import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: { headers: req.headers } })
  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (list) => {
          list.forEach(({name,value}) => req.cookies.set(name,value))
          res = NextResponse.next({ request: req })
          list.forEach(({name,value,options}) => res.cookies.set(name,value,options))
        }
    }}
  )
  const { data: { user } } = await client.auth.getUser()
  const { pathname } = req.nextUrl
  const isAuth = pathname.startsWith('/auth')
  if (!user && !isAuth && pathname !== '/') {
    return NextResponse.redirect(new URL('/auth/login', req.url))
  }
  if (user && isAuth) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }
  return res
}
export const config = { matcher: ['/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'] }
