'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'

const NAV = [
  { href:'/dashboard', icon:'⊞', label:'Tổng quan' },
  { href:'/projects',  icon:'🌸', label:'Dự án' },
]

export function Shell({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth()
  const path = usePathname()

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 bg-white border-r border-rose-100/80 min-h-screen sticky top-0">
        <div className="px-4 py-5 border-b border-rose-100/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center text-sm">🌸</div>
            <div>
              <p className="font-display font-semibold text-stone-900 text-sm leading-tight">Lễ Ăn Hỏi</p>
              <p className="text-[10px] text-stone-400">Wedding Manager</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-3 space-y-0.5">
          {NAV.map(n => {
            const active = path === n.href || path.startsWith(n.href+'/')
            return (
              <Link key={n.href} href={n.href} className={active ? 'nav-link-active' : 'nav-link'}>
                <span className="text-base w-5 text-center">{n.icon}</span>
                {n.label}
                {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-rose-400"/>}
              </Link>
            )
          })}
        </nav>
        <div className="px-3 pb-4 border-t border-rose-100/60 pt-3">
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-stone-50 transition-colors">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-rose-300 to-amber-300 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {user?.email?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-stone-800 truncate">{user?.email ?? ''}</p>
            </div>
            <button onClick={signOut} title="Đăng xuất" className="text-stone-400 hover:text-rose-500 transition-colors text-xs">✕</button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-0">
        {children}
      </div>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-rose-100 safe-bottom">
        <div className="flex items-center justify-around px-2 py-1.5">
          {NAV.map(n => {
            const active = path === n.href || path.startsWith(n.href+'/')
            return (
              <Link key={n.href} href={n.href}
                className={cn('flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all',active?'text-rose-500':'text-stone-400')}>
                <span className={cn('text-xl',active&&'scale-110')}>{n.icon}</span>
                <span className="text-[10px] font-medium">{n.label}</span>
                {active && <span className="w-1 h-1 rounded-full bg-rose-400"/>}
              </Link>
            )
          })}
          <button onClick={signOut} className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl text-stone-400">
            <span className="text-xl">⏻</span>
            <span className="text-[10px] font-medium">Thoát</span>
          </button>
        </div>
      </nav>
    </div>
  )
}

export function TopBar({ title, subtitle, right }: { title:string; subtitle?:string; right?:React.ReactNode }) {
  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-rose-100/60 px-4 sm:px-6 py-3.5">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-xl font-semibold text-stone-900 truncate">{title}</h1>
          {subtitle && <p className="text-xs text-stone-400 mt-0.5">{subtitle}</p>}
        </div>
        {right && <div className="flex items-center gap-2 flex-shrink-0">{right}</div>}
      </div>
    </header>
  )
}
