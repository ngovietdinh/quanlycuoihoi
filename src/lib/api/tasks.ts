import { sb } from '@/lib/supabase/client'
import type { Task, TaskStatus, ApiResult } from '@/types'

const SEL = '*'

export async function getTasks(projectId: string): Promise<ApiResult<Task[]>> {
  try {
    const { data, error } = await sb().from('tasks').select(SEL)
      .eq('project_id', projectId).order('position').order('created_at')
    if (error) throw error
    return { data: data as Task[], error: null }
  } catch(e:any) { return { data: null, error: e.message } }
}

export async function createTask(dto: { project_id:string; title:string; description?:string; status?:TaskStatus; priority?:string; deadline?:string; cost_estimate?:number }): Promise<ApiResult<Task>> {
  try {
    const { data: existing } = await sb().from('tasks').select('position')
      .eq('project_id', dto.project_id).eq('status', dto.status ?? 'todo')
      .order('position', {ascending:false}).limit(1)
    const pos = existing?.[0]?.position != null ? existing[0].position + 1 : 0
    const { data, error } = await sb().from('tasks').insert({...dto, position: pos}).select().single()
    if (error) throw error
    return { data: data as Task, error: null }
  } catch(e:any) { return { data: null, error: e.message } }
}

export async function updateTask(id: string, dto: Partial<{ title:string; description:string; status:TaskStatus; priority:string; deadline:string; cost_estimate:number; cost_actual:number; position:number }>): Promise<ApiResult<Task>> {
  try {
    const { data, error } = await sb().from('tasks').update(dto).eq('id',id).select().single()
    if (error) throw error
    return { data: data as Task, error: null }
  } catch(e:any) { return { data: null, error: e.message } }
}

export async function deleteTask(id: string): Promise<ApiResult<null>> {
  try {
    const { error } = await sb().from('tasks').delete().eq('id',id)
    if (error) throw error
    return { data: null, error: null }
  } catch(e:any) { return { data: null, error: e.message } }
}

export async function moveTask(id: string, status: TaskStatus, position: number): Promise<ApiResult<Task>> {
  return updateTask(id, { status, position })
}
