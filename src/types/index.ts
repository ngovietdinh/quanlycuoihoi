export type TaskStatus   = 'todo' | 'in_progress' | 'done'
export type TaskPriority = 'low'  | 'medium'       | 'high'

export interface Profile { id:string; full_name:string|null; avatar_url:string|null; phone:string|null; created_at:string; updated_at:string }

export interface Project { id:string; user_id:string; name:string; description:string|null; event_date:string|null; venue:string|null; budget_total:number; cover_url:string|null; created_at:string; updated_at:string }

export interface ProjectSummary extends Project { total_tasks:number; completed_tasks:number; total_estimated:number; total_spent:number }

export interface Task { id:string; project_id:string; assigned_to:string|null; title:string; description:string|null; status:TaskStatus; priority:TaskPriority; deadline:string|null; cost_estimate:number; cost_actual:number; position:number; created_at:string; updated_at:string }

export interface Expense { id:string; project_id:string; task_id:string|null; created_by:string|null; amount:number; note:string|null; spent_at:string; created_at:string }

export interface ApiResult<T> { data:T|null; error:string|null }
