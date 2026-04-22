'use client'
import { useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { TopBar } from '@/components/layout/Sidebar'
import { Card, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar, CircularProgress } from '@/components/ui/ProgressBar'
import { EmptyState } from '@/components/ui/EmptyState'
import { KanbanBoard } from '@/components/kanban/KanbanBoard'
import { TaskModal } from '@/components/kanban/TaskModal'
import { BudgetView } from '@/components/budget/BudgetView'
import { ConfirmModal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { formatCurrency, formatDate, calcProgress, calcRemaining, daysUntilEvent, getDeadlineLabel, STATUS_LABELS } from '@/lib/utils'
import type { Task, TaskStatus, Expense, Project } from '@/types'
import { cn } from '@/lib/utils'

type Tab = 'overview' | 'kanban' | 'budget'

/* ── Mock data ── */
const MOCK_PROJECT: Project = {
  id: 'p1', user_id: 'u1', name: 'Lễ Ăn Hỏi — Anh Tuấn & Chị Lan',
  description: 'Lễ ăn hỏi truyền thống tại Huế với đầy đủ nghi lễ truyền thống',
  event_date: '2025-06-15', venue: 'Nhà hàng Tịnh Gia Viên, Huế',
  budget_total: 80000000, cover_url: null, created_at: '', updated_at: '',
}

const MOCK_TASKS: Task[] = [
  { id: 't1', project_id: 'p1', assigned_to: null, title: 'Đặt mâm quả trầu cau', description: 'Liên hệ cơ sở làm mâm quả tại Huế, đặt 10 tráp', status: 'done', priority: 'high', deadline: '2025-04-01', cost_estimate: 3000000, cost_actual: 2800000, position: 0, created_at: '', updated_at: '' },
  { id: 't2', project_id: 'p1', assigned_to: null, title: 'Thuê áo dài cô dâu', description: 'Chọn 2 bộ áo dài màu đỏ và hồng', status: 'done', priority: 'high', deadline: '2025-04-15', cost_estimate: 5000000, cost_actual: 5500000, position: 1, created_at: '', updated_at: '' },
  { id: 't3', project_id: 'p1', assigned_to: null, title: 'Đặt tiệc trà & bánh', description: 'Bánh phu thê, bánh cốm, hoa quả lễ', status: 'in_progress', priority: 'high', deadline: new Date(Date.now() + 3*86400000).toISOString().slice(0,10), cost_estimate: 8000000, cost_actual: 0, position: 0, created_at: '', updated_at: '' },
  { id: 't4', project_id: 'p1', assigned_to: null, title: 'Chụp ảnh & quay phim', description: 'Thuê ekip quay phim chuyên nghiệp', status: 'in_progress', priority: 'medium', deadline: new Date(Date.now() + 20*86400000).toISOString().slice(0,10), cost_estimate: 15000000, cost_actual: 5000000, position: 1, created_at: '', updated_at: '' },
  { id: 't5', project_id: 'p1', assigned_to: null, title: 'Trang trí phòng lễ', description: 'Hoa tươi, đèn led, backdrop chụp ảnh', status: 'todo', priority: 'medium', deadline: new Date(Date.now() + 40*86400000).toISOString().slice(0,10), cost_estimate: 10000000, cost_actual: 0, position: 0, created_at: '', updated_at: '' },
  { id: 't6', project_id: 'p1', assigned_to: null, title: 'Mời thiệp lễ', description: 'In và gửi thiệp mời', status: 'todo', priority: 'low', deadline: new Date(Date.now() + 10*86400000).toISOString().slice(0,10), cost_estimate: 2000000, cost_actual: 0, position: 1, created_at: '', updated_at: '' },
  { id: 't7', project_id: 'p1', assigned_to: null, title: 'Chuẩn bị trang phục phù rể & phù dâu', description: '', status: 'todo', priority: 'medium', deadline: new Date(Date.now() + 30*86400000).toISOString().slice(0,10), cost_estimate: 6000000, cost_actual: 0, position: 2, created_at: '', updated_at: '' },
]

const MOCK_EXPENSES: Expense[] = [
  { id: 'e1', project_id: 'p1', task_id: 't1', created_by: null, amount: 2800000, note: 'Mâm quả 10 tráp', spent_at: '2025-03-28', created_at: '', receipt_url: null },
  { id: 'e2', project_id: 'p1', task_id: 't2', created_by: null, amount: 5500000, note: 'Áo dài cô dâu + chỉnh sửa', spent_at: '2025-04-10', created_at: '', receipt_url: null },
  { id: 'e3', project_id: 'p1', task_id: 't4', created_by: null, amount: 5000000, note: 'Đặt cọc ekip quay phim', spent_at: '2025-04-20', created_at: '', receipt_url: null },
]

function OverviewTab({ project, tasks, expenses }: { project: Project; tasks: Task[]; expenses: Expense[] }) {
  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0)
  const progress   = calcProgress(tasks.filter(t => t.status === 'done').length, tasks.length)
  const days       = daysUntilEvent(project.event_date)

  const upcoming = tasks
    .filter(t => t.deadline && t.status !== 'done')
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
    .slice(0, 4)

  return (
    <div className="grid lg:grid-cols-3 gap-5">
      {/* Left */}
      <div className="lg:col-span-2 space-y-4">
        {/* Hero card */}
        <Card gradient>
          <CardBody>
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <div className="flex-1 min-w-0">
                {project.description && <p className="text-sm text-stone-600 mb-3">{project.description}</p>}
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-stone-500">
                  {project.event_date && <span className="flex items-center gap-1">📅 {formatDate(project.event_date)}</span>}
                  {project.venue && <span className="flex items-center gap-1">📍 {project.venue}</span>}
                  {days !== null && <span className={`flex items-center gap-1 font-medium ${days < 0 ? 'text-stone-400' : days <= 14 ? 'text-rose-500' : 'text-amber-600'}`}>
                    ⏳ {days < 0 ? 'Đã diễn ra' : `Còn ${days} ngày`}
                  </span>}
                </div>
              </div>
              <div className="relative flex-shrink-0 flex flex-col items-center">
                <CircularProgress value={progress} size={80} strokeWidth={7} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-bold font-display text-stone-800">{progress}%</span>
                </div>
                <p className="text-[10px] text-stone-400 mt-1">hoàn thành</p>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-stone-500">Tiến độ tổng thể</span>
                <span className="font-medium text-stone-600">{tasks.filter(t=>t.status==='done').length}/{tasks.length} đầu mục</span>
              </div>
              <ProgressBar value={progress} size="md" />
            </div>
          </CardBody>
        </Card>

        {/* Status breakdown */}
        <Card>
          <CardBody>
            <h3 className="font-semibold text-stone-800 text-sm mb-4">Phân bổ đầu mục</h3>
            {(['todo','in_progress','done'] as TaskStatus[]).map(s => {
              const count = tasks.filter(t => t.status === s).length
              const pct   = tasks.length ? Math.round(count / tasks.length * 100) : 0
              const colors = { todo: 'bg-stone-200', in_progress: 'bg-amber-400', done: 'bg-emerald-400' }
              return (
                <div key={s} className="mb-3 last:mb-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${colors[s]}`} />
                      <span className="text-sm text-stone-600">{STATUS_LABELS[s]}</span>
                    </div>
                    <span className="text-sm font-semibold text-stone-800 tabular-nums">{count}</span>
                  </div>
                  <ProgressBar
                    value={pct}
                    size="xs"
                    variant={s === 'done' ? 'emerald' : s === 'in_progress' ? 'amber' : 'gradient'}
                  />
                </div>
              )
            })}
          </CardBody>
        </Card>
      </div>

      {/* Right */}
      <div className="space-y-4">
        {/* Budget mini */}
        <Card>
          <CardBody>
            <h3 className="font-semibold text-stone-800 text-sm mb-3">Ngân sách</h3>
            <div className="space-y-2 mb-3">
              {[
                { label: 'Kế hoạch', value: formatCurrency(project.budget_total), color: 'text-stone-700' },
                { label: 'Đã chi',   value: formatCurrency(totalSpent),            color: 'text-rose-500' },
                { label: 'Còn lại',  value: formatCurrency(calcRemaining(project.budget_total, totalSpent)), color: calcRemaining(project.budget_total, totalSpent) >= 0 ? 'text-emerald-600' : 'text-red-500' },
              ].map((row, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-stone-50 last:border-0">
                  <span className="text-xs text-stone-500">{row.label}</span>
                  <span className={`text-xs font-bold tabular-nums ${row.color}`}>{row.value}</span>
                </div>
              ))}
            </div>
            <ProgressBar value={(totalSpent / project.budget_total) * 100} size="sm" />
          </CardBody>
        </Card>

        {/* Upcoming deadlines */}
        <Card>
          <CardBody>
            <h3 className="font-semibold text-stone-800 text-sm mb-3">Hạn chót sắp tới</h3>
            {upcoming.length === 0 ? (
              <p className="text-xs text-stone-400 text-center py-4">🎉 Không có hạn chót sắp tới</p>
            ) : (
              <div className="space-y-2">
                {upcoming.map(t => {
                  const dl = getDeadlineLabel(t.deadline)
                  return (
                    <div key={t.id} className={`p-2.5 rounded-xl flex items-start gap-2 ${dl.overdue ? 'bg-red-50' : dl.urgent ? 'bg-amber-50' : 'bg-stone-50'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${dl.overdue ? 'bg-red-400' : dl.urgent ? 'bg-amber-400' : 'bg-stone-300'}`} />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-stone-800 truncate">{t.title}</p>
                        <p className={`text-[10px] ${dl.overdue ? 'text-red-500 font-medium' : dl.urgent ? 'text-amber-600' : 'text-stone-400'}`}>{dl.label}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

export default function ProjectDetailPage() {
  const params    = useParams()
  const { toast } = useToast()
  const [tab, setTab]           = useState<Tab>('overview')
  const [tasks, setTasks]       = useState<Task[]>(MOCK_TASKS)
  const [expenses, setExpenses] = useState<Expense[]>(MOCK_EXPENSES)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [editingTask, setEditingTask]     = useState<Task | undefined>()
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>('todo')
  const [deleteTaskId, setDeleteTaskId]   = useState<string | null>(null)

  const project = MOCK_PROJECT
  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0)

  const handleMoveTask = useCallback(async (id: string, status: TaskStatus) => {
    setTasks(ts => ts.map(t => t.id === id ? { ...t, status } : t))
    toast.success('Đã cập nhật', `Đầu mục đã chuyển sang "${STATUS_LABELS[status]}"`)
  }, [toast])

  const handleSaveTask = useCallback(async (data: Partial<Task>) => {
    if (editingTask) {
      setTasks(ts => ts.map(t => t.id === editingTask.id ? { ...t, ...data } : t))
      toast.success('Đã lưu', 'Đầu mục đã được cập nhật')
    } else {
      const newTask: Task = {
        id: Math.random().toString(36).slice(2),
        project_id: project.id, assigned_to: null,
        title: data.title || '', description: data.description || null,
        status: (data.status as TaskStatus) || defaultStatus,
        priority: (data.priority as any) || 'medium',
        deadline: data.deadline || null,
        cost_estimate: Number(data.cost_estimate) || 0,
        cost_actual: 0, position: tasks.length,
        created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      }
      setTasks(ts => [...ts, newTask])
      toast.success('Đã thêm', `"${newTask.title}" đã được tạo`)
    }
    setEditingTask(undefined)
  }, [editingTask, defaultStatus, project.id, tasks.length, toast])

  const handleDeleteTask = useCallback(async () => {
    if (!deleteTaskId) return
    setTasks(ts => ts.filter(t => t.id !== deleteTaskId))
    toast.success('Đã xóa', 'Đầu mục đã được xóa')
    setDeleteTaskId(null)
  }, [deleteTaskId, toast])

  const handleAddExpense = useCallback(async (data: any) => {
    const newExp: Expense = {
      id: Math.random().toString(36).slice(2),
      project_id: project.id, task_id: data.task_id || null,
      created_by: null, amount: data.amount, note: data.note || null,
      receipt_url: null, spent_at: data.spent_at, created_at: new Date().toISOString(),
    }
    setExpenses(es => [...es, newExp])
    toast.success('Đã thêm chi tiêu', formatCurrency(data.amount))
  }, [project.id, toast])

  const handleDeleteExpense = useCallback(async (id: string) => {
    setExpenses(es => es.filter(e => e.id !== id))
    toast.success('Đã xóa chi tiêu')
  }, [toast])

  const TABS = [
    { id: 'overview' as Tab, label: 'Tổng quan', icon: '⊞' },
    { id: 'kanban'   as Tab, label: 'Kanban',    icon: '⊟' },
    { id: 'budget'   as Tab, label: 'Ngân sách', icon: '◎' },
  ]

  const days = daysUntilEvent(project.event_date)

  return (
    <>
      <TopBar
        title={project.name}
        subtitle={project.event_date ? `📅 ${formatDate(project.event_date)}${days !== null && days > 0 ? ` · còn ${days} ngày` : ''}` : undefined}
        right={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => { setEditingTask(undefined); setDefaultStatus('todo'); setShowTaskModal(true) }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Thêm
            </Button>
          </div>
        }
      />

      {/* Tab bar */}
      <div className="sticky top-[57px] z-20 bg-white/90 backdrop-blur-md border-b border-stone-100 px-4 sm:px-6">
        <div className="flex items-center gap-0 -mb-px">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 transition-all duration-150',
                tab === t.id
                  ? 'border-rose-500 text-rose-600'
                  : 'border-transparent text-stone-500 hover:text-stone-800 hover:border-stone-200'
              )}
            >
              <span className="hidden sm:inline">{t.icon}</span>
              {t.label}
            </button>
          ))}

          {/* Spacer + mini budget badge */}
          <div className="ml-auto flex items-center gap-2 pb-1">
            <Badge variant={totalSpent > project.budget_total ? 'overdue' : 'done'} className="text-[10px]">
              {formatCurrency(totalSpent)} / {formatCurrency(project.budget_total)}
            </Badge>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className={cn('p-4 sm:p-6 max-w-7xl mx-auto w-full', tab === 'kanban' && 'max-w-none')}>
        {tab === 'overview' && <OverviewTab project={project} tasks={tasks} expenses={expenses} />}

        {tab === 'kanban' && (
          <KanbanBoard
            tasks={tasks}
            onMoveTask={handleMoveTask}
            onEditTask={task => { setEditingTask(task); setShowTaskModal(true) }}
            onDeleteTask={id => setDeleteTaskId(id)}
            onAddTask={status => { setEditingTask(undefined); setDefaultStatus(status); setShowTaskModal(true) }}
          />
        )}

        {tab === 'budget' && (
          <BudgetView
            project={project}
            tasks={tasks}
            expenses={expenses}
            onAddExpense={handleAddExpense}
            onDeleteExpense={handleDeleteExpense}
          />
        )}
      </div>

      {/* Modals */}
      <TaskModal
        open={showTaskModal}
        onClose={() => { setShowTaskModal(false); setEditingTask(undefined) }}
        onSave={handleSaveTask}
        task={editingTask}
        defaultStatus={defaultStatus}
      />

      <ConfirmModal
        open={!!deleteTaskId}
        onClose={() => setDeleteTaskId(null)}
        onConfirm={handleDeleteTask}
        title="Xóa đầu mục?"
        message="Đầu mục này sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác."
        confirmLabel="Xóa đầu mục"
      />
    </>
  )
}
