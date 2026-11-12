import { sb } from '@/lib/supabase/client'
import { normalizeInvitation, defaultContent, defaultTheme, makeSlug } from '@/lib/invitation/templates'
import type { Invitation, InvitationListItem, Guest, Rsvp, Wish, ApiResult, TemplateId, Side } from '@/types'

const fail = (e: any) => {
  const msg: string = e?.message ?? String(e)
  // Chưa chạy migration 002 → hướng dẫn rõ ràng thay vì lỗi kỹ thuật
  if (/schema cache|does not exist|Could not find the (table|function)/i.test(msg))
    return { data: null, error: 'Cơ sở dữ liệu chưa được nâng cấp: hãy chạy file supabase/migrations/002_invitations_roles.sql trong Supabase → SQL Editor, rồi tải lại trang.' }
  return { data: null, error: msg }
}

// ── Thiệp ─────────────────────────────────────────────────────────────────────
export async function getMyInvitations(): Promise<ApiResult<InvitationListItem[]>> {
  try {
    const { data: { user } } = await sb().auth.getUser()
    if (!user) return { data: null, error: 'Chưa đăng nhập' }
    const { data, error } = await sb().from('invitations')
      .select('*, rsvps(count), wishes(count)').eq('user_id', user.id).order('created_at', { ascending: false })
    if (error) throw error
    return {
      data: (data ?? []).map((r: any) => ({
        ...normalizeInvitation(r), rsvp_count: r.rsvps?.[0]?.count ?? 0, wish_count: r.wishes?.[0]?.count ?? 0,
      })),
      error: null,
    }
  } catch (e) { return fail(e) }
}

export async function getInvitation(id: string): Promise<ApiResult<Invitation>> {
  try {
    const { data, error } = await sb().from('invitations').select('*').eq('id', id).single()
    if (error) throw error
    return { data: normalizeInvitation(data as Invitation), error: null }
  } catch (e) { return fail(e) }
}

export async function createInvitation(dto: { groom: string; bride: string; template: TemplateId; event_date?: string; project_id?: string }): Promise<ApiResult<Invitation>> {
  try {
    const { data: { user } } = await sb().auth.getUser()
    if (!user) return { data: null, error: 'Chưa đăng nhập' }
    const content = defaultContent()
    content.groom.name = dto.groom; content.bride.name = dto.bride
    if (dto.event_date) content.events = [{ id: 'e1', name: 'Tiệc Cưới', start: new Date(dto.event_date).toISOString(), venue: '', address: '', map_url: '', note: '' }]
    const { data, error } = await sb().from('invitations').insert({
      user_id: user.id, project_id: dto.project_id || null,
      slug: makeSlug(dto.groom, dto.bride), title: `${dto.groom} & ${dto.bride}`,
      event_date: dto.event_date ? new Date(dto.event_date).toISOString() : null,
      content, theme: defaultTheme(dto.template),
    }).select().single()
    if (error) throw error
    return { data: normalizeInvitation(data as Invitation), error: null }
  } catch (e) { return fail(e) }
}

export async function updateInvitation(id: string, dto: Partial<Pick<Invitation,'slug'|'title'|'event_date'|'content'|'theme'|'is_published'|'project_id'>>): Promise<ApiResult<Invitation>> {
  try {
    const { data, error } = await sb().from('invitations').update(dto).eq('id', id).select().single()
    if (error) {
      if (error.code === '23505') throw new Error('Đường dẫn này đã có người sử dụng, hãy chọn tên khác')
      if (error.code === '23514') throw new Error('Đường dẫn chỉ gồm chữ thường không dấu, số và dấu gạch ngang (3–60 ký tự)')
      throw error
    }
    return { data: normalizeInvitation(data as Invitation), error: null }
  } catch (e) { return fail(e) }
}

export async function duplicateInvitation(inv: Invitation): Promise<ApiResult<Invitation>> {
  try {
    const { data, error } = await sb().from('invitations').insert({
      user_id: inv.user_id, project_id: inv.project_id, slug: makeSlug(inv.content.groom.name, inv.content.bride.name),
      title: `${inv.title} (bản sao)`, event_date: inv.event_date, content: inv.content, theme: inv.theme, is_published: false,
    }).select().single()
    if (error) throw error
    return { data: normalizeInvitation(data as Invitation), error: null }
  } catch (e) { return fail(e) }
}

export async function deleteInvitation(id: string): Promise<ApiResult<null>> {
  try {
    const { error } = await sb().from('invitations').delete().eq('id', id)
    if (error) throw error
    return { data: null, error: null }
  } catch (e) { return fail(e) }
}

export async function uploadMedia(file: File, invitationId: string): Promise<ApiResult<string>> {
  try {
    if (!file.type.startsWith('image/') && !file.type.startsWith('audio/')) throw new Error('Chỉ hỗ trợ tệp ảnh hoặc âm thanh')
    if (file.size > 10 * 1024 * 1024) throw new Error('Tệp tối đa 10MB')
    const { data: { user } } = await sb().auth.getUser()
    if (!user) throw new Error('Chưa đăng nhập')
    const ext = file.name.split('.').pop()?.toLowerCase() || 'bin'
    const path = `${user.id}/${invitationId}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`
    const { error } = await sb().storage.from('invitation-media').upload(path, file, { cacheControl: '31536000', upsert: false })
    if (error) throw error
    return { data: sb().storage.from('invitation-media').getPublicUrl(path).data.publicUrl, error: null }
  } catch (e) { return fail(e) }
}

// ── Khách mời ─────────────────────────────────────────────────────────────────
export async function getGuests(invitationId: string): Promise<ApiResult<Guest[]>> {
  try {
    const { data, error } = await sb().from('guests').select('*').eq('invitation_id', invitationId).order('created_at', { ascending: false })
    if (error) throw error
    return { data: data as Guest[], error: null }
  } catch (e) { return fail(e) }
}

export type GuestInput = { name: string; salutation?: string|null; phone?: string|null; side?: Side; group_name?: string|null; invited_count?: number; note?: string|null }
export async function addGuests(invitationId: string, rows: GuestInput[]): Promise<ApiResult<Guest[]>> {
  try {
    const { data, error } = await sb().from('guests').insert(rows.map(r => ({ ...r, invitation_id: invitationId }))).select()
    if (error) throw error
    return { data: data as Guest[], error: null }
  } catch (e) { return fail(e) }
}

export async function updateGuest(id: string, dto: Partial<GuestInput & { is_sent: boolean }>): Promise<ApiResult<Guest>> {
  try {
    const { data, error } = await sb().from('guests').update(dto).eq('id', id).select().single()
    if (error) throw error
    return { data: data as Guest, error: null }
  } catch (e) { return fail(e) }
}

export async function deleteGuest(id: string): Promise<ApiResult<null>> {
  try {
    const { error } = await sb().from('guests').delete().eq('id', id)
    if (error) throw error
    return { data: null, error: null }
  } catch (e) { return fail(e) }
}

// ── Phản hồi & lời chúc (phía chủ thiệp) ──────────────────────────────────────
export async function getRsvps(invitationId: string): Promise<ApiResult<Rsvp[]>> {
  try {
    const { data, error } = await sb().from('rsvps').select('*').eq('invitation_id', invitationId).order('created_at', { ascending: false })
    if (error) throw error
    return { data: data as Rsvp[], error: null }
  } catch (e) { return fail(e) }
}
export async function deleteRsvp(id: string): Promise<ApiResult<null>> {
  try {
    const { error } = await sb().from('rsvps').delete().eq('id', id)
    if (error) throw error
    return { data: null, error: null }
  } catch (e) { return fail(e) }
}

export async function getAllWishes(invitationId: string): Promise<ApiResult<Wish[]>> {
  try {
    const { data, error } = await sb().from('wishes').select('*').eq('invitation_id', invitationId).order('created_at', { ascending: false })
    if (error) throw error
    return { data: data as Wish[], error: null }
  } catch (e) { return fail(e) }
}
export async function setWishHidden(id: string, is_hidden: boolean): Promise<ApiResult<null>> {
  try {
    const { error } = await sb().from('wishes').update({ is_hidden }).eq('id', id)
    if (error) throw error
    return { data: null, error: null }
  } catch (e) { return fail(e) }
}
export async function deleteWish(id: string): Promise<ApiResult<null>> {
  try {
    const { error } = await sb().from('wishes').delete().eq('id', id)
    if (error) throw error
    return { data: null, error: null }
  } catch (e) { return fail(e) }
}

// ── Phía khách (không cần đăng nhập) ──────────────────────────────────────────
export async function getPublicWishes(invitationId: string): Promise<ApiResult<Wish[]>> {
  try {
    const { data, error } = await sb().from('wishes').select('*').eq('invitation_id', invitationId)
      .eq('is_hidden', false).order('created_at', { ascending: false }).limit(100)
    if (error) throw error
    return { data: data as Wish[], error: null }
  } catch (e) { return fail(e) }
}

export async function submitRsvp(dto: { invitation_id: string; name: string; attending: 'yes'|'no'|'maybe'; guest_count: number; phone?: string; side?: Side; message?: string; guest_code?: string }): Promise<ApiResult<string>> {
  try {
    const { data, error } = await sb().rpc('submit_rsvp', {
      p_invitation_id: dto.invitation_id, p_name: dto.name, p_attending: dto.attending, p_guest_count: dto.guest_count,
      p_phone: dto.phone || null, p_side: dto.side || null, p_message: dto.message || null, p_guest_code: dto.guest_code || null,
    })
    if (error) throw error
    return { data: data as string, error: null }
  } catch (e) { return fail(e) }
}

export async function submitWish(invitationId: string, name: string, message: string): Promise<ApiResult<Wish>> {
  try {
    const { data, error } = await sb().rpc('submit_wish', { p_invitation_id: invitationId, p_name: name, p_message: message })
    if (error) throw error
    return { data: data as Wish, error: null }
  } catch (e) { return fail(e) }
}
