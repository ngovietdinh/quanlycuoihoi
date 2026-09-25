/** Dịch thông báo lỗi của Supabase Auth sang tiếng Việt */
export function viAuthError(msg?: string | null): string {
  if (!msg) return 'Đã có lỗi xảy ra, vui lòng thử lại'
  const m = msg.toLowerCase()
  if (m.includes('invalid login credentials')) return 'Email hoặc mật khẩu không đúng'
  if (m.includes('email not confirmed')) return 'Email chưa được xác nhận. Hãy mở hộp thư và bấm vào liên kết xác nhận.'
  if (m.includes('user already registered') || m.includes('already been registered')) return 'Email này đã được đăng ký. Hãy đăng nhập hoặc dùng "Quên mật khẩu".'
  if (m.includes('password should be at least')) return 'Mật khẩu phải có ít nhất 6 ký tự'
  if (m.includes('weak password') || m.includes('password is known')) return 'Mật khẩu quá yếu hoặc quá phổ biến, hãy chọn mật khẩu khác'
  const wait = msg.match(/after (\d+) seconds?/i)
  if (wait) return `Vì lý do bảo mật, vui lòng đợi ${wait[1]} giây rồi thử lại`
  if (m.includes('rate limit')) return 'Bạn đã thử quá nhiều lần, vui lòng thử lại sau ít phút'
  if (m.includes('unable to validate email') || m.includes('invalid email')) return 'Địa chỉ email không hợp lệ'
  if (m.includes('provider is not enabled') || m.includes('unsupported provider')) return 'Phương thức đăng nhập này chưa được bật trong Supabase'
  if (m.includes('signups not allowed') || m.includes('signup is disabled')) return 'Hệ thống đang tạm khóa đăng ký tài khoản mới'
  if (m.includes('failed to fetch') || m.includes('network')) return 'Không kết nối được máy chủ. Kiểm tra mạng hoặc cấu hình Supabase.'
  return msg
}

/** Đánh giá độ mạnh mật khẩu: 0–4 */
export function passwordScore(pw: string) {
  let s = 0
  if (pw.length >= 8) s++
  if (pw.length >= 12) s++
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++
  if (/\d/.test(pw)) s++
  if (/[^A-Za-z0-9]/.test(pw)) s++
  return Math.min(4, pw.length < 6 ? 0 : s)
}
export const SCORE_LABEL = ['Quá ngắn', 'Yếu', 'Trung bình', 'Khá mạnh', 'Rất mạnh']
export const SCORE_COLOR = ['bg-red-400', 'bg-orange-400', 'bg-gold-400', 'bg-jade-400', 'bg-jade-600']
