'use client'
import { useState, useEffect, useCallback } from 'react'
import { sb } from '@/lib/supabase/client'
import { getProject } from '@/lib/api/projects'
import { getTasks }    from '@/lib/api/tasks'
import { getExpenses } from '@/lib/api/expenses'
import { getVendors, getSchedule, getProjectInvitations, type ProjectInvitation } from '@/lib/api/vendors'
import type { Project, Task, Expense, Vendor, ScheduleItem } from '@/types'

export function useProject(projectId: string) {
  const [project,  setProject]  = useState<Project|null>(null)
  const [tasks,    setTasks]    = useState<Task[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [vendors,  setVendors]  = useState<Vendor[]>([])
  const [schedule, setSchedule] = useState<ScheduleItem[]>([])
  const [invitations, setInvitations] = useState<ProjectInvitation[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string|null>(null)

  const reloadTasks    = useCallback(async () => { const r = await getTasks(projectId);    if (r.data) setTasks(r.data) }, [projectId])
  const reloadExpenses = useCallback(async () => { const r = await getExpenses(projectId); if (r.data) setExpenses(r.data) }, [projectId])
  const reloadVendors  = useCallback(async () => { const r = await getVendors(projectId);  if (r.data) setVendors(r.data) }, [projectId])
  const reloadSchedule = useCallback(async () => { const r = await getSchedule(projectId); if (r.data) setSchedule(r.data) }, [projectId])

  const refetch = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    setError(null)
    const [p, t, e, v, s, i] = await Promise.all([
      getProject(projectId), getTasks(projectId), getExpenses(projectId),
      getVendors(projectId), getSchedule(projectId), getProjectInvitations(projectId),
    ])
    if (p.error) setError(p.error); else setProject(p.data)
    if (t.data) setTasks(t.data)
    if (e.data) setExpenses(e.data)
    if (v.data) setVendors(v.data)
    if (s.data) setSchedule(s.data)
    if (i.data) setInvitations(i.data)
    setLoading(false)
  }, [projectId])

  useEffect(() => { refetch() }, [refetch])

  // Realtime: thành viên khác thay đổi → cập nhật ngay
  useEffect(() => {
    const client = sb()
    const on = (table: string, cb: () => void) =>
      client.channel(`${table}:${projectId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table, filter: `project_id=eq.${projectId}` }, cb).subscribe()
    const chs = [on('tasks', reloadTasks), on('expenses', reloadExpenses), on('vendors', reloadVendors), on('schedule_items', reloadSchedule)]
    return () => { chs.forEach(c => client.removeChannel(c)) }
  }, [projectId, reloadTasks, reloadExpenses, reloadVendors, reloadSchedule])

  // Tổng đã chi = tổng chi tiêu (không dùng tasks.cost_actual)
  const totalSpent     = expenses.reduce((sum, e) => sum + Number(e.amount), 0)
  const totalEstimated = tasks.reduce((sum, t) => sum + Number(t.cost_estimate), 0)
  const budgetTotal    = Number(project?.budget_total ?? 0)
  const remaining      = budgetTotal - totalSpent
  const budgetPct      = budgetTotal ? Math.min(100, (totalSpent / budgetTotal) * 100) : 0
  // Đã cam kết = tổng giá trị hợp đồng nhà cung cấp đã chốt
  const committed      = vendors.filter(v => v.status === 'booked').reduce((s, v) => s + Number(v.total_cost), 0)
  const paidByVendor   = expenses.reduce((m, e) => (e.vendor_id ? m.set(e.vendor_id, (m.get(e.vendor_id) ?? 0) + Number(e.amount)) : m), new Map<string, number>())

  return {
    project, tasks, expenses, vendors, schedule, invitations, loading, error,
    refetch, reloadTasks, reloadExpenses, reloadVendors, reloadSchedule,
    setTasks, setSchedule,
    totalSpent, totalEstimated, remaining, budgetPct, committed, paidByVendor,
  }
}
