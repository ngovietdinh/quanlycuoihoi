import { sb } from '@/lib/supabase/client'
import type { Project, ProjectSummary, ApiResult } from '@/types'

export async function getProjects(): Promise<ApiResult<ProjectSummary[]>> {
  try {
    const { data: { user } } = await sb().auth.getUser()
    if (!user) return { data: null, error: 'Chưa đăng nhập' }
    // Chỉ lấy dự án của mình + dự án được chia sẻ (admin không bị lẫn dự án của người khác)
    const { data: mem } = await sb().from('project_members').select('project_id').eq('user_id', user.id)
    const ids = (mem ?? []).map((m: any) => m.project_id)
    let q = sb().from('project_summary').select('*').order('created_at', { ascending: false })
    q = ids.length ? q.or(`user_id.eq.${user.id},id.in.(${ids.join(',')})`) : q.eq('user_id', user.id)
    const { data, error } = await q
    if (error) throw error
    return { data: data as ProjectSummary[], error: null }
  } catch (e: any) { return { data: null, error: e.message } }
}

export async function getProject(id: string): Promise<ApiResult<Project>> {
  try {
    const { data, error } = await sb().from('projects').select('*').eq('id', id).single()
    if (error) throw error
    return { data, error: null }
  } catch (e: any) { return { data: null, error: e.message } }
}

export async function createProject(dto: { name: string; description?: string; event_date?: string; venue?: string; budget_total: number; tags?: string[] }): Promise<ApiResult<Project>> {
  try {
    const { data: { user } } = await sb().auth.getUser()
    if (!user) return { data: null, error: 'Chưa đăng nhập' }
    const { data, error } = await sb().from('projects').insert({ ...dto, user_id: user.id, tags: dto.tags ?? [] }).select().single()
    if (error) throw error
    return { data, error: null }
  } catch (e: any) { return { data: null, error: e.message } }
}

export async function updateProject(id: string, dto: Partial<{ name: string; description: string; event_date: string | null; venue: string; budget_total: number; tags: string[] }>): Promise<ApiResult<Project>> {
  try {
    const clean = 'event_date' in dto ? { ...dto, event_date: dto.event_date || null } : dto
    const { data, error } = await sb().from('projects').update(clean).eq('id', id).select().single()
    if (error) throw error
    return { data, error: null }
  } catch (e: any) { return { data: null, error: e.message } }
}

export async function deleteProject(id: string): Promise<ApiResult<null>> {
  try {
    const { error } = await sb().from('projects').delete().eq('id', id)
    if (error) throw error
    return { data: null, error: null }
  } catch (e: any) { return { data: null, error: e.message } }
}
