'use client'
import { useState, useCallback, FormEvent } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useProject } from '@/hooks/useProject'
import { useAuth } from '@/hooks/useAuth'
import { createTask, updateTask, deleteTask, moveTask } from '@/lib/api/tasks'
import { createExpense, deleteExpense } from '@/lib/api/expenses'
import { formatCurrency, formatDate, calcProgress, calcRemaining, daysUntilEvent, getDeadlineLabel, STATUS_LABELS, PRIORITY_LABELS } from '@/lib/utils'
import type { Task, TaskStatus, CreateTaskDTO, UpdateTaskDTO } from '@/types'

type View = 'dashboard'|'kanban'|'budget'

const SS = {
  todo:        {bg:'bg-slate-50',  border:'border-slate-200',  dot:'bg-slate-400',   badge:'bg-slate-100 text-slate-600'},
  in_progress: {bg:'bg-amber-50',  border:'border-amber-200',  dot:'bg-amber-400',   badge:'bg-amber-50 text-amber-700 border border-amber-200'},
  done:        {bg:'bg-emerald-50',border:'border-emerald-200',dot:'bg-emerald-500',  badge:'bg-emerald-50 text-emerald-700 border border-emerald-200'},
} as const

const PB = {low:'bg-blue-50 text-blue-600',medium:'bg-amber-50 text-amber-700',high:'bg-red-50 text-red-700'} as const

const IcoX    = ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
const IcoEdit = ()=><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
const IcoTrash= ()=><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
const IcoBack = ()=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>

function Modal({title,onClose,children}:{title:string;onClose:()=>void;children:React.ReactNode}) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#F5EFE0]">
          <h2 className="font-display text-lg font-semibold text-[#2C1810]">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#F5EFE0] text-[#A89080]"><IcoX/></button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

function TaskForm({onClose,onSave,task,defaultStatus}:{onClose:()=>void;onSave:(d:UpdateTaskDTO&{status:TaskStatus})=>Promise<void>;task?:Task;defaultStatus:TaskStatus}) {
  const [form,setForm]=useState({
    title:task?.title??'', description:task?.description??'',
    status:task?.status??defaultStatus, priority:task?.priority??'medium' as const,
    deadline:task?.deadline??'', cost_estimate:task?.cost_estimate??0, cost_actual:task?.cost_actual??0
  })
  const [saving,setSaving]=useState(false)
  const sf=(k:string,v:unknown)=>setForm(f=>({...f,[k]:v}))
  async function go(e:FormEvent) {
    e.preventDefault(); if(!form.title.trim()) return
    setSaving(true); await onSave(form as UpdateTaskDTO&{status:TaskStatus}); setSaving(false); onClose()
  }
  return (
    <form onSubmit={go} className="space-y-4">
      <div><label className="label">Tên đầu mục *</label><input className="input" value={form.title} onChange={e=>sf('title',e.target.value)} placeholder="VD: Đặt mâm quả trầu cau" required/></div>
      <div><label className="label">Mô tả</label><textarea className="input resize-none" rows={3} value={form.description} onChange={e=>sf('description',e.target.value)} placeholder="Chi tiết cần chuẩn bị..."/></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label">Trạng thái</label>
          <select className="input" value={form.status} onChange={e=>sf('status',e.target.value)}>
            <option value="todo">Chưa làm</option><option value="in_progress">Đang thực hiện</option><option value="done">Hoàn thành</option>
          </select></div>
        <div><label className="label">Ưu tiên</label>
          <select className="input" value={form.priority} onChange={e=>sf('priority',e.target.value)}>
            <option value="low">Thấp</option><option value="medium">Trung bình</option><option value="high">Cao</option>
          </select></div>
      </div>
      <div><label className="label">Hạn chót</label><input type="date" className="input" value={form.deadline} onChange={e=>sf('deadline',e.target.value)}/></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label">Dự kiến (VNĐ)</label><input type="number" className="input" value={form.cost_estimate||''} onChange={e=>sf('cost_estimate',Number(e.target.value))} placeholder="0"/></div>
        <div><label className="label">Thực tế (VNĐ)</label><input type="number" className="input" value={form.cost_actual||''} onChange={e=>sf('cost_actual',Number(e.target.value))} placeholder="0"/></div>
      </div>
      <div className="flex gap-2 pt-2">
        <button type="button" onClick={onClose} className="btn-ghost flex-1 justify-center border border-[#E8D5C4]">Hủy</button>
        <button type="submit" disabled={saving||!form.title.trim()} className="btn-primary flex-1 justify-center disabled:opacity-60">{saving?'Đang lưu...':task?'Lưu thay đổi':'Thêm đầu mục'}</button>
      </div>
    </form>
  )
}

function ExpenseForm({tasks,onClose,onSave}:{tasks:Task[];onClose:()=>void;onSave:(d:{amount:number;note:string;task_id:string;spent_at:string})=>Promise<void>}) {
  const [form,setForm]=useState({amount:'',note:'',task_id:'',spent_at:new Date().toISOString().slice(0,10)})
  const [saving,setSaving]=useState(false)
  const sf=(k:string,v:string)=>setForm(f=>({...f,[k]:v}))
  async function go(e:FormEvent) {
    e.preventDefault(); if(!form.amount) return
    setSaving(true); await onSave({...form,amount:Number(form.amount)}); setSaving(false); onClose()
  }
  return (
    <form onSubmit={go} className="space-y-4">
      <div><label className="label">Số tiền (VNĐ) *</label><input type="number" className="input" value={form.amount} onChange={e=>sf('amount',e.target.value)} placeholder="5000000" required/></div>
      <div><label className="label">Ghi chú</label><input className="input" value={form.note} onChange={e=>sf('note',e.target.value)} placeholder="VD: Đặt cọc nhà hàng"/></div>
      <div><label className="label">Liên kết đầu mục</label>
        <select className="input" value={form.task_id} onChange={e=>sf('task_id',e.target.value)}>
          <option value="">-- Không liên kết --</option>
          {tasks.map(t=><option key={t.id} value={t.id}>{t.title}</option>)}
        </select></div>
      <div><label className="label">Ngày chi</label><input type="date" className="input" value={form.spent_at} onChange={e=>sf('spent_at',e.target.value)}/></div>
      <div className="flex gap-2 pt-2">
        <button type="button" onClick={onClose} className="btn-ghost flex-1 justify-center border border-[#E8D5C4]">Hủy</button>
        <button type="submit" disabled={saving||!form.amount} className="btn-gold flex-1 justify-center disabled:opacity-60">{saving?'Đang lưu...':'Lưu chi tiêu'}</button>
      </div>
    </form>
  )
}

export default function ProjectPage() {
  const params=useParams(); const projectId=params.id as string
  useAuth()
  const {project,tasks,expenses,loading,refetch}=useProject(projectId)
  const [view,setView]=useState<View>('dashboard')
  const [modal,setModal]=useState<'task'|'expense'|null>(null)
  const [editingTask,setEditingTask]=useState<Task|undefined>()
  const [defaultStatus,setDefaultStatus]=useState<TaskStatus>('todo')
  const [draggingId,setDraggingId]=useState<string|null>(null)
  const [dragOverCol,setDragOverCol]=useState<TaskStatus|null>(null)

  const handleSaveTask=useCallback(async(data:UpdateTaskDTO&{status:TaskStatus})=>{
    if(editingTask) await updateTask(editingTask.id,data)
    else await createTask({project_id:projectId,...data} as CreateTaskDTO)
    await refetch(); setEditingTask(undefined)
  },[editingTask,projectId,refetch])

  const handleDeleteTask=useCallback(async(id:string)=>{
    if(!confirm('Xóa đầu mục này?')) return
    await deleteTask(id); await refetch()
  },[refetch])

  const handleDrop=useCallback(async(status:TaskStatus)=>{
    if(!draggingId) return
    const pos=tasks.filter(t=>t.status===status).length
    await moveTask(draggingId,status,pos)
    setDraggingId(null); setDragOverCol(null); await refetch()
  },[draggingId,tasks,refetch])

  const handleSaveExpense=useCallback(async(data:{amount:number;note:string;task_id:string;spent_at:string})=>{
    await createExpense({project_id:projectId,...data,task_id:data.task_id||undefined})
    await refetch()
  },[projectId,refetch])

  const handleDeleteExpense=useCallback(async(id:string)=>{
    await deleteExpense(id); await refetch()
  },[refetch])

  if(loading) return <div className="min-h-screen bg-[#FAF7F0] flex items-center justify-center"><div className="text-center"><div className="text-4xl mb-3">🌸</div><p className="text-[#A89080]">Đang tải...</p></div></div>
  if(!project) return <div className="min-h-screen bg-[#FAF7F0] flex items-center justify-center"><div className="text-center"><p className="text-[#A89080] mb-4">Không tìm thấy dự án</p><Link href="/dashboard" className="btn-primary">Về trang chủ</Link></div></div>

  const totalSpent=expenses.reduce((s,e)=>s+e.amount,0)
  const progress=calcProgress(tasks.filter(t=>t.status==='done').length,tasks.length)
  const days=daysUntilEvent(project.event_date)
  const STATUSES:TaskStatus[]=['todo','in_progress','done']

  return (
    <div className="min-h-screen bg-[#FAF7F0] flex flex-col">
      <header className="bg-white border-b border-[#E8D5C4] px-4 sm:px-6 py-3 flex items-center gap-3 flex-shrink-0">
        <Link href="/dashboard" className="p-2 rounded-lg hover:bg-[#F5EFE0] text-[#A89080] hover:text-[#5C3D2E] transition-colors flex-shrink-0"><IcoBack/></Link>
        <div className="flex-1 min-w-0">
          <h1 className="font-display font-bold text-[#2C1810] truncate">{project.name}</h1>
          {project.event_date&&<p className="text-xs text-[#A89080]">📅 {formatDate(project.event_date)}{project.venue&&` · ${project.venue}`}{days!==null&&<span className="ml-2 text-[#C9A84C] font-medium">{days>0?`(còn ${days} ngày)`:days===0?'(hôm nay!)':'(đã diễn ra)'}</span>}</p>}
        </div>
        <div className="hidden sm:flex items-center gap-1 bg-[#F5EFE0] p-1 rounded-xl flex-shrink-0">
          {(['dashboard','kanban','budget'] as View[]).map(v=>(
            <button key={v} onClick={()=>setView(v)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${view===v?'bg-white text-[#C41E3A] shadow-sm':'text-[#8B6B5A] hover:text-[#2C1810]'}`}>
              {v==='dashboard'?'Tổng quan':v==='kanban'?'Kanban':'Ngân sách'}
            </button>
          ))}
        </div>
        <button onClick={()=>{setEditingTask(undefined);setDefaultStatus('todo');setModal('task')}} className="btn-primary text-sm py-2 flex-shrink-0">+ Thêm</button>
      </header>

      <div className="sm:hidden flex bg-white border-b border-[#E8D5C4] px-4">
        {(['dashboard','kanban','budget'] as View[]).map(v=>(
          <button key={v} onClick={()=>setView(v)} className={`flex-1 py-2.5 text-sm font-medium border-b-2 transition-colors ${view===v?'border-[#C41E3A] text-[#C41E3A]':'border-transparent text-[#8B6B5A]'}`}>
            {v==='dashboard'?'Tổng quan':v==='kanban'?'Kanban':'Ngân sách'}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6">

        {/* DASHBOARD */}
        {view==='dashboard'&&(
          <div className="max-w-5xl mx-auto space-y-5 animate-fade-in">
            <div className="relative overflow-hidden rounded-2xl p-6" style={{background:'linear-gradient(135deg,#8B1A1A 0%,#C41E3A 60%,#C9A84C 100%)'}}>
              <div className="absolute inset-0 opacity-5" style={{backgroundImage:'radial-gradient(circle at 2px 2px,white 1px,transparent 0)',backgroundSize:'24px 24px'}}/>
              <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <p className="text-white/70 text-sm mb-1">🌸 Lễ ăn hỏi</p>
                  <h2 className="text-white font-display text-xl sm:text-2xl font-bold mb-1">{project.name}</h2>
                  {project.description&&<p className="text-white/70 text-sm">{project.description}</p>}
                </div>
                <div className="text-center flex-shrink-0">
                  <div className="text-white font-bold text-4xl">{progress}%</div>
                  <div className="text-white/70 text-sm">hoàn thành</div>
                </div>
              </div>
              <div className="relative mt-4">
                <div className="w-full h-2.5 bg-white/20 rounded-full">
                  <div className="h-full bg-white rounded-full transition-all duration-700" style={{width:`${progress}%`}}/>
                </div>
                <p className="text-white/60 text-xs mt-1.5">{tasks.filter(t=>t.status==='done').length}/{tasks.length} đầu mục hoàn thành</p>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                {label:'Tổng đầu mục',value:tasks.length,sub:`${tasks.filter(t=>t.status==='done').length} xong`,icon:'📋'},
                {label:'Ngân sách',value:formatCurrency(project.budget_total),sub:'Kế hoạch',icon:'💰'},
                {label:'Đã chi',value:formatCurrency(totalSpent),sub:`${Math.min(100,Math.round(totalSpent/project.budget_total*100))}%`,icon:'💸'},
                {label:'Còn lại',value:formatCurrency(calcRemaining(project.budget_total,totalSpent)),sub:calcRemaining(project.budget_total,totalSpent)>=0?'Trong kế hoạch':'Vượt ngân sách!',icon:calcRemaining(project.budget_total,totalSpent)>=0?'✅':'⚠️'},
              ].map((s,i)=>(
                <div key={i} className="card p-4">
                  <div className="text-2xl mb-1.5">{s.icon}</div>
                  <p className="text-xs text-[#A89080] mb-0.5">{s.label}</p>
                  <p className="font-bold text-base text-[#2C1810] leading-tight">{s.value}</p>
                  <p className="text-xs text-[#A89080] mt-0.5">{s.sub}</p>
                </div>
              ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-4">
              <div className="card p-5">
                <h3 className="font-semibold text-[#2C1810] mb-4">Phân bổ trạng thái</h3>
                {STATUSES.map(s=>{
                  const count=tasks.filter(t=>t.status===s).length
                  const pct=tasks.length?Math.round(count/tasks.length*100):0
                  return (
                    <div key={s} className="mb-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2"><span className={`w-2 h-2 rounded-full ${SS[s].dot}`}/><span className="text-sm text-[#5C3D2E]">{STATUS_LABELS[s]}</span></div>
                        <span className="text-sm font-medium text-[#2C1810]">{count}</span>
                      </div>
                      <div className="w-full h-2 bg-[#F5EFE0] rounded-full"><div className="h-full rounded-full transition-all" style={{width:`${pct}%`,background:s==='done'?'#16a34a':s==='in_progress'?'#f59e0b':'#94a3b8'}}/></div>
                    </div>
                  )
                })}
              </div>
              <div className="card p-5">
                <h3 className="font-semibold text-[#2C1810] mb-4">Hạn chót sắp tới</h3>
                <div className="space-y-2">
                  {tasks.filter(t=>t.deadline&&t.status!=='done').sort((a,b)=>new Date(a.deadline!).getTime()-new Date(b.deadline!).getTime()).slice(0,5).map(t=>{
                    const dl=getDeadlineLabel(t.deadline)
                    return (
                      <div key={t.id} className={`flex items-center gap-3 p-3 rounded-xl ${dl.overdue?'bg-red-50':dl.urgent?'bg-amber-50':'bg-[#FAF7F0]'}`}>
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dl.overdue?'bg-red-500':dl.urgent?'bg-amber-400':'bg-[#C9A84C]'}`}/>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#2C1810] truncate">{t.title}</p>
                          <p className={`text-xs ${dl.overdue?'text-red-500':'text-[#A89080]'}`}>{dl.label}</p>
                        </div>
                      </div>
                    )
                  })}
                  {tasks.filter(t=>t.deadline&&t.status!=='done').length===0&&<div className="text-center py-6 text-[#A89080] text-sm">🎉 Không có hạn chót nào sắp tới</div>}
                </div>
              </div>
            </div>

            <div className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-[#2C1810]">Tiến độ ngân sách</h3>
                <span className="text-sm text-[#A89080]">{formatCurrency(totalSpent)} / {formatCurrency(project.budget_total)}</span>
              </div>
              <div className="w-full h-3 bg-[#F5EFE0] rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700" style={{width:`${Math.min(100,totalSpent/project.budget_total*100)}%`,background:totalSpent>project.budget_total?'#dc2626':'linear-gradient(90deg,#C41E3A,#C9A84C)'}}/>
              </div>
            </div>
          </div>
        )}

        {/* KANBAN */}
        {view==='kanban'&&(
          <div className="max-w-6xl mx-auto animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {STATUSES.map(status=>{
                const colTasks=tasks.filter(t=>t.status===status)
                const style=SS[status]
                return (
                  <div key={status} className={`rounded-2xl border-2 p-3 transition-colors min-h-[200px] ${dragOverCol===status?'border-[#C9A84C] bg-[#FBF6EC]':`${style.bg} ${style.border}`}`}
                    onDragOver={e=>{e.preventDefault();setDragOverCol(status)}}
                    onDragLeave={()=>setDragOverCol(null)}
                    onDrop={()=>handleDrop(status)}>
                    <div className="flex items-center justify-between mb-3 px-1">
                      <div className="flex items-center gap-2"><span className={`w-2.5 h-2.5 rounded-full ${style.dot}`}/><span className="font-semibold text-sm text-[#2C1810]">{STATUS_LABELS[status]}</span></div>
                      <span className="bg-white text-[#A89080] text-xs font-medium w-6 h-6 rounded-full flex items-center justify-center border border-[#E8D5C4]">{colTasks.length}</span>
                    </div>
                    <div className="space-y-2.5">
                      {colTasks.map(task=>{
                        const dl=getDeadlineLabel(task.deadline)
                        return (
                          <div key={task.id} draggable
                            onDragStart={()=>setDraggingId(task.id)}
                            onDragEnd={()=>{setDraggingId(null);setDragOverCol(null)}}
                            className={`bg-white rounded-xl border border-[#E8D5C4] p-4 cursor-grab active:cursor-grabbing select-none transition-all ${draggingId===task.id?'opacity-40 scale-95':'hover:shadow-md hover:-translate-y-0.5'}`}>
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PB[task.priority]}`}>{PRIORITY_LABELS[task.priority]}</span>
                              <div className="flex gap-1">
                                <button onClick={()=>{setEditingTask(task);setModal('task')}} className="p-1 rounded-lg hover:bg-[#F5EFE0] text-[#A89080] hover:text-[#5C3D2E]"><IcoEdit/></button>
                                <button onClick={()=>handleDeleteTask(task.id)} className="p-1 rounded-lg hover:bg-red-50 text-[#A89080] hover:text-red-500"><IcoTrash/></button>
                              </div>
                            </div>
                            <p className="text-sm font-medium text-[#2C1810] mb-1.5 leading-snug">{task.title}</p>
                            {task.description&&<p className="text-xs text-[#A89080] line-clamp-2 mb-2">{task.description}</p>}
                            <div className="flex items-center justify-between pt-2.5 border-t border-[#F5EFE0]">
                              {task.deadline?<span className={`text-xs ${dl.overdue?'text-red-500':dl.urgent?'text-amber-600':'text-[#A89080]'}`}>📅 {dl.label}</span>:<span/>}
                              {task.cost_estimate>0&&<span className="text-xs text-[#C9A84C] font-medium">{formatCurrency(task.cost_estimate)}</span>}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <button onClick={()=>{setEditingTask(undefined);setDefaultStatus(status);setModal('task')}}
                      className="mt-2.5 w-full flex items-center justify-center gap-1 py-2 rounded-xl text-xs text-[#A89080] hover:text-[#5C3D2E] hover:bg-white/80 transition-colors border border-dashed border-[#E8D5C4]">
                      + Thêm vào đây
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* BUDGET */}
        {view==='budget'&&(
          <div className="max-w-5xl mx-auto space-y-5 animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="section-title">Quản lý ngân sách</h2>
              <button onClick={()=>setModal('expense')} className="btn-gold text-sm">+ Thêm chi tiêu</button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                {label:'Tổng ngân sách',val:formatCurrency(project.budget_total),icon:'🏦'},
                {label:'Đã chi',val:formatCurrency(totalSpent),icon:'💸'},
                {label:'Còn lại',val:formatCurrency(calcRemaining(project.budget_total,totalSpent)),icon:calcRemaining(project.budget_total,totalSpent)>=0?'✅':'⚠️'},
              ].map((c,i)=>(
                <div key={i} className="card p-5 text-center">
                  <div className="text-3xl mb-2">{c.icon}</div>
                  <p className="text-xs text-[#A89080] mb-1">{c.label}</p>
                  <p className="font-bold text-base text-[#2C1810]">{c.val}</p>
                </div>
              ))}
            </div>
            <div className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-[#2C1810]">Tiến độ ngân sách</h3>
                <span className="text-sm text-[#A89080]">{Math.min(100,Math.round(totalSpent/project.budget_total*100))}% sử dụng</span>
              </div>
              <div className="w-full h-3 bg-[#F5EFE0] rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700" style={{width:`${Math.min(100,totalSpent/project.budget_total*100)}%`,background:totalSpent>project.budget_total?'#dc2626':'linear-gradient(90deg,#C41E3A,#C9A84C)'}}/>
              </div>
            </div>
            <div className="card overflow-hidden">
              <div className="px-5 py-4 border-b border-[#F5EFE0] font-semibold text-[#2C1810]">Chi phí theo đầu mục</div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="bg-[#FAF7F0]">{['Đầu mục','Dự kiến','Thực tế','Chênh lệch','Trạng thái'].map(h=><th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[#A89080] uppercase tracking-wide">{h}</th>)}</tr></thead>
                  <tbody className="divide-y divide-[#F5EFE0]">
                    {tasks.map(t=>{
                      const diff=t.cost_actual-t.cost_estimate
                      return (
                        <tr key={t.id} className="hover:bg-[#FAF7F0] transition-colors">
                          <td className="px-4 py-3 font-medium text-[#2C1810]">{t.title}</td>
                          <td className="px-4 py-3 text-[#5C3D2E]">{formatCurrency(t.cost_estimate)}</td>
                          <td className="px-4 py-3">{t.cost_actual>0?formatCurrency(t.cost_actual):<span className="text-[#A89080]">—</span>}</td>
                          <td className="px-4 py-3">{t.cost_actual>0?<span className={`font-medium ${diff>0?'text-red-500':'text-emerald-600'}`}>{diff>0?'+':''}{formatCurrency(diff)}</span>:<span className="text-[#A89080]">—</span>}</td>
                          <td className="px-4 py-3"><span className={`text-xs px-2.5 py-1 rounded-full font-medium ${SS[t.status].badge}`}>{STATUS_LABELS[t.status]}</span></td>
                        </tr>
                      )
                    })}
                    <tr className="bg-[#FBF6EC] font-semibold">
                      <td className="px-4 py-3 text-[#2C1810]">TỔNG CỘNG</td>
                      <td className="px-4 py-3 text-[#C9A84C]">{formatCurrency(tasks.reduce((s,t)=>s+t.cost_estimate,0))}</td>
                      <td className="px-4 py-3 text-[#C41E3A]">{formatCurrency(tasks.reduce((s,t)=>s+t.cost_actual,0))}</td>
                      <td className="px-4 py-3"/><td className="px-4 py-3"/>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div className="card overflow-hidden">
              <div className="px-5 py-4 border-b border-[#F5EFE0] flex items-center justify-between">
                <span className="font-semibold text-[#2C1810]">Lịch sử chi tiêu</span>
                <span className="text-sm text-[#A89080]">{expenses.length} giao dịch · {formatCurrency(totalSpent)}</span>
              </div>
              {expenses.length===0?(
                <div className="text-center py-12 text-[#A89080]"><div className="text-4xl mb-2">📋</div><p className="text-sm">Chưa có chi tiêu nào</p></div>
              ):(
                <div className="divide-y divide-[#F5EFE0]">
                  {expenses.map(e=>(
                    <div key={e.id} className="flex items-center justify-between px-5 py-4 hover:bg-[#FAF7F0] transition-colors">
                      <div><p className="text-sm font-medium text-[#2C1810]">{e.note||'Chi tiêu'}</p><p className="text-xs text-[#A89080] mt-0.5">{formatDate(e.spent_at)}</p></div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-[#C41E3A]">{formatCurrency(e.amount)}</span>
                        <button onClick={()=>handleDeleteExpense(e.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-[#A89080] hover:text-red-500 transition-colors"><IcoTrash/></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {modal==='task'&&(
        <Modal title={editingTask?'Chỉnh sửa đầu mục':'Thêm đầu mục mới'} onClose={()=>{setModal(null);setEditingTask(undefined)}}>
          <TaskForm task={editingTask} defaultStatus={defaultStatus} onSave={handleSaveTask} onClose={()=>{setModal(null);setEditingTask(undefined)}}/>
        </Modal>
      )}
      {modal==='expense'&&(
        <Modal title="Thêm chi tiêu" onClose={()=>setModal(null)}>
          <ExpenseForm tasks={tasks} onSave={handleSaveExpense} onClose={()=>setModal(null)}/>
        </Modal>
      )}
    </div>
  )
}
