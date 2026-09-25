'use client'
import { useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Shell } from '@/components/layout/Shell'
import { ToastProvider, useToast } from '@/components/ui/Toast'
import { ConfirmModal } from '@/components/ui/Modal'
import { useProject } from '@/hooks/useProject'
import { useAuth } from '@/hooks/useAuth'
import { createTask, updateTask, deleteTask } from '@/lib/api/tasks'
import { createExpense, deleteExpense } from '@/lib/api/expenses'
import { updateProject, deleteProject } from '@/lib/api/projects'
import { seedWeddingChecklist, WEDDING_CHECKLIST } from '@/lib/api/dashboard'
import { saveVendor, deleteVendor, saveScheduleItem, deleteScheduleItem, addScheduleItems, updateExpense, SCHEDULE_TEMPLATE, type VendorInput, type ScheduleInput } from '@/lib/api/vendors'
import { vnd, cn, STATUS_LABELS, EXPENSE_CATEGORIES } from '@/lib/utils'
import { MembersPanel, useProjectRole } from '@/components/project/MembersPanel'
import { TaskModal, ExpenseModal, EditProjectModal, type TaskForm, type ExpenseForm, type ProjectForm } from '@/components/project/shared'
import { ProjectHero, OverviewTab } from '@/components/project/OverviewTab'
import { TasksTab } from '@/components/project/TasksTab'
import { BudgetTab } from '@/components/project/BudgetTab'
import { VendorsTab } from '@/components/project/VendorsTab'
import { ScheduleTab } from '@/components/project/ScheduleTab'
import type { Task, TaskStatus, Expense, Vendor } from '@/types'

type Tab = 'overview' | 'tasks' | 'budget' | 'vendors' | 'schedule' | 'members'
type Confirm = { title: string; msg: string; label: string; run: () => Promise<void> }

function ProjectContent() {
  const { id: projectId } = useParams() as { id: string }
  const router = useRouter()
  const { success, error: toastErr } = useToast()
  const P = useProject(projectId)
  const { project, tasks, expenses, vendors, schedule, invitations, loading, error } = P
  const { user } = useAuth()
  const { members, role, canEdit, canManage, reload: reloadMembers } = useProjectRole(projectId, user?.id)

  const [tab, setTab] = useState<Tab>('overview')
  const [taskModal, setTaskModal] = useState<{ task?: Task; status: TaskStatus; n: number } | null>(null)
  const [expenseModal, setExpenseModal] = useState<{ expense?: Expense; preset?: Partial<ExpenseForm>; n: number } | null>(null)
  const [editProject, setEditProject] = useState(false)
  const [confirm, setConfirm] = useState<Confirm | null>(null)
  const [busy, setBusy] = useState(false)
  const [menu, setMenu] = useState(false)

  const openTask = (task?: Task, status: TaskStatus = 'todo') => setTaskModal({ task, status, n: Date.now() })
  const ask = (c: Confirm) => setConfirm(c)
  async function runConfirm() { if (!confirm) return; setBusy(true); await confirm.run(); setBusy(false); setConfirm(null) }

  // ── Công việc ──
  const saveTask = useCallback(async (d: TaskForm) => {
    const editing = taskModal?.task
    const r = editing ? await updateTask(editing.id, d) : await createTask({ project_id: projectId, ...d })
    if (r.error) { toastErr(editing ? 'Không cập nhật được' : 'Không thêm được', r.error); return false }
    success(editing ? 'Đã cập nhật đầu mục ✓' : 'Đã thêm đầu mục 🎉')
    await P.reloadTasks(); return true
  }, [taskModal, projectId, P, success, toastErr])

  const moveTask = useCallback(async (id: string, status: TaskStatus) => {
    const prev = tasks
    P.setTasks(ts => ts.map(t => (t.id === id ? { ...t, status } : t)))   // cập nhật lạc quan
    const r = await updateTask(id, { status })
    if (r.error) { P.setTasks(prev); toastErr('Không chuyển được trạng thái', r.error); return }
    success(`→ ${STATUS_LABELS[status]}`)
  }, [tasks, P, success, toastErr])

  async function quickAdd(title: string) {
    const r = await createTask({ project_id: projectId, title })
    if (r.error) toastErr('Không thêm được', r.error); else { success('Đã thêm đầu mục'); await P.reloadTasks() }
  }
  async function seed() {
    const r = await seedWeddingChecklist(projectId, project?.event_date)
    if (r.error) toastErr('Không thêm được việc mẫu', r.error); else { success(`Đã thêm ${WEDDING_CHECKLIST.length} việc chuẩn bị cưới ✨`); await P.reloadTasks() }
  }
  const removeTask = (id: string) => ask({ title: 'Xóa đầu mục?', msg: `“${tasks.find(t => t.id === id)?.title}” sẽ bị xóa vĩnh viễn.`, label: 'Xóa đầu mục',
    run: async () => { const r = await deleteTask(id); if (r.error) toastErr('Không xóa được', r.error); else { success('Đã xóa đầu mục'); await P.reloadTasks() } } })

  // ── Chi tiêu ──
  async function saveExpense(d: ExpenseForm) {
    const editing = expenseModal?.expense
    const r = editing ? await updateExpense(editing.id, d) : await createExpense({ project_id: projectId, ...d })
    if (r.error) { toastErr('Không lưu được chi tiêu', r.error); return false }
    success(editing ? 'Đã cập nhật khoản chi ✓' : `Đã ghi nhận ${vnd(d.amount)} 💸`)
    await P.reloadExpenses(); return true
  }
  const removeExpense = (id: string) => ask({ title: 'Xóa khoản chi?', msg: 'Tổng đã chi của dự án sẽ được tính lại.', label: 'Xóa khoản chi',
    run: async () => { const r = await deleteExpense(id); if (r.error) toastErr('Không xóa được', r.error); else { success('Đã xóa khoản chi'); await P.reloadExpenses() } } })

  // ── Nhà cung cấp ──
  async function saveV(d: VendorInput, id?: string) {
    const r = await saveVendor(projectId, d, id)
    if (r.error) { toastErr('Không lưu được nhà cung cấp', r.error); return false }
    success(id ? 'Đã cập nhật nhà cung cấp ✓' : 'Đã thêm nhà cung cấp 🤝'); await P.reloadVendors(); return true
  }
  const removeVendor = (v: Vendor) => ask({ title: 'Xóa nhà cung cấp?', msg: `Xóa “${v.name}”. Các khoản chi đã ghi vẫn được giữ lại trong Ngân sách.`, label: 'Xóa',
    run: async () => { const r = await deleteVendor(v.id); if (r.error) toastErr('Không xóa được', r.error); else { success('Đã xóa nhà cung cấp'); await Promise.all([P.reloadVendors(), P.reloadExpenses()]) } } })
  const payVendor = (v: Vendor, rest: number) => setExpenseModal({
    n: Date.now(), preset: { amount: rest, vendor_id: v.id, note: `Thanh toán ${v.name}`, category: EXPENSE_CATEGORIES.includes(v.category) ? v.category : 'Khác' },
  })

  // ── Lịch trình ──
  async function saveS(d: ScheduleInput, id?: string) {
    const r = await saveScheduleItem(projectId, d, id)
    if (r.error) { toastErr('Không lưu được', r.error); return false }
    success(id ? 'Đã cập nhật lịch trình ✓' : 'Đã thêm vào lịch trình'); await P.reloadSchedule(); return true
  }
  async function toggleS(it: { id: string; done: boolean; title: string }) {
    P.setSchedule(s => s.map(x => (x.id === it.id ? { ...x, done: !x.done } : x)))
    const r = await saveScheduleItem(projectId, { title: it.title, done: !it.done }, it.id)
    if (r.error) { toastErr('Không cập nhật được', r.error); P.reloadSchedule() }
  }
  async function useTemplate(day: string | null) {
    const r = await addScheduleItems(projectId, SCHEDULE_TEMPLATE.map(t => ({ title: t.title, day, start_time: t.start, end_time: t.end ?? null, location: t.location ?? null, owner: t.owner ?? null })))
    if (r.error) toastErr('Không tạo được lịch trình', r.error); else { success('Đã tạo lịch trình mẫu ✨'); await P.reloadSchedule() }
  }
  const removeS = (id: string) => ask({ title: 'Xóa mục lịch trình?', msg: 'Mục này sẽ bị xóa khỏi lịch trình.', label: 'Xóa',
    run: async () => { const r = await deleteScheduleItem(id); if (r.error) toastErr('Không xóa được', r.error); else await P.reloadSchedule() } })

  // ── Dự án ──
  async function saveProject(d: ProjectForm) {
    const r = await updateProject(projectId, d)
    if (r.error) { toastErr('Không lưu được', r.error); return false }
    success('Đã cập nhật dự án ✓'); await P.refetch(true); return true
  }
  const removeProject = () => ask({ title: 'Xóa dự án?', msg: 'Toàn bộ đầu mục, chi tiêu, nhà cung cấp và lịch trình sẽ bị xóa vĩnh viễn. Không thể hoàn tác.', label: 'Xóa dự án',
    run: async () => { const r = await deleteProject(projectId); if (r.error) toastErr('Không xóa được', r.error); else { success('Đã xóa dự án'); router.push('/dashboard') } } })

  if (loading) return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-4">
      <div className="h-44 rounded-2xl skeleton"/><div className="h-10 w-2/3 skeleton"/>
      <div className="grid lg:grid-cols-3 gap-4"><div className="lg:col-span-2 h-72 skeleton"/><div className="h-72 skeleton"/></div>
    </div>
  )
  if (error || !project) return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="text-center"><div className="text-4xl mb-3">⚠️</div><p className="text-ink-500 mb-4">{error || 'Không tìm thấy dự án hoặc bạn không có quyền truy cập'}</p>
        <Link href="/dashboard" className="btn btn-primary btn-sm">← Về tổng quan</Link></div>
    </div>
  )

  const overdue = tasks.filter(t => t.status !== 'done' && t.deadline && t.deadline < new Date().toISOString().slice(0, 10)).length
  const TABS: { id: Tab; label: string; icon: string; badge?: string | number }[] = [
    { id: 'overview', label: 'Tổng quan', icon: '📊' },
    { id: 'tasks', label: 'Công việc', icon: '✅', badge: overdue ? `${overdue}!` : tasks.filter(t => t.status !== 'done').length || undefined },
    { id: 'budget', label: 'Ngân sách', icon: '💰' },
    { id: 'vendors', label: 'Nhà cung cấp', icon: '🤝', badge: vendors.length || undefined },
    { id: 'schedule', label: 'Lịch trình', icon: '🕰️', badge: schedule.length || undefined },
    { id: 'members', label: 'Thành viên', icon: '👥', badge: members.length > 1 ? members.length : undefined },
  ]

  return (
    <>
      <header className="sticky top-0 z-30 px-4 sm:px-6 h-[61px] border-b border-ink-100/60 flex items-center gap-2 print:hidden" style={{ background: 'rgba(255,253,249,0.94)', backdropFilter: 'blur(20px)' }}>
        <Link href="/dashboard" className="btn btn-ghost btn-sm btn-icon" title="Về tổng quan">←</Link>
        <p className="font-display text-lg font-semibold text-ink-900 truncate flex-1">{project.name}</p>
        {canEdit && <>
          <button onClick={() => setExpenseModal({ n: Date.now() })} className="btn btn-secondary btn-sm hidden sm:inline-flex">💸 Ghi chi tiêu</button>
          <button onClick={() => openTask()} className="btn btn-primary btn-sm">＋ <span className="hidden sm:inline">Đầu mục</span></button>
        </>}
        {(canEdit || canManage) && (
          <div className="relative">
            <button onClick={() => setMenu(m => !m)} className="btn btn-ghost btn-sm btn-icon" aria-label="Thêm thao tác">⋯</button>
            {menu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenu(false)}/>
                <div className="absolute right-0 top-10 z-20 w-52 card p-1.5 animate-popIn text-sm">
                  {canEdit && <button onClick={() => { setMenu(false); setEditProject(true) }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-ink-50">✏️ Sửa thông tin dự án</button>}
                  {canEdit && <button onClick={() => { setMenu(false); setExpenseModal({ n: Date.now() }) }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-ink-50 sm:hidden">💸 Ghi chi tiêu</button>}
                  <button onClick={() => { setMenu(false); setTab('members') }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-ink-50">👥 Mời thành viên</button>
                  <Link href="/invitations" className="block px-3 py-2 rounded-lg hover:bg-ink-50">💌 Thiệp cưới online</Link>
                  {role === 'owner' || role === 'admin' ? <button onClick={() => { setMenu(false); removeProject() }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-red-50 text-red-600">🗑 Xóa dự án</button> : null}
                </div>
              </>
            )}
          </div>
        )}
      </header>

      <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-4">
        <div className="print:hidden"><ProjectHero project={project} tasks={tasks} totalSpent={P.totalSpent} role={role} members={members} onEdit={canEdit ? () => setEditProject(true) : undefined}/></div>

        <nav className="sticky top-[61px] z-20 -mx-4 sm:mx-0 px-4 sm:px-1 py-1.5 flex gap-1 overflow-x-auto no-scrollbar print:hidden" style={{ background: 'rgba(253,248,240,0.94)', backdropFilter: 'blur(16px)' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={cn('flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition',
                tab === t.id ? 'bg-white shadow-card text-sakura-700 font-semibold' : 'text-ink-500 hover:text-ink-900 hover:bg-white/60')}>
              <span>{t.icon}</span>{t.label}
              {t.badge !== undefined && <span className={cn('text-[10px] font-bold rounded-full px-1.5 min-w-[18px] text-center', String(t.badge).endsWith('!') ? 'bg-red-500 text-white' : 'bg-ink-100 text-ink-600')}>{t.badge}</span>}
            </button>
          ))}
        </nav>

        {!canEdit && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm text-blue-700 print:hidden">👁 Bạn đang xem dự án với quyền <b>chỉ xem</b>. Liên hệ chủ dự án để được cấp quyền biên tập.</div>
        )}

        {tab === 'overview' && <OverviewTab project={project} tasks={tasks} vendors={vendors} schedule={schedule} invitations={invitations}
          totalSpent={P.totalSpent} remaining={P.remaining} committed={P.committed} paidByVendor={P.paidByVendor}
          goTo={t => setTab(t as Tab)} onToggleTask={t => moveTask(t.id, 'done')} canEdit={canEdit}/>}
        {tab === 'tasks' && <TasksTab tasks={tasks} members={members} canEdit={canEdit} currentUserId={user?.id} projectName={project.name}
          onEdit={t => openTask(t)} onDelete={removeTask} onMove={moveTask} onAdd={s => openTask(undefined, s)} onQuickAdd={quickAdd} onSeed={seed}/>}
        {tab === 'budget' && <BudgetTab project={project} tasks={tasks} expenses={expenses} vendors={vendors} canEdit={canEdit}
          totalSpent={P.totalSpent} remaining={P.remaining} committed={P.committed}
          onAdd={() => setExpenseModal({ n: Date.now() })} onEdit={e => setExpenseModal({ expense: e, n: Date.now() })} onDelete={removeExpense}/>}
        {tab === 'vendors' && <VendorsTab vendors={vendors} paidByVendor={P.paidByVendor} canEdit={canEdit} projectName={project.name} onSave={saveV} onDelete={removeVendor} onPay={payVendor}/>}
        {tab === 'schedule' && <ScheduleTab items={schedule} eventDate={project.event_date} canEdit={canEdit} projectName={project.name}
          onSave={saveS} onDelete={removeS} onToggle={toggleS} onUseTemplate={useTemplate}/>}
        {tab === 'members' && <MembersPanel projectId={projectId} members={members} canManage={canManage} reload={reloadMembers} currentUserId={user?.id}/>}
      </div>

      {/* Mount lại theo key mỗi lần mở → form luôn đúng dữ liệu */}
      {taskModal && <TaskModal key={taskModal.n} open onClose={() => setTaskModal(null)} onSave={saveTask} task={taskModal.task} defaultStatus={taskModal.status} members={members}/>}
      {expenseModal && <ExpenseModal key={expenseModal.n} open onClose={() => setExpenseModal(null)} onSave={saveExpense} tasks={tasks} vendors={vendors} expense={expenseModal.expense} preset={expenseModal.preset}/>}
      {editProject && <EditProjectModal open onClose={() => setEditProject(false)} project={project} onSave={saveProject}/>}
      <ConfirmModal open={!!confirm} onClose={() => setConfirm(null)} onConfirm={runConfirm} loading={busy} title={confirm?.title ?? ''} msg={confirm?.msg ?? ''} confirmLabel={confirm?.label}/>
    </>
  )
}

export default function ProjectPage() {
  return <ToastProvider><Shell><ProjectContent/></Shell></ToastProvider>
}
