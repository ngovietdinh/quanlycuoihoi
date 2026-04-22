import { sb } from '@/lib/supabase/client'
import type { Project, ProjectSummary, ApiResult } from '@/types'

export async function getProjects(): Promise<ApiResult<ProjectSummary[]>> {
  try {
    const { data, error } = await sb().from('project_summary').select('*').order('created_at', { ascending: false })
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

export async function updateProject(id: string, dto: Partial<{ name: string; description: string; event_date: string; venue: string; budget_total: number; tags: string[] }>): Promise<ApiResult<Project>> {
  try {
    const { data, error } = await sb().from('projects').update(dto).eq('id', id).select().single()
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
