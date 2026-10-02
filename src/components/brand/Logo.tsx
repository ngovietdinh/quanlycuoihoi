import { APP_NAME, APP_TAGLINE } from '@/lib/brand'
import { cn } from '@/lib/utils'

/** Biểu tượng FamilyPlan: mái nhà ôm trái tim — từ ngày cưới tới cả tổ ấm */
export function LogoMark({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={cn('flex-shrink-0', className)} aria-hidden>
      <defs>
        <linearGradient id="fp-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff6b96"/><stop offset=".55" stopColor="#ff3d78"/><stop offset="1" stopColor="#f59e0b"/>
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="14" fill="url(#fp-g)"/>
      <path d="M12 23.5 24 13l12 10.5" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M15.5 21v12.5a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2V21" fill="none" stroke="#fff" strokeOpacity=".55" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M24 32.2s-5.2-3.1-5.2-6.6a2.9 2.9 0 0 1 5.2-1.8 2.9 2.9 0 0 1 5.2 1.8c0 3.5-5.2 6.6-5.2 6.6Z" fill="#fff"/>
    </svg>
  )
}

export function Logo({ size = 40, tone = 'dark', sub = true, className }: { size?: number; tone?: 'dark' | 'light'; sub?: boolean | string; className?: string }) {
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <LogoMark size={size} className="drop-shadow-[0_6px_14px_rgba(255,61,120,.28)]"/>
      <span className="leading-tight">
        <span className={cn('block font-display font-bold tracking-tight', size >= 44 ? 'text-2xl' : 'text-lg', tone === 'dark' ? 'text-ink-900' : 'text-white')}>
          {APP_NAME}
        </span>
        {sub && <span className={cn('block text-[11px] font-medium', tone === 'dark' ? 'text-ink-400' : 'text-white/55')}>{typeof sub === 'string' ? sub : APP_TAGLINE}</span>}
      </span>
    </span>
  )
}
