import Link from 'next/link'
export default function NotFound() {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center">
        <div className="text-6xl mb-4 animate-float">🌸</div>
        <h1 className="font-display text-4xl font-bold text-stone-800 mb-2">404</h1>
        <p className="text-stone-500 mb-6">Trang này không tồn tại</p>
        <Link href="/dashboard" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-500 text-white text-sm font-medium hover:bg-rose-600 transition-colors">
          Về trang chủ
        </Link>
      </div>
    </div>
  )
}
