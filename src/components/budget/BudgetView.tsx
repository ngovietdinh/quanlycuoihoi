'use client'
import { useState } from 'react'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { EmptyState } from '@/components/ui/EmptyState'
import { Modal } from '@/components/ui/Modal'
import { Input, Select } from '@/components/ui/Input'
import { ConfirmModal } from '@/components/ui/Modal'
import { formatCurrency, formatDate, STATUS_LABELS } from '@/lib/utils'
import type { Task, Expense, Project } from '@/types'

interface BudgetViewProps {
  project: Project
  tasks: Task[]
  expenses: Expense[]
  onAddExpense: (data: { amount: number; note: string; task_id?: string; spent_at: string }) => Promise<void>
  onDeleteExpense: (id: string) => Promise<void>
}

function AddExpenseModal({ open, onClose, onSave, tasks }: {
  open: boolean; onClose: () => void
  onSave: (data: { amount: number; note: string; task_id?: string; spent_at: string }) => Promise<void>
  tasks: Task[]
}) {
  const [form, setForm] = useState({ amount: '', note: '', task_id: '', spent_at: new Date().toISOString().slice(0, 10) })
  const [saving, setSaving] = useState(false)
  const sf = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function handleSave() {
    if (!form.amount) return
    setSaving(true)
    await onSave({ ...form, amount: Number(form.amount), task_id: form.task_id || undefined })
    setSaving(false); onClose()
    setForm({ amount: '', note: '', task_id: '', spent_at: new Date().toISOString().slice(0, 10) })
  }

  return (
    <Modal open={open} onClose={onClose} title="Thêm chi tiêu" size="sm"
      footer={<><Button variant="ghost" size="sm" onClick={onClose}>Hủy</Button><Button size="sm" loading={saving} onClick={handleSave}>Lưu chi tiêu</Button></>}
    >
      <div className="space-y-3">
        <Input label="Số tiền (VNĐ) *" type="number" value={form.amount} onChange={e => sf('amount', e.target.value)} placeholder="5,000,000" required />
        <Input label="Ghi chú" value={form.note} onChange={e => sf('note', e.target.value)} placeholder="VD: Đặt cọc nhà hàng" />
        <Select label="Liên kết đầu mục" value={form.task_id} onChange={e => sf('task_id', e.target.value)}>
          <option value="">-- Không liên kết --</option>
          {tasks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
        </Select>
        <Input label="Ngày chi" type="date" value={form.spent_at} onChange={e => sf('spent_at', e.target.value)} />
      </div>
    </Modal>
  )
}

export function BudgetView({ project, tasks, expenses, onAddExpense, onDeleteExpense }: BudgetViewProps) {
  const [showAdd, setShowAdd] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0)
  const remaining  = project.budget_total - totalSpent
  const pct        = project.budget_total > 0 ? Math.min(100, (totalSpent / project.budget_total) * 100) : 0

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    await onDeleteExpense(deleteId)
    setDeleting(false); setDeleteId(null)
  }

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Ngân sách', value: formatCurrency(project.budget_total), icon: '🏦', color: 'text-stone-700' },
          { label: 'Đã chi', value: formatCurrency(totalSpent), icon: '💸', color: 'text-rose-600' },
          { label: 'Còn lại', value: formatCurrency(Math.abs(remaining)), icon: remaining >= 0 ? '✅' : '⚠️', color: remaining >= 0 ? 'text-emerald-600' : 'text-red-500' },
        ].map((s, i) => (
          <Card key={i} className="p-4 text-center">
            <div className="text-2xl mb-1.5">{s.icon}</div>
            <p className="text-[10px] text-stone-400 mb-0.5">{s.label}</p>
            <p className={`text-sm font-bold ${s.color} tabular-nums`}>{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Progress */}
      <Card>
        <CardBody>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-stone-700">Tiến độ ngân sách</span>
            <span className="text-xs text-stone-500 tabular-nums">{Math.round(pct)}% đã dùng</span>
          </div>
          <ProgressBar value={pct} size="lg" variant={pct > 90 ? 'rose' : pct > 70 ? 'amber' : 'gradient'} />
          {remaining < 0 && (
            <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
              ⚠️ Vượt ngân sách {formatCurrency(Math.abs(remaining))}
            </p>
          )}
        </CardBody>
      </Card>

      {/* Task cost table */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-stone-800 text-sm">Chi phí theo đầu mục</h3>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-stone-50 border-y border-stone-100">
                {['Đầu mục', 'Dự kiến', 'Thực tế', 'Chênh lệch', 'Trạng thái'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {tasks.map(t => {
                const diff = t.cost_actual - t.cost_estimate
                return (
                  <tr key={t.id} className="hover:bg-stone-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-stone-800">{t.title}</td>
                    <td className="px-4 py-3 text-stone-600 tabular-nums">{formatCurrency(t.cost_estimate)}</td>
                    <td className="px-4 py-3 tabular-nums">{t.cost_actual > 0 ? formatCurrency(t.cost_actual) : <span className="text-stone-300">—</span>}</td>
                    <td className="px-4 py-3 tabular-nums">
                      {t.cost_actual > 0 ? (
                        <span className={diff > 0 ? 'text-red-500 font-medium' : 'text-emerald-600 font-medium'}>
                          {diff > 0 ? '+' : ''}{formatCurrency(diff)}
                        </span>
                      ) : <span className="text-stone-300">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={t.status as any} dot className="text-[10px]">{STATUS_LABELS[t.status]}</Badge>
                    </td>
                  </tr>
                )
              })}
              <tr className="bg-stone-50 font-semibold border-t border-stone-200">
                <td className="px-4 py-3 text-stone-800">TỔNG CỘNG</td>
                <td className="px-4 py-3 text-amber-600 tabular-nums">{formatCurrency(tasks.reduce((s, t) => s + t.cost_estimate, 0))}</td>
                <td className="px-4 py-3 text-rose-500 tabular-nums">{formatCurrency(tasks.reduce((s, t) => s + t.cost_actual, 0))}</td>
                <td className="px-4 py-3" /><td className="px-4 py-3" />
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Expense log */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-stone-800 text-sm">Lịch sử chi tiêu</h3>
            <Button size="xs" variant="secondary" icon={<span className="text-sm">+</span>} onClick={() => setShowAdd(true)}>
              Thêm
            </Button>
          </div>
        </CardHeader>
        {expenses.length === 0 ? (
          <CardBody>
            <EmptyState icon="💳" title="Chưa có chi tiêu" description="Bắt đầu ghi lại các khoản chi tiêu" action={{ label: 'Thêm chi tiêu', onClick: () => setShowAdd(true) }} />
          </CardBody>
        ) : (
          <div className="divide-y divide-stone-50">
            {expenses.map(e => (
              <div key={e.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-stone-50/50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center text-sm flex-shrink-0">💸</div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-stone-800 truncate">{e.note || 'Chi tiêu'}</p>
                    <p className="text-xs text-stone-400">{formatDate(e.spent_at)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-sm font-semibold text-rose-500 tabular-nums">{formatCurrency(e.amount)}</span>
                  <button onClick={() => setDeleteId(e.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-stone-300 hover:text-red-400 transition-colors">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <AddExpenseModal open={showAdd} onClose={() => setShowAdd(false)} onSave={onAddExpense} tasks={tasks} />
      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Xóa chi tiêu?"
        message="Khoản chi tiêu này sẽ bị xóa vĩnh viễn."
        confirmLabel="Xóa"
      />
    </div>
  )
}
