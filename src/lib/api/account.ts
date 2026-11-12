import { sb } from '@/lib/supabase/client'
import type { UserProfile, ProjectMember, MemberRole, AdminUserRow, AdminStats, AppRole, Invitation, ApiResult } from '@/types'

const fail = (e: any) => ({ data: null, error: e?.message ?? String(e) })

// ── Hồ sơ cá nhân ─────────────────────────────────────────────────────────────
export async function getMyProfile(): Promise<ApiResult<UserProfile>> {
  try {
    const { data: { user } } = await sb().auth.getUser()
    if (!user) return { data: null, error: 'Chưa đăng nhập' }
    const { data, error } = await sb().from('profiles').select('*').eq('id', user.id).single()
    if (error) throw error
    return { data: { email: user.email ?? null, role: 'user', is_active: true, last_seen_at: null, ...data } as UserProfile, error: null }
  } catch (e) { return fail(e) }
}

export async function updateMyProfile(dto: { full_name?: string; phone?: string; avatar_url?: string }): Promise<ApiResult<UserProfile>> {
  try {
    const { data: { user } } = await sb().auth.getUser()
    if (!user) return { data: null, error: 'Chưa đăng nhập' }
    const { data, error } = await sb().from('profiles').update(dto).eq('id', user.id).select().single()
    if (error) throw error
    await sb().auth.updateUser({ data: { full_name: dto.full_name } })
    return { data: data as UserProfile, error: null }
  } catch (e) { return fail(e) }
}

export async function changePassword(password: string): Promise<ApiResult<null>> {
  try {
    const { error } = await sb().auth.updateUser({ password })
    if (error) throw error
    return { data: null, error: null }
  } catch (e) { return fail(e) }
}

export async function touchLastSeen() {
  const { data: { user } } = await sb().auth.getUser()
  if (user) await sb().from('profiles').update({ last_seen_at: new Date().toISOString() }).eq('id', user.id)
}

// ── Thành viên dự án ──────────────────────────────────────────────────────────
export async function getProjectMembers(projectId: string): Promise<ApiResult<ProjectMember[]>> {
  try {
    const { data, error } = await sb().rpc('list_project_members', { p_project_id: projectId })
    if (error) throw error
    return { data: data as ProjectMember[], error: null }
  } catch (e) { return fail(e) }
}
export async function addProjectMember(projectId: string, email: string, role: MemberRole): Promise<ApiResult<null>> {
  try {
    const { error } = await sb().rpc('add_project_member', { p_project_id: projectId, p_email: email, p_role: role })
    if (error) throw error
    return { data: null, error: null }
  } catch (e) { return fail(e) }
}
export async function updateProjectMember(projectId: string, userId: string, role: MemberRole): Promise<ApiResult<null>> {
  try {
    const { error } = await sb().from('project_members').update({ role }).eq('project_id', projectId).eq('user_id', userId)
    if (error) throw error
    return { data: null, error: null }
  } catch (e) { return fail(e) }
}
export async function removeProjectMember(projectId: string, userId: string): Promise<ApiResult<null>> {
  try {
    const { error } = await sb().from('project_members').delete().eq('project_id', projectId).eq('user_id', userId)
    if (error) throw error
    return { data: null, error: null }
  } catch (e) { return fail(e) }
}

// ── Quản trị ──────────────────────────────────────────────────────────────────
export async function adminStats(): Promise<ApiResult<AdminStats>> {
  try {
    const { data, error } = await sb().rpc('admin_stats')
    if (error) throw error
    return { data: data as AdminStats, error: null }
  } catch (e) { return fail(e) }
}
export async function adminListUsers(): Promise<ApiResult<AdminUserRow[]>> {
  try {
    const { data, error } = await sb().rpc('admin_list_users')
    if (error) throw error
    return { data: data as AdminUserRow[], error: null }
  } catch (e) { return fail(e) }
}
export async function adminUpdateUser(id: string, dto: { role?: AppRole; is_active?: boolean }): Promise<ApiResult<null>> {
  try {
    const { error } = await sb().from('profiles').update(dto).eq('id', id)
    if (error) throw error
    return { data: null, error: null }
  } catch (e) { return fail(e) }
}
export async function adminListInvitations(): Promise<ApiResult<(Invitation & { owner_email?: string|null; rsvp_count: number })[]>> {
  try {
    const { data, error } = await sb().from('invitations')
      .select('id,user_id,slug,title,event_date,is_published,view_count,created_at,updated_at,project_id,theme,content,rsvps(count)')
      .order('created_at', { ascending: false }).limit(500)
    if (error) throw error
    return { data: (data ?? []).map((r: any) => ({ ...r, rsvp_count: r.rsvps?.[0]?.count ?? 0 })), error: null }
  } catch (e) { return fail(e) }
}
export async function adminListProjects(): Promise<ApiResult<any[]>> {
  try {
    const { data, error } = await sb().from('project_summary').select('*').order('created_at', { ascending: false }).limit(500)
    if (error) throw error
    return { data: data ?? [], error: null }
  } catch (e) { return fail(e) }
}
