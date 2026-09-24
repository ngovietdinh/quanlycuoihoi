import { createServerClient, type CookieOptions } from '@supabase/ssr'
type CookieList = { name: string; value: string; options?: CookieOptions }[]
import { NextResponse, type NextRequest } from 'next/server'

// Trang công khai: không cần đăng nhập
const isPublic = (p: string) => p === '/' || p.startsWith('/i/') || p.startsWith('/setup') || p === '/auth/locked' || p === '/auth/callback'

export async function middleware(req: NextRequest) {
  // Thiệp công khai được xem nhiều nhất → bỏ qua bước xác thực
  if (req.nextUrl.pathname.startsWith('/i/')) return NextResponse.next()
  let res = NextResponse.next({ request: { headers: req.headers } })
  const client = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll:()=>req.cookies.getAll(), setAll(l: CookieList){l.forEach(({name,value})=>req.cookies.set(name,value));res=NextResponse.next({request:req});l.forEach(({name,value,options})=>res.cookies.set(name,value,options))} } })
  const { data: { user } } = await client.auth.getUser()
  const { pathname } = req.nextUrl
  const isAuth = pathname.startsWith('/auth') && pathname !== '/auth/locked' && pathname !== '/auth/callback'

  if (isPublic(pathname)) return res
  if (!user && !isAuth) {
    const url = new URL('/auth/login', req.url)
    url.searchParams.set('next', pathname + req.nextUrl.search)
    return NextResponse.redirect(url)
  }
  if (user && isAuth) return NextResponse.redirect(new URL('/dashboard', req.url))

  if (user) {
    // Tài khoản bị khóa / phân quyền khu vực quản trị
    const { data: profile } = await client.from('profiles').select('role,is_active').eq('id', user.id).maybeSingle()
    if (profile && profile.is_active === false) return NextResponse.redirect(new URL('/auth/locked', req.url))
    if (pathname.startsWith('/admin') && profile?.role !== 'admin') return NextResponse.redirect(new URL('/dashboard?denied=1', req.url))
  }
  return res
}
export const config = { matcher: ['/((?!_next/static|_next/image|favicon\\.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp3|ico)$).*)'] }
