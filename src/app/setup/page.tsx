export default function SetupPage() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const urlOk = url && url.startsWith('https://') && url.includes('.supabase.co')
  const keyOk = key && key.startsWith('eyJ') && key.length > 100

  return (
    <div className="min-h-screen bg-[#FAF7F0] flex items-center justify-center p-4">
      <div className="card max-w-lg w-full p-8">
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">🔧</div>
          <h1 className="font-display text-2xl font-bold text-[#2C1810]">Kiểm tra cấu hình</h1>
          <p className="text-sm text-[#A89080] mt-1">Truy cập trang này để kiểm tra env vars</p>
        </div>
        <div className="space-y-3">
          <div className={`flex items-center gap-3 p-4 rounded-xl border ${urlOk?'bg-emerald-50 border-emerald-200':'bg-red-50 border-red-200'}`}>
            <span className="text-xl">{urlOk?'✅':'❌'}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#2C1810]">NEXT_PUBLIC_SUPABASE_URL</p>
              <p className="text-xs text-[#A89080] truncate">{url||'Chưa được thiết lập'}</p>
            </div>
          </div>
          <div className={`flex items-center gap-3 p-4 rounded-xl border ${keyOk?'bg-emerald-50 border-emerald-200':'bg-red-50 border-red-200'}`}>
            <span className="text-xl">{keyOk?'✅':'❌'}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#2C1810]">NEXT_PUBLIC_SUPABASE_ANON_KEY</p>
              <p className="text-xs text-[#A89080] truncate">{key?`${key.slice(0,20)}...`:'Chưa được thiết lập'}</p>
            </div>
          </div>
        </div>
        {urlOk&&keyOk?(
          <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
            <p className="text-emerald-700 font-medium text-sm mb-3">✅ Cấu hình đúng! App sẵn sàng.</p>
            <a href="/" className="btn-primary inline-flex items-center gap-2">Vào ứng dụng</a>
          </div>
        ):(
          <div className="mt-6">
            <p className="text-sm font-medium text-[#2C1810] mb-2">Tạo file <code className="bg-[#F5EFE0] px-1.5 py-0.5 rounded text-[#C41E3A]">.env.local</code> ở thư mục gốc:</p>
            <pre className="text-xs bg-[#2C1810] text-green-400 rounded-xl p-4 overflow-auto">{`NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co\nNEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...`}</pre>
            <p className="text-xs text-[#A89080] mt-2">Lấy từ: Supabase Dashboard → Settings → API → restart npm run dev</p>
          </div>
        )}
      </div>
    </div>
  )
}
