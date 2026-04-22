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
import { vnd, fmtDate, pct, deadline, daysTo, STATUS_LABELS, PRI_LABELS } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { Task, TaskStatus, Expense, Project } from '@/types'

// ── Task Modal ────────────────────────────────────────────────────────────────
function TaskModal({ open, onClose, onSave, task, defaultStatus }:
  { open:boolean; onClose:()=>void; onSave:(d:any)=>Promise<void>; task?:Task; defaultStatus:TaskStatus }) {
  const [form, setForm] = useState({
    title: task?.title??'', description: task?.description??'',
    status: task?.status??defaultStatus, priority: task?.priority??'medium',
    deadline: task?.deadline??'', cost_estimate: String(task?.cost_estimate??''), cost_actual: String(task?.cost_actual??''),
  })
  const [saving, setSaving] = useState(false)
  const sf = (k:string,v:string) => setForm(f=>({...f,[k]:v}))
  useState(() => {
    if (open) setForm({
      title: task?.title??'', description: task?.description??'',
      status: task?.status??defaultStatus, priority: task?.priority??'medium',
      deadline: task?.deadline??'', cost_estimate: String(task?.cost_estimate??''), cost_actual: String(task?.cost_actual??''),
    })
  })

  async function submit(e: FormEvent) {
    e.preventDefault(); if (!form.title.trim()) return
    setSaving(true)
    await onSave({ ...form, cost_estimate: Number(form.cost_estimate)||0, cost_actual: Number(form.cost_actual)||0 })
    setSaving(false); onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={task ? 'Chỉnh sửa đầu mục' : 'Thêm đầu mục mới'} size="lg"
      footer={<>
        <button onClick={onClose} className="btn btn-ghost btn-sm">Hủy</button>
        <button onClick={submit} disabled={saving} className="btn btn-primary btn-sm disabled:opacity-60">
          {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : (task ? 'Lưu' : 'Thêm')}
        </button>
      </>}>
      <form onSubmit={submit} className="space-y-3">
        <div><label className="label">Tên đầu mục *</label><input className="input" value={form.title} onChange={e=>sf('title',e.target.value)} placeholder="VD: Đặt mâm quả trầu cau" required/></div>
        <div><label className="label">Mô tả</label><textarea className="input resize-none" rows={2} value={form.description} onChange={e=>sf('description',e.target.value)} placeholder="Chi tiết..."/></div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Trạng thái</label>
            <select className="input" value={form.status} onChange={e=>sf('status',e.target.value)}>
              <option value="todo">Chưa làm</option>
              <option value="in_progress">Đang thực hiện</option>
              <option value="done">Hoàn thành</option>
            </select>
          </div>
          <div>
            <label className="label">Ưu tiên</label>
            <select className="input" value={form.priority} onChange={e=>sf('priority',e.target.value)}>
              <option value="low">Thấp</option>
              <option value="medium">Trung bình</option>
              <option value="high">Cao</option>
            </select>
          </div>
        </div>
        <div><label className="label">Hạn chót</label><input className="input" type="date" value={form.deadline} onChange={e=>sf('deadline',e.target.value)}/></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Dự kiến (VNĐ)</label><input className="input" type="number" value={form.cost_estimate} onChange={e=>sf('cost_estimate',e.target.value)} placeholder="0"/></div>
          <div><label className="label">Thực tế (VNĐ)</label><input className="input" type="number" value={form.cost_actual} onChange={e=>sf('cost_actual',e.target.value)} placeholder="0"/></div>
        </div>
      </form>
    </Modal>
  )
}

// ── Expense Modal ─────────────────────────────────────────────────────────────
function ExpenseModal({ open, onClose, onSave, tasks }:
  { open:boolean; onClose:()=>void; onSave:(d:any)=>Promise<void>; tasks:Task[] }) {
  const [form, setForm] = useState({ amount:'', note:'', task_id:'', spent_at: new Date().toISOString().slice(0,10) })
  const [saving, setSaving] = useState(false)
  const sf = (k:string,v:string) => setForm(f=>({...f,[k]:v}))

  async function submit(e: FormEvent) {
    e.preventDefault(); if (!form.amount) return
    setSaving(true)
    await onSave({ ...form, amount: Number(form.amount), task_id: form.task_id||undefined })
    setSaving(false); onClose()
    setForm({ amount:'', note:'', task_id:'', spent_at: new Date().toISOString().slice(0,10) })
  }

  return (
    <Modal open={open} onClose={onClose} title="Thêm chi tiêu" size="sm"
      footer={<>
        <button onClick={onClose} className="btn btn-ghost btn-sm">Hủy</button>
        <button onClick={submit} disabled={saving} className="btn btn-gold btn-sm disabled:opacity-60">
          {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : 'Lưu chi tiêu'}
        </button>
      </>}>
      <form onSubmit={submit} className="space-y-3">
        <div><label className="label">Số tiền (VNĐ) *</label><input className="input" type="number" value={form.amount} onChange={e=>sf('amount',e.target.value)} placeholder="5000000" required/></div>
        <div><label className="label">Ghi chú</label><input className="input" value={form.note} onChange={e=>sf('note',e.target.value)} placeholder="VD: Đặt cọc nhà hàng"/></div>
        <div>
          <label className="label">Liên kết đầu mục</label>
          <select className="input" value={form.task_id} onChange={e=>sf('task_id',e.target.value)}>
            <option value="">-- Không liên kết --</option>
            {tasks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>
        </div>
        <div><label className="label">Ngày chi</label><input className="input" type="date" value={form.spent_at} onChange={e=>sf('spent_at',e.target.value)}/></div>
      </form>
    </Modal>
  )
}

// ── Edit Project Modal ────────────────────────────────────────────────────────
function EditProjectModal({ open, onClose, project, onSaved }:
  { open:boolean; onClose:()=>void; project:Project; onSaved:()=>void }) {
  const { success } = useToast()
  const [form, setForm] = useState({ name: project.name, description: project.description??'', event_date: project.event_date??'', venue: project.venue??'', budget_total: String(project.budget_total) })
  const [saving, setSaving] = useState(false)
  const sf = (k:string,v:string) => setForm(f=>({...f,[k]:v}))

  async function submit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    await updateProject(project.id, { ...form, budget_total: Number(form.budget_total)||0 })
    setSaving(false); success('Đã cập nhật dự án'); onSaved(); onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Chỉnh sửa dự án" size="md"
      footer={<>
        <button onClick={onClose} className="btn btn-ghost btn-sm">Hủy</button>
        <button onClick={submit} disabled={saving} className="btn btn-primary btn-sm disabled:opacity-60">
          {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : 'Lưu'}
        </button>
      </>}>
      <form onSubmit={submit} className="space-y-3">
        <div><label className="label">Tên lễ *</label><input className="input" value={form.name} onChange={e=>sf('name',e.target.value)} required/></div>
        <div><label className="label">Mô tả</label><textarea className="input resize-none" rows={2} value={form.description} onChange={e=>sf('description',e.target.value)}/></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Ngày tổ chức</label><input className="input" type="date" value={form.event_date} onChange={e=>sf('event_date',e.target.value)}/></div>
          <div><label className="label">Ngân sách (VNĐ)</label><input className="input" type="number" value={form.budget_total} onChange={e=>sf('budget_total',e.target.value)}/></div>
        </div>
        <div><label className="label">Địa điểm</label><input className="input" value={form.venue} onChange={e=>sf('venue',e.target.value)}/></div>
      </form>
    </Modal>
  )
}

// ── Kanban Board ──────────────────────────────────────────────────────────────
const COLS: { id:TaskStatus; label:string; bg:string; border:string; dot:string }[] = [
  { id:'todo',        label:'Chưa làm',       bg:'bg-stone-50',   border:'border-stone-200',  dot:'bg-stone-400' },
  { id:'in_progress', label:'Đang thực hiện', bg:'bg-amber-50/60', border:'border-amber-200',  dot:'bg-amber-400' },
  { id:'done',        label:'Hoàn thành',     bg:'bg-emerald-50/60',border:'border-emerald-200',dot:'bg-emerald-500' },
]
const PRI_BADGE: Record<string,string> = { low:'badge-low', medium:'badge-medium', high:'badge-high' }

function KanbanBoard({ tasks, onEdit, onDelete, onMove, onAdd }:
  { tasks:Task[]; onEdit:(t:Task)=>void; onDelete:(id:string)=>void; onMove:(id:string,s:TaskStatus)=>void; onAdd:(s:TaskStatus)=>void }) {
  const [draggingId, setDraggingId] = useState<string|null>(null)
  const [overCol,    setOverCol]    = useState<TaskStatus|null>(null)

  return (
    <div className="flex gap-3 overflow-x-auto pb-4" style={{scrollSnapType:'x mandatory'}}>
      {COLS.map(col => {
        const colTasks = tasks.filter(t => t.status === col.id)
        const isOver   = overCol === col.id
        return (
          <div key={col.id}
            className={cn('flex-shrink-0 w-[300px] sm:flex-1 sm:min-w-0 rounded-2xl border-2 flex flex-col transition-all duration-150',
              col.bg, isOver ? 'border-rose-300 shadow-rose' : col.border)}
            style={{scrollSnapAlign:'start'}}
            onDragOver={e=>{e.preventDefault();setOverCol(col.id)}}
            onDragLeave={()=>setOverCol(null)}
            onDrop={()=>{ if(draggingId){onMove(draggingId,col.id);setDraggingId(null);setOverCol(null)} }}>

            {/* Column header */}
            <div className="flex items-center justify-between px-4 pt-4 pb-2 flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${col.dot}`}/>
                <span className="text-sm font-semibold text-stone-700">{col.label}</span>
                <span className="text-xs font-bold text-stone-500 bg-white/80 border border-stone-200 w-5 h-5 rounded-full flex items-center justify-center">{colTasks.length}</span>
              </div>
              <button onClick={()=>onAdd(col.id)} className="p-1 rounded-lg hover:bg-white/70 text-stone-400 hover:text-stone-600 transition-colors" title="Thêm">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </button>
            </div>

            {/* Cards */}
            <div className="flex-1 px-3 pb-2 space-y-2 min-h-[120px] overflow-y-auto">
              {isOver && draggingId && <div className="h-14 rounded-xl border-2 border-dashed border-rose-300 bg-rose-50/50 animate-pulse"/>}
              {colTasks.map(task => {
                const dl = deadline(task.deadline)
                return (
                  <div key={task.id} draggable
                    onDragStart={()=>setDraggingId(task.id)}
                    onDragEnd={()=>{setDraggingId(null);setOverCol(null)}}
                    className={cn('bg-white rounded-xl border border-stone-100 p-3.5 cursor-grab active:cursor-grabbing select-none transition-all duration-150 group',
                      draggingId===task.id?'opacity-40 scale-95':'hover:shadow-medium hover:-translate-y-0.5')}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className={`badge ${PRI_BADGE[task.priority]} text-[10px]`}>{PRI_LABELS[task.priority]}</span>
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={e=>{e.stopPropagation();onEdit(task)}} className="p-1 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-600">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button onClick={e=>{e.stopPropagation();onDelete(task.id)}} className="p-1 rounded-lg hover:bg-red-50 text-stone-400 hover:text-red-500">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                      </div>
                    </div>
                    <p className="text-sm font-medium text-stone-800 leading-snug mb-1.5">{task.title}</p>
                    {task.description && <p className="text-xs text-stone-400 line-clamp-2 mb-2">{task.description}</p>}
                    <div className="flex items-center justify-between pt-2 border-t border-stone-50">
                      {task.deadline ? (
                        <span className={`text-xs flex items-center gap-1 ${dl.overdue?'text-red-500 font-medium':dl.urgent?'text-amber-600':'text-stone-400'}`}>
                          📅 {dl.label}
                        </span>
                      ) : <span/>}
                      {task.cost_estimate > 0 && <span className="text-xs font-medium text-amber-600 tabular-nums">{vnd(task.cost_estimate)}</span>}
                    </div>
                  </div>
                )
              })}
              {colTasks.length === 0 && !isOver && (
                <div className="flex items-center justify-center h-20 rounded-xl border-2 border-dashed border-stone-200 text-xs text-stone-300">
                  Kéo thả vào đây
                </div>
              )}
            </div>

            <button onClick={()=>onAdd(col.id)}
              className="mx-3 mb-3 flex items-center gap-1.5 py-2 px-3 rounded-xl text-xs text-stone-400 hover:text-stone-600 hover:bg-white/60 transition-all border border-dashed border-stone-200 flex-shrink-0">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Thêm đầu mục
            </button>
          </div>
        )
      })}
    </div>
  )
}

// ── Overview Tab ──────────────────────────────────────────────────────────────
function OverviewTab({ project, tasks, expenses }:
  { project:Project; tasks:Task[]; expenses:Expense[] }) {
  const totalSpent = expenses.reduce((s,e)=>s+e.amount,0)
  const progress   = pct(tasks.filter(t=>t.status==='done').length, tasks.length)
  const days       = daysTo(project.event_date)

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-4">
        {/* Hero */}
        <div className="card p-5" style={{background:'linear-gradient(135deg,rgba(244,63,94,0.04) 0%,rgba(245,158,11,0.04) 100%)'}}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {project.description && <p className="text-sm text-stone-600 mb-3">{project.description}</p>}
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-stone-500 mb-4">
                {project.event_date && <span>📅 {fmtDate(project.event_date)}</span>}
                {project.venue && <span>📍 {project.venue}</span>}
                {days !== null && <span className={days > 0 ? 'text-rose-500 font-medium' : 'text-stone-400'}>⏳ {days > 0 ? `Còn ${days} ngày` : 'Đã diễn ra'}</span>}
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-stone-500">Tiến độ tổng thể</span>
                  <span className="font-semibold text-stone-700">{tasks.filter(t=>t.status==='done').length}/{tasks.length} đầu mục</span>
                </div>
                <div className="progress-track h-2">
                  <div className="progress-fill" style={{width:`${progress}%`,height:'100%'}}/>
                </div>
              </div>
            </div>
            <div className="text-center flex-shrink-0">
              <p className="font-display text-4xl font-bold text-rose-500">{progress}%</p>
              <p className="text-xs text-stone-400">hoàn thành</p>
            </div>
          </div>
        </div>

        {/* Status breakdown */}
        <div className="card p-5">
          <h3 className="font-semibold text-stone-800 text-sm mb-4">Phân bổ đầu mục</h3>
          {(['todo','in_progress','done'] as TaskStatus[]).map(s => {
            const count = tasks.filter(t=>t.status===s).length
            const p     = tasks.length ? Math.round(count/tasks.length*100) : 0
            const colors: Record<string,string> = { todo:'bg-stone-200', in_progress:'bg-amber-400', done:'bg-emerald-400' }
            return (
              <div key={s} className="mb-3 last:mb-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${colors[s]}`}/>
                    <span className="text-sm text-stone-600">{STATUS_LABELS[s]}</span>
                  </div>
                  <span className="text-sm font-semibold text-stone-800 tabular-nums">{count}</span>
                </div>
                <div className="progress-track h-1.5">
                  <div className={`h-full ${colors[s]} rounded-full transition-all duration-700`} style={{width:`${p}%`}}/>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Right */}
      <div className="space-y-4">
        {/* Budget */}
        <div className="card p-5">
          <h3 className="font-semibold text-stone-800 text-sm mb-3">Ngân sách</h3>
          {[
            {label:'Kế hoạch', value:vnd(project.budget_total), cls:'text-stone-700'},
            {label:'Đã chi',   value:vnd(totalSpent),            cls:'text-rose-500'},
            {label:'Còn lại',  value:vnd(project.budget_total-totalSpent), cls:(project.budget_total-totalSpent)>=0?'text-emerald-600':'text-red-500'},
          ].map((r,i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-stone-50 last:border-0">
              <span className="text-xs text-stone-500">{r.label}</span>
              <span className={`text-xs font-bold tabular-nums ${r.cls}`}>{r.value}</span>
            </div>
          ))}
          <div className="progress-track h-1.5 mt-3">
            <div className="progress-fill" style={{width:`${Math.min(100,(totalSpent/project.budget_total)*100)}%`,height:'100%'}}/>
          </div>
        </div>

        {/* Upcoming */}
        <div className="card p-5">
          <h3 className="font-semibold text-stone-800 text-sm mb-3">Hạn chót sắp tới</h3>
          {tasks.filter(t=>t.deadline&&t.status!=='done')
            .sort((a,b)=>new Date(a.deadline!).getTime()-new Date(b.deadline!).getTime())
            .slice(0,4).map(t => {
              const dl = deadline(t.deadline)
              return (
                <div key={t.id} className={`flex items-start gap-2 p-2 rounded-lg mb-1.5 ${dl.overdue?'bg-red-50':dl.urgent?'bg-amber-50':'bg-stone-50'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${dl.overdue?'bg-red-400':dl.urgent?'bg-amber-400':'bg-stone-300'}`}/>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-stone-800 truncate">{t.title}</p>
                    <p className={`text-[10px] ${dl.overdue?'text-red-500 font-medium':dl.urgent?'text-amber-600':'text-stone-400'}`}>{dl.label}</p>
                  </div>
                </div>
              )
            })}
          {tasks.filter(t=>t.deadline&&t.status!=='done').length===0 && (
            <p className="text-xs text-stone-400 text-center py-4">🎉 Không có hạn chót nào</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Budget Tab ────────────────────────────────────────────────────────────────
function BudgetTab({ project, tasks, expenses, onAddExpense, onDeleteExpense }:
  { project:Project; tasks:Task[]; expenses:Expense[]; onAddExpense:(d:any)=>Promise<void>; onDeleteExpense:(id:string)=>void }) {
  const [showAdd, setShowAdd]     = useState(false)
  const [delId,   setDelId]       = useState<string|null>(null)
  const [deleting, setDeleting]   = useState(false)
  const { success } = useToast()
  const totalSpent = expenses.reduce((s,e)=>s+e.amount,0)
  const usedPct    = project.budget_total > 0 ? Math.min(100, (totalSpent/project.budget_total)*100) : 0

  async function handleDel() {
    if (!delId) return; setDeleting(true)
    await onDeleteExpense(delId); success('Đã xóa chi tiêu')
    setDeleting(false); setDelId(null)
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {icon:'🏦',label:'Ngân sách',value:vnd(project.budget_total),cls:'text-stone-700'},
          {icon:'💸',label:'Đã chi',    value:vnd(totalSpent),           cls:'text-rose-500'},
          {icon:project.budget_total-totalSpent>=0?'✅':'⚠️',label:'Còn lại', value:vnd(Math.abs(project.budget_total-totalSpent)),cls:project.budget_total-totalSpent>=0?'text-emerald-600':'text-red-500'},
        ].map((s,i) => (
          <div key={i} className="card p-4 text-center">
            <div className="text-2xl mb-1.5">{s.icon}</div>
            <p className="text-[10px] text-stone-400 mb-0.5">{s.label}</p>
            <p className={`text-sm font-bold tabular-nums ${s.cls}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-stone-700">Tiến độ ngân sách</span>
          <span className="text-xs text-stone-400 tabular-nums">{Math.round(usedPct)}% đã dùng</span>
        </div>
        <div className="progress-track h-3">
          <div className="progress-fill" style={{width:`${usedPct}%`,height:'100%',background:usedPct>90?'#f43f5e':undefined}}/>
        </div>
      </div>

      {/* Task costs */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-stone-100 font-semibold text-stone-800 text-sm">Chi phí theo đầu mục</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-stone-50 border-b border-stone-100">
              {['Đầu mục','Dự kiến','Thực tế','Chênh lệch','Trạng thái'].map(h=>(
                <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-stone-50">
              {tasks.map(t => {
                const diff = t.cost_actual - t.cost_estimate
                return (
                  <tr key={t.id} className="hover:bg-stone-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-stone-800">{t.title}</td>
                    <td className="px-4 py-3 text-stone-600 tabular-nums">{vnd(t.cost_estimate)}</td>
                    <td className="px-4 py-3 tabular-nums">{t.cost_actual>0?vnd(t.cost_actual):<span className="text-stone-300">—</span>}</td>
                    <td className="px-4 py-3 tabular-nums">{t.cost_actual>0?<span className={diff>0?'text-red-500 font-medium':'text-emerald-600 font-medium'}>{diff>0?'+':''}{vnd(diff)}</span>:<span className="text-stone-300">—</span>}</td>
                    <td className="px-4 py-3"><span className={`badge badge-${t.status} text-[10px]`}>{STATUS_LABELS[t.status]}</span></td>
                  </tr>
                )
              })}
              <tr className="bg-stone-50 font-semibold">
                <td className="px-4 py-3 text-stone-800">TỔNG</td>
                <td className="px-4 py-3 text-amber-600 tabular-nums">{vnd(tasks.reduce((s,t)=>s+t.cost_estimate,0))}</td>
                <td className="px-4 py-3 text-rose-500 tabular-nums">{vnd(tasks.reduce((s,t)=>s+t.cost_actual,0))}</td>
                <td className="px-4 py-3" colSpan={2}/>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Expense log */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-stone-100 flex items-center justify-between">
          <span className="font-semibold text-stone-800 text-sm">Lịch sử chi tiêu</span>
          <button onClick={()=>setShowAdd(true)} className="btn btn-secondary btn-xs">+ Thêm</button>
        </div>
        {expenses.length === 0 ? (
          <div className="text-center py-10">
            <div className="text-3xl mb-2">💳</div>
            <p className="text-sm text-stone-400 mb-3">Chưa có chi tiêu nào</p>
            <button onClick={()=>setShowAdd(true)} className="btn btn-secondary btn-sm">Thêm chi tiêu đầu tiên</button>
          </div>
        ) : (
          <div className="divide-y divide-stone-50">
            {expenses.map(e => (
              <div key={e.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-stone-50/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center text-sm flex-shrink-0">💸</div>
                  <div>
                    <p className="text-sm font-medium text-stone-800">{e.note||'Chi tiêu'}</p>
                    <p className="text-xs text-stone-400">{fmtDate(e.spent_at)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-rose-500 tabular-nums">{vnd(e.amount)}</span>
                  <button onClick={()=>setDelId(e.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-stone-300 hover:text-red-400 transition-colors">
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
        title="Xóa chi tiêu?" msg="Chi tiêu này sẽ bị xóa vĩnh viễn." confirmLabel="Xóa"/>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
type Tab = 'overview'|'kanban'|'budget'

function ProjectContent() {
  const params    = useParams()
  const projectId = params.id as string
  const { success, error: toastErr } = useToast()
  const { project, tasks, expenses, loading, error, refetch } = useProject(projectId)

  const [tab, setTab]             = useState<Tab>('overview')
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [editingTask,   setEditingTask]   = useState<Task|undefined>()
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>('todo')
  const [deleteTaskId,  setDeleteTaskId]  = useState<string|null>(null)
  const [deleting,      setDeleting]      = useState(false)
  const [showEditProject, setShowEditProject] = useState(false)

  const handleSaveTask = useCallback(async (data: any) => {
    if (editingTask) {
      const { error } = await updateTask(editingTask.id, data)
      if (error) { toastErr('Lỗi: ' + error); return }
      success('Đã cập nhật đầu mục')
    } else {
      const { error } = await createTask({ project_id: projectId, ...data })
      if (error) { toastErr('Lỗi: ' + error); return }
      success('Đã thêm đầu mục!')
    }
    await refetch(); setEditingTask(undefined)
  }, [editingTask, projectId, refetch, success, toastErr])

  const handleMoveTask = useCallback(async (id: string, status: TaskStatus) => {
    const pos = tasks.filter(t=>t.status===status).length
    await moveTask(id, status, pos)
    success(`Đã chuyển sang "${STATUS_LABELS[status]}"`)
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
    if (error) { toastErr('Lỗi: ' + error); return }
    success(`Đã thêm chi tiêu ${vnd(data.amount)}`)
    await refetch()
  }, [projectId, refetch, success, toastErr])

  const handleDeleteExpense = useCallback(async (id: string) => {
    await deleteExpense(id); await refetch()
  }, [refetch])

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center"><div className="text-4xl mb-3">🌸</div><p className="text-stone-400">Đang tải...</p></div>
    </div>
  )
  if (error || !project) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <p className="text-stone-500 mb-3">{error || 'Không tìm thấy dự án'}</p>
        <Link href="/dashboard" className="btn btn-primary btn-sm">Về trang chủ</Link>
      </div>
    </div>
  )

  const days       = daysTo(project.event_date)
  const totalSpent = expenses.reduce((s,e)=>s+e.amount,0)
  const TABS = [
    {id:'overview' as Tab, label:'Tổng quan'},
    {id:'kanban'   as Tab, label:'Kanban'},
    {id:'budget'   as Tab, label:'Ngân sách'},
  ]

  return (
    <>
      <TopBar
        title={project.name}
        subtitle={project.event_date
          ? `📅 ${fmtDate(project.event_date)}${days !== null && days > 0 ? ` · còn ${days} ngày` : ''}`
          : undefined}
        right={
          <div className="flex items-center gap-2">
            <button onClick={()=>setShowEditProject(true)} className="btn btn-ghost btn-sm px-2.5" title="Chỉnh sửa">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button onClick={()=>{setEditingTask(undefined);setDefaultStatus('todo');setShowTaskModal(true)}} className="btn btn-primary btn-sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Thêm
            </button>
          </div>
        }
      />

      {/* Tabs */}
      <div className="sticky top-[57px] z-20 bg-white/90 backdrop-blur-md border-b border-stone-100 px-4 sm:px-6">
        <div className="flex items-center -mb-px">
          {TABS.map(t => (
            <button key={t.id} onClick={()=>setTab(t.id)} className={tab===t.id?'tab-active':'tab'}>
              {t.label}
            </button>
          ))}
          <div className="ml-auto pb-1">
            <span className={`badge text-[10px] ${totalSpent>project.budget_total?'badge-overdue':'badge-done'}`}>
              {vnd(totalSpent)} / {vnd(project.budget_total)}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className={cn('p-4 sm:p-6 max-w-7xl mx-auto w-full', tab==='kanban'&&'max-w-none')}>
        {tab==='overview' && <OverviewTab project={project} tasks={tasks} expenses={expenses}/>}
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
            onAddExpense={handleAddExpense}
            onDeleteExpense={handleDeleteExpense}
          />
        )}
      </div>

      {/* Modals */}
      <TaskModal
        open={showTaskModal}
        onClose={()=>{setShowTaskModal(false);setEditingTask(undefined)}}
        onSave={handleSaveTask}
        task={editingTask}
        defaultStatus={defaultStatus}
      />
      <EditProjectModal
        open={showEditProject}
        onClose={()=>setShowEditProject(false)}
        project={project}
        onSaved={refetch}
      />
      <ConfirmModal
        open={!!deleteTaskId}
        onClose={()=>setDeleteTaskId(null)}
        onConfirm={handleDeleteTask}
        loading={deleting}
        title="Xóa đầu mục?"
        msg="Đầu mục này sẽ bị xóa vĩnh viễn."
        confirmLabel="Xóa"
      />
    </>
  )
}

export default function ProjectPage() {
  return (
    <ToastProvider>
      <Shell>
        <ProjectContent/>
      </Shell>
    </ToastProvider>
  )
}
