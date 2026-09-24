import { NextResponse, type NextRequest } from 'next/server'
import { sbServer } from '@/lib/supabase/server'

// Xác thực email / đặt lại mật khẩu: đổi mã PKCE lấy phiên đăng nhập
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const next = req.nextUrl.searchParams.get('next') || '/dashboard'
  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard'
  if (code) {
    const s = await sbServer()
    const { error } = await s.auth.exchangeCodeForSession(code)
    if (error) return NextResponse.redirect(new URL(`/auth/login?error=${encodeURIComponent(error.message)}`, req.url))
  }
  return NextResponse.redirect(new URL(safeNext, req.url))
}
