'use client'
import { useState, useEffect } from 'react'
import { TopBar } from '@/components/layout/Sidebar'
import { StatCard } from '@/components/dashboard/StatCard'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar, CircularProgress } from '@/components/ui/ProgressBar'
import { CardSkeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatCurrency, formatDate, calcProgress, daysUntilEvent, getDeadlineLabel, STATUS_LABELS } from '@/lib/utils'
import type { ProjectSummary, Task } from '@/types'

/* ── Mock data — replace with real Supabase calls ── */
const MOCK_PROJECTS: ProjectSummary[] = [
  {
    id: 'p1', user_id: 'u1', name: 'Lễ Ăn Hỏi — Anh Tuấn & Chị Lan',
    description: 'Lễ ăn hỏi truyền thống tại Huế', event_date: '2025-06-15',
    venue: 'Nhà hàng Tịnh Gia Viên', budget_total: 80000000,
    cover_url: null, created_at: '', updated_at: '',
    total_tasks: 12, completed_tasks: 7, total_estimated: 72000000, total_spent: 38500000,
  },
  {
    id: 'p2', user_id: 'u1', name: 'Lễ Ăn Hỏi — Minh & Hương',
    description: 'Lễ ăn hỏi hiện đại tại Đà Nẵng', event_date: '2025-08-22',
    venue: 'Riverside Garden', budget_total: 120000000,
    cover_url: null, created_at: '', updated_at: '',
    total_tasks: 18, completed_tasks: 4, total_estimated: 115000000, total_spent: 22000000,
  },
]

const MOCK_TASKS: Task[] = [
  { id: 't1', project_id: 'p1', assigned_to: null, title: 'Đặt mâm quả trầu cau', description: '', status: 'in_progress', priority: 'high', deadline: new Date(Date.now() + 3*86400000).toISOString().slice(0,10), cost_estimate: 3000000, cost_actual: 0, position: 0, created_at: '', updated_at: '' },
  { id: 't2', project_id: 'p1', assigned_to: null, title: 'Thuê áo dài cô dâu', description: '', status: 'done', priority: 'high', deadline: new Date(Date.now() - 5*86400000).toISOString().slice(0,10), cost_estimate: 5000000, cost_actual: 5500000, position: 1, created_at: '', updated_at: '' },
  { id: 't3', project_id: 'p1', assigned_to: null, title: 'Trang trí phòng lễ', description: '', status: 'todo', priority: 'medium', deadline: new Date(Date.now() + 10*86400000).toISOString().slice(0,10), cost_estimate: 8000000, cost_actual: 0, position: 2, created_at: '', updated_at: '' },
  { id: 't4', project_id: 'p1', assigned_to: null, title: 'Đặt tiệc trà & bánh', description: '', status: 'todo', priority: 'high', deadline: new Date(Date.now() - 1*86400000).toISOString().slice(0,10), cost_estimate: 6000000, cost_actual: 0, position: 3, created_at: '', updated_at: '' },
  { id: 't5', project_id: 'p2', assigned_to: null, title: 'Mời thiệp lễ', description: '', status: 'in_progress', priority: 'medium', deadline: new Date(Date.now() + 14*86400000).toISOString().slice(0,10), cost_estimate: 2000000, cost_actual: 0, position: 0, created_at: '', updated_at: '' },
]

function WelcomeBanner() {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối'

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-400 via-rose-500 to-amber-400 p-6 text-white mb-6">
      {/* Decorative circles */}
      <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10" />
      <div className="absolute -bottom-4 right-16 w-20 h-20 rounded-full bg-white/10" />
      <div className="absolute top-4 right-32 w-10 h-10 rounded-full bg-white/15" />

      <div className="relative">
        <p className="text-white/80 text-sm font-medium mb-1">🌸 {greeting}!</p>
        <h2 className="font-display text-2xl font-semibold mb-1">Lễ Ăn Hỏi Manager</h2>
        <p className="text-white/70 text-sm">Bạn đang quản lý <strong className="text-white">{MOCK_PROJECTS.length} dự án</strong> · {MOCK_TASKS.filter(t => t.status !== 'done').length} đầu mục đang chờ</p>

        <div className="flex items-center gap-3 mt-4">
          <Button
            variant="secondary"
            size="sm"
            className="bg-white/20 text-white border-white/30 hover:bg-white/30"
          >
            + Tạo dự án mới
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-white/80 hover:text-white hover:bg-white/10"
          >
            Xem tổng quan →
          </Button>
        </div>
      </div>
    </div>
  )
}

function UpcomingDeadlines({ tasks }: { tasks: Task[] }) {
  const upcoming = tasks
    .filter(t => t.deadline && t.status !== 'done')
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
    .slice(0, 5)

  if (upcoming.length === 0) {
    return <EmptyState icon="🎉" title="Không có hạn chót nào" description="Tất cả đầu mục đang trong tầm kiểm soát!" />
  }

  return (
    <div className="space-y-2">
      {upcoming.map(task => {
        const dl = getDeadlineLabel(task.deadline)
        return (
          <div key={task.id} className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${dl.overdue ? 'bg-red-50' : dl.urgent ? 'bg-amber-50' : 'bg-stone-50'}`}>
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${dl.overdue ? 'bg-red-400' : dl.urgent ? 'bg-amber-400' : 'bg-stone-300'}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-stone-800 truncate">{task.title}</p>
              <p className={`text-xs ${dl.overdue ? 'text-red-500 font-medium' : dl.urgent ? 'text-amber-600' : 'text-stone-400'}`}>
                {dl.label}
              </p>
            </div>
            <Badge variant={task.priority as any} className="text-[10px] flex-shrink-0">{task.priority === 'high' ? 'Cao' : task.priority === 'medium' ? 'TB' : 'Thấp'}</Badge>
          </div>
        )
      })}
    </div>
  )
}

function ProjectProgressList({ projects }: { projects: ProjectSummary[] }) {
  return (
    <div className="space-y-3">
      {projects.map(p => {
        const progress = calcProgress(p.completed_tasks, p.total_tasks)
        const days = daysUntilEvent(p.event_date)
        return (
          <div key={p.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-stone-50 transition-colors cursor-pointer group">
            <div className="relative flex-shrink-0">
              <CircularProgress value={progress} size={48} strokeWidth={5} />
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-stone-700">{progress}%</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-stone-800 truncate group-hover:text-rose-600 transition-colors">{p.name}</p>
              <p className="text-xs text-stone-400 mt-0.5">{p.completed_tasks}/{p.total_tasks} đầu mục · {days !== null && days > 0 ? `còn ${days} ngày` : 'đã qua'}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs font-semibold text-rose-500">{formatCurrency(p.total_spent)}</p>
              <p className="text-[10px] text-stone-400">/ {formatCurrency(p.budget_total)}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function StatusDonut({ tasks }: { tasks: Task[] }) {
  const counts = {
    todo:        tasks.filter(t => t.status === 'todo').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    done:        tasks.filter(t => t.status === 'done').length,
  }
  const total = tasks.length || 1
  const pct = (n: number) => Math.round((n / total) * 100)

  const segments = [
    { key: 'done',        label: 'Hoàn thành',     count: counts.done,        pct: pct(counts.done),        color: '#10b981', bg: 'bg-emerald-400' },
    { key: 'in_progress', label: 'Đang thực hiện', count: counts.in_progress, pct: pct(counts.in_progress), color: '#f59e0b', bg: 'bg-amber-400' },
    { key: 'todo',        label: 'Chưa làm',        count: counts.todo,        pct: pct(counts.todo),        color: '#d6d3d1', bg: 'bg-stone-300' },
  ]

  // Simple stacked bar instead of actual donut
  return (
    <div>
      <div className="flex h-4 rounded-full overflow-hidden gap-px mb-3">
        {segments.map(s => (
          <div
            key={s.key}
            className={`${s.bg} transition-all duration-700`}
            style={{ width: `${s.pct}%` }}
          />
        ))}
      </div>
      <div className="space-y-1.5">
        {segments.map(s => (
          <div key={s.key} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${s.bg}`} />
              <span className="text-xs text-stone-600">{s.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-stone-800 tabular-nums">{s.count}</span>
              <span className="text-xs text-stone-400 w-8 text-right tabular-nums">{s.pct}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const projects = MOCK_PROJECTS
  const tasks    = MOCK_TASKS

  const totalTasks     = tasks.length
  const completedTasks = tasks.filter(t => t.status === 'done').length
  const overallProgress = calcProgress(completedTasks, totalTasks)
  const totalBudget    = projects.reduce((s, p) => s + p.budget_total, 0)
  const totalSpent     = projects.reduce((s, p) => s + p.total_spent, 0)

  useEffect(() => { setTimeout(() => setLoading(false), 800) }, [])

  return (
    <>
      <TopBar
        title="Tổng quan"
        subtitle={`${new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })}`}
        right={
          <Button size="sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Tạo dự án
          </Button>
        }
      />

      <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-5">
        {/* Welcome Banner */}
        <WelcomeBanner />

        {/* Stat Cards */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[1,2,3,4].map(i => <CardSkeleton key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              title="Tổng đầu mục"
              value={totalTasks}
              sub={`${completedTasks} hoàn thành`}
              icon="📋"
              color="rose"
            />
            <StatCard
              title="Tiến độ"
              value={`${overallProgress}%`}
              sub={`${totalTasks - completedTasks} còn lại`}
              icon="🎯"
              color="amber"
            />
            <StatCard
              title="Tổng ngân sách"
              value={formatCurrency(totalBudget)}
              sub={`${projects.length} dự án`}
              icon="💰"
              color="emerald"
            />
            <StatCard
              title="Đã chi tiêu"
              value={formatCurrency(totalSpent)}
              sub={`${Math.round((totalSpent/totalBudget)*100)}% ngân sách`}
              icon="💸"
              color="sky"
            />
          </div>
        )}

        {/* Main grid */}
        <div className="grid lg:grid-cols-3 gap-5">
          {/* Left col */}
          <div className="lg:col-span-2 space-y-5">
            {/* Overall progress */}
            <Card>
              <CardBody>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-stone-800">Tiến độ tổng thể</h3>
                    <p className="text-xs text-stone-400 mt-0.5">Tất cả dự án đang hoạt động</p>
                  </div>
                  <span className="text-2xl font-bold font-display text-rose-500">{overallProgress}%</span>
                </div>
                <ProgressBar value={overallProgress} size="lg" showLabel={false} />
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-4 text-xs text-stone-500">
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400" />{completedTasks} xong</span>
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400" />{tasks.filter(t=>t.status==='in_progress').length} đang làm</span>
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-stone-300" />{tasks.filter(t=>t.status==='todo').length} chờ</span>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Projects progress */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-stone-800">Dự án đang theo dõi</h3>
                  <Button variant="ghost" size="xs">Xem tất cả →</Button>
                </div>
              </CardHeader>
              <CardBody className="pt-0">
                <ProjectProgressList projects={projects} />
              </CardBody>
            </Card>

            {/* Budget overview */}
            <Card>
              <CardBody>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-stone-800">Tình hình ngân sách</h3>
                  <span className="text-xs text-stone-400 tabular-nums">
                    {formatCurrency(totalSpent)} / {formatCurrency(totalBudget)}
                  </span>
                </div>
                <ProgressBar value={(totalSpent / totalBudget) * 100} size="md" />
                <div className="grid grid-cols-3 gap-3 mt-4">
                  {[
                    { label: 'Đã chi', value: formatCurrency(totalSpent),                color: 'text-rose-500' },
                    { label: 'Còn lại', value: formatCurrency(totalBudget - totalSpent), color: 'text-emerald-600' },
                    { label: 'Tổng',    value: formatCurrency(totalBudget),              color: 'text-stone-700' },
                  ].map((s, i) => (
                    <div key={i} className="text-center p-2.5 bg-stone-50 rounded-xl">
                      <p className="text-[10px] text-stone-400 mb-1">{s.label}</p>
                      <p className={`text-xs font-bold tabular-nums ${s.color}`}>{s.value}</p>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Right col */}
          <div className="space-y-5">
            {/* Status distribution */}
            <Card>
              <CardHeader>
                <h3 className="font-semibold text-stone-800">Phân bổ trạng thái</h3>
              </CardHeader>
              <CardBody className="pt-0">
                <StatusDonut tasks={tasks} />
              </CardBody>
            </Card>

            {/* Upcoming deadlines */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-stone-800">Hạn chót sắp tới</h3>
                  <Badge variant="overdue" dot className="text-[10px]">
                    {tasks.filter(t => { const dl = getDeadlineLabel(t.deadline); return dl.overdue }).length} quá hạn
                  </Badge>
                </div>
              </CardHeader>
              <CardBody className="pt-0">
                <UpcomingDeadlines tasks={tasks} />
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </>
  )
}
