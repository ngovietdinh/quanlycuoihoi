'use client'
import { useState, useEffect, useCallback, FormEvent } from 'react'
import Link from 'next/link'
import { Shell, TopBar } from '@/components/layout/Shell'
import { ToastProvider, useToast } from '@/components/ui/Toast'
import { Modal, ConfirmModal } from '@/components/ui/Modal'
import { getProjects, createProject, deleteProject } from '@/lib/api/projects'
import { vnd, fmtDate, pct, daysTo, EXPENSE_CATEGORIES } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { ProjectSummary } from '@/types'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'
import { updateTask } from '@/lib/api/tasks'
import { getDashboardData, seedWeddingChecklist, WEDDING_CHECKLIST, type DashboardData, type TaskWithProject } from '@/lib/api/dashboard'
import { Greeting, QuickActions, Kpis, UpcomingTasks, ActivityFeed, SpendingBreakdown, MonthCalendar } from '@/components/dashboard/widgets'

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
  const [seed, setSeed] = useState(true)
  const [loading, setLoading] = useState(false)
  const sf = (k:string, v:any) => setForm(f=>({...f,[k]:v}))

  function toggleTag(tag: string) {
    setForm(f=>({...f, tags: f.tags.includes(tag) ? f.tags.filter(t=>t!==tag) : [...f.tags, tag]}))
  }

  async function submit(e: FormEvent) {
    e.preventDefault(); if (!form.name.trim()) return
    setLoading(true)
    const { data, error } = await createProject({ ...form, event_date: form.event_date || undefined, budget_total: Number(form.budget_total)||0 })
    if (error || !data) { setLoading(false); toastErr('Không tạo được dự án', error ?? ''); return }
    if (seed) {
      const r = await seedWeddingChecklist(data.id, form.event_date || null)
      if (r.error) toastErr('Đã tạo dự án nhưng chưa thêm được danh sách việc', r.error)
    }
    setLoading(false)
    success('Tạo dự án thành công! 🎉', seed ? `Đã thêm ${WEDDING_CHECKLIST.length} việc chuẩn bị cưới` : undefined)
    setForm({ name:'', description:'', event_date:'', venue:'', budget_total:'', tags:[] })
    onCreated(); onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Tạo dự án Sự kiện mới" subtitle="Điền thông tin để bắt đầu theo dõi" size="lg"
      footer={<>
        <button onClick={onClose} className="btn btn-ghost btn-sm">Hủy bỏ</button>
        <button onClick={submit} disabled={loading} className="btn btn-primary btn-sm disabled:opacity-60">
          {loading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/><span>Đang tạo...</span></> : '🌸 Tạo dự án'}
        </button>
      </>}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Tên lễ *</label>
          <input className="input" value={form.name} onChange={e=>sf('name',e.target.value)} placeholder="VD: Sự kiện Gia Đình Trần - Nguyễn" required/>
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
        <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-sakura-200 bg-sakura-50/50 cursor-pointer">
          <input type="checkbox" checked={seed} onChange={e=>setSeed(e.target.checked)} className="w-4 h-4 mt-0.5 accent-sakura-500"/>
          <span className="text-sm">
            <b className="text-ink-900">Tạo sẵn {WEDDING_CHECKLIST.length} việc chuẩn bị cưới</b>
            <span className="block text-xs text-ink-500 mt-0.5">Xem ngày, đặt nhà hàng, chụp ảnh cưới, gửi thiệp… hạn chót tự tính theo ngày tổ chức.</span>
          </span>
        </label>
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

function ProjectCard({ project, onDelete, shared }: { project: ProjectSummary; onDelete: ()=>void; shared?: boolean }) {
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
            {shared && <span className="inline-block mt-1 text-[10px] font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5">👥 Được chia sẻ</span>}
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
          {!shared && <button onClick={()=>setConfirmDel(true)}
            className="btn btn-ghost btn-sm btn-icon hover:bg-red-50 hover:text-red-500 transition-colors">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>}
        </div>
      </div>

      <ConfirmModal open={confirmDel} onClose={()=>setConfirmDel(false)} onConfirm={handleDelete}
        loading={deleting} title="Xóa dự án?" msg="Toàn bộ đầu mục và chi tiêu sẽ bị xóa vĩnh viễn. Không thể hoàn tác." confirmLabel="Xóa dự án"/>
    </div>
  )
}

type Filter = 'all' | 'upcoming' | 'past' | 'shared'
const dateRank = (p: ProjectSummary) => !p.event_date ? 1 : daysTo(p.event_date)! >= 0 ? 0 : 2
// Dự án đã qua: gần đây nhất lên trước (đảo chuỗi ngày để sắp giảm dần)
const dateKey = (p: ProjectSummary) => !p.event_date ? p.name : dateRank(p) === 2 ? String(99999999 - Number(p.event_date.replace(/-/g, ''))) : p.event_date
type Sort = 'date' | 'recent' | 'name' | 'progress'

function DashboardContent() {
  const { user } = useAuth()
  const { profile } = useProfile()
  const { success, error: toastErr, warning } = useToast()
  const [projects, setProjects] = useState<ProjectSummary[]>([])
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [sort, setSort] = useState<Sort>('date')

  const load = useCallback(async () => {
    setLoading(true)
    const { data: ps } = await getProjects()
    const list = ps ?? []
    setProjects(list)
    const d = await getDashboardData(list.map(p => p.id))
    setData(d.data)
    setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('denied')) warning('Bạn không có quyền truy cập trang đó')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function markDone(t: TaskWithProject) {
    setData(d => d && { ...d, tasks: d.tasks.filter(x => x.id !== t.id) })
    setProjects(ps => ps.map(p => p.id === t.project_id ? { ...p, completed_tasks: p.completed_tasks + 1 } : p))
    const r = await updateTask(t.id, { status: 'done' })
    if (r.error) { toastErr('Không cập nhật được', r.error); load() } else success(`Đã hoàn thành “${t.title}” ✓`)
  }

  const name = (profile?.full_name || user?.user_metadata?.full_name || '').trim().split(/\s+/).pop() ?? ''
  const next = projects.filter(p => p.event_date && daysTo(p.event_date)! >= 0).sort((a, b) => a.event_date!.localeCompare(b.event_date!))[0] ?? null
  const budget = projects.reduce((s, p) => s + Number(p.budget_total), 0)

  const shown = projects
    .filter(p => !q || `${p.name} ${p.venue ?? ''} ${(p.tags ?? []).join(' ')}`.toLowerCase().includes(q.toLowerCase()))
    .filter(p => filter === 'all' ? true : filter === 'shared' ? p.user_id !== user?.id
      : filter === 'upcoming' ? (p.event_date ? daysTo(p.event_date)! >= 0 : true) : (p.event_date ? daysTo(p.event_date)! < 0 : false))
    .sort((a, b) => sort === 'name' ? a.name.localeCompare(b.name, 'vi')
      : sort === 'recent' ? b.created_at.localeCompare(a.created_at)
      : sort === 'progress' ? pct(b.completed_tasks, b.total_tasks) - pct(a.completed_tasks, a.total_tasks)
      : dateRank(a) - dateRank(b) || dateKey(a).localeCompare(dateKey(b)))
  const counts = {
    all: projects.length, upcoming: projects.filter(p => !p.event_date || daysTo(p.event_date)! >= 0).length,
    past: projects.filter(p => p.event_date && daysTo(p.event_date)! < 0).length, shared: projects.filter(p => p.user_id !== user?.id).length,
  }

  return (
    <>
      <TopBar
        title="Tổng quan"
        subtitle="Mọi thứ cho ngày cưới của bạn ở một nơi"
        right={
          <button onClick={()=>setShowCreate(true)} className="btn btn-primary btn-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span className="hidden sm:inline">Tạo dự án</span>
          </button>
        }
      />

      <div className="p-4 sm:p-6 space-y-5 max-w-7xl mx-auto w-full">
        <Greeting name={name} next={next} onCreateProject={() => setShowCreate(true)}/>
        <QuickActions onCreateProject={() => setShowCreate(true)} firstProjectId={next?.id ?? projects[0]?.id}/>
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{[1,2,3,4].map(i => <div key={i} className="card h-24 skeleton"/>)}</div>
        ) : <Kpis projects={projects} data={data}/>}

        <div className="grid lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] gap-5">
          <UpcomingTasks tasks={data?.tasks ?? []} onDone={markDone} loading={loading}/>
          <ActivityFeed items={data?.activity ?? []} loading={loading}/>
        </div>
        <div className="grid lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] gap-5">
          <SpendingBreakdown data={data?.expenses ?? []} budget={budget} projects={projects}/>
          <MonthCalendar projects={projects} tasks={data?.tasks ?? []}/>
        </div>

        {/* Danh sách dự án */}
        <section className="pt-2">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-4">
            <div>
              <h2 className="font-display text-2xl font-semibold text-ink-900">Dự án của bạn</h2>
              {!loading && <p className="text-sm text-ink-400 mt-0.5">{projects.length} dự án · cập nhật realtime</p>}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 text-sm">🔍</span>
                <input className="input !py-2 !pl-9 !w-52 text-sm" placeholder="Tìm dự án, địa điểm…" value={q} onChange={e => setQ(e.target.value)}/>
              </div>
              <select className="input !py-2 !w-auto text-sm" value={sort} onChange={e => setSort(e.target.value as Sort)} aria-label="Sắp xếp">
                <option value="date">Ngày tổ chức gần nhất</option><option value="recent">Mới tạo</option>
                <option value="progress">Tiến độ cao nhất</option><option value="name">Tên A–Z</option>
              </select>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {([['all','Tất cả'],['upcoming','Sắp diễn ra'],['past','Đã diễn ra'],['shared','Được chia sẻ']] as const).map(([k, l]) => (
              <button key={k} onClick={() => setFilter(k)}
                className={cn('px-3 py-1.5 rounded-full text-xs font-medium border transition', filter === k ? 'bg-ink-900 text-white border-ink-900' : 'bg-white text-ink-600 border-ink-200 hover:border-ink-400')}>
                {l} <span className="opacity-60">{counts[k]}</span>
              </button>
            ))}
          </div>

          {loading ? (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">{[1,2,3].map(i=><Sk key={i}/>)}</div>
          ) : projects.length === 0 ? (
            <div className="card text-center py-16 px-4">
              <div className="text-6xl mb-4 animate-float">🌸</div>
              <h3 className="font-display text-2xl font-semibold text-ink-800 mb-2">Chưa có dự án nào</h3>
              <p className="text-ink-500 text-sm mb-6 max-w-sm mx-auto">Tạo dự án cưới đầu tiên — hệ thống sẽ gợi ý sẵn {WEDDING_CHECKLIST.length} việc cần chuẩn bị theo đúng lộ trình.</p>
              <button onClick={()=>setShowCreate(true)} className="btn btn-primary btn-lg mx-auto">🌸 Tạo dự án đầu tiên</button>
            </div>
          ) : shown.length === 0 ? (
            <div className="card text-center py-10 text-sm text-ink-500">Không có dự án phù hợp bộ lọc. <button onClick={() => { setQ(''); setFilter('all') }} className="text-sakura-600 font-semibold hover:underline">Xóa bộ lọc</button></div>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {shown.map(p => <ProjectCard key={p.id} project={p} onDelete={load} shared={p.user_id !== user?.id}/>)}
            </div>
          )}
        </section>
      </div>

      <CreateModal open={showCreate} onClose={()=>setShowCreate(false)} onCreated={load}/>
    </>
  )
}

export default function DashboardPage() {
  return <ToastProvider><Shell><DashboardContent/></Shell></ToastProvider>
}
