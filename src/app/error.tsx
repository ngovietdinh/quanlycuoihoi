'use client'
import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  const isEnvError = error.message?.includes('Supabase env vars') ||
                     error.message?.includes('Invalid path') ||
                     error.message?.includes('NEXT_PUBLIC_SUPABASE')

  return (
    <div className="min-h-screen bg-[#f6f5f9] flex items-center justify-center p-4">
      <div className="card max-w-lg w-full p-8 text-center">
        <div className="text-5xl mb-4">{isEnvError ? '⚙️' : '⚠️'}</div>
        <h2 className="font-display text-xl font-bold text-[#2C1810] mb-3">
          {isEnvError ? 'Thiếu cấu hình Supabase' : 'Đã xảy ra lỗi'}
        </h2>

        {isEnvError ? (
          <div className="text-left bg-[#f6f5f9] rounded-xl p-4 mb-6">
            <p className="text-sm text-[#463f53] font-medium mb-3">
              Tạo file <code className="bg-[#efedf3] px-1.5 py-0.5 rounded text-[#C41E3A]">.env.local</code> ở thư mục gốc với nội dung:
            </p>
            <pre className="text-xs bg-[#2C1810] text-green-400 rounded-xl p-4 overflow-auto">
{`NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...`}
            </pre>
            <p className="text-xs text-[#9a93a8] mt-3">
              Lấy giá trị từ: Supabase Dashboard → Settings → API
            </p>
          </div>
        ) : (
          <p className="text-[#9a93a8] text-sm mb-6">{error.message}</p>
        )}

        <div className="flex gap-3 justify-center">
          <button onClick={reset} className="btn-primary">Thử lại</button>
          <a href="/" className="btn-ghost border border-[#E8D5C4]">Về trang chủ</a>
        </div>
      </div>
    </div>
  )
}
