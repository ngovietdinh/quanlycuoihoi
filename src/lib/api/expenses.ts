import { sb } from '@/lib/supabase/client'
import type { Expense, ApiResult } from '@/types'

export async function getExpenses(projectId: string): Promise<ApiResult<Expense[]>> {
  try {
    const { data, error } = await sb().from('expenses').select('*')
      .eq('project_id', projectId).order('spent_at', { ascending: false })
    if (error) throw error
    return { data: data as Expense[], error: null }
  } catch (e: any) { return { data: null, error: e.message } }
}

export async function createExpense(dto: { project_id: string; amount: number; note?: string; category?: string; task_id?: string | null; vendor_id?: string | null; spent_at?: string }): Promise<ApiResult<Expense>> {
  try {
    const { data: { user } } = await sb().auth.getUser()
    const { vendor_id, ...rest } = dto
    const { data, error } = await sb().from('expenses').insert({
      ...rest,
      created_by: user?.id ?? null,
      task_id: dto.task_id || null,
      ...(vendor_id ? { vendor_id } : {}),  // chỉ gửi khi có (cột thêm ở migration 003)
      category: dto.category || 'Khác',
      spent_at: dto.spent_at ?? new Date().toISOString().slice(0, 10),
    }).select().single()
    if (error) throw error
    return { data: data as Expense, error: null }
  } catch (e: any) { return { data: null, error: e.message } }
}

export async function deleteExpense(id: string): Promise<ApiResult<null>> {
  try {
    const { error } = await sb().from('expenses').delete().eq('id', id)
    if (error) throw error
    return { data: null, error: null }
  } catch (e: any) { return { data: null, error: e.message } }
}
