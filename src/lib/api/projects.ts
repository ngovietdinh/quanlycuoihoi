import { getSupabaseClient } from '@/lib/supabase/client'
import type { Project,ProjectSummary,CreateProjectDTO,UpdateProjectDTO,ApiResult } from '@/types'
const err = (e:unknown) => ({data:null,error:e instanceof Error?e.message:'Lỗi'})
export async function getProjects():Promise<ApiResult<ProjectSummary[]>> {
  try {
    const sb=getSupabaseClient(); const {data:{user}}=await sb.auth.getUser()
    if(!user) return {data:null,error:'Chưa đăng nhập'}
    const {data,error}=await sb.from('project_summary').select('*').order('created_at',{ascending:false})
    if(error) throw error; return {data:data as ProjectSummary[],error:null}
  } catch(e) { return err(e) }
}
export async function getProject(id:string):Promise<ApiResult<Project>> {
  try {
    const {data,error}=await getSupabaseClient().from('projects').select('*').eq('id',id).single()
    if(error) throw error; return {data,error:null}
  } catch(e) { return err(e) }
}
export async function createProject(dto:CreateProjectDTO):Promise<ApiResult<Project>> {
  try {
    const sb=getSupabaseClient(); const {data:{user}}=await sb.auth.getUser()
    if(!user) return {data:null,error:'Chưa đăng nhập'}
    const {data,error}=await sb.from('projects').insert({...dto,user_id:user.id}).select().single()
    if(error) throw error; return {data,error:null}
  } catch(e) { return err(e) }
}
export async function updateProject(id:string,dto:UpdateProjectDTO):Promise<ApiResult<Project>> {
  try {
    const {data,error}=await getSupabaseClient().from('projects').update(dto).eq('id',id).select().single()
    if(error) throw error; return {data,error:null}
  } catch(e) { return err(e) }
}
export async function deleteProject(id:string):Promise<ApiResult<null>> {
  try {
    const {error}=await getSupabaseClient().from('projects').delete().eq('id',id)
    if(error) throw error; return {data:null,error:null}
  } catch(e) { return err(e) }
}
