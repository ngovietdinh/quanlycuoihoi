import { NextResponse, type NextRequest } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import { sbServer } from '@/lib/supabase/server'

/**
 * Điểm quay về từ email (xác nhận đăng ký, liên kết đăng nhập, đặt lại mật khẩu) và Google.
 *  - ?token_hash=…&type=…  → verifyOtp: mở được trên MỌI thiết bị/trình duyệt (dùng với mẫu email trong supabase/email-templates)
 *  - ?code=…               → PKCE: chỉ chạy trên đúng trình duyệt đã yêu cầu (mẫu email mặc định của Supabase, Google)
 *  - ?error=…              → Supabase báo lỗi (liên kết hết hạn, đã dùng…)
 */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams
  const n = q.get('next') || '/dashboard'
  const next = n.startsWith('/') && !n.startsWith('//') ? n : '/dashboard'
  const fail = (msg: string) => NextResponse.redirect(new URL(`/auth/login?error=${encodeURIComponent(msg)}`, req.url))

  const supaErr = q.get('error_code') || q.get('error_description') || q.get('error')
  if (supaErr) return fail(q.get('error_code') === 'otp_expired' ? 'otp_expired' : (q.get('error_description') || supaErr))

  const s = await sbServer()
  const tokenHash = q.get('token_hash'), type = q.get('type') as EmailOtpType | null
  if (tokenHash && type) {
    const { error } = await s.auth.verifyOtp({ token_hash: tokenHash, type })
    if (error) return fail(error.message)
    return NextResponse.redirect(new URL(type === 'recovery' ? '/account?reset=1' : next, req.url))
  }

  const code = q.get('code')
  if (code) {
    const { error } = await s.auth.exchangeCodeForSession(code)
    // Mở liên kết trên thiết bị/trình duyệt khác với nơi đã bấm "Đăng ký"/"Gửi liên kết" → thiếu code verifier
    if (error) return fail(/code verifier|both auth code/i.test(error.message) ? 'pkce_other_device' : error.message)
  }
  return NextResponse.redirect(new URL(next, req.url))
}
