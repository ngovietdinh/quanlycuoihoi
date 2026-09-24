'use client'
import { useMemo, useState, useCallback, useRef } from 'react'
import type { Invitation, GuestGreeting, Wish, SectionId } from '@/types'
import { normalizeInvitation, templateById, SCRIPT_FONTS, SECTION_LABELS, patternBg } from '@/lib/invitation/templates'
import { FontLoader, FallingEffect, Ornament, Reveal } from './effects'
import { Cover, Intro, Countdown, Couple, Story, Events, Gallery, Gift, type ViewCtx } from './sections'
import { Envelope, MusicButton, Rsvp, Wishes, ShareDock } from './interactive'

interface Props {
  invitation: Invitation
  guest?: GuestGreeting | null
  guestCode?: string
  /** Xem trước trong trình thiết kế: overlay dùng absolute, không lưu phản hồi */
  preview?: boolean
  /** Thiệp mẫu: phản hồi chỉ hiển thị cục bộ */
  demo?: boolean
  initialWishes?: Wish[]
  /** Trong trình thiết kế: có hiện phong bì hay không */
  showEnvelope?: boolean
}

export function InvitationView({ invitation, guest = null, guestCode, preview = false, demo = false, initialWishes = [], showEnvelope }: Props) {
  const inv = useMemo(() => normalizeInvitation(invitation), [invitation])
  const { content: c, theme: t } = inv
  const tpl = templateById(t.template)
  const [opened, setOpened] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>()
  const notify = useCallback((m: string) => {
    setToast(m); clearTimeout(timer.current); timer.current = setTimeout(() => setToast(null), 2600)
  }, [])

  const mainDate = inv.event_date
    ?? c.events.map(e => e.start).filter(Boolean).sort().pop()
    ?? null

  const ctx: ViewCtx = {
    inv, c, t, ornament: tpl.ornament, script: SCRIPT_FONTS.has(t.heading_font),
    preview, demo, guest, guestCode, notify, mainDate,
  }
  const envelope = showEnvelope ?? (t.envelope && !preview)
  const wishesInitial = useMemo(() => initialWishes, [initialWishes])

  const renderSection = (id: SectionId, title: string) => {
    switch (id) {
      case 'countdown': return <Countdown key={id} ctx={ctx} title={title}/>
      case 'couple':    return <Couple    key={id} ctx={ctx} title={title}/>
      case 'story':     return <Story     key={id} ctx={ctx} title={title}/>
      case 'events':    return <Events    key={id} ctx={ctx} title={title}/>
      case 'gallery':   return <Gallery   key={id} ctx={ctx} title={title}/>
      case 'rsvp':      return <Rsvp      key={id} ctx={ctx} title={title}/>
      case 'wishes':    return <Wishes    key={id} ctx={ctx} title={title} initial={wishesInitial}/>
      case 'gift':      return <Gift      key={id} ctx={ctx} title={title}/>
    }
  }

  return (
    <div
      className="inv relative min-h-full"
      style={{
        ['--p' as any]: t.primary, ['--a' as any]: t.accent, ['--bg' as any]: t.background, ['--tx' as any]: t.text,
        ['--hf' as any]: `'${t.heading_font}'`, ['--bf' as any]: `'${t.body_font}'`, ['--r' as any]: `${t.radius}px`,
        backgroundImage: patternBg(t.pattern, t.primary),
      }}
    >
      <FontLoader fonts={[t.heading_font, t.body_font]}/>
      <FallingEffect effect={t.effect} color={t.primary}/>
      {envelope && <Envelope ctx={ctx} onOpen={() => setOpened(true)}/>}
      {t.music_url && <MusicButton src={t.music_url} play={opened} preview={preview}/>}
      <ShareDock ctx={ctx}/>

      <main className="relative z-[1]">
        <div id="sec-cover"><Cover ctx={ctx}/></div>
        <div><Intro ctx={ctx}/></div>
        {c.sections.filter(s => s.visible).map(s => (
          <div key={s.id} id={`sec-${s.id}`}>{renderSection(s.id, s.title || SECTION_LABELS[s.id].title)}</div>
        ))}

        <footer className="inv-section text-center">
          <Reveal>
            <Ornament kind={tpl.ornament} className="mb-6"/>
            <p className="max-w-md mx-auto italic inv-muted">{c.closing}</p>
            <p className={`inv-h ${ctx.script ? 'text-5xl' : 'is-serif text-3xl'} inv-p mt-6`}>{c.groom.name} &amp; {c.bride.name}</p>
            {c.hashtag && <p className="mt-3 font-semibold tracking-wider inv-p">{c.hashtag}</p>}
            <p className="mt-12 text-[11px] inv-muted">Thiệp cưới online được tạo bởi <a href="/" className="underline">Hỷ Sự</a> 💍</p>
          </Reveal>
        </footer>
      </main>

      {toast && (
        <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-[90] px-5 py-3 rounded-full shadow-xl text-sm animate-fadeUp`}
          style={{ background: 'var(--tx)', color: 'var(--bg)' }}>{toast}</div>
      )}
    </div>
  )
}
