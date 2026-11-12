'use client'
// Mỗi phân hệ Gia đình có một cặp màu riêng — dùng cho thanh điều hướng, hero và điểm nhấn
import { cn } from '@/lib/utils'
import { CountUp } from '@/components/motion'

export type ModuleKey = 'overview' | 'finance' | 'pregnancy' | 'children' | 'savings'
export const MODULES: Record<ModuleKey, { href: string; label: string; short: string; emoji: string; from: string; to: string; soft: string; ink: string }> = {
  overview:  { href: '/family',           label: 'Tổng quan',           short: 'Tổng quan', emoji: '🏡', from: '#ff3d78', to: '#f97316', soft: '#fff1f5', ink: '#be123c' },
  finance:   { href: '/family/finance',   label: 'Thu chi',             short: 'Thu chi',   emoji: '💰', from: '#059669', to: '#14b8a6', soft: '#ecfdf5', ink: '#047857' },
  pregnancy: { href: '/family/pregnancy', label: 'Thai sản',            short: 'Thai sản',  emoji: '🤰', from: '#ec4899', to: '#a855f7', soft: '#fdf2f8', ink: '#be185d' },
  children:  { href: '/family/children',  label: 'Con cái',             short: 'Con cái',   emoji: '🧒', from: '#0ea5e9', to: '#6366f1', soft: '#f0f9ff', ink: '#0369a1' },
  savings:   { href: '/family/savings',   label: 'Tiết kiệm & tài sản', short: 'Tích lũy',  emoji: '🐷', from: '#f59e0b', to: '#f43f5e', soft: '#fffbeb', ink: '#b45309' },
}
export const MODULE_ORDER: ModuleKey[] = ['overview', 'finance', 'pregnancy', 'children', 'savings']
export const moduleOf = (path: string): ModuleKey =>
  MODULE_ORDER.find(k => k !== 'overview' && path.includes(MODULES[k].href)) ?? 'overview'
export const grad = (k: ModuleKey, deg = 135) => `linear-gradient(${deg}deg, ${MODULES[k].from}, ${MODULES[k].to})`

/** Khối mở đầu của mỗi phân hệ: nền gradient màu phân hệ, đốm sáng trôi, hình minh họa nổi bên phải */
export function ModuleHero({ mod, eyebrow, title, sub, art, artMobile, actions, children, className }: {
  mod: ModuleKey; eyebrow?: React.ReactNode; title: React.ReactNode; sub?: React.ReactNode; art?: React.ReactNode; artMobile?: boolean
  actions?: React.ReactNode; children?: React.ReactNode; className?: string
}) {
  const m = MODULES[mod]
  return (
    <section className={cn('module-hero relative overflow-hidden rounded-[28px] text-white', className)}
      style={{ background: `radial-gradient(120% 140% at 0% 0%, ${m.from} 0%, transparent 55%), radial-gradient(120% 140% at 100% 100%, ${m.to} 0%, transparent 60%), linear-gradient(135deg, #1c1825, #2a1d3a)` }}>
      <span aria-hidden className="mh-blob" style={{ background: m.to, top: '-30%', right: '18%' }}/>
      <span aria-hidden className="mh-blob" style={{ background: m.from, bottom: '-40%', left: '-8%', animationDelay: '-7s' }}/>
      <span aria-hidden className="mh-grain"/>
      <div className="relative grid md:grid-cols-[minmax(0,1fr)_auto] gap-6 items-center p-6 sm:p-8">
        <div className="min-w-0 stagger">
          {eyebrow && <p className="text-sm text-white/70 mb-1">{eyebrow}</p>}
          <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight">{title}</h1>
          {sub && <div className="text-white/75 mt-2 max-w-xl">{sub}</div>}
          {actions && <div className="flex flex-wrap gap-2 mt-5">{actions}</div>}
        </div>
        {art && <div className={cn(artMobile ? 'flex' : 'hidden md:flex', 'justify-center items-center md:min-w-[220px]')}>{art}</div>}
      </div>
      {children && <div className="relative px-4 sm:px-6 pb-4 sm:pb-6">{children}</div>}
    </section>
  )
}

/** Ô số liệu kiểu kính mờ đặt trong hero */
export function HeroStat({ label, value, sub, tone }: { label: string; value: React.ReactNode; sub?: React.ReactNode; tone?: 'good' | 'bad' }) {
  return (
    <div className="rounded-2xl bg-white/[.10] border border-white/15 backdrop-blur-md px-3.5 sm:px-4 py-3 min-w-0 transition-colors duration-300 hover:bg-white/[.16]">
      <p className="text-xs text-white/65 truncate">{label}</p>
      <p className={cn('text-lg sm:text-2xl font-extrabold tracking-tight tabular truncate', tone === 'good' && 'text-emerald-200', tone === 'bad' && 'text-rose-200')}><CountUp value={value}/></p>
      {sub && <p className="text-[11px] text-white/55 truncate">{sub}</p>}
    </div>
  )
}

/** Nút trên nền hero */
export const heroBtn = 'btn h-10 px-4 text-sm rounded-xl bg-white text-ink-900 hover:bg-white/90 shadow-lg shadow-black/10'
export const heroBtnGhost = 'btn h-10 px-4 text-sm rounded-xl bg-white/10 text-white border border-white/20 hover:bg-white/20 backdrop-blur'
