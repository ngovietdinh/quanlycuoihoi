'use client'
import { useEffect, useRef, useState } from 'react'
import type { EffectId } from '@/types'
import { googleFontsHref } from '@/lib/invitation/templates'

/** Nạp Google Fonts theo lựa chọn của người dùng */
export function FontLoader({ fonts }: { fonts: string[] }) {
  const href = googleFontsHref(fonts)
  useEffect(() => {
    const id = 'inv-font-' + btoa(unescape(encodeURIComponent(href))).slice(0, 24)
    if (document.getElementById(id)) return
    const link = document.createElement('link')
    link.id = id; link.rel = 'stylesheet'; link.href = href
    document.head.appendChild(link)
  }, [href])
  return null
}

/** Hiện dần khi phần tử cuộn vào khung nhìn */
export function Reveal({ children, delay = 0, className = '', as: Tag = 'div' }:
  { children: React.ReactNode; delay?: number; className?: string; as?: any }) {
  const ref = useRef<HTMLElement>(null)
  const [on, setOn] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') { setOn(true); return }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOn(true); io.disconnect() } }, { threshold: 0.12 })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return <Tag ref={ref} className={`inv-reveal ${on ? 'is-in' : ''} ${className}`} style={{ transitionDelay: `${delay}ms` }}>{children}</Tag>
}

const CONFETTI = ['#ff5a5f', '#ffd166', '#06d6a0', '#118ab2', '#ef476f', '#f78c6b']
const SHAPES: Record<Exclude<EffectId, 'none' | 'sparkles' | 'bubbles' | 'confetti'>, (c: string) => React.ReactNode> = {
  petals: c => <svg viewBox="0 0 30 30" width="100%" height="100%"><path d="M15 2C22 8 26 16 15 28 4 16 8 8 15 2Z" fill={c} opacity=".85"/></svg>,
  hearts: c => <svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M12 21s-7.5-4.6-10-9.3C.4 8.4 2.3 4 6.4 4c2.3 0 3.8 1.3 5.6 3.3C13.8 5.3 15.3 4 17.6 4c4.1 0 6 4.4 4.4 7.7C19.5 16.4 12 21 12 21Z" fill={c} opacity=".8"/></svg>,
  leaves: c => <svg viewBox="0 0 30 30" width="100%" height="100%"><path d="M4 26C4 12 14 4 27 3c-1 13-9 23-23 23Z" fill={c} opacity=".75"/><path d="M5 25 22 8" stroke="white" strokeOpacity=".5" strokeWidth="1"/></svg>,
  snow:   () => <svg viewBox="0 0 20 20" width="100%" height="100%"><circle cx="10" cy="10" r="8" fill="white" opacity=".9"/></svg>,
}

/** Hiệu ứng rơi (cánh hoa, tim, lá, tuyết) hoặc lấp lánh */
export function FallingEffect({ effect, color, contained = false, count = 18 }: { effect: EffectId; color: string; contained?: boolean; count?: number }) {
  const [items, setItems] = useState<{ left: number; size: number; dur: number; delay: number; drift: number; spin: number; top: number }[]>([])
  useEffect(() => {
    // Sinh ngẫu nhiên phía client để tránh lệch hydrate
    setItems(Array.from({ length: count }, () => ({
      left: Math.random() * 100, size: 10 + Math.random() * 14, dur: 9 + Math.random() * 10, delay: -Math.random() * 18,
      drift: -80 + Math.random() * 160, spin: 180 + Math.random() * 540, top: Math.random() * 100,
    })))
  }, [count, effect])
  if (effect === 'none' || !items.length) return null
  const pos = contained ? 'absolute' : 'fixed'
  return (
    <div aria-hidden className="pointer-events-none inset-0 overflow-hidden z-[5]" style={{ position: pos }}>
      {effect === 'bubbles'
        ? items.map((it, i) => (
            <span key={i} className="inv-rise rounded-full" style={{
              left: `${it.left}%`, width: it.size * 1.2, height: it.size * 1.2, animationDuration: `${it.dur * 1.2}s`, animationDelay: `${it.delay}s`,
              ['--drift' as any]: `${it.drift / 2}px`,
              background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,.9), color-mix(in srgb, ${color} 25%, transparent) 60%)`,
              border: `1px solid color-mix(in srgb, ${color} 35%, transparent)`,
            }}/>
          ))
      : effect === 'confetti'
        ? items.map((it, i) => (
            <span key={i} className="inv-fall" style={{
              left: `${it.left}%`, width: it.size * .45, height: it.size * .8, animationDuration: `${it.dur * .8}s`, animationDelay: `${it.delay}s`,
              ['--drift' as any]: `${it.drift}px`, ['--spin' as any]: `${it.spin * 2}deg`, background: CONFETTI[i % CONFETTI.length], borderRadius: 2,
            }}/>
          ))
      : effect === 'sparkles'
        ? items.map((it, i) => (
            <span key={i} className="inv-twinkle" style={{ left: `${it.left}%`, top: `${it.top}%`, width: it.size * .7, height: it.size * .7, animationDelay: `${it.delay / 4}s`, animationDuration: `${2 + (i % 4)}s` }}>
              <svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M12 0l2.4 9.6L24 12l-9.6 2.4L12 24l-2.4-9.6L0 12l9.6-2.4z" fill={color} opacity=".75"/></svg>
            </span>
          ))
        : items.map((it, i) => (
            <span key={i} className="inv-fall" style={{
              left: `${it.left}%`, width: it.size, height: it.size, animationDuration: `${it.dur}s`, animationDelay: `${it.delay}s`,
              ['--drift' as any]: `${it.drift}px`, ['--spin' as any]: `${it.spin}deg`,
            }}>{SHAPES[effect as keyof typeof SHAPES](color)}</span>
          ))}
    </div>
  )
}

/** Hoa văn trang trí theo mẫu thiệp */
export function Ornament({ kind, className = '' }: { kind: string; className?: string }) {
  const c = 'var(--p)'
  if (kind === 'songhy') return (
    <div className={`flex items-center justify-center gap-3 ${className}`}>
      <span className="h-px w-12" style={{ background: c, opacity: .5 }}/>
      <span className="text-3xl font-bold" style={{ color: c, fontFamily: 'serif' }}>囍</span>
      <span className="h-px w-12" style={{ background: c, opacity: .5 }}/>
    </div>
  )
  if (kind === 'floral') return (
    <svg viewBox="0 0 200 30" className={`mx-auto h-7 ${className}`} fill="none" stroke={c} strokeWidth="1.2">
      <path d="M10 15h60M130 15h60"/><circle cx="100" cy="15" r="5" fill={c} opacity=".5"/>
      <path d="M100 15c-8-12-20-10-24 0 4 10 16 12 24 0zM100 15c8-12 20-10 24 0-4 10-16 12-24 0z" opacity=".8"/>
    </svg>
  )
  if (kind === 'leaf') return (
    <svg viewBox="0 0 200 30" className={`mx-auto h-7 ${className}`} fill="none" stroke={c} strokeWidth="1.2">
      <path d="M20 15h160"/><path d="M100 15c-6-10-2-14 0-14s6 4 0 14zM100 15c-6 10-2 14 0 14s6-4 0-14z" fill={c} opacity=".35"/>
      <path d="M70 15c-4-6-10-7-14-5 4 4 9 6 14 5zM130 15c4-6 10-7 14-5-4 4-9 6-14 5z" fill={c} opacity=".35"/>
    </svg>
  )
  if (kind === 'star') return (
    <div className={`flex items-center justify-center gap-3 ${className}`} style={{ color: c }}>
      <span className="h-px w-16" style={{ background: `linear-gradient(90deg,transparent,${c})` }}/>
      <span>✦</span><span className="text-xs opacity-60">✦</span><span>✦</span>
      <span className="h-px w-16" style={{ background: `linear-gradient(-90deg,transparent,${c})` }}/>
    </div>
  )
  if (kind === 'lotus') return (
    <svg viewBox="0 0 200 40" className={`mx-auto h-9 ${className}`} fill="none" stroke={c} strokeWidth="1.2">
      <path d="M10 30h55M135 30h55" opacity=".6"/>
      <path d="M100 32c-6-6-6-18 0-26 6 8 6 20 0 26z" fill={c} fillOpacity=".25"/>
      <path d="M100 32c-10-2-18-10-18-20 8 2 16 10 18 20zM100 32c10-2 18-10 18-20-8 2-16 10-18 20z" fill={c} fillOpacity=".15"/>
      <path d="M100 32c-14 2-26-4-30-12 10-2 22 2 30 12zM100 32c14 2 26-4 30-12-10-2-22 2-30 12z"/>
    </svg>
  )
  if (kind === 'deco') return (
    <svg viewBox="0 0 200 36" className={`mx-auto h-8 ${className}`} fill="none" stroke={c} strokeWidth="1">
      <path d="M0 18h70M130 18h70M0 22h60M140 22h60"/>
      <path d="M100 4l14 14-14 14-14-14z"/><path d="M100 10l8 8-8 8-8-8z" fill={c} fillOpacity=".3"/>
      <path d="M72 18l8-8M72 18l8 8M128 18l-8-8M128 18l-8 8"/>
    </svg>
  )
  if (kind === 'wave') return (
    <svg viewBox="0 0 200 24" className={`mx-auto h-6 ${className}`} fill="none" stroke={c} strokeWidth="1.3">
      <path d="M20 12c10-8 20-8 30 0s20 8 30 0 20-8 30 0 20 8 30 0 20-8 30 0"/>
      <path d="M40 18c10-6 20-6 30 0s20 6 30 0 20-6 30 0 20 6 30 0" opacity=".45"/>
    </svg>
  )
  if (kind === 'heart') return (
    <div className={`flex items-center justify-center gap-3 ${className}`} style={{ color: c }}>
      <span className="h-px w-16" style={{ background: `linear-gradient(90deg,transparent,${c})` }}/>
      <svg viewBox="0 0 24 24" className="w-5 h-5 inv-heartbeat"><path fill="currentColor" d="M12 21s-7.5-4.6-10-9.3C.4 8.4 2.3 4 6.4 4c2.3 0 3.8 1.3 5.6 3.3C13.8 5.3 15.3 4 17.6 4c4.1 0 6 4.4 4.4 7.7C19.5 16.4 12 21 12 21Z"/></svg>
      <span className="h-px w-16" style={{ background: `linear-gradient(-90deg,transparent,${c})` }}/>
    </div>
  )
  if (kind === 'geo') return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      <span className="h-px w-20" style={{ background: c }}/>
      <span className="w-2 h-2 rotate-45" style={{ background: c }}/>
      <span className="h-px w-20" style={{ background: c }}/>
    </div>
  )
  return (
    <svg viewBox="0 0 200 20" className={`mx-auto h-5 ${className}`} fill="none" stroke={c} strokeWidth="1">
      <path d="M0 10h80M120 10h80"/><path d="M85 10l15-7 15 7-15 7z"/><circle cx="100" cy="10" r="2.5" fill={c}/>
    </svg>
  )
}

export function SectionTitle({ eyebrow, title, ornament, script }: { eyebrow?: string; title: string; ornament: string; script: boolean }) {
  return (
    <Reveal className="text-center mb-10">
      {eyebrow && <p className="inv-eyebrow mb-2 inv-p">{eyebrow}</p>}
      <h2 className={`inv-h text-balance ${script ? 'text-[2.75rem] sm:text-6xl' : 'is-serif text-3xl sm:text-4xl'} inv-p`}>{title}</h2>
      <Ornament kind={ornament} className="mt-4"/>
    </Reveal>
  )
}

/** Ảnh tự ẩn khi lỗi tải (link hỏng), tránh hiện biểu tượng ảnh vỡ + chữ alt */
export function SafeImg(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  const ref = useRef<HTMLImageElement>(null)
  const [broken, setBroken] = useState(false)
  useEffect(() => {
    // Lỗi có thể xảy ra trước khi React hydrate → kiểm tra lại trạng thái ảnh
    const el = ref.current
    setBroken(!!el && el.complete && el.naturalWidth === 0)
  }, [props.src])
  if (broken || !props.src) return null
  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
  return <img ref={ref} {...props} onError={() => setBroken(true)}/>
}
