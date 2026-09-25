'use client'
import { useMemo, useState, FormEvent } from 'react'
import { vnd, cn, deadlineInfo, PRI_LABELS, STATUS_LABELS, downloadCsv, fmtDate } from '@/lib/utils'
import { TagPill, Initial, TASK_TAGS } from './shared'
import type { Task, TaskStatus, ProjectMember } from '@/types'

const COLS: { id: TaskStatus; label: string; bg: string; border: string; dot: string }[] = [
  { id: 'todo',        label: 'Chưa làm',       bg: 'bg-ink-50/60',  border: 'border-ink-200',  dot: 'bg-ink-400' },
  { id: 'in_progress', label: 'Đang thực hiện', bg: 'bg-gold-50/50', border: 'border-gold-200', dot: 'bg-gold-500' },
  { id: 'done',        label: 'Hoàn thành',     bg: 'bg-jade-50/50', border: 'border-jade-200', dot: 'bg-jade-500' },
]
const PRI_CLS: Record<string, string> = { low: 'badge-low', medium: 'badge-medium', high: 'badge-high' }
const PRI_RANK: Record<string, number> = { high: 0, medium: 1, low: 2 }
const NEXT: Record<TaskStatus, TaskStatus> = { todo: 'in_progress', in_progress: 'done', done: 'todo' }

interface Props {
  tasks: Task[]; members: ProjectMember[]; canEdit: boolean; currentUserId?: string | null; projectName: string
  onEdit: (t: Task) => void; onDelete: (id: string) => void; onMove: (id: string, s: TaskStatus) => void
  onAdd: (s: TaskStatus) => void; onQuickAdd: (title: string) => Promise<void>; onSeed: () => Promise<void>
}

export function TasksTab({ tasks, members, canEdit, currentUserId, projectName, onEdit, onDelete, onMove, onAdd, onQuickAdd, onSeed }: Props) {
  const [view, setView] = useState<'kanban' | 'list'>('kanban')
  const [q, setQ] = useState('')
  const [pri, setPri] = useState('')
  const [tag, setTag] = useState('')
  const [who, setWho] = useState('')
  const [dueOnly, setDueOnly] = useState(false)
  const [quick, setQuick] = useState('')
  const [adding, setAdding] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const member = (id: string | null) => members.find(m => m.user_id === id)

  const list = useMemo(() => tasks.filter(t =>
    (!q || `${t.title} ${t.description ?? ''}`.toLowerCase().includes(q.toLowerCase())) &&
    (!pri || t.priority === pri) && (!tag || t.tags?.includes(tag)) &&
    (!who || (who === 'me' ? t.assigned_to === currentUserId : who === 'none' ? !t.assigned_to : t.assigned_to === who)) &&
    (!dueOnly || (t.status !== 'done' && t.deadline && deadlineInfo(t.deadline).urgent))
  ), [tasks, q, pri, tag, who, dueOnly, currentUserId])
  const filtered = list.length !== tasks.length

  async function quickAdd(e: FormEvent) {
    e.preventDefault(); if (!quick.trim()) return
    setAdding(true); await onQuickAdd(quick.trim()); setQuick(''); setAdding(false)
  }
  function exportCsv() {
    downloadCsv(`cong-viec-${projectName}.csv`, [
      ['Đầu mục', 'Trạng thái', 'Ưu tiên', 'Hạn chót', 'Phụ trách', 'Nhãn', 'Dự kiến', 'Thực tế', 'Mô tả'],
      ...tasks.map(t => [t.title, STATUS_LABELS[t.status], PRI_LABELS[t.priority], t.deadline ? fmtDate(t.deadline) : '', member(t.assigned_to)?.full_name ?? '', (t.tags ?? []).join('; '), t.cost_estimate, t.cost_actual, t.description]),
    ])
  }

  if (tasks.length === 0) return (
    <div className="card text-center py-14 px-4 max-w-2xl mx-auto">
      <div className="text-5xl mb-3 animate-float">📋</div>
      <h3 className="font-display text-2xl font-semibold text-ink-900 mb-2">Chưa có đầu mục nào</h3>
      <p className="text-sm text-ink-500 mb-6 max-w-md mx-auto">Bắt đầu nhanh với danh sách 24 việc chuẩn bị cưới theo đúng lộ trình, hoặc tự thêm từng việc.</p>
      {canEdit && (
        <div className="flex flex-wrap gap-2 justify-center">
          <button disabled={seeding} onClick={async () => { setSeeding(true); await onSeed(); setSeeding(false) }} className="btn btn-primary">{seeding ? 'Đang thêm…' : '✨ Thêm 24 việc mẫu'}</button>
          <button onClick={() => onAdd('todo')} className="btn btn-secondary">+ Tự thêm đầu mục</button>
        </div>
      )}
    </div>
  )

  const card = (t: Task) => {
    const dl = deadlineInfo(t.deadline), m = member(t.assigned_to)
    return (
      <div key={t.id} draggable={canEdit}
        onDragStart={e => { e.dataTransfer.setData('text/plain', t.id); e.dataTransfer.effectAllowed = 'move' }}
        onClick={() => canEdit && onEdit(t)}
        className={cn('kanban-card group', t.status === 'done' && 'opacity-75')}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className={`badge ${PRI_CLS[t.priority]} text-[10px]`}>{PRI_LABELS[t.priority]}</span>
          {canEdit && (
            <div className="flex gap-0.5 sm:opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
              {/* Chuyển trạng thái bằng nút — dùng được trên điện thoại (kéo thả không hỗ trợ cảm ứng) */}
              <button onClick={() => onMove(t.id, NEXT[t.status])} title={`Chuyển sang “${STATUS_LABELS[NEXT[t.status]]}”`}
                className="px-1.5 py-1 rounded-lg hover:bg-ink-100 text-ink-400 hover:text-jade-600 text-[11px] font-semibold">
                {t.status === 'done' ? '↺' : t.status === 'todo' ? '▶' : '✓'}
              </button>
              <button onClick={() => onDelete(t.id)} title="Xóa" className="p-1 rounded-lg hover:bg-red-50 text-ink-400 hover:text-red-500">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
          )}
        </div>
        <p className={cn('text-sm font-semibold text-ink-900 leading-snug mb-1', t.status === 'done' && 'line-through decoration-ink-300')}>{t.title}</p>
        {t.description && <p className="text-xs text-ink-400 line-clamp-2 mb-2">{t.description}</p>}
        {t.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {t.tags.slice(0, 3).map(x => <TagPill key={x} tag={x}/>)}
            {t.tags.length > 3 && <span className="tag bg-ink-50 text-ink-400 border-ink-200">+{t.tags.length - 3}</span>}
          </div>
        )}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-ink-50 mt-1">
          {t.deadline
            ? <span className={cn('text-[11px] font-medium', t.status === 'done' ? 'text-ink-400' : dl.overdue ? 'text-red-600' : dl.urgent ? 'text-gold-600' : 'text-ink-400')}>📅 {t.status === 'done' ? fmtDate(t.deadline) : dl.label}</span>
            : <span className="text-[11px] text-ink-300">Không hạn</span>}
          <span className="flex items-center gap-1.5">
            {Number(t.cost_estimate) > 0 && <span className="text-[11px] font-bold text-gold-600 tabular">{vnd(t.cost_estimate)}</span>}
            {m && <Initial name={m.full_name || m.email} url={m.avatar_url}/>}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Thanh công cụ */}
      <div className="card p-3 flex flex-wrap items-center gap-2">
        {canEdit && (
          <form onSubmit={quickAdd} className="flex-1 min-w-[220px] flex gap-1.5">
            <input className="input !py-2 text-sm" placeholder="＋ Thêm nhanh: gõ tên việc rồi Enter" value={quick} onChange={e => setQuick(e.target.value)}/>
            <button disabled={adding || !quick.trim()} className="btn btn-primary btn-sm flex-shrink-0">{adding ? '…' : 'Thêm'}</button>
          </form>
        )}
        <div className="flex bg-ink-100/70 rounded-xl p-0.5 text-xs font-medium">
          {([['kanban', '▦ Kanban'], ['list', '☰ Danh sách']] as const).map(([k, l]) => (
            <button key={k} onClick={() => setView(k)} className={cn('px-3 py-1.5 rounded-lg', view === k ? 'bg-white shadow text-ink-900' : 'text-ink-500')}>{l}</button>
          ))}
        </div>
        <button onClick={exportCsv} className="btn btn-secondary btn-sm" title="Xuất Excel">⬇ Excel</button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <input className="input !py-1.5 !w-48 text-sm" placeholder="🔍 Tìm đầu mục…" value={q} onChange={e => setQ(e.target.value)}/>
        <select className="input !py-1.5 !w-auto text-sm" value={pri} onChange={e => setPri(e.target.value)}>
          <option value="">Mọi mức ưu tiên</option><option value="high">🔴 Cao</option><option value="medium">🟡 Trung bình</option><option value="low">🔵 Thấp</option>
        </select>
        <select className="input !py-1.5 !w-auto text-sm" value={tag} onChange={e => setTag(e.target.value)}>
          <option value="">Mọi nhãn</option>{TASK_TAGS.map(x => <option key={x} value={x}>{x}</option>)}
        </select>
        <select className="input !py-1.5 !w-auto text-sm" value={who} onChange={e => setWho(e.target.value)}>
          <option value="">Mọi người phụ trách</option><option value="me">Việc của tôi</option><option value="none">Chưa giao</option>
          {members.map(m => <option key={m.user_id} value={m.user_id}>{m.full_name || m.email}</option>)}
        </select>
        <label className="flex items-center gap-1.5 text-sm text-ink-600 cursor-pointer"><input type="checkbox" checked={dueOnly} onChange={e => setDueOnly(e.target.checked)} className="accent-sakura-500"/>Gấp / quá hạn</label>
        {filtered && <button onClick={() => { setQ(''); setPri(''); setTag(''); setWho(''); setDueOnly(false) }} className="text-xs text-sakura-600 font-semibold hover:underline">Xóa lọc ({list.length}/{tasks.length})</button>}
      </div>

      {view === 'kanban' ? (
        <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 sm:mx-0 px-4 sm:px-0 snap-x">
          {COLS.map(col => <KanbanCol key={col.id} col={col} tasks={list.filter(t => t.status === col.id)} canEdit={canEdit} render={card} onDropTask={id => onMove(id, col.id)} onAdd={() => onAdd(col.id)}/>)}
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead><tr className="bg-ink-50/70 border-b border-ink-100 text-left text-[11px] text-ink-500 uppercase tracking-wide">
              {['', 'Đầu mục', 'Trạng thái', 'Ưu tiên', 'Hạn chót', 'Phụ trách', 'Dự kiến', ''].map((h, i) => <th key={i} className="px-3 py-2.5 font-bold">{h}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-ink-50">
              {[...list].sort((a, b) => (a.status === 'done' ? 1 : 0) - (b.status === 'done' ? 1 : 0) || (a.deadline ?? '9999').localeCompare(b.deadline ?? '9999') || PRI_RANK[a.priority] - PRI_RANK[b.priority]).map(t => {
                const dl = deadlineInfo(t.deadline), m = member(t.assigned_to)
                return (
                  <tr key={t.id} className="hover:bg-ink-50/40">
                    <td className="px-3 py-2.5 w-8">
                      <input type="checkbox" disabled={!canEdit} checked={t.status === 'done'} onChange={() => onMove(t.id, t.status === 'done' ? 'todo' : 'done')} className="w-4 h-4 accent-jade-500" aria-label="Hoàn thành"/>
                    </td>
                    <td className="px-3 py-2.5">
                      <button disabled={!canEdit} onClick={() => onEdit(t)} className={cn('text-left font-medium text-ink-900 hover:text-sakura-700', t.status === 'done' && 'line-through text-ink-400')}>{t.title}</button>
                      {t.tags?.length > 0 && <div className="flex gap-1 mt-1">{t.tags.slice(0, 2).map(x => <TagPill key={x} tag={x}/>)}</div>}
                    </td>
                    <td className="px-3 py-2.5">
                      <select disabled={!canEdit} value={t.status} onChange={e => onMove(t.id, e.target.value as TaskStatus)} className={cn('text-[11px] font-semibold rounded-full border px-2 py-1 bg-white', `badge-${t.status}`)}>
                        {COLS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2.5"><span className={`badge ${PRI_CLS[t.priority]} text-[10px]`}>{PRI_LABELS[t.priority]}</span></td>
                    <td className={cn('px-3 py-2.5 text-xs whitespace-nowrap', t.status !== 'done' && dl.overdue ? 'text-red-600 font-semibold' : t.status !== 'done' && dl.urgent ? 'text-gold-600 font-semibold' : 'text-ink-500')}>{t.deadline ? (t.status === 'done' ? fmtDate(t.deadline) : dl.label) : '—'}</td>
                    <td className="px-3 py-2.5">{m ? <span className="flex items-center gap-1.5 text-xs text-ink-600"><Initial name={m.full_name || m.email} url={m.avatar_url}/>{m.full_name || m.email}</span> : <span className="text-xs text-ink-300">—</span>}</td>
                    <td className="px-3 py-2.5 text-xs font-semibold text-gold-700 tabular whitespace-nowrap">{Number(t.cost_estimate) > 0 ? vnd(t.cost_estimate) : ''}</td>
                    <td className="px-3 py-2.5 text-right">{canEdit && <button onClick={() => onDelete(t.id)} className="btn btn-ghost btn-xs btn-icon hover:text-red-500" title="Xóa">✕</button>}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {list.length === 0 && <p className="text-center text-sm text-ink-400 py-8">Không có đầu mục phù hợp bộ lọc</p>}
        </div>
      )}
    </div>
  )
}

function KanbanCol({ col, tasks, canEdit, render, onDropTask, onAdd }:
  { col: typeof COLS[number]; tasks: Task[]; canEdit: boolean; render: (t: Task) => React.ReactNode; onDropTask: (id: string) => void; onAdd: () => void }) {
  const [over, setOver] = useState(0)   // bộ đếm tránh nhấp nháy khi rê qua phần tử con
  return (
    <div className={cn('kanban-col flex-shrink-0 w-[290px] sm:w-auto sm:flex-1 sm:min-w-0 snap-start', col.bg, over ? 'drop-active' : col.border)}
      onDragOver={e => { if (canEdit) e.preventDefault() }}
      onDragEnter={() => canEdit && setOver(n => n + 1)} onDragLeave={() => setOver(n => Math.max(0, n - 1))}
      onDrop={e => { e.preventDefault(); setOver(0); const id = e.dataTransfer.getData('text/plain'); if (id) onDropTask(id) }}>
      <div className="flex items-center justify-between px-4 pt-4 pb-2.5">
        <div className="flex items-center gap-2">
          <span className={cn('w-2.5 h-2.5 rounded-full', col.dot)}/>
          <span className="text-sm font-bold text-ink-800">{col.label}</span>
          <span className="text-xs font-bold text-ink-500 bg-white/80 border border-ink-100 rounded-full min-w-5 h-5 px-1.5 flex items-center justify-center">{tasks.length}</span>
        </div>
        {canEdit && <button onClick={onAdd} className="p-1.5 rounded-lg hover:bg-white/70 text-ink-400 hover:text-sakura-500" title="Thêm đầu mục">＋</button>}
      </div>
      <div className="px-3 pb-3 space-y-2 flex-1 min-h-[140px]">
        {tasks.map(render)}
        {tasks.length === 0 && (
          <div className="flex items-center justify-center h-20 rounded-xl border-2 border-dashed border-ink-200 text-xs text-ink-300">{canEdit ? 'Kéo thả vào đây' : 'Trống'}</div>
        )}
      </div>
    </div>
  )
}
