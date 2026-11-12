import { sb } from '@/lib/supabase/client'
import type { Task, Expense, Rsvp, Wish, ApiResult, TaskPriority } from '@/types'

export type TaskWithProject = Task & { projects: { name: string } | null }
export type ActivityItem =
  | { kind: 'rsvp'; id: string; at: string; invitation: { title: string; id: string }; data: Rsvp }
  | { kind: 'wish'; id: string; at: string; invitation: { title: string; id: string }; data: Wish }

export interface DashboardData {
  tasks: TaskWithProject[]
  expenses: Pick<Expense, 'amount' | 'category' | 'project_id' | 'spent_at'>[]
  activity: ActivityItem[]
  invitationStats: { count: number; published: number; views: number; rsvps: number; attending: number; wishes: number }
}

/** Dữ liệu tổng hợp cho trang tổng quan — chỉ trong phạm vi dự án/thiệp của người dùng */
export async function getDashboardData(projectIds: string[]): Promise<ApiResult<DashboardData>> {
  try {
    const { data: { user } } = await sb().auth.getUser()
    if (!user) return { data: null, error: 'Chưa đăng nhập' }
    const none = Promise.resolve({ data: [] as any[], error: null })
    const [t, e, inv] = await Promise.all([
      projectIds.length
        ? sb().from('tasks').select('*, projects(name)').in('project_id', projectIds).neq('status', 'done').order('deadline', { ascending: true, nullsFirst: false }).limit(200)
        : none,
      projectIds.length ? sb().from('expenses').select('amount,category,project_id,spent_at').in('project_id', projectIds) : none,
      sb().from('invitations').select('id,title,is_published,view_count').eq('user_id', user.id),
    ])
    const invs = (inv.data ?? []) as { id: string; title: string; is_published: boolean; view_count: number }[]
    const ids = invs.map(i => i.id)
    const byId = new Map(invs.map(i => [i.id, { id: i.id, title: i.title }]))
    const [r, w] = ids.length
      ? await Promise.all([
          sb().from('rsvps').select('*').in('invitation_id', ids).order('created_at', { ascending: false }).limit(300),
          sb().from('wishes').select('*').in('invitation_id', ids).order('created_at', { ascending: false }).limit(50),
        ])
      : [{ data: [] }, { data: [] }]
    const rsvps = (r.data ?? []) as Rsvp[]
    const wishes = (w.data ?? []) as Wish[]
    const activity: ActivityItem[] = [
      ...rsvps.slice(0, 15).map(x => ({ kind: 'rsvp' as const, id: x.id, at: x.created_at, invitation: byId.get(x.invitation_id)!, data: x })),
      ...wishes.slice(0, 15).map(x => ({ kind: 'wish' as const, id: x.id, at: x.created_at, invitation: byId.get(x.invitation_id)!, data: x })),
    ].filter(a => a.invitation).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 12)
    return {
      data: {
        tasks: (t.data ?? []) as TaskWithProject[],
        expenses: (e.data ?? []) as DashboardData['expenses'],
        activity,
        invitationStats: {
          count: invs.length, published: invs.filter(i => i.is_published).length,
          views: invs.reduce((s, i) => s + (i.view_count ?? 0), 0),
          rsvps: rsvps.length, attending: rsvps.filter(x => x.attending === 'yes').reduce((s, x) => s + x.guest_count, 0),
          wishes: wishes.length,
        },
      },
      error: null,
    }
  } catch (e: any) { return { data: null, error: e?.message ?? String(e) } }
}

// ── Danh sách việc chuẩn bị cưới mẫu (hạn tính theo số ngày trước ngày cưới) ──
export const WEDDING_CHECKLIST: { title: string; days: number; priority: TaskPriority; tags?: string[]; description?: string }[] = [
  { title: 'Thống nhất ngân sách & quy mô đám cưới', days: -180, priority: 'high', tags: ['Bắt buộc'] },
  { title: 'Xem ngày cưới, ngày ăn hỏi', days: -180, priority: 'high', tags: ['Bắt buộc'] },
  { title: 'Lên danh sách khách mời hai bên', days: -150, priority: 'medium' },
  { title: 'Chọn & đặt cọc nhà hàng tiệc cưới', days: -150, priority: 'high', tags: ['Bắt buộc', 'Cần thanh toán'] },
  { title: 'Chụp ảnh cưới / pre-wedding', days: -120, priority: 'medium' },
  { title: 'Chọn studio váy cưới, áo dài, vest', days: -120, priority: 'medium' },
  { title: 'Đặt trang trí, hoa cưới, cổng hoa', days: -90, priority: 'medium' },
  { title: 'Đặt MC, ban nhạc, âm thanh ánh sáng', days: -90, priority: 'medium' },
  { title: 'Đặt quay phim, chụp ảnh ngày cưới', days: -90, priority: 'medium' },
  { title: 'Mua nhẫn cưới', days: -75, priority: 'high', tags: ['Bắt buộc'] },
  { title: 'Đặt mâm quả, tráp ăn hỏi', days: -60, priority: 'medium' },
  { title: 'Thiết kế & gửi thiệp cưới online', days: -45, priority: 'high', description: 'Tạo thiệp ở mục Thiệp cưới, gửi link cá nhân cho từng khách' },
  { title: 'In thiệp giấy (nếu cần)', days: -45, priority: 'low', tags: ['Tùy chọn'] },
  { title: 'Đặt xe hoa, xe đưa đón khách', days: -45, priority: 'medium' },
  { title: 'Đặt lịch trang điểm, làm tóc cô dâu', days: -45, priority: 'medium' },
  { title: 'Tổ chức lễ ăn hỏi', days: -30, priority: 'high' },
  { title: 'Chốt số lượng khách với nhà hàng', days: -14, priority: 'high', tags: ['Bắt buộc'], description: 'Dựa trên số khách xác nhận tham dự trong thiệp online' },
  { title: 'Chuẩn bị phong bì, quà cảm ơn khách', days: -14, priority: 'low' },
  { title: 'Thử váy / vest lần cuối', days: -10, priority: 'medium' },
  { title: 'Sắp xếp sơ đồ bàn tiệc', days: -7, priority: 'medium' },
  { title: 'Trang trí phòng tân hôn', days: -5, priority: 'low' },
  { title: 'Tổng duyệt với MC, nhà hàng, ekip', days: -2, priority: 'high' },
  { title: 'Lễ gia tiên, rước dâu', days: 0, priority: 'high', tags: ['Bắt buộc'] },
  { title: 'Thanh toán các dịch vụ còn lại', days: 3, priority: 'medium', tags: ['Cần thanh toán'] },
]

export async function seedWeddingChecklist(projectId: string, eventDate?: string | null): Promise<ApiResult<number>> {
  try {
    const base = eventDate ? new Date(eventDate + 'T12:00:00') : null
    const today = new Date(); today.setHours(12, 0, 0, 0)
    const rows = WEDDING_CHECKLIST.map((c, i) => {
      let deadline: string | null = null
      if (base) {
        const d = new Date(base.getTime() + c.days * 864e5)
        // Hạn đã qua (dự án tạo sát ngày) → dời về hôm nay để không bị báo quá hạn hàng loạt
        deadline = (d < today && c.days < 0 ? today : d).toISOString().slice(0, 10)
      }
      return { project_id: projectId, title: c.title, description: c.description ?? null, priority: c.priority, tags: c.tags ?? [], deadline, status: 'todo', position: i }
    })
    const { error } = await sb().from('tasks').insert(rows)
    if (error) throw error
    return { data: rows.length, error: null }
  } catch (e: any) { return { data: null, error: e?.message ?? String(e) } }
}
