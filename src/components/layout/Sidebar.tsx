'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/dashboard', icon: '⊞', label: 'Tổng quan' },
  { href: '/projects',  icon: '🌸', label: 'Dự án' },
  { href: '/tasks',     icon: '✓',  label: 'Đầu mục' },
  { href: '/budget',    icon: '◎',  label: 'Ngân sách' },
  { href: '/files',     icon: '⊡',  label: 'Tập tin' },
]

export function Sidebar() {
  const pathname = usePathname()
  return (
    <aside className="hidden lg:flex flex-col w-60 bg-white border-r border-rose-100/80 min-h-screen sticky top-0">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-rose-100/60">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center shadow-rose text-white text-sm font-bold">
            🌸
          </div>
          <div>
            <p className="font-display font-semibold text-stone-900 text-sm leading-tight">Lễ Ăn Hỏi</p>
            <p className="text-xs text-stone-400">Wedding Manager</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ href, icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                active
                  ? 'bg-rose-50 text-rose-600 shadow-sm'
                  : 'text-stone-500 hover:text-stone-900 hover:bg-stone-50'
              )}
            >
              <span className="text-base w-5 text-center">{icon}</span>
              {label}
              {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-rose-400" />}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-rose-100/60">
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-stone-50 cursor-pointer transition-colors">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-rose-300 to-amber-300 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">N</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-stone-800 truncate">Người dùng</p>
            <p className="text-xs text-stone-400 truncate">Admin</p>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a8a29e" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
        </div>
      </div>
    </aside>
  )
}

export function MobileBottomNav() {
  const pathname = usePathname()
  const mobileNav = NAV.slice(0, 5)
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/90 backdrop-blur-md border-t border-rose-100 safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-2">
        {mobileNav.map(({ href, icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-150 min-w-0',
                active ? 'text-rose-500' : 'text-stone-400'
              )}
            >
              <span className={cn('text-xl transition-transform duration-150', active && 'scale-110')}>{icon}</span>
              <span className="text-[10px] font-medium truncate">{label}</span>
              {active && <span className="w-1 h-1 rounded-full bg-rose-400 mt-0.5" />}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export function TopBar({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-rose-100/60 px-4 sm:px-6 py-3.5">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-lg sm:text-xl font-semibold text-stone-900 truncate">{title}</h1>
          {subtitle && <p className="text-xs text-stone-400 mt-0.5">{subtitle}</p>}
        </div>
        {right && <div className="flex items-center gap-2 flex-shrink-0">{right}</div>}
      </div>
    </header>
  )
}
