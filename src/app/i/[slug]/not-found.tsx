import Link from 'next/link'
export default function InvitationNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 text-center" style={{ background: '#fbf8f1' }}>
      <div>
        <div className="text-6xl mb-4">💌</div>
        <h1 className="font-display text-3xl font-semibold text-ink-900 mb-2">Không tìm thấy thiệp cưới</h1>
        <p className="text-ink-500 mb-6">Đường dẫn có thể đã thay đổi hoặc thiệp chưa được phát hành.</p>
        <Link href="/" className="btn btn-primary btn-sm">Về trang chủ</Link>
      </div>
    </div>
  )
}
