'use client'
import { useEffect, useRef, useState, FormEvent } from 'react'
import type { Wish, Side } from '@/types'
import { Reveal, SectionTitle } from './effects'
import type { ViewCtx } from './sections'
import { submitRsvp, submitWish, getPublicWishes } from '@/lib/api/invitations'
import { sb } from '@/lib/supabase/client'
import { fmtDay } from '@/lib/invitation/datetime'

// ── Phong bì mở thiệp ─────────────────────────────────────────────────────────
export function Envelope({ ctx, onOpen }: { ctx: ViewCtx; onOpen: () => void }) {
  const { c, guest, preview, ornament } = ctx
  const [open, setOpen] = useState(false)
  const [gone, setGone] = useState(false)
  function doOpen() {
    setOpen(true); onOpen()
    setTimeout(() => setGone(true), 2200)
  }
  if (gone) return null
  const isSongHy = ornament === 'songhy'
  return (
    <div className={`inv-env-wrap ${open ? 'is-open' : ''} fixed inset-0 z-[80] flex flex-col items-center justify-center p-6`}
      style={{ background: 'radial-gradient(circle at 50% 40%, color-mix(in srgb, var(--a) 60%, var(--bg)), var(--bg))' }}>
      <p className="inv-eyebrow inv-p mb-3">Wedding invitation</p>
      {guest
        ? <p className="mb-8 text-center">Kính gửi<br/><span className="inv-h text-4xl inv-p">{[guest.salutation, guest.name].filter(Boolean).join(' ')}</span></p>
        : <p className="inv-h text-4xl sm:text-5xl inv-p mb-8 text-center">{c.groom.name || 'Chú rể'} &amp; {c.bride.name || 'Cô dâu'}</p>}

      <div className={`inv-env relative w-72 sm:w-80 h-48 sm:h-52 ${open ? 'is-open' : ''}`} style={{ perspective: 1000 }}>
        {/* thân phong bì */}
        <div className="absolute inset-0 shadow-2xl" style={{ background: 'var(--p)', borderRadius: 8 }}/>
        {/* lá thư */}
        <div className="inv-env-letter absolute left-4 right-4 top-3 bottom-3 bg-white flex flex-col items-center justify-center text-center p-3" style={{ borderRadius: 6, color: '#333' }}>
          <p className="text-[10px] tracking-[.3em] uppercase opacity-60">Save the date</p>
          <p className="inv-h text-3xl" style={{ color: 'var(--p)' }}>{c.groom.name} &amp; {c.bride.name}</p>
        </div>
        {/* nếp gấp hai bên + dưới */}
        <div className="absolute inset-0 pointer-events-none z-[2]" style={{ borderRadius: 8, clipPath: 'polygon(0 0, 50% 55%, 0 100%)', background: 'color-mix(in srgb, var(--p) 88%, black)' }}/>
        <div className="absolute inset-0 pointer-events-none z-[2]" style={{ borderRadius: 8, clipPath: 'polygon(100% 0, 50% 55%, 100% 100%)', background: 'color-mix(in srgb, var(--p) 88%, black)' }}/>
        <div className="absolute inset-0 pointer-events-none z-[3]" style={{ borderRadius: 8, clipPath: 'polygon(0 100%, 50% 48%, 100% 100%)', background: 'color-mix(in srgb, var(--p) 94%, white)' }}/>
        {/* nắp */}
        <div className="inv-env-flap absolute left-0 right-0 top-0 h-1/2 z-10" style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)', background: 'color-mix(in srgb, var(--p) 90%, white)', height: '58%' }}/>
        {/* con dấu */}
        {!open && (
          <button onClick={doOpen} aria-label="Mở thiệp"
            className="inv-seal absolute left-1/2 top-[52%] -translate-x-1/2 -translate-y-1/2 z-20 w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold shadow-xl"
            style={{ background: 'radial-gradient(circle at 35% 35%, color-mix(in srgb, var(--a) 40%, #c9302c), #8b1a1a)', color: '#fbe8c8', border: '3px solid rgba(255,255,255,.25)' }}>
            {isSongHy ? '囍' : '♥'}
          </button>
        )}
      </div>
      {!open && <button onClick={doOpen} className="inv-btn mt-10 animate-pulse-glow">Mở thiệp mời</button>}
      <p className="mt-4 text-xs inv-muted">Bật âm thanh để trải nghiệm trọn vẹn 🎵</p>
    </div>
  )
}

// ── Nhạc nền ──────────────────────────────────────────────────────────────────
export function MusicButton({ src, play, preview }: { src: string; play: boolean; preview: boolean }) {
  const ref = useRef<HTMLAudioElement>(null)
  const [on, setOn] = useState(false)
  useEffect(() => {
    if (!play || !ref.current) return
    ref.current.volume = 0.6
    ref.current.play().then(() => setOn(true)).catch(() => setOn(false))
  }, [play])
  const toggle = () => {
    const a = ref.current; if (!a) return
    if (a.paused) a.play().then(() => setOn(true)).catch(() => {})
    else { a.pause(); setOn(false) }
  }
  return (
    <>
      <audio ref={ref} src={src} loop preload="none"/>
      <button onClick={toggle} aria-label={on ? 'Tắt nhạc' : 'Bật nhạc'}
        className={`fixed bottom-4 left-4 z-[60] w-11 h-11 rounded-full flex items-center justify-center shadow-lg`}
        style={{ background: 'var(--p)', color: 'var(--bg)' }}>
        {on ? <span className="inv-bars flex items-end h-3"><span/><span/><span/></span> : <span className="text-lg">♪</span>}
        {on && <span className="absolute inset-0 rounded-full inv-spin" style={{ border: '2px dashed color-mix(in srgb, var(--bg) 60%, transparent)' }}/>}
      </button>
    </>
  )
}

// ── Xác nhận tham dự ──────────────────────────────────────────────────────────
export function Rsvp({ ctx, title }: { ctx: ViewCtx; title: string }) {
  const { inv, script, ornament, guest, guestCode, preview, demo, notify } = ctx
  const storageKey = `rsvp:${inv.id}:${guestCode ?? ''}`
  const [form, setForm] = useState({
    name: guest ? [guest.salutation, guest.name].filter(Boolean).join(' ') : '', phone: '',
    attending: 'yes' as 'yes' | 'no' | 'maybe', guest_count: guest?.invited_count ?? 1,
    side: (guest?.side && guest.side !== 'both' ? guest.side : '') as Side | '', message: '',
  })
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState<string | null>(null)
  useEffect(() => { try { setDone(localStorage.getItem(storageKey)) } catch {} }, [storageKey])

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    if (preview) { notify('Đây là bản xem trước — phản hồi không được lưu'); return }
    setSending(true)
    if (!demo) {
      const { error } = await submitRsvp({ invitation_id: inv.id, ...form, side: form.side || undefined, guest_code: guestCode })
      if (error) { setSending(false); notify('Không gửi được: ' + error); return }
    }
    setSending(false)
    try { localStorage.setItem(storageKey, form.attending) } catch {}
    setDone(form.attending)
  }

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))
  return (
    <section className="inv-section" id="rsvp">
      <SectionTitle title={title} ornament={ornament} script={script} eyebrow="R.S.V.P"/>
      <Reveal className="max-w-lg mx-auto">
        {done ? (
          <div className="inv-card p-8 text-center">
            <div className="text-5xl mb-3">{done === 'no' ? '💐' : '🥂'}</div>
            <p className="inv-h text-4xl inv-p mb-2">Cảm ơn bạn!</p>
            <p className="inv-muted">{done === 'yes' ? 'Chúng mình rất mong được gặp bạn trong ngày vui.' : done === 'maybe' ? 'Hy vọng bạn sẽ sắp xếp được thời gian nhé!' : 'Tiếc quá! Cảm ơn lời chúc phúc của bạn.'}</p>
            <button onClick={() => { try { localStorage.removeItem(storageKey) } catch {}; setDone(null) }} className="text-xs underline mt-5 inv-muted">Thay đổi phản hồi</button>
          </div>
        ) : (
          <form onSubmit={submit} className="inv-card p-6 sm:p-8 space-y-4">
            <p className="text-center text-sm inv-muted">Vui lòng xác nhận để gia đình chuẩn bị đón tiếp chu đáo nhất</p>
            <input className="inv-input" placeholder="Họ và tên *" value={form.name} onChange={e => set('name', e.target.value)} required maxLength={120}/>
            <input className="inv-input" placeholder="Số điện thoại" value={form.phone} onChange={e => set('phone', e.target.value)} maxLength={20} inputMode="tel"/>
            <div className="grid grid-cols-3 gap-2">
              {([['yes','Sẽ đến 🎉'],['maybe','Chưa chắc'],['no','Không thể']] as const).map(([v, l]) => (
                <button type="button" key={v} data-on={form.attending === v} onClick={() => set('attending', v)} className="inv-chip">{l}</button>
              ))}
            </div>
            {form.attending !== 'no' && (
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm">Số người tham dự</span>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => set('guest_count', Math.max(1, form.guest_count - 1))} className="inv-chip !px-3">−</button>
                  <span className="w-6 text-center font-semibold">{form.guest_count}</span>
                  <button type="button" onClick={() => set('guest_count', Math.min(20, form.guest_count + 1))} className="inv-chip !px-3">+</button>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              {([['groom','Khách nhà trai'],['bride','Khách nhà gái']] as const).map(([v, l]) => (
                <button type="button" key={v} data-on={form.side === v} onClick={() => set('side', form.side === v ? '' : v)} className="inv-chip">{l}</button>
              ))}
            </div>
            <textarea className="inv-input resize-none" rows={3} placeholder="Lời nhắn cho cô dâu chú rể (tùy chọn)" value={form.message} onChange={e => set('message', e.target.value)} maxLength={1000}/>
            <button disabled={sending} className="inv-btn w-full">{sending ? 'Đang gửi…' : 'Gửi xác nhận'}</button>
          </form>
        )}
      </Reveal>
    </section>
  )
}

// ── Sổ lưu bút ────────────────────────────────────────────────────────────────
const SUGGESTIONS = ['Chúc hai bạn trăm năm hạnh phúc! 💕', 'Chúc mừng hạnh phúc! Mãi yêu thương nhau nhé 🥰', 'Chúc hai bạn sớm có tin vui 👶', 'Bách niên giai lão, sớm sinh quý tử 🎊']

export function Wishes({ ctx, title, initial }: { ctx: ViewCtx; title: string; initial: Wish[] }) {
  const { inv, script, ornament, preview, demo, guest, notify } = ctx
  const [wishes, setWishes] = useState<Wish[]>(initial)
  const [name, setName] = useState(guest?.name ?? '')
  const [msg, setMsg] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => { setWishes(initial) }, [initial])
  useEffect(() => {
    if (preview || demo) return
    getPublicWishes(inv.id).then(r => { if (r.data) setWishes(r.data) })
    const client = sb()
    const ch = client.channel(`wishes:${inv.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'wishes', filter: `invitation_id=eq.${inv.id}` },
        (p: any) => setWishes(w => w.some(x => x.id === p.new.id) ? w : [p.new as Wish, ...w]))
      .subscribe()
    return () => { client.removeChannel(ch) }
  }, [inv.id, preview, demo])

  async function send(e: FormEvent) {
    e.preventDefault()
    if (!name.trim() || !msg.trim()) return
    if (preview) { notify('Đây là bản xem trước — lời chúc không được lưu'); return }
    setSending(true)
    let w: Wish = { id: String(Date.now()), invitation_id: inv.id, name, message: msg, is_hidden: false, created_at: new Date().toISOString() }
    if (!demo) {
      const { data, error } = await submitWish(inv.id, name, msg)
      if (error || !data) { setSending(false); notify('Không gửi được: ' + error); return }
      w = data
    }
    setWishes(ws => ws.some(x => x.id === w.id) ? ws : [w, ...ws])
    setMsg(''); setSending(false); notify('Cảm ơn lời chúc của bạn 💕')
  }

  return (
    <section className="inv-section">
      <SectionTitle title={title} ornament={ornament} script={script} eyebrow="Guestbook"/>
      <div className="max-w-2xl mx-auto grid gap-6">
        <Reveal>
          <form onSubmit={send} className="inv-card p-6 space-y-3">
            <input className="inv-input" placeholder="Tên của bạn" value={name} onChange={e => setName(e.target.value)} maxLength={120} required/>
            <textarea className="inv-input resize-none" rows={3} placeholder="Viết lời chúc…" value={msg} onChange={e => setMsg(e.target.value)} maxLength={1000} required/>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTIONS.map(s => <button type="button" key={s} onClick={() => setMsg(s)} className="inv-chip !py-1 !px-3 !text-xs">{s}</button>)}
            </div>
            <button disabled={sending} className="inv-btn w-full">{sending ? 'Đang gửi…' : 'Gửi lời chúc 💌'}</button>
          </form>
        </Reveal>
        <div className="max-h-[480px] overflow-y-auto no-scrollbar space-y-3 pr-1">
          {wishes.length === 0 && <p className="text-center text-sm inv-muted">Hãy là người đầu tiên gửi lời chúc!</p>}
          {wishes.map(w => (
            <div key={w.id} className="inv-card p-4 flex gap-3 animate-fadeUp">
              <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center font-semibold" style={{ background: 'var(--p)', color: 'var(--bg)' }}>
                {w.name.trim()[0]?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm">{w.name} <span className="font-normal text-xs inv-muted">· {fmtDay(w.created_at)}</span></p>
                <p className="text-sm whitespace-pre-line break-words">{w.message}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Thanh chia sẻ nổi ─────────────────────────────────────────────────────────
export function ShareDock({ ctx }: { ctx: ViewCtx }) {
  const { inv, preview, notify, c } = ctx
  const share = async () => {
    const url = window.location.href.split('?')[0]
    const data = { title: inv.title, text: `Thiệp cưới ${c.groom.name} & ${c.bride.name}`, url }
    try {
      if (navigator.share) await navigator.share(data)
      else { await navigator.clipboard.writeText(url); notify('Đã sao chép liên kết thiệp') }
    } catch {}
  }
  const jump = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  // Chỉ hiện sau khi cuộn qua trang bìa để không che nội dung
  const [show, setShow] = useState(false)
  useEffect(() => {
    const on = () => setShow(window.scrollY > window.innerHeight * 0.6)
    on(); window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])
  return (
    <div className={`fixed bottom-4 right-4 z-[60] flex flex-col gap-2 transition-all duration-300 ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
      <button onClick={() => jump('rsvp')} aria-label="Xác nhận tham dự" className="w-11 h-11 rounded-full shadow-lg flex items-center justify-center text-base" style={{ background: 'var(--bg)', color: 'var(--p)', border: '1.5px solid var(--p)' }}>✉️</button>
      <button onClick={share} aria-label="Chia sẻ" className="w-11 h-11 rounded-full shadow-lg flex items-center justify-center text-lg" style={{ background: 'var(--bg)', color: 'var(--p)', border: '1.5px solid var(--p)' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg>
      </button>
    </div>
  )
}
