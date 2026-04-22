import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#FAF7F0] flex items-center justify-center p-4">
      <div className="text-center">
        <div className="text-6xl mb-4">🌸</div>
        <h1 className="font-display text-3xl font-bold text-[#2C1810] mb-2">404</h1>
        <p className="text-[#A89080] mb-6">Trang này không tồn tại</p>
        <Link href="/" className="btn-primary">
          Về trang chủ
        </Link>
      </div>
    </div>
  )
}
