'use client'
import { Logo } from '@/components/brand/Logo'
import { Icon } from '@/components/ui/Icon'
import { PageTransition, RouteProgress } from '@/components/motion'
import Link from 'next/link'
import { AUTHOR, copyright } from '@/lib/brand'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { useProfile, clearProfileCache } from '@/hooks/useProfile'

const BASE_NAV = [
  { href:'/dashboard',   icon:'grid',   label:'Tổng quan',  hint:'Lễ cưới & dự án' },
  { href:'/invitations', icon:'invite', label:'Thiệp cưới', hint:'Thiết kế & gửi thiệp' },
  { href:'/family',      icon:'family', label:'Gia đình',   hint:'Thu chi, con cái, tích lũy' },
  { href:'/account',     icon:'user',   label:'Tài khoản',  hint:'Hồ sơ & bảo mật' },
]
const ADMIN_NAV = { href:'/admin', icon:'shield', label:'Quản trị', hint:'Người dùng & hệ thống' }

export function Shell({ children }: { children: React.ReactNode }) {
  const { user, signOut: baseSignOut } = useAuth()
  const { profile, isAdmin } = useProfile()
  const path = usePathname()
  const displayName = profile?.full_name || user?.email || ''
  const initial = displayName?.[0]?.toUpperCase() ?? '?'
  const NAV = isAdmin ? [...BASE_NAV, ADMIN_NAV] : BASE_NAV
  const signOut = () => { clearProfileCache(); baseSignOut() }
  const isActive = (href: string) => path === href || path.startsWith(href + '/') || (href === '/dashboard' && path.startsWith('/projects/'))

  return (
    <div className="flex min-h-screen">
      {/* Desktop Sidebar — nền tối, mục đang chọn phát sáng */}
      <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 text-white overflow-hidden"
        style={{background:'linear-gradient(180deg,#17121f 0%,#1f1730 55%,#2a1533 100%)'}}>
        <div aria-hidden className="absolute -top-24 -left-20 w-72 h-72 rounded-full blur-3xl opacity-30" style={{background:'#ff3d78'}}/>
        <div aria-hidden className="absolute bottom-10 -right-24 w-72 h-72 rounded-full blur-3xl opacity-20" style={{background:'#8b5cf6'}}/>
        <div className="relative px-5 pt-6 pb-5">
          <Link href="/dashboard"><Logo size={40} tone="light"/></Link>
        </div>

        <nav className="relative flex-1 px-3 py-2 space-y-1 overflow-y-auto no-scrollbar">
          <p className="text-[11px] font-semibold text-white/35 px-3 mb-2">Không gian của bạn</p>
          {NAV.map(n => {
            const active = isActive(n.href)
            return (
              <Link key={n.href} href={n.href} aria-current={active ? 'page' : undefined}
                className={cn('side-link group', active && 'is-active')}>
                <span className="side-ic"><Icon name={n.icon} size={18}/></span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold leading-tight">{n.label}</span>
                  <span className="block text-[11px] text-white/40 truncate">{n.hint}</span>
                </span>
              </Link>
            )
          })}
        </nav>

        <div className="relative p-3 space-y-1">
          <Link href="/account" className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/[.06] hover:bg-white/10 border border-white/10 transition-colors">
            {profile?.avatar_url
              ? <img src={profile.avatar_url} alt="" className="w-9 h-9 rounded-xl object-cover flex-shrink-0"/>
              : <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                  style={{background:'linear-gradient(135deg, #ff6b96, #f59e0b)'}}>
                  {initial}
                </div>}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate">{displayName}</p>
              <p className="text-[11px] text-white/45">{isAdmin ? <span className="text-sakura-300 font-semibold">Quản trị viên</span> : 'Thành viên'}</p>
            </div>
          </Link>
          <button onClick={signOut}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-white/55 hover:text-white hover:bg-white/[.06] transition-colors">
            <Icon name="logout" size={17}/>
            Đăng xuất
          </button>
          <p className="px-3 pt-1 text-[11px] text-white/30 leading-snug">{copyright()}<br/>Tác giả: <span className="font-semibold text-white/50">{AUTHOR}</span></p>
        </div>
      </aside>

      {/* Main area */}
      <RouteProgress/>
      <PageTransition className="flex-1 flex flex-col min-w-0 pb-28 lg:pb-0">
        {children}
      </PageTransition>

      {/* Mobile: thanh tab nổi, mục đang chọn có viên nền gradient */}
      <nav className="lg:hidden fixed bottom-3 inset-x-3 z-40 safe-bottom rounded-[22px] border border-white/70 shadow-modal"
        style={{background:'rgba(255,255,255,0.86)',backdropFilter:'blur(20px) saturate(1.6)',WebkitBackdropFilter:'blur(20px) saturate(1.6)'}}>
        <div className="flex items-center justify-around px-1.5 py-1.5">
          {NAV.map(n => {
            const active = isActive(n.href)
            return (
              <Link key={n.href} href={n.href} aria-current={active ? 'page' : undefined}
                className={cn('relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl transition-colors duration-300 min-w-[64px]',
                  active ? 'text-white' : 'text-ink-400')}>
                {active && <span aria-hidden className="absolute inset-0 rounded-2xl tab-pill" style={{background:'linear-gradient(135deg,#ff3d78,#f97316)'}}/>}
                <span className="relative"><Icon name={n.icon} size={21}/></span>
                <span className="relative text-[11px] font-semibold">{n.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

export function TopBar({ title, subtitle, right }: { title:string; subtitle?:string; right?:React.ReactNode }) {
  return (
    <header className="sticky top-0 z-30 px-4 sm:px-6 py-4 border-b border-ink-100/60 flex items-center justify-between gap-4"
      style={{background:'rgba(255,255,255,0.92)',backdropFilter:'blur(20px)'}}>
      <div className="min-w-0">
        <h1 className="font-display text-xl sm:text-2xl font-semibold text-ink-900 truncate leading-snug">{title}</h1>
        {subtitle && <p className="text-xs text-ink-500 mt-0.5 truncate">{subtitle}</p>}
      </div>
      {right && <div className="flex items-center gap-2 flex-shrink-0">{right}</div>}
    </header>
  )
}
