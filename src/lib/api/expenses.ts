import { getSupabaseClient } from '@/lib/supabase/client'
import type { Expense,CreateExpenseDTO,ApiResult } from '@/types'
const SEL='*, task:task_id(id,title), creator:created_by(id,full_name)'
const err=(e:unknown)=>({data:null,error:e instanceof Error?e.message:'Lỗi'})
export async function getExpenses(projectId:string):Promise<ApiResult<Expense[]>> {
  try {
    const {data,error}=await getSupabaseClient().from('expenses').select(SEL)
      .eq('project_id',projectId).order('spent_at',{ascending:false})
    if(error) throw error; return {data:data as Expense[],error:null}
  } catch(e) { return err(e) }
}
export async function createExpense(dto:CreateExpenseDTO):Promise<ApiResult<Expense>> {
  try {
    const sb=getSupabaseClient(); const {data:{user}}=await sb.auth.getUser()
    const {data,error}=await sb.from('expenses').insert({
      ...dto, created_by:user?.id??null, task_id:dto.task_id??null,
      spent_at:dto.spent_at??new Date().toISOString().slice(0,10)
    }).select(SEL).single()
    if(error) throw error; return {data:data as Expense,error:null}
  } catch(e) { return err(e) }
}
export async function deleteExpense(id:string):Promise<ApiResult<null>> {
  try {
    const {error}=await getSupabaseClient().from('expenses').delete().eq('id',id)
    if(error) throw error; return {data:null,error:null}
  } catch(e) { return err(e) }
}
