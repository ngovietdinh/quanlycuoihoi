// Bộ biểu tượng nét (24×24, stroke 2) dùng cho điều hướng & thao tác — thay emoji ở khung ứng dụng
import { cn } from '@/lib/utils'

const P: Record<string, React.ReactNode> = {
  home: <><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5"/></>,
  grid: <><rect x="3" y="3" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="2"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2"/></>,
  invite: <><rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m3.5 6.5 8.5 6.5 8.5-6.5"/></>,
  family: <><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5"/><path d="M12 17.5s-3-1.8-3-3.8a1.6 1.6 0 0 1 3-.9 1.6 1.6 0 0 1 3 .9c0 2-3 3.8-3 3.8Z"/></>,
  user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
  shield: <><path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.3 7.5 9.5 4.3-1.2 7.5-4.9 7.5-9.5V6Z"/><path d="m9 12 2 2 4-4"/></>,
  logout: <><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3"/><path d="M10 17l-5-5 5-5"/><path d="M5 12h11"/></>,
  wallet: <><path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18a1 1 0 0 1 1 1v2"/><rect x="3.5" y="8" width="17" height="12" rx="2.5"/><circle cx="16" cy="14" r="1.3" fill="currentColor"/></>,
  baby: <><circle cx="12" cy="8.5" r="5"/><path d="M10 8.2h.01M14 8.2h.01"/><path d="M10.5 10.6a2 2 0 0 0 3 0"/><path d="M7 21c.6-3 2.6-4.5 5-4.5s4.4 1.5 5 4.5"/></>,
  child: <><circle cx="12" cy="6" r="3"/><path d="M8 21v-6l-2-3 3-2h6l3 2-2 3v6"/><path d="M12 15v6"/></>,
  piggy: <><path d="M5 11a7 6 0 0 1 12.5-3.5H20v4l-2 1V16h-2.5v3h-3v-2h-3v2H7v-3.5A6 6 0 0 1 5 11Z"/><path d="M15 10.5h.01"/><path d="M3 9.5c0 1.2.9 2 2 2"/></>,
  plus: <path d="M12 5v14M5 12h14"/>,
  chevron: <path d="m9 6 6 6-6 6"/>,
  calendar: <><rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M8 3v4M16 3v4M3.5 10h17"/></>,
  sparkle: <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>,
}

export type IconName = keyof typeof P
export function Icon({ name, size = 20, className, strokeWidth = 2 }: { name: string; size?: number; className?: string; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={cn('flex-shrink-0', className)} aria-hidden>
      {P[name] ?? P.sparkle}
    </svg>
  )
}
