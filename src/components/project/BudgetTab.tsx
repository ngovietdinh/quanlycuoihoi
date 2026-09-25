'use client'
import { useState } from 'react'
import { vnd, cn, fmtDate, STATUS_LABELS, EXPENSE_CATEGORIES, CATEGORY_ICONS, downloadCsv } from '@/lib/utils'
import { TagPill } from './shared'
import type { Project, Task, Expense, Vendor } from '@/types'

interface Props {
  project: Project; tasks: Task[]; expenses: Expense[]; vendors: Vendor[]; canEdit: boolean
  totalSpent: number; remaining: number; committed: number
  onAdd: () => void; onEdit: (e: Expense) => void; onDelete: (id: string) => void
}

export function BudgetTab({ project, tasks, expenses, vendors, canEdit, totalSpent, remaining, committed, onAdd, onEdit, onDelete }: Props) {
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('')
  const [showPlan, setShowPlan] = useState(false)
  const budget = Number(project.budget_total)
  const spentPct = budget ? (totalSpent / budget) * 100 : 0
  const vendorPaid = expenses.filter(e => e.vendor_id).reduce((s, e) => s + Number(e.amount), 0)
  // Còn phải trả nhà cung cấp đã chốt
  const toPay = vendors.filter(v => v.status === 'booked').reduce((s, v) => {
    const paid = expenses.filter(e => e.vendor_id === v.id).reduce((a, e) => a + Number(e.amount), 0)
    return s + Math.max(0, Number(v.total_cost) - paid)
  }, 0)
  const projected = totalSpent + toPay
  const projPct = budget ? (projected / budget) * 100 : 0
  const byCat = expenses.reduce((m, e) => m.set(e.category || 'Khác', (m.get(e.category || 'Khác') ?? 0) + Number(e.amount)), new Map<string, number>())
  const cats = Array.from(byCat.entries()).sort((a, b) => b[1] - a[1])
  const vendorName = (id?: string | null) => vendors.find(v => v.id === id)?.name
  const list = expenses.filter(e => (!cat || e.category === cat) && (!q || `${e.note ?? ''} ${e.category} ${vendorName(e.vendor_id) ?? ''}`.toLowerCase().includes(q.toLowerCase())))
  const month = new Date().toISOString().slice(0, 7)
  const thisMonth = expenses.filter(e => e.spent_at?.startsWith(month)).reduce((s, e) => s + Number(e.amount), 0)

  const tiles = [
    { icon: '🏦', label: 'Ngân sách', value: vnd(budget), cls: 'text-ink-900' },
    { icon: '💸', label: 'Đã chi', value: vnd(totalSpent), sub: `Tháng này ${vnd(thisMonth)}`, cls: 'text-sakura-600' },
    { icon: '🤝', label: 'Còn phải trả NCC', value: vnd(toPay), sub: `Đã chốt ${vnd(committed)}`, cls: 'text-gold-700' },
    { icon: remaining >= 0 ? '✅' : '⚠️', label: remaining >= 0 ? 'Còn lại' : 'Vượt ngân sách', value: vnd(Math.abs(remaining)), sub: budget ? `Dự kiến cuối: ${vnd(Math.max(0, budget - projected))} ${projected > budget ? '(vượt)' : ''}` : undefined, cls: remaining >= 0 ? 'text-jade-600' : 'text-red-600' },
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {tiles.map(t => (
          <div key={t.label} className="card p-4">
            <div className="flex items-center gap-2 text-[11px] text-ink-400 font-semibold uppercase tracking-wide"><span className="text-lg">{t.icon}</span>{t.label}</div>
            <p className={cn('font-display text-xl sm:text-2xl font-bold tabular mt-1', t.cls)}>{t.value}</p>
            {t.sub && <p className="text-[11px] text-ink-400 truncate">{t.sub}</p>}
          </div>
        ))}
      </div>

      {/* Thanh ngân sách: đã chi + còn phải trả */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-2.5 gap-3 flex-wrap">
          <span className="text-sm font-semibold text-ink-800">Tiến độ ngân sách</span>
          <span className="text-xs text-ink-500 tabular">{vnd(totalSpent)} đã chi + {vnd(toPay)} sắp trả / {vnd(budget)}</span>
        </div>
        <div className="relative h-3.5 rounded-full bg-ink-100 overflow-hidden">
          <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${Math.min(100, projPct)}%`, background: 'repeating-linear-gradient(45deg,#fcd34d,#fcd34d 6px,#fde68a 6px,#fde68a 12px)' }}/>
          <div className={cn('absolute inset-y-0 left-0 rounded-full', spentPct > 100 ? 'progress-bar-danger' : 'progress-bar')} style={{ width: `${Math.min(100, spentPct)}%` }}/>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[11px] text-ink-500">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full progress-bar"/>Đã chi {Math.round(spentPct)}%</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-gold-300"/>Sắp trả nhà cung cấp</span>
          {projected > budget && budget > 0 && <span className="text-red-600 font-semibold">⚠ Dự kiến vượt {vnd(projected - budget)}</span>}
        </div>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-4 items-start">
        {/* Theo danh mục */}
        <div className="card p-5">
          <h3 className="font-semibold text-ink-900 text-sm mb-3">Chi tiêu theo danh mục</h3>
          {cats.length === 0 ? <p className="text-sm text-ink-400 text-center py-6">Chưa có chi tiêu</p> : (
            <div className="space-y-3">
              {cats.map(([c, v]) => (
                <button key={c} onClick={() => setCat(cat === c ? '' : c)} className={cn('w-full text-left rounded-xl p-1.5 -m-1.5 transition', cat === c && 'bg-gold-50')}>
                  <div className="flex items-center justify-between text-sm mb-1 gap-2">
                    <span className="text-ink-700 truncate">{CATEGORY_ICONS[c] ?? '📦'} {c}</span>
                    <span className="font-bold text-ink-900 tabular flex-shrink-0">{vnd(v)}</span>
                  </div>
                  <div className="progress-track h-1.5"><div className="progress-bar" style={{ width: `${(v / totalSpent) * 100}%`, height: '100%' }}/></div>
                </button>
              ))}
            </div>
          )}
          {vendorPaid > 0 && <p className="text-[11px] text-ink-400 mt-4">Trong đó {vnd(vendorPaid)} đã trả cho nhà cung cấp</p>}
        </div>

        {/* Lịch sử chi tiêu */}
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-ink-100 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-ink-800 text-sm">Lịch sử chi tiêu <span className="text-xs font-normal text-ink-400">({list.length})</span></span>
              {canEdit && <button onClick={onAdd} className="btn btn-gold btn-xs">+ Thêm khoản chi</button>}
            </div>
            <div className="flex flex-wrap items-center gap-2">
            <input className="input !py-1.5 !w-auto flex-1 min-w-[120px] text-xs" placeholder="🔍 Tìm…" value={q} onChange={e => setQ(e.target.value)}/>
            <select className="input !py-1.5 !w-auto text-xs" value={cat} onChange={e => setCat(e.target.value)}>
              <option value="">Mọi danh mục</option>{EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <button onClick={() => downloadCsv(`chi-tieu-${project.name}.csv`, [
              ['Ngày', 'Danh mục', 'Ghi chú', 'Nhà cung cấp', 'Đầu mục', 'Số tiền'],
              ...expenses.map(e => [fmtDate(e.spent_at), e.category, e.note, vendorName(e.vendor_id), tasks.find(t => t.id === e.task_id)?.title, e.amount]),
              ['', '', '', '', 'TỔNG', totalSpent],
            ])} className="btn btn-secondary btn-xs">⬇ Excel</button>
            </div>
          </div>
          {expenses.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3 animate-float">💳</div>
              <p className="text-sm text-ink-400 mb-4">Chưa có chi tiêu nào được ghi nhận</p>
              {canEdit && <button onClick={onAdd} className="btn btn-gold btn-sm">Thêm chi tiêu đầu tiên</button>}
            </div>
          ) : (
            <div className="divide-y divide-ink-50 max-h-[520px] overflow-y-auto">
              {list.map(e => (
                <div key={e.id} className="flex items-center gap-3 px-4 py-3 hover:bg-ink-50/50 group">
                  <span className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-lg bg-gold-50">{CATEGORY_ICONS[e.category] ?? '💸'}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink-900 truncate">{e.note || e.category}</p>
                    <p className="text-[11px] text-ink-400 truncate">{fmtDate(e.spent_at)} · {e.category}{vendorName(e.vendor_id) && ` · 🤝 ${vendorName(e.vendor_id)}`}</p>
                  </div>
                  <span className="text-sm font-bold text-sakura-600 tabular flex-shrink-0">{vnd(e.amount)}</span>
                  {canEdit && (
                    <span className="flex gap-0.5 sm:opacity-0 group-hover:opacity-100">
                      <button onClick={() => onEdit(e)} className="btn btn-ghost btn-xs btn-icon" title="Sửa">✎</button>
                      <button onClick={() => onDelete(e.id)} className="btn btn-ghost btn-xs btn-icon hover:text-red-500" title="Xóa">✕</button>
                    </span>
                  )}
                </div>
              ))}
              {list.length === 0 && <p className="text-center text-sm text-ink-400 py-8">Không có khoản chi phù hợp</p>}
            </div>
          )}
        </div>
      </div>

      {/* Chi phí dự kiến theo đầu mục */}
      <div className="card overflow-hidden">
        <button onClick={() => setShowPlan(s => !s)} className="w-full px-5 py-3.5 flex items-center justify-between text-left">
          <span className="font-semibold text-ink-800 text-sm">Chi phí dự kiến theo đầu mục <span className="text-xs font-normal text-ink-400">— tổng {vnd(tasks.reduce((s, t) => s + Number(t.cost_estimate), 0))}</span></span>
          <span className="text-ink-400 text-sm">{showPlan ? '▲' : '▼'}</span>
        </button>
        {showPlan && (
          <div className="overflow-x-auto border-t border-ink-100">
            <table className="w-full text-sm min-w-[560px]">
              <thead><tr className="bg-ink-50/70 text-left text-[11px] text-ink-500 uppercase">{['Đầu mục', 'Dự kiến', 'Thực tế', 'Trạng thái'].map(h => <th key={h} className="px-4 py-2.5 font-bold">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-ink-50">
                {tasks.filter(t => Number(t.cost_estimate) || Number(t.cost_actual)).map(t => (
                  <tr key={t.id}>
                    <td className="px-4 py-2.5"><p className="font-medium text-ink-900">{t.title}</p>{t.tags?.length > 0 && <div className="flex gap-1 mt-1">{t.tags.slice(0, 2).map(x => <TagPill key={x} tag={x}/>)}</div>}</td>
                    <td className="px-4 py-2.5 font-bold text-gold-700 tabular">{vnd(t.cost_estimate)}</td>
                    <td className={cn('px-4 py-2.5 tabular', Number(t.cost_actual) > Number(t.cost_estimate) && Number(t.cost_estimate) > 0 ? 'text-red-600 font-semibold' : 'text-ink-600')}>{Number(t.cost_actual) ? vnd(t.cost_actual) : '—'}</td>
                    <td className="px-4 py-2.5"><span className={`badge badge-${t.status} text-[10px]`}>{STATUS_LABELS[t.status]}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!tasks.some(t => Number(t.cost_estimate) || Number(t.cost_actual)) && <p className="text-center text-sm text-ink-400 py-6">Chưa có đầu mục nào nhập chi phí dự kiến</p>}
          </div>
        )}
      </div>
    </div>
  )
}
