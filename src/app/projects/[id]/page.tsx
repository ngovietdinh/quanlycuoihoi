'use client'
import { useState, useCallback, FormEvent } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Shell, TopBar } from '@/components/layout/Shell'
import { ToastProvider, useToast } from '@/components/ui/Toast'
import { Modal, ConfirmModal } from '@/components/ui/Modal'
import { useProject } from '@/hooks/useProject'
import { createTask, updateTask, deleteTask, moveTask } from '@/lib/api/tasks'
import { createExpense, deleteExpense } from '@/lib/api/expenses'
import { updateProject } from '@/lib/api/projects'
import { vnd, fmtDate, pct, deadlineInfo, daysTo, STATUS_LABELS, PRI_LABELS, EXPENSE_CATEGORIES } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { Task, TaskStatus, Expense, Project } from '@/types'

// ── Tag system ────────────────────────────────────────────────────────────────
const TASK_TAGS = ['Bắt buộc','Tùy chọn','Đã đặt cọc','Cần thanh toán','Ưu tiên cao','Đang chờ','Đã xong']
const TAG_COLORS: Record<string,string> = {
  'Bắt buộc':      'bg-red-50 text-red-700 border-red-200',
  'Tùy chọn':      'bg-blue-50 text-blue-700 border-blue-200',
  'Đã đặt cọc':    'bg-gold-50 text-gold-700 border-gold-200',
  'Cần thanh toán':'bg-sakura-50 text-sakura-700 border-sakura-200',
  'Ưu tiên cao':   'bg-orange-50 text-orange-700 border-orange-200',
  'Đang chờ':      'bg-purple-50 text-purple-700 border-purple-200',
  'Đã xong':       'bg-jade-50 text-jade-700 border-jade-200',
}

function TagPill({ tag, onRemove }: { tag: string; onRemove?: () => void }) {
  const cls = TAG_COLORS[tag] ?? 'bg-ink-50 text-ink-600 border-ink-200'
  return (
    <span className={`tag border ${cls} gap-1`}>
      {tag}
      {onRemove && <button onClick={onRemove} className="hover:opacity-70 transition-opacity ml-0.5 text-[10px]">✕</button>}
    </span>
  )
}

// ── Task Modal ────────────────────────────────────────────────────────────────
function TaskModal({ open, onClose, onSave, task, defaultStatus }:
  { open:boolean; onClose:()=>void; onSave:(d:any)=>Promise<void>; task?:Task; defaultStatus:TaskStatus }) {
  const [form, setForm] = useState({
    title: task?.title??'', description: task?.description??'',
    status: task?.status??defaultStatus, priority: task?.priority??'medium',
    deadline: task?.deadline??'', cost_estimate: String(task?.cost_estimate||''), cost_actual: String(task?.cost_actual||''),
    tags: (task?.tags ?? []) as string[],
  })
  const [saving, setSaving] = useState(false)
  const sf = (k:string,v:any) => setForm(f=>({...f,[k]:v}))

  // Reset when reopened
  useState(() => {
    if (open) setForm({
      title: task?.title??'', description: task?.description??'',
      status: task?.status??defaultStatus, priority: task?.priority??'medium',
      deadline: task?.deadline??'', cost_estimate: String(task?.cost_estimate||''), cost_actual: String(task?.cost_actual||''),
      tags: (task?.tags ?? []) as string[],
    })
  })

  function toggleTag(tag: string) {
    setForm(f=>({...f, tags: f.tags.includes(tag) ? f.tags.filter(t=>t!==tag) : [...f.tags, tag]}))
  }

  async function submit(e: FormEvent) {
    e.preventDefault(); if (!form.title.trim()) return
    setSaving(true)
    await onSave({ ...form, cost_estimate: Number(form.cost_estimate)||0, cost_actual: Number(form.cost_actual)||0 })
    setSaving(false); onClose()
  }

  const STATUS_OPTS = [['todo','Chưa làm'],['in_progress','Đang thực hiện'],['done','Hoàn thành']]
  const PRI_OPTS    = [['low','🔵 Thấp'],['medium','🟡 Trung bình'],['high','🔴 Cao']]

  return (
    <Modal open={open} onClose={onClose}
      title={task ? 'Chỉnh sửa đầu mục' : 'Thêm đầu mục mới'}
      subtitle={task ? `Cập nhật thông tin cho "${task.title}"` : 'Tạo công việc cần theo dõi'}
      size="lg"
      footer={<>
        <button onClick={onClose} className="btn btn-ghost btn-sm">Hủy bỏ</button>
        <button onClick={submit} disabled={saving} className="btn btn-primary btn-sm disabled:opacity-60">
          {saving ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/><span>Đang lưu...</span></> : (task ? '✓ Lưu thay đổi' : '+ Thêm đầu mục')}
        </button>
      </>}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Tên đầu mục *</label>
          <input className="input" value={form.title} onChange={e=>sf('title',e.target.value)} placeholder="VD: Đặt mâm quả trầu cau" required/>
        </div>
        <div>
          <label className="label">Mô tả chi tiết</label>
          <textarea className="input resize-none" rows={2} value={form.description} onChange={e=>sf('description',e.target.value)} placeholder="Chi tiết cần thực hiện..."/>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Trạng thái</label>
            <select className="input" value={form.status} onChange={e=>sf('status',e.target.value)}>
              {STATUS_OPTS.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Mức ưu tiên</label>
            <select className="input" value={form.priority} onChange={e=>sf('priority',e.target.value)}>
              {PRI_OPTS.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="label">Hạn chót</label>
          <input className="input" type="date" value={form.deadline} onChange={e=>sf('deadline',e.target.value)}/>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Chi phí dự kiến (VNĐ)</label>
            <input className="input" type="number" value={form.cost_estimate} onChange={e=>sf('cost_estimate',e.target.value)} placeholder="0"/>
          </div>
          <div>
            <label className="label">Chi phí thực tế (VNĐ)</label>
            <input className="input" type="number" value={form.cost_actual} onChange={e=>sf('cost_actual',e.target.value)} placeholder="0"/>
            <p className="text-[10px] text-ink-400 mt-1">Dùng để so sánh, không tính vào tổng chi</p>
          </div>
        </div>
        {/* Tags */}
        <div>
          <label className="label">Nhãn đầu mục</label>
          <div className="flex flex-wrap gap-1.5">
            {TASK_TAGS.map(tag => {
              const active = form.tags.includes(tag)
              const cls = TAG_COLORS[tag] ?? ''
              return (
                <button key={tag} type="button" onClick={()=>toggleTag(tag)}
                  className={cn('tag border transition-all duration-150',
                    active ? cls + ' ring-2 ring-offset-1 ring-sakura-300' : 'bg-ink-50 text-ink-500 border-ink-200 hover:border-ink-300')}>
                  {active && '✓ '}{tag}
                </button>
              )
            })}
          </div>
        </div>
        {/* Preview */}
        {form.tags.length > 0 && (
          <div className="p-3 bg-ink-50/50 rounded-xl border border-ink-100">
            <p className="text-[10px] text-ink-400 font-semibold uppercase tracking-wider mb-2">Xem trước nhãn</p>
            <div className="flex flex-wrap gap-1.5">
              {form.tags.map(tag => <TagPill key={tag} tag={tag}/>)}
            </div>
          </div>
        )}
      </form>
    </Modal>
  )
}

// ── Expense Modal ─────────────────────────────────────────────────────────────
function ExpenseModal({ open, onClose, onSave, tasks }:
  { open:boolean; onClose:()=>void; onSave:(d:any)=>Promise<void>; tasks:Task[] }) {
  const [form, setForm] = useState({ amount:'', note:'', category:'Khác', task_id:'', spent_at: new Date().toISOString().slice(0,10) })
  const [saving, setSaving] = useState(false)
  const sf = (k:string,v:string) => setForm(f=>({...f,[k]:v}))

  async function submit(e: FormEvent) {
    e.preventDefault(); if (!form.amount) return
    setSaving(true)
    await onSave({ ...form, amount: Number(form.amount), task_id: form.task_id||undefined })
    setSaving(false); onClose()
    setForm({ amount:'', note:'', category:'Khác', task_id:'', spent_at: new Date().toISOString().slice(0,10) })
  }

  return (
    <Modal open={open} onClose={onClose} title="Ghi nhận chi tiêu" subtitle="Chi tiêu được dùng để tính tổng đã chi" size="sm"
      footer={<>
        <button onClick={onClose} className="btn btn-ghost btn-sm">Hủy bỏ</button>
        <button onClick={submit} disabled={saving} className="btn btn-gold btn-sm disabled:opacity-60">
          {saving ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/><span>Đang lưu...</span></> : '💸 Lưu chi tiêu'}
        </button>
      </>}>
      <form onSubmit={submit} className="space-y-3.5">
        <div>
          <label className="label">Số tiền (VNĐ) *</label>
          <input className="input font-mono" type="number" value={form.amount} onChange={e=>sf('amount',e.target.value)} placeholder="5,000,000" required/>
        </div>
        <div>
          <label className="label">Danh mục</label>
          <select className="input" value={form.category} onChange={e=>sf('category',e.target.value)}>
            {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Ghi chú</label>
          <input className="input" value={form.note} onChange={e=>sf('note',e.target.value)} placeholder="VD: Đặt cọc nhà hàng 30%"/>
        </div>
        <div>
          <label className="label">Liên kết đầu mục (tùy chọn)</label>
          <select className="input" value={form.task_id} onChange={e=>sf('task_id',e.target.value)}>
            <option value="">-- Không liên kết --</option>
            {tasks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Ngày chi</label>
          <input className="input" type="date" value={form.spent_at} onChange={e=>sf('spent_at',e.target.value)}/>
        </div>
        {form.amount && (
          <div className="p-3 bg-jade-50 rounded-xl border border-jade-200 text-center">
            <p className="text-xs text-jade-600">Sẽ ghi nhận</p>
            <p className="text-lg font-bold text-jade-700 font-display tabular">{vnd(Number(form.amount))}</p>
          </div>
        )}
      </form>
    </Modal>
  )
}

// ── Edit Project Modal ────────────────────────────────────────────────────────
function EditProjectModal({ open, onClose, project, onSaved }:
  { open:boolean; onClose:()=>void; project:Project; onSaved:()=>void }) {
  const { success } = useToast()
  const [form, setForm] = useState({ name:project.name, description:project.description??'', event_date:project.event_date??'', venue:project.venue??'', budget_total:String(project.budget_total), tags:(project.tags??[]) as string[] })
  const [saving, setSaving] = useState(false)
  const sf = (k:string,v:any) => setForm(f=>({...f,[k]:v}))
  const PROJECT_TAGS_EDIT = ['truyền thống','hiện đại','tiết kiệm','sang trọng','miền trung','miền bắc','miền nam']
  const TAG_C: Record<string,string> = { 'truyền thống':'bg-amber-50 text-amber-700 border-amber-200','hiện đại':'bg-blue-50 text-blue-700 border-blue-200','tiết kiệm':'bg-jade-50 text-jade-700 border-jade-200','sang trọng':'bg-sakura-50 text-sakura-700 border-sakura-200','miền trung':'bg-orange-50 text-orange-700 border-orange-200','miền bắc':'bg-purple-50 text-purple-700 border-purple-200','miền nam':'bg-teal-50 text-teal-700 border-teal-200' }
  function toggleTag(tag: string) { setForm(f=>({...f, tags: f.tags.includes(tag)?f.tags.filter(t=>t!==tag):[...f.tags,tag]})) }

  async function submit(e: FormEvent) {
    e.preventDefault(); setSaving(true)
    await updateProject(project.id, { ...form, budget_total: Number(form.budget_total)||0 })
    setSaving(false); success('Đã cập nhật dự án! ✓'); onSaved(); onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Chỉnh sửa dự án" size="md"
      footer={<>
        <button onClick={onClose} className="btn btn-ghost btn-sm">Hủy bỏ</button>
        <button onClick={submit} disabled={saving} className="btn btn-primary btn-sm disabled:opacity-60">
          {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : '✓ Lưu thay đổi'}
        </button>
      </>}>
      <form onSubmit={submit} className="space-y-4">
        <div><label className="label">Tên lễ *</label><input className="input" value={form.name} onChange={e=>sf('name',e.target.value)} required/></div>
        <div><label className="label">Mô tả</label><textarea className="input resize-none" rows={2} value={form.description} onChange={e=>sf('description',e.target.value)}/></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Ngày tổ chức</label><input className="input" type="date" value={form.event_date} onChange={e=>sf('event_date',e.target.value)}/></div>
          <div><label className="label">Ngân sách (VNĐ)</label><input className="input font-mono" type="number" value={form.budget_total} onChange={e=>sf('budget_total',e.target.value)}/></div>
        </div>
        <div><label className="label">Địa điểm</label><input className="input" value={form.venue} onChange={e=>sf('venue',e.target.value)}/></div>
        <div>
          <label className="label">Nhãn dự án</label>
          <div className="flex flex-wrap gap-1.5">
            {PROJECT_TAGS_EDIT.map(tag => {
              const active = form.tags.includes(tag)
              const cls = TAG_C[tag] ?? ''
              return <button key={tag} type="button" onClick={()=>toggleTag(tag)}
                className={cn('tag border transition-all',active?cls+' ring-2 ring-offset-1 ring-sakura-300':'bg-ink-50 text-ink-500 border-ink-200')}>{active&&'✓ '}{tag}</button>
            })}
          </div>
        </div>
      </form>
    </Modal>
  )
}

// ── Kanban ────────────────────────────────────────────────────────────────────
const COL_CFG = [
  { id:'todo'        as TaskStatus, label:'Chưa làm',       bg:'bg-ink-50/60',     border:'border-ink-200',    dot:'bg-ink-400'    },
  { id:'in_progress' as TaskStatus, label:'Đang thực hiện', bg:'bg-gold-50/50',    border:'border-gold-200',   dot:'bg-gold-500'   },
  { id:'done'        as TaskStatus, label:'Hoàn thành',     bg:'bg-jade-50/50',    border:'border-jade-200',   dot:'bg-jade-500'   },
]
const PRI_BADGE_CLS: Record<string,string> = { low:'badge-low', medium:'badge-medium', high:'badge-high' }

function KanbanBoard({ tasks, onEdit, onDelete, onMove, onAdd }:
  { tasks:Task[]; onEdit:(t:Task)=>void; onDelete:(id:string)=>void; onMove:(id:string,s:TaskStatus)=>void; onAdd:(s:TaskStatus)=>void }) {
  const [draggingId, setDraggingId] = useState<string|null>(null)
  const [overCol,    setOverCol]    = useState<TaskStatus|null>(null)

  return (
    <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 sm:mx-0 px-4 sm:px-0" style={{scrollSnapType:'x mandatory'}}>
      {COL_CFG.map(col => {
        const colTasks = tasks.filter(t=>t.status===col.id)
        const isOver   = overCol === col.id
        return (
          <div key={col.id}
            className={cn('kanban-col flex-shrink-0 w-[300px] sm:flex-1 sm:min-w-0', col.bg,
              isOver ? 'drop-active' : col.border)}
            style={{scrollSnapAlign:'start'}}
            onDragOver={e=>{e.preventDefault();setOverCol(col.id)}}
            onDragLeave={()=>setOverCol(null)}
            onDrop={()=>{ if(draggingId){onMove(draggingId,col.id);setDraggingId(null);setOverCol(null)} }}>

            {/* Column header */}
            <div className="flex items-center justify-between px-4 pt-4 pb-2.5 flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className={cn('w-2.5 h-2.5 rounded-full', col.dot)}/>
                <span className="text-sm font-bold text-ink-800">{col.label}</span>
                <span className="text-xs font-bold text-ink-500 bg-white/80 border border-ink-100 rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
                  {colTasks.length}
                </span>
              </div>
              <button onClick={()=>onAdd(col.id)}
                className="p-1.5 rounded-lg hover:bg-white/70 text-ink-400 hover:text-sakura-500 transition-all"
                title="Thêm đầu mục">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </button>
            </div>

            {/* Drop target indicator */}
            <div className="px-3 space-y-2 flex-1 min-h-[160px] overflow-y-auto">
              {isOver && draggingId && (
                <div className="h-16 rounded-xl border-2 border-dashed border-sakura-400 bg-sakura-50/50 flex items-center justify-center text-xs text-sakura-500 animate-pulse">
                  Thả vào đây
                </div>
              )}
              {colTasks.map(task => {
                const dl = deadlineInfo(task.deadline)
                return (
                  <div key={task.id} draggable
                    onDragStart={()=>setDraggingId(task.id)}
                    onDragEnd={()=>{setDraggingId(null);setOverCol(null)}}
                    className={cn('kanban-card', draggingId===task.id&&'dragging')}>

                    {/* Priority + actions */}
                    <div className="flex items-start justify-between gap-2 mb-2.5">
                      <span className={`badge ${PRI_BADGE_CLS[task.priority]} text-[10px]`}>
                        {PRI_LABELS[task.priority]}
                      </span>
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={e=>{e.stopPropagation();onEdit(task)}}
                          className="p-1 rounded-lg hover:bg-ink-100 text-ink-400 hover:text-ink-700 transition-colors">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button onClick={e=>{e.stopPropagation();onDelete(task.id)}}
                          className="p-1 rounded-lg hover:bg-red-50 text-ink-400 hover:text-red-500 transition-colors">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                      </div>
                    </div>

                    {/* Title */}
                    <p className="text-sm font-semibold text-ink-900 leading-snug mb-1.5">{task.title}</p>
                    {task.description && <p className="text-xs text-ink-400 line-clamp-2 mb-2">{task.description}</p>}

                    {/* Tags */}
                    {task.tags && task.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {task.tags.slice(0,3).map(tag => <TagPill key={tag} tag={tag}/>)}
                        {task.tags.length > 3 && <span className="tag bg-ink-50 text-ink-400 border-ink-200">+{task.tags.length-3}</span>}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-2.5 border-t border-ink-50 mt-1">
                      {task.deadline ? (
                        <span className={cn('text-xs flex items-center gap-1 font-medium',
                          dl.overdue?'text-red-600':dl.urgent?'text-gold-600':'text-ink-400')}>
                          📅 {dl.label}
                        </span>
                      ) : <span/>}
                      {task.cost_estimate > 0 && (
                        <span className="text-xs font-bold text-gold-600 tabular">{vnd(task.cost_estimate)}</span>
                      )}
                    </div>
                  </div>
                )
              })}
              {colTasks.length === 0 && !isOver && (
                <div className="flex flex-col items-center justify-center h-24 rounded-xl border-2 border-dashed border-ink-200 text-xs text-ink-300 gap-1">
                  <span className="text-lg opacity-50">⊕</span>
                  Kéo thả vào đây
                </div>
              )}
            </div>

            <button onClick={()=>onAdd(col.id)}
              className="mx-3 mb-3 mt-2 flex items-center gap-1.5 py-2.5 px-3 rounded-xl text-xs text-ink-400 hover:text-sakura-600 hover:bg-white/60 transition-all border border-dashed border-ink-200 hover:border-sakura-300 flex-shrink-0">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Thêm đầu mục
            </button>
          </div>
        )
      })}
    </div>
  )
}

// ── Overview Tab ──────────────────────────────────────────────────────────────
function OverviewTab({ project, tasks, totalSpent, remaining, budgetPct }:
  { project:Project; tasks:Task[]; totalSpent:number; remaining:number; budgetPct:number }) {
  const progress = pct(tasks.filter(t=>t.status==='done').length, tasks.length)
  const days     = daysTo(project.event_date)
  const upcomingTasks = tasks
    .filter(t=>t.deadline&&t.status!=='done')
    .sort((a,b)=>new Date(a.deadline!).getTime()-new Date(b.deadline!).getTime())
    .slice(0,5)

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-4">
        {/* Hero summary */}
        <div className="card p-5 overflow-hidden relative" style={{background:'linear-gradient(135deg,#fffdf9,#fff8f0)'}}>
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-5" style={{background:'#ff3d78',transform:'translate(30%,-30%)'}}/>
          <div className="relative flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {project.description && <p className="text-sm text-ink-600 mb-3 leading-relaxed">{project.description}</p>}
              {project.tags && project.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {project.tags.map(tag => {
                    const TC: Record<string,string> = {'truyền thống':'bg-amber-50 text-amber-700 border-amber-200','hiện đại':'bg-blue-50 text-blue-700 border-blue-200','tiết kiệm':'bg-jade-50 text-jade-700 border-jade-200','sang trọng':'bg-sakura-50 text-sakura-700 border-sakura-200','miền trung':'bg-orange-50 text-orange-700 border-orange-200','miền bắc':'bg-purple-50 text-purple-700 border-purple-200','miền nam':'bg-teal-50 text-teal-700 border-teal-200'}
                    return <span key={tag} className={`tag border ${TC[tag]??'bg-ink-50 text-ink-600 border-ink-200'}`}>{tag}</span>
                  })}
                </div>
              )}
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-ink-500">
                {project.event_date && <span className="flex items-center gap-1 font-medium">📅 {fmtDate(project.event_date)}</span>}
                {project.venue && <span className="flex items-center gap-1">📍 {project.venue}</span>}
                {days !== null && (
                  <span className={cn('flex items-center gap-1 font-bold',
                    days < 0 ? 'text-ink-400' : days <= 14 ? 'text-sakura-600' : 'text-gold-600')}>
                    ⏳ {days < 0 ? 'Đã diễn ra' : `Còn ${days} ngày`}
                  </span>
                )}
              </div>
            </div>
            <div className="text-center flex-shrink-0">
              <p className="font-display text-5xl font-bold text-gradient-sakura tabular">{progress}%</p>
              <p className="text-xs text-ink-400 font-medium mt-0.5">hoàn thành</p>
              <p className="text-xs text-ink-500 mt-1">{tasks.filter(t=>t.status==='done').length}/{tasks.length} đầu mục</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="progress-track h-2.5">
              <div className="progress-bar" style={{width:`${progress}%`,height:'100%'}}/>
            </div>
          </div>
        </div>

        {/* Status breakdown */}
        <div className="card p-5">
          <h3 className="font-display text-lg font-semibold text-ink-900 mb-4">Phân bổ đầu mục</h3>
          {(['todo','in_progress','done'] as TaskStatus[]).map(s => {
            const count = tasks.filter(t=>t.status===s).length
            const p     = tasks.length ? Math.round(count/tasks.length*100) : 0
            const C = {todo:{bar:'bg-ink-300',txt:'text-ink-600'},in_progress:{bar:'bg-gold-400',txt:'text-gold-700'},done:{bar:'bg-jade-400',txt:'text-jade-700'}}[s]
            return (
              <div key={s} className="mb-3.5 last:mb-0">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2.5">
                    <div className={cn('w-2.5 h-2.5 rounded-full', C.bar)}/>
                    <span className="text-sm font-medium text-ink-700">{STATUS_LABELS[s]}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-ink-400">{p}%</span>
                    <span className={cn('text-sm font-bold tabular', C.txt)}>{count}</span>
                  </div>
                </div>
                <div className="progress-track h-1.5">
                  <div className={cn(C.bar,'h-full rounded-full transition-all duration-700')} style={{width:`${p}%`}}/>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Right column */}
      <div className="space-y-4">
        {/* Budget card — CORRECT CALCULATION */}
        <div className="card p-5">
          <h3 className="font-display text-lg font-semibold text-ink-900 mb-4">Ngân sách</h3>
          <div className="space-y-2.5 mb-4">
            {[
              {label:'Kế hoạch', value:vnd(project.budget_total), cls:'text-ink-800'},
              {label:'Đã chi (từ chi tiêu)', value:vnd(totalSpent), cls:'text-sakura-600'},
              {label:'Còn lại', value:vnd(Math.abs(remaining)), cls: remaining>=0?'text-jade-600':'text-red-600'},
            ].map((r,i) => (
              <div key={i} className={cn('flex items-center justify-between py-2 border-b border-ink-50 last:border-0', i===1&&'bg-sakura-50/50 -mx-2 px-2 rounded-lg border-0')}>
                <span className="text-xs text-ink-500 font-medium">{r.label}</span>
                <span className={cn('text-sm font-bold tabular', r.cls)}>{r.value}</span>
              </div>
            ))}
          </div>
          <div className="progress-track h-2.5">
            <div className={remaining<0?'progress-bar-danger':'progress-bar'} style={{width:`${budgetPct}%`,height:'100%'}}/>
          </div>
          <p className="text-xs text-ink-400 mt-1.5 text-right tabular">{Math.round(budgetPct)}% đã dùng</p>
          {remaining < 0 && (
            <div className="mt-3 p-2.5 bg-red-50 rounded-xl border border-red-200 text-xs text-red-700 flex items-center gap-2">
              ⚠️ Vượt ngân sách <strong>{vnd(Math.abs(remaining))}</strong>
            </div>
          )}
        </div>

        {/* Upcoming deadlines */}
        <div className="card p-5">
          <h3 className="font-display text-lg font-semibold text-ink-900 mb-3">Hạn chót sắp tới</h3>
          {upcomingTasks.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-2xl mb-2">🎉</p>
              <p className="text-xs text-ink-400">Không có hạn chót nào sắp tới</p>
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingTasks.map(t => {
                const dl = deadlineInfo(t.deadline)
                return (
                  <div key={t.id} className={cn('flex items-start gap-2.5 p-2.5 rounded-xl',
                    dl.overdue?'bg-red-50 border border-red-100':dl.urgent?'bg-gold-50 border border-gold-100':'bg-ink-50')}>
                    <div className={cn('w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0',
                      dl.overdue?'bg-red-500':dl.urgent?'bg-gold-500':'bg-ink-300')}/>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-ink-900 truncate">{t.title}</p>
                      <p className={cn('text-[10px] font-medium mt-0.5',
                        dl.overdue?'text-red-600':dl.urgent?'text-gold-700':'text-ink-400')}>{dl.label}</p>
                    </div>
                    <span className={`badge ${PRI_BADGE_CLS[t.priority]} text-[10px] flex-shrink-0`}>{PRI_LABELS[t.priority]}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Budget Tab — CORRECT: total_spent from expenses ───────────────────────────
function BudgetTab({ project, tasks, expenses, totalSpent, remaining, budgetPct, onAddExpense, onDeleteExpense }:
  { project:Project; tasks:Task[]; expenses:Expense[]; totalSpent:number; remaining:number; budgetPct:number; onAddExpense:(d:any)=>Promise<void>; onDeleteExpense:(id:string)=>void }) {
  const [showAdd, setShowAdd]   = useState(false)
  const [delId,   setDelId]     = useState<string|null>(null)
  const [deleting, setDeleting] = useState(false)
  const { success } = useToast()

  async function handleDel() {
    if (!delId) return; setDeleting(true)
    await onDeleteExpense(delId); success('Đã xóa chi tiêu ✓')
    setDeleting(false); setDelId(null)
  }

  // Group expenses by category
  const byCategory = expenses.reduce((acc, e) => {
    const cat = e.category || 'Khác'
    acc[cat] = (acc[cat]||0) + e.amount
    return acc
  }, {} as Record<string,number>)

  return (
    <div className="space-y-4">
      {/* Summary row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {icon:'🏦',label:'Ngân sách',value:vnd(project.budget_total),cls:'text-ink-800'},
          {icon:'💸',label:'Đã chi (tổng expenses)',value:vnd(totalSpent),cls:'text-sakura-600'},
          {icon:remaining>=0?'✅':'⚠️',label:'Còn lại',value:vnd(Math.abs(remaining)),cls:remaining>=0?'text-jade-600':'text-red-600'},
        ].map((s,i) => (
          <div key={i} className="card p-4 text-center">
            <div className="text-2xl mb-1.5">{s.icon}</div>
            <p className="text-[10px] text-ink-400 font-semibold uppercase tracking-wide mb-0.5">{s.label}</p>
            <p className={cn('text-sm font-bold tabular leading-tight', s.cls)}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Budget bar */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-ink-800">Tiến độ ngân sách</span>
          <span className="text-xs font-bold text-ink-600 tabular">{vnd(totalSpent)} / {vnd(project.budget_total)}</span>
        </div>
        <div className="progress-track h-3">
          <div className={remaining<0?'progress-bar-danger':'progress-bar'} style={{width:`${budgetPct}%`,height:'100%'}}/>
        </div>
        <div className="flex justify-between text-xs text-ink-400 mt-1.5">
          <span>{Math.round(budgetPct)}% đã dùng</span>
          <span className={remaining<0?'text-red-500 font-bold':'text-jade-600 font-semibold'}>{remaining>=0?`Còn ${vnd(remaining)}`:`Vượt ${vnd(Math.abs(remaining))}`}</span>
        </div>
      </div>

      {/* By category */}
      {Object.keys(byCategory).length > 0 && (
        <div className="card p-5">
          <h3 className="font-semibold text-ink-800 text-sm mb-3">Chi tiêu theo danh mục</h3>
          <div className="space-y-2">
            {Object.entries(byCategory).sort(([,a],[,b])=>b-a).map(([cat, amount]) => {
              const catPct = totalSpent > 0 ? (amount/totalSpent)*100 : 0
              return (
                <div key={cat} className="flex items-center gap-3">
                  <span className="text-xs text-ink-600 w-28 flex-shrink-0 font-medium">{cat}</span>
                  <div className="flex-1 progress-track h-1.5">
                    <div className="progress-bar" style={{width:`${catPct}%`,height:'100%'}}/>
                  </div>
                  <span className="text-xs font-bold text-ink-800 tabular w-24 text-right">{vnd(amount)}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Task estimate table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-ink-100 font-semibold text-ink-800 text-sm">
          Chi phí dự kiến theo đầu mục
          <span className="ml-2 text-xs font-normal text-ink-400">(tham khảo — không tính vào tổng đã chi)</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-ink-50/70 border-b border-ink-100">
                {['Đầu mục','Dự kiến','Thực tế (ghi chú)','Trạng thái'].map(h=>(
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-bold text-ink-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-50">
              {tasks.map(t=>(
                <tr key={t.id} className="hover:bg-ink-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-ink-900 text-sm">{t.title}</p>
                    {t.tags && t.tags.length>0 && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {t.tags.slice(0,2).map(tag=><TagPill key={tag} tag={tag}/>)}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-bold text-gold-700 tabular text-sm">{vnd(t.cost_estimate)}</td>
                  <td className="px-4 py-3">
                    {t.cost_actual > 0
                      ? <span className="font-medium text-ink-600 tabular text-sm">{vnd(t.cost_actual)}</span>
                      : <span className="text-ink-300 text-xs">Chưa có</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge badge-${t.status} text-[10px]`}>{STATUS_LABELS[t.status]}</span>
                  </td>
                </tr>
              ))}
              <tr className="bg-ink-50 border-t-2 border-ink-200 font-bold">
                <td className="px-4 py-3 text-ink-900">TỔNG KẾ HOẠCH</td>
                <td className="px-4 py-3 text-gold-700 tabular">{vnd(tasks.reduce((s,t)=>s+t.cost_estimate,0))}</td>
                <td className="px-4 py-3 text-ink-600 tabular">{vnd(tasks.reduce((s,t)=>s+t.cost_actual,0))}</td>
                <td className="px-4 py-3"/>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Expense log */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-ink-100 flex items-center justify-between">
          <div>
            <span className="font-semibold text-ink-800 text-sm">Lịch sử chi tiêu</span>
            <span className="ml-2 text-xs text-ink-400">({expenses.length} giao dịch · Tổng: {vnd(totalSpent)})</span>
          </div>
          <button onClick={()=>setShowAdd(true)} className="btn btn-gold btn-xs">+ Thêm</button>
        </div>
        {expenses.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3 animate-float">💳</div>
            <p className="text-sm text-ink-400 mb-4">Chưa có chi tiêu nào được ghi nhận</p>
            <button onClick={()=>setShowAdd(true)} className="btn btn-gold btn-sm mx-auto">Thêm chi tiêu đầu tiên</button>
          </div>
        ) : (
          <div className="divide-y divide-ink-50">
            {expenses.map(e=>(
              <div key={e.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-ink-50/50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
                    style={{background:'linear-gradient(135deg,rgba(255,61,120,0.08),rgba(245,158,11,0.08))'}}>
                    💸
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink-900 truncate">{e.note || e.category || 'Chi tiêu'}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-ink-400">{fmtDate(e.spent_at)}</p>
                      {e.category && <span className="tag bg-ink-50 text-ink-500 border-ink-200">{e.category}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-base font-bold text-sakura-600 tabular">{vnd(e.amount)}</span>
                  <button onClick={()=>setDelId(e.id)}
                    className="btn btn-ghost btn-xs btn-icon hover:bg-red-50 hover:text-red-500">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ExpenseModal open={showAdd} onClose={()=>setShowAdd(false)} onSave={onAddExpense} tasks={tasks}/>
      <ConfirmModal open={!!delId} onClose={()=>setDelId(null)} onConfirm={handleDel} loading={deleting}
        title="Xóa chi tiêu?" msg="Chi tiêu này sẽ bị xóa và tổng tiền đã chi sẽ được cập nhật lại." confirmLabel="Xóa chi tiêu"/>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
type Tab = 'overview'|'kanban'|'budget'

function ProjectContent() {
  const params    = useParams()
  const projectId = params.id as string
  const { success, error: toastErr } = useToast()
  const { project, tasks, expenses, loading, error, refetch, totalSpent, remaining, budgetPct } = useProject(projectId)

  const [tab, setTab]               = useState<Tab>('overview')
  const [showTaskModal, setShowTaskModal]   = useState(false)
  const [editingTask,   setEditingTask]     = useState<Task|undefined>()
  const [defaultStatus, setDefaultStatus]  = useState<TaskStatus>('todo')
  const [deleteTaskId,  setDeleteTaskId]   = useState<string|null>(null)
  const [deleting,      setDeleting]       = useState(false)
  const [showEditProject, setShowEditProject] = useState(false)

  const handleSaveTask = useCallback(async (data: any) => {
    if (editingTask) {
      const { error } = await updateTask(editingTask.id, data)
      if (error) { toastErr('Không cập nhật được', error); return }
      success('Đã cập nhật đầu mục ✓')
    } else {
      const { error } = await createTask({ project_id: projectId, ...data })
      if (error) { toastErr('Không thêm được', error); return }
      success('Đã thêm đầu mục mới! 🎉')
    }
    await refetch(); setEditingTask(undefined)
  }, [editingTask, projectId, refetch, success, toastErr])

  const handleMoveTask = useCallback(async (id: string, status: TaskStatus) => {
    const pos = tasks.filter(t=>t.status===status).length
    await moveTask(id, status, pos)
    success(`Đã chuyển sang "${STATUS_LABELS[status]}" ✓`)
    await refetch()
  }, [tasks, refetch, success])

  const handleDeleteTask = useCallback(async () => {
    if (!deleteTaskId) return; setDeleting(true)
    await deleteTask(deleteTaskId)
    success('Đã xóa đầu mục'); setDeleting(false); setDeleteTaskId(null)
    await refetch()
  }, [deleteTaskId, refetch, success])

  const handleAddExpense = useCallback(async (data: any) => {
    const { error } = await createExpense({ project_id: projectId, ...data })
    if (error) { toastErr('Không thêm được chi tiêu', error); return }
    success(`Đã ghi nhận ${vnd(data.amount)} 💸`)
    await refetch()
  }, [projectId, refetch, success, toastErr])

  const handleDeleteExpense = useCallback(async (id: string) => {
    await deleteExpense(id)
    await refetch()
  }, [refetch])

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center animate-fadeUp">
        <div className="text-5xl mb-3 animate-float">🌸</div>
        <p className="text-ink-400 font-medium">Đang tải dữ liệu...</p>
      </div>
    </div>
  )
  if (error || !project) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center animate-fadeUp">
        <div className="text-4xl mb-3">⚠️</div>
        <p className="text-ink-500 mb-4">{error || 'Không tìm thấy dự án'}</p>
        <Link href="/dashboard" className="btn btn-primary btn-sm">← Về trang chủ</Link>
      </div>
    </div>
  )

  const days = daysTo(project.event_date)
  const TABS = [{id:'overview' as Tab,label:'Tổng quan'},{id:'kanban' as Tab,label:'Kanban'},{id:'budget' as Tab,label:'Ngân sách'}]

  return (
    <>
      <TopBar
        title={project.name}
        subtitle={project.event_date
          ? `📅 ${fmtDate(project.event_date)}${days!==null&&days>0?` · còn ${days} ngày`:days===0?' · 🎊 Hôm nay!':' · đã diễn ra'}`
          : undefined}
        right={
          <div className="flex items-center gap-2">
            <button onClick={()=>setShowEditProject(true)}
              className="btn btn-ghost btn-sm btn-icon" title="Chỉnh sửa dự án">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button
              onClick={()=>{setEditingTask(undefined);setDefaultStatus('todo');setShowTaskModal(true)}}
              className="btn btn-primary btn-sm">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Thêm đầu mục
            </button>
          </div>
        }
      />

      {/* Tab bar */}
      <div className="sticky top-[61px] z-20 border-b border-ink-100 px-4 sm:px-6 flex items-center"
        style={{background:'rgba(255,253,249,0.95)',backdropFilter:'blur(20px)'}}>
        <div className="flex items-center -mb-px flex-1">
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} className={tab===t.id?'tab-active':'tab'}>
              {t.label}
            </button>
          ))}
        </div>
        {/* Budget badge in tab bar */}
        <div className="pb-1 flex-shrink-0 hidden sm:flex items-center gap-2">
          <span className={cn('badge text-[10px]', remaining<0?'badge-overdue':'badge-done')}>
            💸 {vnd(totalSpent)} / {vnd(project.budget_total)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className={cn('p-4 sm:p-6 max-w-7xl mx-auto w-full', tab==='kanban'&&'max-w-none')}>
        {tab==='overview' && (
          <OverviewTab project={project} tasks={tasks} totalSpent={totalSpent} remaining={remaining} budgetPct={budgetPct}/>
        )}
        {tab==='kanban' && (
          <KanbanBoard
            tasks={tasks}
            onEdit={t=>{setEditingTask(t);setShowTaskModal(true)}}
            onDelete={id=>setDeleteTaskId(id)}
            onMove={handleMoveTask}
            onAdd={s=>{setEditingTask(undefined);setDefaultStatus(s);setShowTaskModal(true)}}
          />
        )}
        {tab==='budget' && (
          <BudgetTab
            project={project} tasks={tasks} expenses={expenses}
            totalSpent={totalSpent} remaining={remaining} budgetPct={budgetPct}
            onAddExpense={handleAddExpense}
            onDeleteExpense={handleDeleteExpense}
          />
        )}
      </div>

      {/* Modals */}
      <TaskModal open={showTaskModal} onClose={()=>{setShowTaskModal(false);setEditingTask(undefined)}} onSave={handleSaveTask} task={editingTask} defaultStatus={defaultStatus}/>
      <EditProjectModal open={showEditProject} onClose={()=>setShowEditProject(false)} project={project} onSaved={refetch}/>
      <ConfirmModal open={!!deleteTaskId} onClose={()=>setDeleteTaskId(null)} onConfirm={handleDeleteTask} loading={deleting}
        title="Xóa đầu mục?" msg="Đầu mục này sẽ bị xóa vĩnh viễn. Hành động không thể hoàn tác." confirmLabel="Xóa đầu mục"/>
    </>
  )
}

export default function ProjectPage() {
  return <ToastProvider><Shell><ProjectContent/></Shell></ToastProvider>
}
