export type TaskStatus   = 'todo' | 'in_progress' | 'done'
export type TaskPriority = 'low'  | 'medium'       | 'high'
export type MemberRole   = 'owner'| 'editor'        | 'viewer'

export interface Profile {
  id: string; full_name: string | null; avatar_url: string | null
  phone: string | null; created_at: string; updated_at: string
}
export interface Project {
  id: string; user_id: string; name: string; description: string | null
  event_date: string | null; venue: string | null; budget_total: number
  cover_url: string | null; created_at: string; updated_at: string
}
export interface ProjectSummary extends Project {
  total_tasks: number; completed_tasks: number; total_estimated: number; total_spent: number
}
export interface Task {
  id: string; project_id: string; assigned_to: string | null
  title: string; description: string | null; status: TaskStatus
  priority: TaskPriority; deadline: string | null
  cost_estimate: number; cost_actual: number; position: number
  created_at: string; updated_at: string
  assignee?: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>
}
export interface Expense {
  id: string; project_id: string; task_id: string | null
  created_by: string | null; amount: number; note: string | null
  receipt_url: string | null; spent_at: string; created_at: string
  task?: Pick<Task, 'id' | 'title'>; creator?: Pick<Profile, 'id' | 'full_name'>
}
export interface CreateProjectDTO {
  name: string; description?: string; event_date?: string; venue?: string; budget_total: number
}
export interface UpdateProjectDTO extends Partial<CreateProjectDTO> { cover_url?: string }
export interface CreateTaskDTO {
  project_id: string; title: string; description?: string; status?: TaskStatus
  priority?: TaskPriority; deadline?: string; cost_estimate?: number; assigned_to?: string
}
export interface UpdateTaskDTO {
  title?: string; description?: string; status?: TaskStatus; priority?: TaskPriority
  deadline?: string; cost_estimate?: number; cost_actual?: number; position?: number
}
export interface CreateExpenseDTO {
  project_id: string; task_id?: string; amount: number; note?: string; spent_at?: string
}
export interface ApiResult<T> { data: T | null; error: string | null }
