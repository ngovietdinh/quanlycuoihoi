'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { TEMPLATES, patternBg, googleFontsHref } from '@/lib/invitation/templates'
import { AUTHOR, copyright } from '@/lib/brand'

const HIGHLIGHTS = [
  ['💌', '18 mẫu thiệp online', 'Phong bì, nhạc nền, hiệu ứng, âm lịch'],
  ['👥', 'Khách mời cá nhân hóa', 'Link riêng hiện đúng tên từng khách'],
  ['📊', 'Xác nhận tham dự realtime', 'Thống kê, xuất Excel cho nhà hàng'],
  ['📋', 'Kế hoạch & ngân sách', '24 việc chuẩn bị cưới có sẵn'],
]
const SHOWCASE = ['songhy', 'floral', 'royal', 'lotus', 'midnight', 'sakura'] as const

/** Khung chung trang đăng nhập / đăng ký: giới thiệu bên trái, form bên phải */
export function AuthShell({ children }: { children: React.ReactNode }) {
  const [i, setI] = useState(0)
  useEffect(() => { const t = setInterval(() => setI(x => (x + 1) % SHOWCASE.length), 3200); return () => clearInterval(t) }, [])
  return (
    <div className="min-h-screen grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] bg-[#fdf8f0]">
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href={googleFontsHref(TEMPLATES.filter(t => (SHOWCASE as readonly string[]).includes(t.id)).map(t => t.theme.heading_font))}/>

      {/* Bên trái: giới thiệu (ẩn trên điện thoại) */}
      <aside className="hidden lg:flex relative overflow-hidden flex-col justify-between p-10 xl:p-14 text-white"
        style={{ background: 'linear-gradient(145deg,#1a0d08 0%,#2c1810 35%,#4a2520 70%,#78350f 100%)' }}>
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full opacity-20 blur-3xl" style={{ background: '#ff3d78' }}/>
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full opacity-15 blur-3xl" style={{ background: '#f59e0b' }}/>
        <Link href="/" className="relative flex items-center gap-3 w-fit">
          <span className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shadow-glow-sakura" style={{ background: 'linear-gradient(135deg,#ff6b96,#ff3d78)' }}>💍</span>
          <span><span className="block font-display text-2xl font-bold leading-none">Hỷ Sự</span><span className="text-[11px] text-white/50 tracking-wider uppercase">Wedding planner</span></span>
        </Link>

        <div className="relative grid grid-cols-[1fr_auto] gap-8 items-center my-10">
          <div>
            <h2 className="font-display text-4xl 2xl:text-5xl font-bold leading-tight mb-4">Ngày trọng đại,<br/><span className="text-gradient-sakura whitespace-nowrap">trọn vẹn từng chi tiết</span></h2>
            <p className="text-white/60 mb-8 max-w-md">Một nơi duy nhất để lên kế hoạch, quản lý ngân sách và gửi thiệp cưới online tới mọi khách mời.</p>
            <ul className="space-y-3.5">
              {HIGHLIGHTS.map(([ic, t, d]) => (
                <li key={t} className="flex items-start gap-3">
                  <span className="w-9 h-9 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center flex-shrink-0">{ic}</span>
                  <span><span className="block font-semibold text-sm">{t}</span><span className="block text-xs text-white/50">{d}</span></span>
                </li>
              ))}
            </ul>
          </div>
          {/* Thẻ thiệp xoay vòng các mẫu */}
          <div className="relative w-52 h-72 hidden xl:block">
            {SHOWCASE.map((id, k) => {
              const t = TEMPLATES.find(x => x.id === id)!.theme
              const on = k === i, prev = k === (i - 1 + SHOWCASE.length) % SHOWCASE.length
              return (
                <div key={id} className="absolute inset-0 rounded-2xl shadow-2xl flex flex-col items-center justify-center text-center p-5 transition-all duration-700"
                  style={{ background: t.background, backgroundImage: patternBg(t.pattern, t.primary), color: t.primary,
                    opacity: on ? 1 : prev ? 0 : 0, transform: on ? 'rotate(-4deg) scale(1)' : prev ? 'rotate(8deg) translateX(40px) scale(.9)' : 'rotate(-10deg) scale(.9)' }}>
                  <div className="absolute inset-3 border rounded-xl opacity-40" style={{ borderColor: t.primary }}/>
                  <span className="text-[9px] tracking-[.35em] uppercase" style={{ color: t.text, opacity: .6 }}>Save the date</span>
                  <span className="text-4xl my-2 leading-tight" style={{ fontFamily: `'${t.heading_font}', serif` }}>Minh Anh<br/>&amp;<br/>Thu Trang</span>
                  <span className="text-xs tracking-widest" style={{ color: t.text, opacity: .7 }}>20 · 12 · 2026</span>
                </div>
              )
            })}
          </div>
        </div>

        <figure className="relative rounded-2xl border border-white/10 bg-white/5 p-5 max-w-lg">
          <blockquote className="text-sm text-white/80 italic">“Gửi thiệp cho 300 khách chỉ trong một buổi tối, biết chính xác bao nhiêu người đến để chốt bàn với nhà hàng. Quá tiện!”</blockquote>
          <figcaption className="mt-3 text-xs text-white/50">— Cặp đôi Hà Nội, cưới tháng 10</figcaption>
        </figure>
      </aside>

      {/* Bên phải: form */}
      <main className="flex flex-col min-h-screen">
        <div className="lg:hidden px-5 pt-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background: 'linear-gradient(135deg,#ff6b96,#ff3d78)' }}>💍</span>
            <span className="font-display text-xl font-bold text-ink-900">Hỷ Sự</span>
          </Link>
          <Link href="/i/demo" target="_blank" className="text-xs text-sakura-600 font-semibold">Xem thiệp mẫu ↗</Link>
        </div>
        <div className="flex-1 flex items-center justify-center p-5 sm:p-10">
          <div className="w-full max-w-md animate-fadeUp">{children}</div>
        </div>
        <p className="text-center text-[11px] text-ink-400 pb-6 px-4 leading-relaxed">{copyright()}<br/>Tác giả: <span className="whitespace-nowrap font-semibold">{AUTHOR}</span></p>
      </main>
    </div>
  )
}

/** Ô nhập có biểu tượng bên trái */
export function AuthInput({ icon, right, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { icon: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="relative">
      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none">{icon}</span>
      <input {...props} className={`input !pl-10 h-12 ${right ? '!pr-11' : ''} ${props.className ?? ''}`}/>
      {right && <span className="absolute right-2 top-1/2 -translate-y-1/2">{right}</span>}
    </div>
  )
}

export const Icon = {
  mail: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>,
  lock: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>,
  user: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>,
  eye: (on: boolean) => on
    ? <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.9 17.9A10 10 0 0 1 12 20C5 20 1 12 1 12a18 18 0 0 1 5.1-5.9M9.9 4.2A9 9 0 0 1 12 4c7 0 11 8 11 8a18 18 0 0 1-2.2 3.2M1 1l22 22"/></svg>
    : <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>,
  google: <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2A12 12 0 0 1 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3a12 12 0 0 1-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>,
}

export const GOOGLE_ENABLED = process.env.NEXT_PUBLIC_AUTH_GOOGLE === '1'
