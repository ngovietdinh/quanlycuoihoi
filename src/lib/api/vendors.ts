import { sb } from '@/lib/supabase/client'
import type { Vendor, ScheduleItem, Expense, ApiResult } from '@/types'

const fail = (e: any) => ({ data: null, error: e?.message ?? String(e) })
const missing = (e: any) => /schema cache|does not exist|Could not find the table/i.test(e?.message ?? '')

// ── Nhà cung cấp ──────────────────────────────────────────────────────────────
export async function getVendors(projectId: string): Promise<ApiResult<Vendor[]>> {
  try {
    const { data, error } = await sb().from('vendors').select('*').eq('project_id', projectId).order('created_at')
    if (error) { if (missing(error)) return { data: [], error: null }; throw error }
    return { data: data as Vendor[], error: null }
  } catch (e) { return fail(e) }
}
export type VendorInput = Partial<Omit<Vendor, 'id' | 'project_id' | 'created_at' | 'updated_at'>> & { name: string }
export async function saveVendor(projectId: string, dto: VendorInput, id?: string): Promise<ApiResult<Vendor>> {
  try {
    const q = id ? sb().from('vendors').update(dto).eq('id', id) : sb().from('vendors').insert({ ...dto, project_id: projectId })
    const { data, error } = await q.select().single()
    if (error) throw missing(error) ? new Error('Chưa bật tính năng nhà cung cấp: hãy chạy supabase/migrations/003_vendors_schedule.sql') : error
    return { data: data as Vendor, error: null }
  } catch (e) { return fail(e) }
}
export async function deleteVendor(id: string): Promise<ApiResult<null>> {
  try {
    const { error } = await sb().from('vendors').delete().eq('id', id)
    if (error) throw error
    return { data: null, error: null }
  } catch (e) { return fail(e) }
}

// ── Lịch trình ────────────────────────────────────────────────────────────────
export async function getSchedule(projectId: string): Promise<ApiResult<ScheduleItem[]>> {
  try {
    const { data, error } = await sb().from('schedule_items').select('*').eq('project_id', projectId)
      .order('day', { nullsFirst: true }).order('start_time', { nullsFirst: false }).order('position')
    if (error) { if (missing(error)) return { data: [], error: null }; throw error }
    return { data: data as ScheduleItem[], error: null }
  } catch (e) { return fail(e) }
}
export type ScheduleInput = Partial<Omit<ScheduleItem, 'id' | 'project_id' | 'created_at'>> & { title: string }
export async function saveScheduleItem(projectId: string, dto: ScheduleInput, id?: string): Promise<ApiResult<ScheduleItem>> {
  try {
    const clean = { ...dto, start_time: dto.start_time || null, end_time: dto.end_time || null, day: dto.day || null }
    const q = id ? sb().from('schedule_items').update(clean).eq('id', id) : sb().from('schedule_items').insert({ ...clean, project_id: projectId })
    const { data, error } = await q.select().single()
    if (error) throw missing(error) ? new Error('Chưa bật tính năng lịch trình: hãy chạy supabase/migrations/003_vendors_schedule.sql') : error
    return { data: data as ScheduleItem, error: null }
  } catch (e) { return fail(e) }
}
export async function addScheduleItems(projectId: string, rows: ScheduleInput[]): Promise<ApiResult<null>> {
  try {
    const { error } = await sb().from('schedule_items').insert(rows.map((r, i) => ({ ...r, position: i, project_id: projectId })))
    if (error) throw missing(error) ? new Error('Chưa bật tính năng lịch trình: hãy chạy supabase/migrations/003_vendors_schedule.sql') : error
    return { data: null, error: null }
  } catch (e) { return fail(e) }
}
export async function deleteScheduleItem(id: string): Promise<ApiResult<null>> {
  try {
    const { error } = await sb().from('schedule_items').delete().eq('id', id)
    if (error) throw error
    return { data: null, error: null }
  } catch (e) { return fail(e) }
}

// ── Chi tiêu: sửa ─────────────────────────────────────────────────────────────
export async function updateExpense(id: string, dto: Partial<Pick<Expense, 'amount' | 'note' | 'category' | 'spent_at' | 'task_id' | 'vendor_id'>>): Promise<ApiResult<Expense>> {
  try {
    const { data, error } = await sb().from('expenses').update(dto).eq('id', id).select().single()
    if (error) throw error
    return { data: data as Expense, error: null }
  } catch (e) { return fail(e) }
}

// ── Thiệp online gắn với dự án ────────────────────────────────────────────────
export interface ProjectInvitation { id: string; title: string; slug: string; is_published: boolean; view_count: number; rsvps: { attending: string; guest_count: number }[] }
export async function getProjectInvitations(projectId: string): Promise<ApiResult<ProjectInvitation[]>> {
  try {
    const { data, error } = await sb().from('invitations').select('id,title,slug,is_published,view_count,rsvps(attending,guest_count)').eq('project_id', projectId)
    if (error) { if (missing(error)) return { data: [], error: null }; throw error }
    return { data: data as ProjectInvitation[], error: null }
  } catch (e) { return fail(e) }
}

// ── Lịch trình mẫu ngày cưới ─────────────────────────────────────────────────
export const SCHEDULE_TEMPLATE: { start: string; end?: string; title: string; location?: string; owner?: string }[] = [
  { start: '05:30', end: '07:30', title: 'Trang điểm, làm tóc cô dâu', location: 'Nhà gái', owner: 'Chuyên viên trang điểm' },
  { start: '07:30', title: 'Chụp ảnh chuẩn bị (getting ready)', location: 'Nhà gái', owner: 'Nhiếp ảnh' },
  { start: '08:00', title: 'Nhà trai đến, trao lễ vật', location: 'Nhà gái', owner: 'Đại diện nhà trai' },
  { start: '08:30', end: '09:15', title: 'Lễ gia tiên nhà gái, xin dâu', location: 'Nhà gái', owner: 'Đại diện hai họ' },
  { start: '09:30', title: 'Rước dâu về nhà trai', owner: 'Xe hoa' },
  { start: '10:00', end: '10:30', title: 'Lễ gia tiên nhà trai', location: 'Nhà trai' },
  { start: '10:30', title: 'Đón khách tại nhà hàng, chụp ảnh backdrop', location: 'Nhà hàng', owner: 'Cô dâu chú rể' },
  { start: '11:00', end: '11:30', title: 'Làm lễ trên sân khấu, phát biểu hai họ', location: 'Nhà hàng', owner: 'MC' },
  { start: '11:30', title: 'Cắt bánh, rót rượu, nâng ly — khai tiệc', location: 'Nhà hàng', owner: 'MC' },
  { start: '12:00', end: '13:00', title: 'Chào bàn, cảm ơn khách', location: 'Nhà hàng' },
  { start: '13:30', title: 'Tiễn khách, chụp ảnh gia đình', location: 'Nhà hàng' },
  { start: '14:00', title: 'Thanh toán, kiểm kê quà mừng', owner: 'Người nhà' },
]
