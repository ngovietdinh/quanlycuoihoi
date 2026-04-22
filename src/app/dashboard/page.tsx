'use client'
import { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Shell, TopBar } from '@/components/layout/Shell'
import { ToastProvider, useToast } from '@/components/ui/Toast'
import { Modal, ConfirmModal } from '@/components/ui/Modal'
import { getProjects, createProject, deleteProject } from '@/lib/api/projects'
import { vnd, fmtDate, pct, daysTo } from '@/lib/utils'
import type { ProjectSummary } from '@/types'

function Sk() {
  return (
    <div className="card p-5 space-y-3">
      <div className="skeleton h-4 w-2/3"/>
      <div className="skeleton h-3 w-1/2"/>
      <div className="skeleton h-2 w-full mt-4"/>
      <div className="flex gap-2 mt-2">
        <div className="skeleton h-8 flex-1"/>
        <div className="skeleton h-8 w-8"/>
      </div>
    </div>
  )
}

function CreateModal({ open, onClose, onCreated }: { open:boolean; onClose:()=>void; onCreated:()=>void }) {
  const { success, error: toastErr } = useToast()
  const [form, setForm] = useState({ name:'', description:'', event_date:'', venue:'', budget_total:'' })
  const [loading, setLoading] = useState(false)
  const sf = (k:string,v:string) => setForm(f=>({...f,[k]:v}))

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    setLoading(true)
    const { error } = await createProject({ ...form, budget_total: Number(form.budget_total)||0 })
    setLoading(false)
    if (error) { toastErr('Lỗi: ' + error); return }
    success('Đã tạo dự án mới!')
    setForm({ name:'', description:'', event_date:'', venue:'', budget_total:'' })
    onCreated(); onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Tạo dự án mới" size="md"
      footer={<>
        <button onClick={onClose} className="btn btn-ghost btn-sm">Hủy</button>
        <button onClick={submit} disabled={loading} className="btn btn-primary btn-sm disabled:opacity-60">
          {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : 'Tạo dự án'}
        </button>
      </>}>
      <form onSubmit={submit} className="space-y-3">
        <div><label className="label">Tên lễ *</label><input className="input" value={form.name} onChange={e=>sf('name',e.target.value)} placeholder="Lễ Ăn Hỏi Gia Đình Trần - Nguyễn" required/></div>
        <div><label className="label">Mô tả</label><textarea className="input resize-none" rows={2} value={form.description} onChange={e=>sf('description',e.target.value)} placeholder="Chi tiết buổi lễ..."/></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Ngày tổ chức</label><input className="input" type="date" value={form.event_date} onChange={e=>sf('event_date',e.target.value)}/></div>
          <div><label className="label">Ngân sách (VNĐ)</label><input className="input" type="number" value={form.budget_total} onChange={e=>sf('budget_total',e.target.value)} placeholder="80000000"/></div>
        </div>
        <div><label className="label">Địa điểm</label><input className="input" value={form.venue} onChange={e=>sf('venue',e.target.value)} placeholder="Nhà hàng Tịnh Gia Viên, Huế"/></div>
      </form>
    </Modal>
  )
}

function ProjectCard({ project, onDelete }: { project: ProjectSummary; onDelete: ()=>void }) {
  const progress = pct(project.completed_tasks, project.total_tasks)
  const days     = daysTo(project.event_date)
  const remaining = project.budget_total - project.total_spent
  const [confirmDel, setConfirmDel] = useState(false)
  const [deleting, setDeleting]     = useState(false)
  const { success } = useToast()

  async function handleDelete() {
    setDeleting(true)
    await deleteProject(project.id)
    setDeleting(false); setConfirmDel(false)
    success('Đã xóa dự án'); onDelete()
  }

  return (
    <div className="card-hover overflow-hidden flex flex-col">
      {/* Top accent */}
      <div className="h-1 bg-gradient-to-r from-rose-300 via-rose-400 to-amber-300"/>
      <div className="p-5 flex flex-col flex-1 gap-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-display font-semibold text-stone-900 text-base leading-snug line-clamp-2">{project.name}</h3>
            {project.venue && <p className="text-xs text-stone-400 mt-0.5 truncate">📍 {project.venue}</p>}
          </div>
          {days !== null && (
            <span className={`badge flex-shrink-0 text-[10px] ${days < 0 ? 'badge-done' : days <= 14 ? 'badge-overdue' : 'badge-in_progress'}`}>
              {days < 0 ? 'Đã qua' : days === 0 ? 'Hôm nay' : `${days}d`}
            </span>
          )}
        </div>

        {/* Date */}
        {project.event_date && (
          <p className="text-xs text-stone-500 flex items-center gap-1">
            📅 {fmtDate(project.event_date)}
            {days !== null && days > 0 && <span className="text-rose-400 font-medium">· còn {days} ngày</span>}
          </p>
        )}

        {/* Progress */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-stone-500">Tiến độ</span>
            <span className="font-semibold text-stone-700">{progress}%</span>
          </div>
          <div className="progress-track h-1.5">
            <div className="progress-fill" style={{width:`${progress}%`, height:'100%'}}/>
          </div>
          <p className="text-xs text-stone-400 mt-1">{project.completed_tasks}/{project.total_tasks} đầu mục</p>
        </div>

        {/* Budget */}
        <div className="grid grid-cols-3 gap-1.5 p-2.5 bg-stone-50 rounded-xl text-center">
          <div><p className="text-[10px] text-stone-400">Ngân sách</p><p className="text-xs font-semibold text-stone-700">{vnd(project.budget_total)}</p></div>
          <div className="border-x border-stone-200"><p className="text-[10px] text-stone-400">Đã chi</p><p className="text-xs font-semibold text-rose-500">{vnd(project.total_spent)}</p></div>
          <div><p className="text-[10px] text-stone-400">Còn lại</p><p className={`text-xs font-semibold ${remaining>=0?'text-emerald-600':'text-red-500'}`}>{vnd(Math.abs(remaining))}</p></div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-auto">
          <Link href={`/projects/${project.id}`} className="btn btn-primary btn-sm flex-1 justify-center">
            Mở dự án →
          </Link>
          <button onClick={()=>setConfirmDel(true)} className="btn btn-ghost btn-sm px-2.5 hover:bg-red-50 hover:text-red-500">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </div>
      </div>
      <ConfirmModal open={confirmDel} onClose={()=>setConfirmDel(false)} onConfirm={handleDelete}
        loading={deleting} title="Xóa dự án?" msg="Toàn bộ đầu mục và chi tiêu sẽ bị xóa vĩnh viễn." confirmLabel="Xóa dự án"/>
    </div>
  )
}

function DashboardContent() {
  const [projects, setProjects] = useState<ProjectSummary[]>([])
  const [loading, setLoading]   = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  async function load() {
    setLoading(true)
    const { data } = await getProjects()
    setProjects(data ?? [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const totalBudget = projects.reduce((s,p)=>s+p.budget_total,0)
  const totalSpent  = projects.reduce((s,p)=>s+p.total_spent,0)
  const totalTasks  = projects.reduce((s,p)=>s+p.total_tasks,0)
  const doneTasks   = projects.reduce((s,p)=>s+p.completed_tasks,0)

  return (
    <>
      <TopBar
        title="Tổng quan"
        subtitle={new Date().toLocaleDateString('vi-VN',{weekday:'long',day:'numeric',month:'long'})}
        right={
          <button onClick={()=>setShowCreate(true)} className="btn btn-primary btn-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Tạo dự án
          </button>
        }
      />

      <div className="p-4 sm:p-6 max-w-6xl mx-auto w-full space-y-5">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl p-6" style={{background:'linear-gradient(135deg,#f43f5e 0%,#e11d48 50%,#f59e0b 100%)'}}>
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10"/>
          <div className="absolute bottom-0 right-20 w-20 h-20 rounded-full bg-white/10"/>
          <div className="relative">
            <p className="text-white/80 text-sm mb-1">🌸 Chào mừng trở lại</p>
            <h2 className="font-display text-2xl font-bold text-white mb-1">Lễ Ăn Hỏi Manager</h2>
            <p className="text-white/70 text-sm">{projects.length} dự án đang quản lý · {totalTasks - doneTasks} đầu mục chờ hoàn thành</p>
          </div>
        </div>

        {/* Stats */}
        {!loading && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { icon:'📁', label:'Dự án',      value: projects.length,        sub: 'đang quản lý' },
              { icon:'✅', label:'Đầu mục xong', value: `${doneTasks}/${totalTasks}`, sub: `${pct(doneTasks,totalTasks)}% hoàn thành` },
              { icon:'💰', label:'Tổng ngân sách', value: vnd(totalBudget),    sub: 'kế hoạch' },
              { icon:'💸', label:'Đã chi',      value: vnd(totalSpent),        sub: `${pct(totalSpent,totalBudget)||0}% ngân sách` },
            ].map((s,i) => (
              <div key={i} className="card p-4">
                <div className="text-2xl mb-2">{s.icon}</div>
                <p className="text-xs text-stone-500 mb-0.5">{s.label}</p>
                <p className="font-display text-xl font-bold text-stone-900">{s.value}</p>
                <p className="text-xs text-stone-400 mt-0.5">{s.sub}</p>
              </div>
            ))}
          </div>
        )}

        {/* Project grid */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-xl font-semibold text-stone-900">Dự án của bạn</h2>
            {projects.length > 0 && (
              <button onClick={()=>setShowCreate(true)} className="btn btn-secondary btn-sm">+ Tạo mới</button>
            )}
          </div>

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1,2,3].map(i=><Sk key={i}/>)}
            </div>
          ) : projects.length === 0 ? (
            <div className="card text-center py-16">
              <div className="text-5xl mb-4">🌸</div>
              <h3 className="font-display text-xl font-semibold text-stone-800 mb-2">Chưa có dự án nào</h3>
              <p className="text-stone-500 text-sm mb-5">Tạo dự án đầu tiên để bắt đầu quản lý lễ ăn hỏi</p>
              <button onClick={()=>setShowCreate(true)} className="btn btn-primary mx-auto">Tạo dự án đầu tiên</button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map(p => <ProjectCard key={p.id} project={p} onDelete={load}/>)}
            </div>
          )}
        </div>
      </div>

      <CreateModal open={showCreate} onClose={()=>setShowCreate(false)} onCreated={load}/>
    </>
  )
}

export default function DashboardPage() {
  return (
    <ToastProvider>
      <Shell>
        <DashboardContent/>
      </Shell>
    </ToastProvider>
  )
}
