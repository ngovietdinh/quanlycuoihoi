'use client'
import { useEffect, useMemo, useState, useCallback, FormEvent } from 'react'
import type { Invitation, Guest, Rsvp, Wish, Side } from '@/types'
import { getGuests, addGuests, updateGuest, deleteGuest, getRsvps, deleteRsvp, getAllWishes, setWishHidden, deleteWish, type GuestInput } from '@/lib/api/invitations'
import { sb } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/Toast'
import { Box } from './fields'
import { cn } from '@/lib/utils'

const SALUTATIONS = ['', 'Anh', 'Chị', 'Em', 'Bạn', 'Cô', 'Chú', 'Bác', 'Ông', 'Bà', 'Anh chị', 'Vợ chồng', 'Gia đình']
const SIDE_LABEL: Record<Side, string> = { groom: 'Nhà trai', bride: 'Nhà gái', both: 'Chung' }
const ATT_LABEL = { yes: 'Sẽ đến', maybe: 'Chưa chắc', no: 'Không đến' } as const
const ATT_CLS   = { yes: 'badge-done', maybe: 'badge-in_progress', no: 'badge-overdue' } as const

function downloadCsv(name: string, rows: (string | number | null | undefined)[][]) {
  const csv = rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }))
  a.download = name; a.click(); URL.revokeObjectURL(a.href)
}

/** Nhập nhanh: mỗi dòng "Tên, SĐT, Nhóm, Số người" — tự nhận xưng hô ở đầu tên */
function parseBulk(text: string, side: Side): GuestInput[] {
  return text.split('\n').map(l => l.trim()).filter(Boolean).map(line => {
    const [rawName, phone, group, count] = line.split(/\t|,|\|/).map(s => s?.trim())
    const sal = SALUTATIONS.filter(Boolean).sort((a, b) => b.length - a.length).find(s => rawName.toLowerCase().startsWith(s.toLowerCase() + ' '))
    return {
      name: sal ? rawName.slice(sal.length).trim() : rawName, salutation: sal ?? null, phone: phone || null,
      group_name: group || null, invited_count: Math.max(1, Math.min(50, parseInt(count || '1') || 1)), side,
    }
  }).filter(g => g.name)
}

// ── Khách mời ─────────────────────────────────────────────────────────────────
export function GuestsPanel({ inv }: { inv: Invitation }) {
  const { success, error } = useToast()
  const [guests, setGuests] = useState<Guest[]>([])
  const [rsvps, setRsvps] = useState<Rsvp[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [sideF, setSideF] = useState<'' | Side>('')
  const [mode, setMode] = useState<'one' | 'bulk'>('one')
  const [form, setForm] = useState({ name: '', salutation: '', phone: '', side: 'groom' as Side, group_name: '', invited_count: 1 })
  const [bulk, setBulk] = useState('')
  const [origin, setOrigin] = useState('')

  const load = useCallback(async () => {
    const [g, r] = await Promise.all([getGuests(inv.id), getRsvps(inv.id)])
    if (g.error) error('Không tải được khách mời', g.error)
    setGuests(g.data ?? []); setRsvps(r.data ?? []); setLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inv.id])
  useEffect(() => { load(); setOrigin(window.location.origin) }, [load])

  const rsvpBy = useMemo(() => new Map(rsvps.filter(r => r.guest_id).map(r => [r.guest_id!, r])), [rsvps])
  const link = (g: Guest) => `${origin}/i/${inv.slug}?g=${g.code}`
  const inviteMsg = (g: Guest) => `💌 Kính gửi ${[g.salutation, g.name].filter(Boolean).join(' ')}, trân trọng kính mời đến dự lễ cưới của ${inv.content.groom.name} & ${inv.content.bride.name}. Thiệp mời: ${link(g)}`

  async function add(e: FormEvent) {
    e.preventDefault()
    const rows = mode === 'one'
      ? (form.name.trim() ? [{ ...form, salutation: form.salutation || null, phone: form.phone || null, group_name: form.group_name || null }] : [])
      : parseBulk(bulk, form.side)
    if (!rows.length) return
    const r = await addGuests(inv.id, rows)
    if (r.error) return error('Không thêm được', r.error)
    success(`Đã thêm ${rows.length} khách mời`)
    setForm(f => ({ ...f, name: '', phone: '', invited_count: 1 })); setBulk(''); load()
  }
  async function toggleSent(g: Guest) {
    setGuests(gs => gs.map(x => x.id === g.id ? { ...x, is_sent: !x.is_sent } : x))
    await updateGuest(g.id, { is_sent: !g.is_sent })
  }
  async function copyLink(g: Guest) {
    await navigator.clipboard.writeText(inviteMsg(g))
    success('Đã sao chép lời mời cá nhân', 'Dán vào Zalo / Messenger để gửi')
    if (!g.is_sent) toggleSent(g)
  }
  async function remove(g: Guest) {
    if (!confirm(`Xóa khách mời "${g.name}"?`)) return
    const r = await deleteGuest(g.id)
    if (r.error) return error('Không xóa được', r.error)
    setGuests(gs => gs.filter(x => x.id !== g.id))
  }

  const list = guests.filter(g => (!sideF || g.side === sideF) && (!q || `${g.name} ${g.phone ?? ''} ${g.group_name ?? ''}`.toLowerCase().includes(q.toLowerCase())))
  const stats = {
    total: guests.length, people: guests.reduce((s, g) => s + g.invited_count, 0),
    sent: guests.filter(g => g.is_sent).length, replied: guests.filter(g => rsvpBy.has(g.id)).length,
  }
  const groups = Array.from(new Set(guests.map(g => g.group_name).filter(Boolean))) as string[]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-2">
        {[['Khách', stats.total], ['Số người', stats.people], ['Đã gửi', stats.sent], ['Đã phản hồi', stats.replied]].map(([l, v]) => (
          <div key={l} className="card p-3 text-center"><p className="text-[10px] text-ink-400">{l}</p><p className="font-bold text-lg text-ink-900 tabular">{v}</p></div>
        ))}
      </div>

      <Box title="➕ Thêm khách mời" desc="Mỗi khách có đường dẫn riêng hiển thị tên trên thiệp"
        right={<div className="flex bg-ink-100 rounded-lg p-0.5 text-xs">{(['one', 'bulk'] as const).map(m => (
          <button key={m} onClick={() => setMode(m)} className={cn('px-2.5 py-1 rounded-md', mode === m ? 'bg-white shadow font-semibold' : 'text-ink-500')}>{m === 'one' ? 'Từng người' : 'Nhập nhanh'}</button>
        ))}</div>}>
        <form onSubmit={add} className="space-y-3">
          {mode === 'one' ? (
            <>
              <div className="grid grid-cols-[110px_1fr] gap-2">
                <select className="input" value={form.salutation} onChange={e => setForm(f => ({ ...f, salutation: e.target.value }))}>
                  {SALUTATIONS.map(s => <option key={s} value={s}>{s || 'Xưng hô'}</option>)}
                </select>
                <input className="input" placeholder="Tên khách mời *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}/>
              </div>
              <div className="grid grid-cols-[1fr_1fr_90px] gap-2">
                <input className="input" placeholder="Số điện thoại" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}/>
                <input className="input" placeholder="Nhóm (VD: Bạn ĐH)" list="guest-groups" value={form.group_name} onChange={e => setForm(f => ({ ...f, group_name: e.target.value }))}/>
                <input className="input" type="number" min={1} max={50} title="Số người" value={form.invited_count} onChange={e => setForm(f => ({ ...f, invited_count: +e.target.value || 1 }))}/>
              </div>
              <datalist id="guest-groups">{groups.map(g => <option key={g} value={g}/>)}</datalist>
            </>
          ) : (
            <textarea className="input font-mono text-xs" rows={6} value={bulk} onChange={e => setBulk(e.target.value)}
              placeholder={'Mỗi dòng một khách: Tên, SĐT, Nhóm, Số người\nAnh Nguyễn Văn Nam, 0901234567, Bạn ĐH, 2\nChị Lan, , Đồng nghiệp\nGia đình chú Tư, 0912345678, Họ hàng, 4'}/>
          )}
          <div className="flex items-center gap-2">
            <select className="input !w-auto" value={form.side} onChange={e => setForm(f => ({ ...f, side: e.target.value as Side }))}>
              <option value="groom">Khách nhà trai</option><option value="bride">Khách nhà gái</option><option value="both">Khách chung</option>
            </select>
            <button className="btn btn-primary btn-sm ml-auto">{mode === 'one' ? '＋ Thêm' : `＋ Thêm ${parseBulk(bulk, form.side).length} khách`}</button>
          </div>
        </form>
      </Box>

      <div className="card overflow-hidden">
        <div className="p-3 border-b border-ink-100 flex flex-wrap gap-2 items-center">
          <input className="input !py-2 !w-auto flex-1 min-w-[140px] text-sm" placeholder="🔍 Tìm khách…" value={q} onChange={e => setQ(e.target.value)}/>
          <select className="input !py-2 !w-auto text-sm" value={sideF} onChange={e => setSideF(e.target.value as any)}>
            <option value="">Tất cả</option><option value="groom">Nhà trai</option><option value="bride">Nhà gái</option><option value="both">Chung</option>
          </select>
          <button onClick={() => downloadCsv(`khach-moi-${inv.slug}.csv`, [
            ['Xưng hô', 'Tên', 'SĐT', 'Bên', 'Nhóm', 'Số người mời', 'Đã gửi', 'Phản hồi', 'Số người đến', 'Link thiệp'],
            ...guests.map(g => { const r = rsvpBy.get(g.id); return [g.salutation, g.name, g.phone, SIDE_LABEL[g.side], g.group_name, g.invited_count, g.is_sent ? 'Có' : '', r ? ATT_LABEL[r.attending] : '', r?.guest_count, link(g)] }),
          ])} className="btn btn-secondary btn-sm">⬇ Excel</button>
        </div>
        {loading ? <div className="p-6 skeleton h-24 m-3"/> : list.length === 0 ? (
          <p className="text-center text-sm text-ink-400 py-10">Chưa có khách mời nào</p>
        ) : (
          <div className="divide-y divide-ink-50 max-h-[560px] overflow-y-auto">
            {list.map(g => {
              const r = rsvpBy.get(g.id)
              return (
                <div key={g.id} className="px-3 py-2.5 flex items-center gap-3 hover:bg-ink-50/50">
                  <button onClick={() => toggleSent(g)} title={g.is_sent ? 'Đã gửi' : 'Chưa gửi'}
                    className={cn('w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center text-[10px]', g.is_sent ? 'bg-jade-500 border-jade-500 text-white' : 'border-ink-300')}>{g.is_sent && '✓'}</button>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink-900 truncate">{[g.salutation, g.name].filter(Boolean).join(' ')} {g.invited_count > 1 && <span className="text-xs text-ink-400 font-normal">×{g.invited_count}</span>}</p>
                    <p className="text-[11px] text-ink-400 truncate">{SIDE_LABEL[g.side]}{g.group_name && ` · ${g.group_name}`}{g.phone && ` · ${g.phone}`}</p>
                  </div>
                  {r && <span className={cn('badge text-[10px]', ATT_CLS[r.attending])}>{ATT_LABEL[r.attending]}{r.attending !== 'no' && ` · ${r.guest_count}`}</span>}
                  <div className="flex gap-0.5 flex-shrink-0">
                    <button onClick={() => copyLink(g)} className="btn btn-ghost btn-xs btn-icon" title="Sao chép lời mời cá nhân">🔗</button>
                    {g.phone && <a href={`sms:${g.phone}?body=${encodeURIComponent(inviteMsg(g))}`} className="btn btn-ghost btn-xs btn-icon" title="Gửi SMS">💬</a>}
                    <a href={link(g)} target="_blank" rel="noreferrer" className="btn btn-ghost btn-xs btn-icon" title="Xem thiệp của khách">↗</a>
                    <button onClick={() => remove(g)} className="btn btn-ghost btn-xs btn-icon hover:text-red-500" title="Xóa">✕</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Phản hồi & lời chúc ───────────────────────────────────────────────────────
export function ResponsesPanel({ inv }: { inv: Invitation }) {
  const { success, error } = useToast()
  const [rsvps, setRsvps] = useState<Rsvp[]>([])
  const [wishes, setWishes] = useState<Wish[]>([])
  const [view, setView] = useState<'rsvp' | 'wish'>('rsvp')
  const [filter, setFilter] = useState<'' | Rsvp['attending']>('')

  const load = useCallback(async () => {
    const [r, w] = await Promise.all([getRsvps(inv.id), getAllWishes(inv.id)])
    setRsvps(r.data ?? []); setWishes(w.data ?? [])
  }, [inv.id])
  useEffect(() => {
    load()
    // Cập nhật tức thì khi khách gửi phản hồi
    const c = sb()
    const ch = c.channel(`owner:${inv.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rsvps', filter: `invitation_id=eq.${inv.id}` }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wishes', filter: `invitation_id=eq.${inv.id}` }, () => load())
      .subscribe()
    return () => { c.removeChannel(ch) }
  }, [inv.id, load])

  const yes = rsvps.filter(r => r.attending === 'yes')
  const stats = [
    { l: 'Sẽ đến', v: yes.length, sub: `${yes.reduce((s, r) => s + r.guest_count, 0)} người`, cls: 'text-jade-600' },
    { l: 'Chưa chắc', v: rsvps.filter(r => r.attending === 'maybe').length, sub: `${rsvps.filter(r => r.attending === 'maybe').reduce((s, r) => s + r.guest_count, 0)} người`, cls: 'text-gold-600' },
    { l: 'Không đến', v: rsvps.filter(r => r.attending === 'no').length, sub: 'phản hồi', cls: 'text-red-500' },
    { l: 'Nhà trai / gái', v: `${yes.filter(r => r.side === 'groom').reduce((s, r) => s + r.guest_count, 0)}/${yes.filter(r => r.side === 'bride').reduce((s, r) => s + r.guest_count, 0)}`, sub: 'người sẽ đến', cls: 'text-sakura-600' },
  ]
  const list = rsvps.filter(r => !filter || r.attending === filter)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {stats.map(s => (
          <div key={s.l} className="card p-3 text-center">
            <p className="text-[10px] text-ink-400">{s.l}</p><p className={cn('font-bold text-xl tabular', s.cls)}>{s.v}</p><p className="text-[10px] text-ink-400">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="flex bg-ink-100 rounded-xl p-1 text-sm">
        <button onClick={() => setView('rsvp')} className={cn('flex-1 py-1.5 rounded-lg', view === 'rsvp' ? 'bg-white shadow font-semibold' : 'text-ink-500')}>✉️ Xác nhận ({rsvps.length})</button>
        <button onClick={() => setView('wish')} className={cn('flex-1 py-1.5 rounded-lg', view === 'wish' ? 'bg-white shadow font-semibold' : 'text-ink-500')}>💌 Lời chúc ({wishes.length})</button>
      </div>

      {view === 'rsvp' ? (
        <div className="card overflow-hidden">
          <div className="p-3 border-b border-ink-100 flex gap-2 items-center">
            <select className="input !py-2 !w-auto text-sm" value={filter} onChange={e => setFilter(e.target.value as any)}>
              <option value="">Tất cả phản hồi</option><option value="yes">Sẽ đến</option><option value="maybe">Chưa chắc</option><option value="no">Không đến</option>
            </select>
            <span className="text-xs text-ink-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-jade-500 animate-pulse"/>Realtime</span>
            <button onClick={() => downloadCsv(`phan-hoi-${inv.slug}.csv`, [
              ['Thời gian', 'Tên', 'SĐT', 'Phản hồi', 'Số người', 'Bên', 'Lời nhắn'],
              ...rsvps.map(r => [new Date(r.created_at).toLocaleString('vi-VN'), r.name, r.phone, ATT_LABEL[r.attending], r.guest_count, r.side ? SIDE_LABEL[r.side] : '', r.message]),
            ])} className="btn btn-secondary btn-sm ml-auto">⬇ Excel</button>
          </div>
          {list.length === 0 ? <p className="text-center text-sm text-ink-400 py-10">Chưa có phản hồi nào</p> : (
            <div className="divide-y divide-ink-50 max-h-[560px] overflow-y-auto">
              {list.map(r => (
                <div key={r.id} className="px-4 py-3 flex gap-3 group">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-ink-900">{r.name}</p>
                      <span className={cn('badge text-[10px]', ATT_CLS[r.attending])}>{ATT_LABEL[r.attending]}{r.attending !== 'no' && ` · ${r.guest_count} người`}</span>
                      {r.side && <span className="tag bg-ink-50 text-ink-500 border-ink-200">{SIDE_LABEL[r.side]}</span>}
                      {r.guest_id && <span className="tag bg-sakura-50 text-sakura-600 border-sakura-200">Khách mời</span>}
                    </div>
                    <p className="text-[11px] text-ink-400">{new Date(r.created_at).toLocaleString('vi-VN')}{r.phone && ` · ${r.phone}`}</p>
                    {r.message && <p className="text-sm text-ink-600 mt-1 italic">“{r.message}”</p>}
                  </div>
                  <button onClick={async () => { if (!confirm('Xóa phản hồi này?')) return; const x = await deleteRsvp(r.id); if (x.error) error('Lỗi', x.error); else { success('Đã xóa'); load() } }}
                    className="btn btn-ghost btn-xs btn-icon opacity-0 group-hover:opacity-100 hover:text-red-500">✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {wishes.length === 0 && <p className="text-center text-sm text-ink-400 py-10 card">Chưa có lời chúc nào</p>}
          {wishes.map(w => (
            <div key={w.id} className={cn('card p-4 flex gap-3', w.is_hidden && 'opacity-50')}>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-ink-900">{w.name} <span className="text-[11px] font-normal text-ink-400">· {new Date(w.created_at).toLocaleString('vi-VN')}</span>{w.is_hidden && <span className="ml-2 tag bg-ink-100 text-ink-500 border-ink-200">Đã ẩn</span>}</p>
                <p className="text-sm text-ink-600 whitespace-pre-line break-words">{w.message}</p>
              </div>
              <div className="flex flex-col gap-1">
                <button onClick={async () => { await setWishHidden(w.id, !w.is_hidden); load() }} className="btn btn-ghost btn-xs" title={w.is_hidden ? 'Hiện' : 'Ẩn'}>{w.is_hidden ? '👁 Hiện' : '🙈 Ẩn'}</button>
                <button onClick={async () => { if (!confirm('Xóa lời chúc này?')) return; await deleteWish(w.id); load() }} className="btn btn-ghost btn-xs hover:text-red-500">✕ Xóa</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
