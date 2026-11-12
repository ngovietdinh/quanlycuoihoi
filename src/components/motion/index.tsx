'use client'
/**
 * Bộ hiệu ứng chuyển động dùng chung — nhẹ, không thư viện ngoài.
 * Mọi hiệu ứng đều tắt khi người dùng bật "Giảm chuyển động" (prefers-reduced-motion).
 */
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const EASE = 'cubic-bezier(.16,1,.3,1)'
export const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

// ── Số chạy: "37.000.000 đ", "65%", "55.5 kg" → đếm từ giá trị cũ tới giá trị mới ──
function parseNum(s: string) {
  const m = s.match(/-?\d[\d.,]*/)
  if (!m) return null
  const raw = m[0]
  const thousands = /^-?\d{1,3}(\.\d{3})+$/.test(raw) // định dạng vi-VN: 37.000.000
  const value = thousands ? Number(raw.replace(/\./g, '')) : Number(raw.replace(',', '.'))
  if (!isFinite(value)) return null
  const decimals = thousands ? 0 : (raw.split(/[.,]/)[1]?.length ?? 0)
  return { value, decimals, thousands, pre: s.slice(0, m.index), post: s.slice((m.index ?? 0) + raw.length) }
}
const fmt = (n: number, p: NonNullable<ReturnType<typeof parseNum>>) =>
  p.pre + (p.thousands ? Math.round(n).toLocaleString('vi-VN') : n.toFixed(p.decimals)) + p.post

export function CountUp({ value, duration = 900, className }: { value: ReactNode; duration?: number; className?: string }) {
  const text = typeof value === 'string' || typeof value === 'number' ? String(value) : null
  const parsed = text ? parseNum(text) : null
  const from = useRef(0)
  const [shown, setShown] = useState<string | null>(null)
  useEffect(() => {
    if (!parsed || reducedMotion()) { setShown(null); return }
    const start = performance.now(), a = from.current, b = parsed.value
    let raf = 0
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / duration), e = 1 - Math.pow(1 - k, 4)
      setShown(fmt(a + (b - a) * e, parsed))
      if (k < 1) raf = requestAnimationFrame(tick); else { from.current = b; setShown(null) }
    }
    raf = requestAnimationFrame(tick)
    return () => { cancelAnimationFrame(raf); from.current = b }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text])
  if (!text) return <span className={className}>{value}</span>
  return <span className={cn('tabular', className)}>{shown ?? text}</span>
}

// ── Hiện dần khi cuộn tới (một lần) ──
export function Reveal({ children, delay = 0, y = 16, className, as: Tag = 'div' }: { children: ReactNode; delay?: number; y?: number; className?: string; as?: 'div' | 'section' | 'li' }) {
  const ref = useRef<HTMLElement>(null)
  const [on, setOn] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || reducedMotion() || !('IntersectionObserver' in window)) { setOn(true); return }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOn(true); io.disconnect() } }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 })
    io.observe(el); return () => io.disconnect()
  }, [])
  const style: CSSProperties = { transition: `opacity .7s ${EASE} ${delay}ms, transform .7s ${EASE} ${delay}ms, filter .7s ${EASE} ${delay}ms`, opacity: on ? 1 : 0, transform: on ? 'none' : `translateY(${y}px)`, filter: on ? 'none' : 'blur(4px)' }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <Tag ref={ref as any} className={className} style={style}>{children}</Tag>
}

// ── Chuyển trang: nội dung trượt nhẹ lên khi đổi đường dẫn (không remount trang) ──
export function PageTransition({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const path = usePathname()
  const first = useRef(true)
  useEffect(() => {
    if (first.current) { first.current = false; return }
    if (reducedMotion() || !ref.current?.animate) return
    ref.current.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 420, easing: EASE })
  }, [path])
  return <div ref={ref} className={className}>{children}</div>
}

// ── Thanh tiến trình chuyển trang ở mép trên ──
export function RouteProgress() {
  const path = usePathname()
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle')
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const a = (e.target as HTMLElement).closest('a')
      if (!a || a.target === '_blank' || a.hasAttribute('download')) return
      const url = new URL(a.href, location.href)
      if (url.origin !== location.origin || url.pathname === location.pathname) return
      setState('loading')
    }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [])
  useEffect(() => {
    setState(s => (s === 'loading' ? 'done' : s))
    const t = setTimeout(() => setState('idle'), 450)
    return () => clearTimeout(t)
  }, [path])
  if (state === 'idle') return null
  return <div className={cn('route-progress', state === 'done' && 'is-done')} aria-hidden/>
}

// ── Nghiêng 3D theo con trỏ (chỉ trên thiết bị có chuột) ──
export function Tilt({ children, max = 8, className }: { children: ReactNode; max?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el || reducedMotion() || !matchMedia('(hover: hover)').matches) return
    let raf = 0
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => { el.style.transform = `perspective(1100px) rotateY(${x * max}deg) rotateX(${-y * max}deg)` })
    }
    const leave = () => { cancelAnimationFrame(raf); el.style.transform = '' }
    el.addEventListener('pointermove', move); el.addEventListener('pointerleave', leave)
    return () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave) }
  }, [max])
  return <div ref={ref} className={cn('tilt', className)}>{children}</div>
}

// ── Vệt sáng theo con trỏ cho nhóm thẻ (đặt class "spot" lên từng thẻ) ──
export function Spotlight({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el || !matchMedia('(hover: hover)').matches) return
    const move = (e: PointerEvent) => {
      el.querySelectorAll<HTMLElement>('.spot').forEach(c => {
        const r = c.getBoundingClientRect()
        c.style.setProperty('--mx', `${e.clientX - r.left}px`); c.style.setProperty('--my', `${e.clientY - r.top}px`)
      })
    }
    el.addEventListener('pointermove', move); return () => el.removeEventListener('pointermove', move)
  }, [])
  return <div ref={ref} className={className}>{children}</div>
}
