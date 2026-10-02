/**
 * Pháo giấy ăn mừng (canvas, ~1.6 giây) — gọi khi hoàn thành một mốc: đạt mục tiêu tiết kiệm,
 * tiêm xong mũi, mua đủ đồ sơ sinh, bé chào đời… Tự bỏ qua khi người dùng bật "Giảm chuyển động".
 */
const COLORS = ['#ff3d78', '#f59e0b', '#10b981', '#0ea5e9', '#8b5cf6', '#f472b6', '#fde047']

export function celebrate(origin?: { x: number; y: number }, count = 120) {
  if (typeof window === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const c = document.createElement('canvas')
  const dpr = Math.min(2, window.devicePixelRatio || 1)
  c.width = innerWidth * dpr; c.height = innerHeight * dpr
  Object.assign(c.style, { position: 'fixed', inset: '0', width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: '300' })
  document.body.appendChild(c)
  const ctx = c.getContext('2d')!
  ctx.scale(dpr, dpr)
  const ox = origin?.x ?? innerWidth / 2, oy = origin?.y ?? innerHeight * 0.35
  const parts = Array.from({ length: count }, () => {
    const a = Math.random() * Math.PI * 2, v = 6 + Math.random() * 9
    return { x: ox, y: oy, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 7, r: 4 + Math.random() * 5, rot: Math.random() * 6, vr: (Math.random() - .5) * .4,
      c: COLORS[(Math.random() * COLORS.length) | 0], shape: Math.random() < .5 ? 0 : 1 }
  })
  const start = performance.now()
  const frame = (t: number) => {
    const k = (t - start) / 1600
    ctx.clearRect(0, 0, innerWidth, innerHeight)
    for (const p of parts) {
      p.vy += .32; p.vx *= .985; p.vy *= .985; p.x += p.vx; p.y += p.vy; p.rot += p.vr
      ctx.save(); ctx.globalAlpha = Math.max(0, 1 - k * k); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.c
      if (p.shape) ctx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); else { ctx.beginPath(); ctx.arc(0, 0, p.r / 2.4, 0, 7); ctx.fill() }
      ctx.restore()
    }
    if (k < 1) requestAnimationFrame(frame); else c.remove()
  }
  requestAnimationFrame(frame)
}

/** Lấy tâm phần tử được bấm làm điểm bắn pháo giấy */
export const fromEvent = (e: { currentTarget: EventTarget | null }) => {
  const el = e.currentTarget as HTMLElement | null
  if (!el?.getBoundingClientRect) return undefined
  const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
}
