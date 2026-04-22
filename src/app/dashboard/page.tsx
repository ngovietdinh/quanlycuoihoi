'use client'
import { useState, useEffect, FormEvent } from 'react'
import Link from 'next/link'
import { Shell, TopBar } from '@/components/layout/Shell'
import { ToastProvider, useToast } from '@/components/ui/Toast'
import { Modal, ConfirmModal } from '@/components/ui/Modal'
import { getProjects, createProject, deleteProject } from '@/lib/api/projects'
import { vnd, fmtDate, pct, daysTo, EXPENSE_CATEGORIES } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { ProjectSummary } from '@/types'

const TAG_COLORS: Record<string,string> = {
  'truyền thống': 'bg-amber-50 text-amber-700 border-amber-200',
  'hiện đại':     'bg-blue-50 text-blue-700 border-blue-200',
  'tiết kiệm':    'bg-jade-50 text-jade-700 border-jade-200',
  'sang trọng':   'bg-sakura-50 text-sakura-700 border-sakura-200',
  'miền trung':   'bg-orange-50 text-orange-700 border-orange-200',
  'miền bắc':     'bg-purple-50 text-purple-700 border-purple-200',
  'miền nam':     'bg-teal-50 text-teal-700 border-teal-200',
}
const PROJECT_TAGS = Object.keys(TAG_COLORS)

function TagPill({ tag }: { tag: string }) {
  const cls = TAG_COLORS[tag.toLowerCase()] ?? 'bg-ink-50 text-ink-700 border-ink-200'
  return <span className={`tag border ${cls}`}>{tag}</span>
}

function Sk() {
  return (
    <div className="card p-5 space-y-3">
      <div className="skeleton h-4 w-2/3"/>
      <div className="skeleton h-3 w-1/2"/>
      <div className="flex gap-1.5 mt-2">
        <div className="skeleton h-5 w-14 rounded-full"/>
        <div className="skeleton h-5 w-16 rounded-full"/>
      </div>
      <div className="skeleton h-2 w-full mt-3"/>
      <div className="grid grid-cols-3 gap-2 mt-2">
        <div className="skeleton h-10 rounded-xl"/>
        <div className="skeleton h-10 rounded-xl"/>
        <div className="skeleton h-10 rounded-xl"/>
      </div>
      <div className="flex gap-2 mt-1">
        <div className="skeleton h-9 flex-1 rounded-xl"/>
        <div className="skeleton h-9 w-9 rounded-xl"/>
      </div>
    </div>
  )
}

function CreateModal({ open, onClose, onCreated }: { open:boolean; onClose:()=>void; onCreated:()=>void }) {
  const { success, error: toastErr } = useToast()
  const [form, setForm] = useState({ name:'', description:'', event_date:'', venue:'', budget_total:'', tags:[] as string[] })
  const [loading, setLoading] = useState(false)
  const sf = (k:string, v:any) => setForm(f=>({...f,[k]:v}))

  function toggleTag(tag: string) {
    setForm(f=>({...f, tags: f.tags.includes(tag) ? f.tags.filter(t=>t!==tag) : [...f.tags, tag]}))
  }

  async function submit(e: FormEvent) {
    e.preventDefault(); if (!form.name.trim()) return
    setLoading(true)
    const { error } = await createProject({ ...form, budget_total: Number(form.budget_total)||0 })
    setLoading(false)
    if (error) { toastErr('Không tạo được dự án', error); return }
    success('Tạo dự án thành công! 🎉')
    setForm({ name:'', description:'', event_date:'', venue:'', budget_total:'', tags:[] })
    onCreated(); onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Tạo dự án lễ ăn hỏi mới" subtitle="Điền thông tin để bắt đầu theo dõi" size="lg"
      footer={<>
        <button onClick={onClose} className="btn btn-ghost btn-sm">Hủy bỏ</button>
        <button onClick={submit} disabled={loading} className="btn btn-primary btn-sm disabled:opacity-60">
          {loading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/><span>Đang tạo...</span></> : '🌸 Tạo dự án'}
        </button>
      </>}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Tên lễ *</label>
          <input className="input" value={form.name} onChange={e=>sf('name',e.target.value)} placeholder="VD: Lễ Ăn Hỏi Gia Đình Trần - Nguyễn" required/>
        </div>
        <div>
          <label className="label">Mô tả</label>
          <textarea className="input resize-none" rows={2} value={form.description} onChange={e=>sf('description',e.target.value)} placeholder="Chi tiết buổi lễ..."/>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Ngày tổ chức</label>
            <input className="input" type="date" value={form.event_date} onChange={e=>sf('event_date',e.target.value)}/>
          </div>
          <div>
            <label className="label">Ngân sách (VNĐ)</label>
            <input className="input" type="number" value={form.budget_total} onChange={e=>sf('budget_total',e.target.value)} placeholder="80,000,000"/>
          </div>
        </div>
        <div>
          <label className="label">Địa điểm</label>
          <input className="input" value={form.venue} onChange={e=>sf('venue',e.target.value)} placeholder="Nhà hàng Tịnh Gia Viên, Huế"/>
        </div>
        {/* Tags */}
        <div>
          <label className="label">Nhãn phân loại</label>
          <div className="flex flex-wrap gap-1.5">
            {PROJECT_TAGS.map(tag => {
              const active = form.tags.includes(tag)
              const cls = TAG_COLORS[tag] ?? 'bg-ink-50 text-ink-700 border-ink-200'
              return (
                <button key={tag} type="button" onClick={()=>toggleTag(tag)}
                  className={cn('tag border transition-all duration-150', active ? cls + ' ring-2 ring-offset-1 ring-sakura-300' : 'bg-ink-50 text-ink-500 border-ink-200 hover:border-ink-300')}>
                  {active && '✓ '}{tag}
                </button>
              )
            })}
          </div>
        </div>
      </form>
    </Modal>
  )
}

function ProjectCard({ project, onDelete }: { project: ProjectSummary; onDelete: ()=>void }) {
  const progress   = pct(project.completed_tasks, project.total_tasks)
  const days       = daysTo(project.event_date)
  // FIXED: remaining = budget - total_spent (from expenses, already computed in view)
  const remaining  = project.budget_total - project.total_spent
  const overBudget = remaining < 0
  const usedPct    = project.budget_total > 0 ? Math.min(100, (project.total_spent / project.budget_total) * 100) : 0

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
    <div className="card-hover overflow-hidden flex flex-col group">
      {/* Gradient top bar */}
      <div className="h-1.5" style={{background:'linear-gradient(90deg, #ff3d78, #ff6b96, #f59e0b)'}}/>

      <div className="p-5 flex flex-col flex-1 gap-3.5">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="font-display font-semibold text-ink-900 text-base leading-tight line-clamp-2 group-hover:text-sakura-700 transition-colors">
              {project.name}
            </h3>
            {project.venue && (
              <p className="text-xs text-ink-400 mt-1 flex items-center gap-1 truncate">
                <span>📍</span> {project.venue}
              </p>
            )}
          </div>
          {days !== null && (
            <span className={cn('flex-shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full border',
              days < 0  ? 'bg-ink-100 text-ink-500 border-ink-200' :
              days === 0 ? 'bg-sakura-100 text-sakura-700 border-sakura-300 animate-pulse-glow' :
              days <= 14 ? 'bg-gold-50 text-gold-700 border-gold-200' :
                           'bg-jade-50 text-jade-700 border-jade-200')}>
              {days < 0 ? '✓ Đã qua' : days === 0 ? '🎊 Hôm nay!' : `${days}d`}
            </span>
          )}
        </div>

        {/* Tags */}
        {project.tags && project.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {project.tags.map(tag => <TagPill key={tag} tag={tag}/>)}
          </div>
        )}

        {/* Event date */}
        {project.event_date && (
          <div className="flex items-center gap-1.5 text-xs text-ink-500 bg-ink-50 rounded-lg px-3 py-1.5">
            <span>📅</span>
            <span className="font-medium">{fmtDate(project.event_date)}</span>
            {days !== null && days > 0 && (
              <span className="ml-auto text-sakura-500 font-semibold">còn {days} ngày</span>
            )}
          </div>
        )}

        {/* Progress */}
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-ink-500 font-medium">Tiến độ</span>
            <span className="font-bold text-ink-800 tabular">{progress}%</span>
          </div>
          <div className="progress-track h-2">
            <div className="progress-bar" style={{width:`${progress}%`,height:'100%'}}/>
          </div>
          <div className="flex justify-between text-[10px] text-ink-400 mt-1">
            <span>{project.completed_tasks} hoàn thành</span>
            <span>{project.total_tasks} đầu mục</span>
          </div>
        </div>

        {/* BUDGET — correctly uses total_spent from expenses */}
        <div className="rounded-xl overflow-hidden border border-ink-100">
          <div className="grid grid-cols-3 divide-x divide-ink-100">
            <div className="p-2.5 text-center bg-white">
              <p className="text-[10px] text-ink-400 mb-0.5 font-medium">Ngân sách</p>
              <p className="text-xs font-bold text-ink-800 tabular">{vnd(project.budget_total)}</p>
            </div>
            <div className="p-2.5 text-center bg-white">
              <p className="text-[10px] text-ink-400 mb-0.5 font-medium">Đã chi</p>
              <p className="text-xs font-bold text-sakura-600 tabular">{vnd(project.total_spent)}</p>
            </div>
            <div className={cn('p-2.5 text-center', overBudget ? 'bg-red-50' : 'bg-white')}>
              <p className="text-[10px] text-ink-400 mb-0.5 font-medium">Còn lại</p>
              <p className={cn('text-xs font-bold tabular', overBudget ? 'text-red-600' : 'text-jade-600')}>
                {overBudget ? '-' : ''}{vnd(Math.abs(remaining))}
              </p>
            </div>
          </div>
          {/* Budget usage bar */}
          <div className="h-1 bg-ink-100">
            <div className={overBudget ? 'progress-bar-danger' : 'progress-bar'} style={{width:`${usedPct}%`,height:'100%',transition:'width .7s ease'}}/>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-auto">
          <Link href={`/projects/${project.id}`}
            className="btn btn-primary btn-sm flex-1 justify-center">
            Mở dự án <span className="opacity-70">→</span>
          </Link>
          <button onClick={()=>setConfirmDel(true)}
            className="btn btn-ghost btn-sm btn-icon hover:bg-red-50 hover:text-red-500 transition-colors">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </div>
      </div>

      <ConfirmModal open={confirmDel} onClose={()=>setConfirmDel(false)} onConfirm={handleDelete}
        loading={deleting} title="Xóa dự án?" msg="Toàn bộ đầu mục và chi tiêu sẽ bị xóa vĩnh viễn. Không thể hoàn tác." confirmLabel="Xóa dự án"/>
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

  // Aggregate stats — using total_spent from project_summary (from expenses table)
  const totalBudget = projects.reduce((s,p)=>s+p.budget_total, 0)
  const totalSpent  = projects.reduce((s,p)=>s+p.total_spent, 0)   // ← correct
  const totalTasks  = projects.reduce((s,p)=>s+p.total_tasks, 0)
  const doneTasks   = projects.reduce((s,p)=>s+p.completed_tasks, 0)
  const remaining   = totalBudget - totalSpent
  const budgetPct   = totalBudget > 0 ? Math.min(100, (totalSpent/totalBudget)*100) : 0

  const urgentProjects = projects.filter(p => { const d = daysTo(p.event_date); return d !== null && d >= 0 && d <= 30 })

  return (
    <>
      <TopBar
        title="Tổng quan"
        subtitle={new Date().toLocaleDateString('vi-VN',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}
        right={
          <button onClick={()=>setShowCreate(true)} className="btn btn-primary btn-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Tạo dự án
          </button>
        }
      />

      <div className="p-4 sm:p-6 space-y-5 max-w-6xl mx-auto w-full">

        {/* Hero banner */}
        <div className="hero p-6 sm:p-8">
          <div className="hero-bubble w-32 h-32 top-0 right-0 translate-x-8 -translate-y-8" style={{animationDelay:'0s'}}/>
          <div className="hero-bubble w-20 h-20 bottom-4 right-32" style={{animationDelay:'2s'}}/>
          <div className="hero-bubble w-12 h-12 top-6 right-48" style={{animationDelay:'4s'}}/>

          <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
            <div>
              <p className="text-white/60 text-sm font-medium mb-1">🌸 Xin chào!</p>
              <h2 className="font-display text-3xl font-bold text-white mb-2">Lễ Ăn Hỏi Manager</h2>
              <p className="text-white/60 text-sm">
                <span className="text-white font-semibold">{projects.length}</span> dự án đang quản lý ·{' '}
                <span className="text-white font-semibold">{totalTasks - doneTasks}</span> đầu mục chờ xử lý
              </p>
            </div>
            <button onClick={()=>setShowCreate(true)}
              className="btn btn-sm flex-shrink-0 text-white border border-white/30 hover:bg-white/15 transition-all"
              style={{background:'rgba(255,255,255,0.12)'}}>
              + Tạo dự án mới
            </button>
          </div>

          {/* Budget summary in hero */}
          {!loading && projects.length > 0 && (
            <div className="relative mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label:'Ngân sách tổng', value: vnd(totalBudget),   icon:'💰' },
                { label:'Đã chi tiêu',   value: vnd(totalSpent),    icon:'💸' },
                { label:'Còn lại',       value: vnd(Math.abs(remaining)), icon: remaining >= 0 ? '✅' : '⚠️' },
                { label:'Tiến độ',       value: `${pct(doneTasks,totalTasks)}%`, icon:'🎯' },
              ].map((s,i) => (
                <div key={i} className="rounded-xl p-3 border border-white/15 text-center"
                  style={{background:'rgba(255,255,255,0.08)'}}>
                  <p className="text-xl mb-1">{s.icon}</p>
                  <p className="text-[10px] text-white/50 mb-0.5 font-medium">{s.label}</p>
                  <p className="text-sm font-bold text-white tabular leading-tight">{s.value}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Urgent notice */}
        {urgentProjects.length > 0 && !loading && (
          <div className="rounded-2xl border border-gold-200 bg-gold-50 p-4 flex items-center gap-3">
            <span className="text-2xl flex-shrink-0 animate-pulse-glow">⏰</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gold-800">
                {urgentProjects.length} dự án sắp tới ngày lễ trong 30 ngày tới!
              </p>
              <p className="text-xs text-gold-600 mt-0.5 truncate">
                {urgentProjects.map(p=>`${p.name} (${daysTo(p.event_date)}d)`).join(' · ')}
              </p>
            </div>
          </div>
        )}

        {/* Project grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-2xl font-semibold text-ink-900">Dự án của bạn</h2>
              {!loading && <p className="text-sm text-ink-400 mt-0.5">{projects.length} dự án · Cập nhật realtime</p>}
            </div>
            {!loading && projects.length > 0 && (
              <button onClick={()=>setShowCreate(true)} className="btn btn-secondary btn-sm">+ Tạo mới</button>
            )}
          </div>

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1,2,3].map(i=><Sk key={i}/>)}
            </div>
          ) : projects.length === 0 ? (
            <div className="card text-center py-20">
              <div className="text-6xl mb-4 animate-float">🌸</div>
              <h3 className="font-display text-2xl font-semibold text-ink-800 mb-2">Chưa có dự án nào</h3>
              <p className="text-ink-500 text-sm mb-6 max-w-xs mx-auto">Tạo dự án đầu tiên để bắt đầu theo dõi và quản lý lễ ăn hỏi</p>
              <button onClick={()=>setShowCreate(true)} className="btn btn-primary btn-lg mx-auto">
                🌸 Tạo dự án đầu tiên
              </button>
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
  return <ToastProvider><Shell><DashboardContent/></Shell></ToastProvider>
}
