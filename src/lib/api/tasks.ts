import { getSupabaseClient } from '@/lib/supabase/client'
import type { Task,TaskStatus,CreateTaskDTO,UpdateTaskDTO,ApiResult } from '@/types'
const SEL='*, assignee:assigned_to(id,full_name,avatar_url)'
const err=(e:unknown)=>({data:null,error:e instanceof Error?e.message:'Lỗi'})
export async function getTasks(projectId:string):Promise<ApiResult<Task[]>> {
  try {
    const {data,error}=await getSupabaseClient().from('tasks').select(SEL)
      .eq('project_id',projectId).order('position',{ascending:true}).order('created_at',{ascending:true})
    if(error) throw error; return {data:data as Task[],error:null}
  } catch(e) { return err(e) }
}
export async function createTask(dto:CreateTaskDTO):Promise<ApiResult<Task>> {
  try {
    const sb=getSupabaseClient()
    const {data:ex}=await sb.from('tasks').select('position').eq('project_id',dto.project_id)
      .eq('status',dto.status??'todo').order('position',{ascending:false}).limit(1)
    const pos=ex&&ex.length>0?ex[0].position+1:0
    const {data,error}=await sb.from('tasks').insert({...dto,position:pos}).select(SEL).single()
    if(error) throw error; return {data:data as Task,error:null}
  } catch(e) { return err(e) }
}
export async function updateTask(id:string,dto:UpdateTaskDTO):Promise<ApiResult<Task>> {
  try {
    const {data,error}=await getSupabaseClient().from('tasks').update(dto).eq('id',id).select(SEL).single()
    if(error) throw error; return {data:data as Task,error:null}
  } catch(e) { return err(e) }
}
export async function moveTask(id:string,status:TaskStatus,position:number):Promise<ApiResult<Task>> {
  return updateTask(id,{status,position})
}
export async function deleteTask(id:string):Promise<ApiResult<null>> {
  try {
    const {error}=await getSupabaseClient().from('tasks').delete().eq('id',id)
    if(error) throw error; return {data:null,error:null}
  } catch(e) { return err(e) }
}
