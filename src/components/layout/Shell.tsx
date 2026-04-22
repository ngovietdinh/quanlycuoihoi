'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'

const NAV = [
  { href:'/dashboard', emoji:'⊞', label:'Tổng quan' },
  { href:'/projects',  emoji:'🌸', label:'Dự án' },
]

export function Shell({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth()
  const path = usePathname()
  const initial = user?.email?.[0]?.toUpperCase() ?? '?'

  return (
    <div className="flex min-h-screen bg-ink-50/30">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 min-h-screen sticky top-0 border-r border-ink-100/60"
        style={{background:'linear-gradient(180deg, #fffdf9 0%, #fff8f0 100%)'}}>
        {/* Brand */}
        <div className="px-5 py-6 border-b border-ink-100/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shadow-glow-sakura"
              style={{background:'linear-gradient(135deg, #ff6b96, #ff3d78)'}}>
              🌸
            </div>
            <div>
              <p className="font-display font-bold text-ink-900 text-base leading-tight">Lễ Ăn Hỏi</p>
              <p className="text-[10px] text-ink-400 font-medium tracking-wider uppercase">Wedding Manager</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          <p className="text-[10px] font-bold text-ink-400 uppercase tracking-widest px-3 mb-3">Menu chính</p>
          {NAV.map(n => {
            const active = path === n.href || (n.href !== '/dashboard' && path.startsWith(n.href+'/'))
            return (
              <Link key={n.href} href={n.href} className={active ? 'nav-link-active' : 'nav-link'}>
                <span className="text-base w-5 text-center leading-none">{n.emoji}</span>
                {n.label}
                {active && <span className="ml-auto w-2 h-2 rounded-full bg-sakura-400 animate-pulse-glow"/>}
              </Link>
            )
          })}
        </nav>

        {/* User */}
        <div className="px-3 py-4 border-t border-ink-100/50 space-y-1">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-ink-50 transition-colors cursor-pointer group">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
              style={{background:'linear-gradient(135deg, #ff6b96, #f59e0b)'}}>
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-ink-800 truncate">{user?.email ?? ''}</p>
              <p className="text-[10px] text-ink-400">Tài khoản của tôi</p>
            </div>
          </div>
          <button onClick={signOut}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-ink-500 hover:text-red-600 hover:bg-red-50 transition-all duration-200">
            <span className="text-base">⏻</span>
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-0">
        {children}
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 safe-bottom border-t border-ink-100"
        style={{background:'rgba(255,253,249,0.92)',backdropFilter:'blur(20px)'}}>
        <div className="flex items-center justify-around px-4 pt-2 pb-1">
          {NAV.map(n => {
            const active = path === n.href || (n.href !== '/dashboard' && path.startsWith(n.href+'/'))
            return (
              <Link key={n.href} href={n.href}
                className={cn('flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition-all duration-200',
                  active ? 'text-sakura-600' : 'text-ink-400')}>
                <span className={cn('text-2xl transition-transform duration-200', active && 'scale-110')}>{n.emoji}</span>
                <span className="text-[10px] font-semibold">{n.label}</span>
                {active && <span className="w-1.5 h-1.5 rounded-full bg-sakura-400"/>}
              </Link>
            )
          })}
          <button onClick={signOut}
            className="flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl text-ink-400 transition-all">
            <span className="text-2xl">⏻</span>
            <span className="text-[10px] font-semibold">Thoát</span>
          </button>
        </div>
      </nav>
    </div>
  )
}

export function TopBar({ title, subtitle, right }: { title:string; subtitle?:string; right?:React.ReactNode }) {
  return (
    <header className="sticky top-0 z-30 px-4 sm:px-6 py-4 border-b border-ink-100/60 flex items-center justify-between gap-4"
      style={{background:'rgba(255,253,249,0.92)',backdropFilter:'blur(20px)'}}>
      <div className="min-w-0">
        <h1 className="font-display text-xl sm:text-2xl font-semibold text-ink-900 truncate leading-tight">{title}</h1>
        {subtitle && <p className="text-xs text-ink-500 mt-0.5 truncate">{subtitle}</p>}
      </div>
      {right && <div className="flex items-center gap-2 flex-shrink-0">{right}</div>}
    </header>
  )
}
