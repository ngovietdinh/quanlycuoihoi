'use client'
import { useEffect, useState, useCallback } from 'react'
import type { Invitation, InvitationContent, InvitationTheme, GuestGreeting, Side } from '@/types'
import { Reveal, Ornament, SectionTitle } from './effects'
import { fmtDay, fmtTime, fmtLong, lunarText, vnParts, googleCalendarUrl, icsDataUrl, mapEmbedUrl, mapLinkUrl } from '@/lib/invitation/datetime'
import { bankName, vietQrUrl } from '@/lib/invitation/templates'

export interface ViewCtx {
  inv: Invitation
  c: InvitationContent
  t: InvitationTheme
  ornament: string
  script: boolean
  preview: boolean
  demo: boolean
  guest: GuestGreeting | null
  guestCode?: string
  notify: (msg: string) => void
  mainDate: string | null
}

const sideLabel = (s: Side) => (s === 'groom' ? 'Nhà trai' : s === 'bride' ? 'Nhà gái' : '')

// ── Trang bìa ─────────────────────────────────────────────────────────────────
export function Cover({ ctx }: { ctx: ViewCtx }) {
  const { c, t, script, mainDate, guest, ornament } = ctx
  const names = (
    <h1 className={`inv-h ${script ? 'text-6xl sm:text-7xl' : 'is-serif text-5xl sm:text-6xl'}`}>
      <span className="block">{c.groom.name || 'Chú rể'}</span>
      <span className={`block ${script ? 'text-4xl' : 'text-3xl'} my-1 opacity-80`}>&amp;</span>
      <span className="block">{c.bride.name || 'Cô dâu'}</span>
    </h1>
  )
  const dateLine = mainDate && (
    <div className="mt-6 flex items-center justify-center gap-4 text-sm tracking-[0.25em] uppercase">
      <span>{vnParts(mainDate).weekday}</span>
      <span className="text-2xl font-semibold tracking-normal border-x px-4" style={{ borderColor: 'currentColor' }}>{fmtDay(mainDate)}</span>
      <span>{fmtTime(mainDate)}</span>
    </div>
  )
  const greet = guest && (
    <p className="mt-6 text-sm italic opacity-90">Trân trọng kính mời <b className="not-italic">{[guest.salutation, guest.name].filter(Boolean).join(' ')}</b></p>
  )
  const cover = c.cover_url

  if (t.layout === 'overlay' && cover) return (
    <header className="relative min-h-[100svh] flex items-center justify-center text-center overflow-hidden text-white">
      <img src={cover} alt="" className="absolute inset-0 w-full h-full object-cover inv-kenburns"/>
      <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, rgba(0,0,0,${t.overlay / 200}) 0%, rgba(0,0,0,${t.overlay / 100}) 100%)` }}/>
      <div className="relative px-6 py-20 animate-fadeUp">
        <p className="inv-eyebrow mb-5">{c.headline}</p>
        {names}
        {dateLine}
        {greet}
      </div>
      <ScrollHint/>
    </header>
  )

  if (t.layout === 'arch' && cover) return (
    <header className="relative min-h-[100svh] flex flex-col items-center justify-center text-center px-6 py-16">
      <p className="inv-eyebrow inv-p mb-6">{c.headline}</p>
      <div className="relative w-64 sm:w-72 aspect-[3/4] overflow-hidden shadow-2xl" style={{ borderRadius: '999px 999px 12px 12px', border: '6px solid color-mix(in srgb, var(--p) 35%, white)' }}>
        <img src={cover} alt="" className="w-full h-full object-cover inv-kenburns"/>
      </div>
      <div className="mt-8 inv-p">{names}</div>
      <Ornament kind={ornament} className="mt-4"/>
      <div className="inv-p">{dateLine}</div>
      {greet}
      <ScrollHint dark/>
    </header>
  )

  if (t.layout === 'split' && cover) return (
    <header className="min-h-[100svh] grid md:grid-cols-2">
      <div className="relative min-h-[55svh] md:min-h-full overflow-hidden"><img src={cover} alt="" className="absolute inset-0 w-full h-full object-cover inv-kenburns"/></div>
      <div className="flex flex-col items-center justify-center text-center px-6 py-14">
        <p className="inv-eyebrow inv-p mb-5">{c.headline}</p>
        <div className="inv-p">{names}</div>
        <Ornament kind={ornament} className="mt-5"/>
        {dateLine}
        {greet}
      </div>
    </header>
  )

  // minimal (hoặc chưa có ảnh bìa)
  return (
    <header className="relative min-h-[100svh] flex flex-col items-center justify-center text-center px-6 py-20">
      <div className="absolute inset-6 pointer-events-none" style={{ border: '1px solid color-mix(in srgb, var(--p) 40%, transparent)', borderRadius: 'var(--r)' }}/>
      <div className="absolute inset-9 pointer-events-none" style={{ border: '1px solid color-mix(in srgb, var(--p) 20%, transparent)', borderRadius: 'var(--r)' }}/>
      <p className="inv-eyebrow inv-p mb-6">{c.headline}</p>
      <Ornament kind={ornament} className="mb-6"/>
      <div className="inv-p">{names}</div>
      <Ornament kind={ornament} className="mt-6"/>
      {dateLine}
      {mainDate && <p className="mt-3 text-sm italic inv-muted">({lunarText(mainDate)})</p>}
      {greet}
      <ScrollHint dark/>
    </header>
  )
}

function ScrollHint({ dark }: { dark?: boolean }) {
  return (
    <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 inv-scroll-hint text-xs tracking-widest uppercase ${dark ? 'inv-p' : 'text-white/80'}`}>
      <div className="flex flex-col items-center gap-1">Cuộn xuống<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg></div>
    </div>
  )
}

// ── Lời mời + đếm ngược ───────────────────────────────────────────────────────
export function Intro({ ctx }: { ctx: ViewCtx }) {
  const { c, ornament, guest } = ctx
  return (
    <section className="inv-section text-center">
      <Reveal className="max-w-xl mx-auto">
        <Ornament kind={ornament} className="mb-6"/>
        {c.quote && <p className="text-xl sm:text-2xl italic leading-relaxed mb-6">“{c.quote}”</p>}
        {guest && <p className="mb-3 text-lg">Kính gửi <b className="inv-p">{[guest.salutation, guest.name].filter(Boolean).join(' ')}</b>{guest.invited_count > 1 ? ` (${guest.invited_count} người)` : ''}</p>}
        <p className="inv-muted">{c.invite_text}</p>
      </Reveal>
    </section>
  )
}

export function Countdown({ ctx, title }: { ctx: ViewCtx; title: string }) {
  const { mainDate, script, ornament } = ctx
  const calc = useCallback(() => {
    const diff = Math.max(0, new Date(mainDate ?? 0).getTime() - Date.now())
    return { d: Math.floor(diff / 864e5), h: Math.floor(diff / 36e5) % 24, m: Math.floor(diff / 6e4) % 60, s: Math.floor(diff / 1e3) % 60, done: diff === 0 }
  }, [mainDate])
  const [left, setLeft] = useState<ReturnType<typeof calc> | null>(null)
  useEffect(() => { setLeft(calc()); const i = setInterval(() => setLeft(calc()), 1000); return () => clearInterval(i) }, [calc])
  if (!mainDate) return null
  return (
    <section className="inv-section text-center">
      <SectionTitle title={title} ornament={ornament} script={script} eyebrow="Counting down"/>
      <Reveal>
        <p className="mb-2 font-semibold">{fmtLong(mainDate)}</p>
        <p className="text-sm italic inv-muted mb-8">{lunarText(mainDate)}</p>
        {left?.done ? (
          <p className="inv-h text-4xl inv-p">Hôm nay là ngày vui! <span className="inv-heartbeat">💗</span></p>
        ) : (
          <div className="flex justify-center gap-3 sm:gap-5">
            {[['d','Ngày'],['h','Giờ'],['m','Phút'],['s','Giây']].map(([k, l]) => (
              <div key={k} className="inv-card w-[4.5rem] sm:w-24 py-4">
                <div className="text-3xl sm:text-4xl font-semibold tabular-nums inv-p">{left ? String((left as any)[k]).padStart(2, '0') : '--'}</div>
                <div className="text-[11px] uppercase tracking-widest inv-muted mt-1">{l}</div>
              </div>
            ))}
          </div>
        )}
        <CalendarMonth iso={mainDate}/>
      </Reveal>
    </section>
  )
}

/** Lịch tháng có khoanh tròn ngày cưới */
function CalendarMonth({ iso }: { iso: string }) {
  const p = vnParts(iso)
  const first = new Date(p.year, p.month - 1, 1).getDay() // 0 = CN
  const offset = (first + 6) % 7                            // tuần bắt đầu Thứ 2
  const days = new Date(p.year, p.month, 0).getDate()
  const cells = [...Array(offset).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)]
  return (
    <div className="inv-card max-w-xs mx-auto mt-10 p-5">
      <p className="font-semibold mb-3 inv-p">Tháng {p.month} · {p.year}</p>
      <div className="grid grid-cols-7 gap-1 text-xs">
        {['T2','T3','T4','T5','T6','T7','CN'].map(d => <div key={d} className="inv-muted font-semibold py-1">{d}</div>)}
        {cells.map((d, i) => (
          <div key={i} className="aspect-square flex items-center justify-center relative">
            {d === p.day
              ? <span className="absolute inset-0 flex items-center justify-center"><svg viewBox="0 0 24 24" className="w-full h-full inv-heartbeat" style={{ color: 'var(--p)' }}><path fill="currentColor" d="M12 21s-7.5-4.6-10-9.3C.4 8.4 2.3 4 6.4 4c2.3 0 3.8 1.3 5.6 3.3C13.8 5.3 15.3 4 17.6 4c4.1 0 6 4.4 4.4 7.7C19.5 16.4 12 21 12 21Z"/></svg><span className="absolute text-white font-bold text-[11px]">{d}</span></span>
              : d}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Cô dâu chú rể ─────────────────────────────────────────────────────────────
export function Couple({ ctx, title }: { ctx: ViewCtx; title: string }) {
  const { c, script, ornament } = ctx
  const Card = ({ who, role }: { who: typeof c.groom; role: string }) => (
    <Reveal className="text-center">
      <div className="mx-auto w-44 h-44 sm:w-52 sm:h-52 rounded-full p-1.5 mb-5" style={{ background: 'linear-gradient(135deg, var(--p), var(--a))' }}>
        {who.photo
          ? <img src={who.photo} alt={who.name} className="w-full h-full rounded-full object-cover" style={{ border: '4px solid var(--bg)' }}/>
          : <div className="w-full h-full rounded-full flex items-center justify-center text-5xl" style={{ background: 'var(--bg)' }}>{role === 'Chú rể' ? '🤵' : '👰'}</div>}
      </div>
      <p className="inv-eyebrow inv-p">{role}</p>
      <h3 className={`inv-h ${script ? 'text-5xl' : 'is-serif text-3xl'} my-2`}>{who.full_name || who.name}</h3>
      {(who.father || who.mother) && (
        <p className="text-sm inv-muted">{role === 'Chú rể' ? 'Trưởng nam' : 'Trưởng nữ'} của {[who.father, who.mother].filter(Boolean).join(' & ')}</p>
      )}
      {who.bio && <p className="mt-3 text-sm max-w-xs mx-auto">{who.bio}</p>}
    </Reveal>
  )
  return (
    <section className="inv-section">
      <SectionTitle title={title} ornament={ornament} script={script} eyebrow="Bride & Groom"/>
      <div className="max-w-4xl mx-auto grid sm:grid-cols-[1fr_auto_1fr] gap-10 items-center">
        <Card who={c.groom} role="Chú rể"/>
        <div className="text-center"><span className="inv-h text-6xl inv-p inv-heartbeat">&amp;</span></div>
        <Card who={c.bride} role="Cô dâu"/>
      </div>
    </section>
  )
}

// ── Chuyện tình ───────────────────────────────────────────────────────────────
export function Story({ ctx, title }: { ctx: ViewCtx; title: string }) {
  const { c, script, ornament } = ctx
  if (!c.story.length) return null
  return (
    <section className="inv-section">
      <SectionTitle title={title} ornament={ornament} script={script} eyebrow="Our love story"/>
      <div className="max-w-3xl mx-auto relative">
        <div className="absolute left-5 sm:left-1/2 top-0 bottom-0 w-px -translate-x-1/2" style={{ background: 'color-mix(in srgb, var(--p) 35%, transparent)' }}/>
        {c.story.map((s, i) => (
          <Reveal key={s.id} delay={80} className={`relative pl-14 sm:pl-0 mb-12 sm:grid sm:grid-cols-2 sm:gap-12 ${i % 2 ? 'sm:[direction:rtl]' : ''}`}>
            <span className="absolute left-5 sm:left-1/2 top-2 -translate-x-1/2 w-4 h-4 rounded-full ring-4" style={{ background: 'var(--p)', ['--tw-ring-color' as any]: 'var(--bg)' }}/>
            <div className="sm:[direction:ltr] mb-4 sm:mb-0">
              {s.image && <img src={s.image} alt={s.title} loading="lazy" className="w-full aspect-[4/3] object-cover shadow-lg" style={{ borderRadius: 'var(--r)' }}/>}
            </div>
            <div className="sm:[direction:ltr] sm:pt-2">
              {s.date && <p className="text-xs uppercase tracking-widest inv-p font-semibold">{fmtDay(s.date)}</p>}
              <h3 className={`inv-h ${script ? 'text-4xl' : 'is-serif text-2xl'} my-1`}>{s.title}</h3>
              <p className="text-sm inv-muted">{s.text}</p>
            </div>
          </Reveal>
        ))}
        <div className="text-center relative"><span className="inline-block px-4 text-3xl inv-heartbeat" style={{ background: 'inherit' }}>💞</span></div>
      </div>
    </section>
  )
}

// ── Sự kiện ───────────────────────────────────────────────────────────────────
export function Events({ ctx, title }: { ctx: ViewCtx; title: string }) {
  const { c, script, ornament, inv } = ctx
  const [openMap, setOpenMap] = useState<string | null>(null)
  if (!c.events.length) return null
  return (
    <section className="inv-section">
      <SectionTitle title={title} ornament={ornament} script={script} eyebrow="When & where"/>
      <div className={`max-w-4xl mx-auto grid gap-6 ${c.events.length > 1 ? 'md:grid-cols-2' : 'max-w-md'}`}>
        {c.events.map((e, i) => {
          const calTitle = `${e.name} · ${inv.title}`
          const where = [e.venue, e.address].filter(Boolean).join(', ')
          return (
            <Reveal key={e.id} delay={i * 120} className="inv-card p-7 text-center">
              <h3 className={`inv-h ${script ? 'text-4xl' : 'is-serif text-2xl'} inv-p`}>{e.name}</h3>
              {e.start && <>
                <div className="flex items-center justify-center gap-4 my-5">
                  <div className="text-right"><p className="text-xs uppercase tracking-widest inv-muted">{vnParts(e.start).weekday}</p><p className="text-2xl font-semibold">{fmtTime(e.start)}</p></div>
                  <div className="w-px h-12" style={{ background: 'var(--p)', opacity: .4 }}/>
                  <div className="text-left"><p className="text-4xl font-semibold inv-p leading-none">{vnParts(e.start).day}</p><p className="text-xs uppercase tracking-widest inv-muted">Th{vnParts(e.start).month} · {vnParts(e.start).year}</p></div>
                </div>
                <p className="text-xs italic inv-muted -mt-2 mb-4">({lunarText(e.start)})</p>
              </>}
              {e.venue && <p className="font-semibold">{e.venue}</p>}
              {e.address && <p className="text-sm inv-muted">{e.address}</p>}
              {e.note && <p className="text-sm mt-2 italic">{e.note}</p>}
              <div className="flex flex-wrap justify-center gap-2 mt-5">
                {(e.address || e.map_url) && <a href={mapLinkUrl(where, e.map_url)} target="_blank" rel="noreferrer" className="inv-btn !py-2 !px-4 text-xs">📍 Chỉ đường</a>}
                {e.address && <button onClick={() => setOpenMap(openMap === e.id ? null : e.id)} className="inv-btn inv-btn-ghost !py-2 !px-4 text-xs">{openMap === e.id ? 'Ẩn bản đồ' : '🗺️ Bản đồ'}</button>}
                {e.start && <a href={googleCalendarUrl(calTitle, e.start, where, c.invite_text)} target="_blank" rel="noreferrer" className="inv-btn inv-btn-ghost !py-2 !px-4 text-xs">📅 Google Lịch</a>}
                {e.start && <a href={icsDataUrl(calTitle, e.start, where, c.invite_text)} download={`${inv.slug}-${e.id}.ics`} className="inv-btn inv-btn-ghost !py-2 !px-4 text-xs">🔔 Lưu lịch</a>}
              </div>
              {openMap === e.id && (
                <iframe title={`Bản đồ ${e.name}`} src={mapEmbedUrl(where)} className="w-full h-56 mt-5 border-0" style={{ borderRadius: 'var(--r)' }} loading="lazy" referrerPolicy="no-referrer-when-downgrade"/>
              )}
            </Reveal>
          )
        })}
      </div>
      {c.dress_code.length > 0 && (
        <Reveal className="text-center mt-12">
          <p className="inv-eyebrow inv-p mb-3">Dress code</p>
          <div className="flex justify-center gap-3">
            {c.dress_code.map(col => <span key={col} className="w-10 h-10 rounded-full shadow-inner" style={{ background: col, border: '2px solid color-mix(in srgb, var(--tx) 12%, transparent)' }}/>)}
          </div>
        </Reveal>
      )}
    </section>
  )
}

// ── Album ảnh + lightbox ──────────────────────────────────────────────────────
export function Gallery({ ctx, title }: { ctx: ViewCtx; title: string }) {
  const { c, script, ornament } = ctx
  const [idx, setIdx] = useState<number | null>(null)
  const n = c.gallery.length
  const go = useCallback((d: number) => setIdx(i => (i === null ? i : (i + d + n) % n)), [n])
  useEffect(() => {
    if (idx === null) return
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') setIdx(null); if (e.key === 'ArrowRight') go(1); if (e.key === 'ArrowLeft') go(-1) }
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h)
  }, [idx, go])
  const [touchX, setTouchX] = useState<number | null>(null)
  if (!n) return null
  return (
    <section className="inv-section">
      <SectionTitle title={title} ornament={ornament} script={script} eyebrow="Gallery"/>
      <div className="max-w-5xl mx-auto columns-2 md:columns-3 gap-3 [&>*]:mb-3">
        {c.gallery.map((src, i) => (
          <Reveal key={src + i} delay={(i % 3) * 80}>
            <button onClick={() => setIdx(i)} className="block w-full overflow-hidden group" style={{ borderRadius: 'var(--r)' }}>
              <img src={src} alt={`Ảnh cưới ${i + 1}`} loading="lazy" className="w-full h-auto transition-transform duration-700 group-hover:scale-105"/>
            </button>
          </Reveal>
        ))}
      </div>
      {idx !== null && (
        <div className={`fixed inset-0 z-[70] bg-black/90 flex items-center justify-center`} onClick={() => setIdx(null)}
          onTouchStart={e => setTouchX(e.touches[0].clientX)}
          onTouchEnd={e => { if (touchX !== null) { const dx = e.changedTouches[0].clientX - touchX; if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1) } setTouchX(null) }}>
          <img src={c.gallery[idx]} alt="" className="max-w-[92%] max-h-[85%] object-contain animate-popIn" onClick={e => e.stopPropagation()}/>
          <button aria-label="Ảnh trước" onClick={e => { e.stopPropagation(); go(-1) }} className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/15 text-white text-2xl">‹</button>
          <button aria-label="Ảnh sau" onClick={e => { e.stopPropagation(); go(1) }} className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/15 text-white text-2xl">›</button>
          <button aria-label="Đóng" onClick={() => setIdx(null)} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/15 text-white">✕</button>
          <p className="absolute bottom-5 text-white/70 text-sm">{idx + 1} / {n}</p>
        </div>
      )}
    </section>
  )
}

// ── Hộp mừng cưới ─────────────────────────────────────────────────────────────
export function Gift({ ctx, title }: { ctx: ViewCtx; title: string }) {
  const { c, script, ornament, notify } = ctx
  const [open, setOpen] = useState(false)
  if (!c.gifts.length) return null
  const copy = async (text: string) => {
    try { await navigator.clipboard.writeText(text); notify('Đã sao chép số tài khoản') } catch { notify(text) }
  }
  return (
    <section className="inv-section text-center">
      <SectionTitle title={title} ornament={ornament} script={script} eyebrow="Wedding gift"/>
      <Reveal className="max-w-md mx-auto">
        <p className="inv-muted mb-6">Sự hiện diện của bạn là món quà quý giá nhất. Nếu muốn gửi lời chúc phúc từ xa, bạn có thể gửi qua mã QR bên dưới.</p>
        {!open && <button onClick={() => setOpen(true)} className="inv-btn">🎁 Mở hộp mừng cưới</button>}
      </Reveal>
      {open && (
        <div className="max-w-3xl mx-auto grid sm:grid-cols-2 gap-6 mt-4 animate-fadeUp">
          {c.gifts.map(g => (
            <div key={g.id} className="inv-card p-6">
              <p className="inv-eyebrow inv-p mb-1">{g.label || sideLabel(g.side)}</p>
              {g.bank && g.account_number && (
                <img src={vietQrUrl(g.bank, g.account_number, g.account_name, `Mung cuoi ${c.groom.name} ${c.bride.name}`)} alt="Mã QR chuyển khoản"
                  loading="lazy" className="w-52 h-52 mx-auto my-4 bg-white p-2 object-contain" style={{ borderRadius: 'var(--r)' }}/>
              )}
              <p className="font-semibold">{bankName(g.bank)}</p>
              <p className="text-xl font-semibold tracking-wider inv-p my-1 tabular-nums">{g.account_number}</p>
              <p className="text-sm inv-muted uppercase">{g.account_name}</p>
              <button onClick={() => copy(g.account_number)} className="inv-btn inv-btn-ghost !py-2 !px-4 text-xs mt-4">📋 Sao chép STK</button>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
