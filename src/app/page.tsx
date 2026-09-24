import Link from 'next/link'
import { sbServer } from '@/lib/supabase/server'
import { TEMPLATES, TEMPLATE_CATEGORIES, LAYOUTS, googleFontsHref, patternBg } from '@/lib/invitation/templates'

async function getUser() {
  try { const s = await sbServer(); return (await s.auth.getUser()).data.user } catch { return null }
}

const FEATURES = [
  ['💌', 'Thiệp cưới online', '18 mẫu thiệp, 7 bố cục trang bìa, hiệu ứng mở phong bì, cánh hoa rơi, nhạc nền và đếm ngược.'],
  ['🎨', 'Tùy biến giao diện', 'Đổi màu, font chữ tiếng Việt, bố cục trang bìa, bật/tắt và sắp xếp từng phần theo ý thích.'],
  ['👥', 'Khách mời cá nhân hóa', 'Mỗi khách có đường dẫn riêng với lời chào đúng tên, gửi nhanh qua Zalo, Messenger, SMS.'],
  ['✉️', 'Xác nhận tham dự', 'Khách phản hồi trực tuyến, thống kê số người realtime, xuất Excel cho nhà hàng.'],
  ['🎁', 'Hộp mừng cưới QR', 'Mã VietQR tự động cho mọi ngân hàng — khách quét là chuyển khoản ngay.'],
  ['🌙', 'Ngày âm lịch', 'Tự động hiển thị ngày âm lịch & năm can chi, thêm vào Google Calendar một chạm.'],
  ['📋', 'Kế hoạch & ngân sách', 'Bảng Kanban đầu mục, theo dõi chi tiêu theo danh mục, cảnh báo vượt ngân sách.'],
  ['🔐', 'Cộng tác & phân quyền', 'Mời người thân cùng lên kế hoạch với quyền Biên tập / Chỉ xem, trang quản trị cho admin.'],
]

export default async function Landing() {
  const user = await getUser()
  const cta = user ? { href: '/dashboard', label: 'Vào bảng điều khiển →' } : { href: '/auth/register', label: 'Tạo thiệp miễn phí →' }
  return (
    <div className="min-h-screen bg-[#fdf8f0] text-ink-900">
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href={googleFontsHref(TEMPLATES.map(t => t.theme.heading_font))}/>
      <nav className="sticky top-0 z-40 border-b border-ink-100/60" style={{ background: 'rgba(253,248,240,.88)', backdropFilter: 'blur(16px)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shadow-glow-sakura" style={{ background: 'linear-gradient(135deg,#ff6b96,#ff3d78)' }}>💍</span>
            <span className="font-display text-xl font-bold">Hỷ Sự</span>
          </Link>
          <div className="flex items-center gap-2">
            <a href="#templates" className="btn btn-ghost btn-sm hidden sm:inline-flex">Mẫu thiệp</a>
            <a href="#features" className="btn btn-ghost btn-sm hidden sm:inline-flex">Tính năng</a>
            {user
              ? <Link href="/dashboard" className="btn btn-primary btn-sm">Bảng điều khiển</Link>
              : <><Link href="/auth/login" className="btn btn-ghost btn-sm">Đăng nhập</Link><Link href="/auth/register" className="btn btn-primary btn-sm">Đăng ký</Link></>}
          </div>
        </div>
      </nav>

      <header className="relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full opacity-20 blur-3xl" style={{ background: '#ff3d78' }}/>
        <div className="absolute top-40 -right-24 w-96 h-96 rounded-full opacity-20 blur-3xl" style={{ background: '#f59e0b' }}/>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 grid lg:grid-cols-2 gap-12 items-center">
          <div className="animate-fadeUp">
            <span className="badge badge-high mb-5">✨ Thiệp cưới online · Quản lý lễ cưới</span>
            <h1 className="font-display text-5xl sm:text-6xl font-bold leading-[1.05] mb-5">
              Ngày trọng đại,<br/><span className="text-gradient-sakura">trọn vẹn từng chi tiết</span>
            </h1>
            <p className="text-lg text-ink-600 mb-8 max-w-lg">Thiết kế thiệp cưới online thật đẹp, gửi lời mời cá nhân hóa tới từng khách, theo dõi xác nhận tham dự và quản lý toàn bộ kế hoạch – ngân sách đám cưới ở một nơi.</p>
            <div className="flex flex-wrap gap-3">
              <Link href={cta.href} className="btn btn-primary btn-lg">{cta.label}</Link>
              <a href="/i/demo" target="_blank" className="btn btn-secondary btn-lg">👁 Xem thiệp mẫu</a>
            </div>
            <p className="text-xs text-ink-400 mt-5">Không cần cài đặt · Tối ưu cho điện thoại · Chia sẻ qua Zalo, Facebook</p>
          </div>
          <div className="relative flex justify-center">
            <div className="phone-frame w-[300px] h-[600px] rotate-2 shadow-2xl">
              <iframe src="/i/demo?t=floral" title="Thiệp mẫu" className="w-full h-full bg-white" loading="lazy"/>
            </div>
            <div className="absolute -left-2 bottom-16 card px-4 py-3 animate-float hidden sm:block">
              <p className="text-[10px] text-ink-400">Xác nhận tham dự</p>
              <p className="font-bold text-jade-600">+ 128 khách sẽ đến 🎉</p>
            </div>
            <div className="absolute -right-2 top-16 card px-4 py-3 animate-float hidden sm:block" style={{ animationDelay: '1.5s' }}>
              <p className="text-[10px] text-ink-400">Lời chúc mới</p>
              <p className="font-semibold text-sm">“Trăm năm hạnh phúc!” 💕</p>
            </div>
          </div>
        </div>
      </header>

      <section id="templates" className="py-16 sm:py-20 bg-white/60 border-y border-ink-100/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="font-display text-4xl font-bold mb-2">{TEMPLATES.length} mẫu thiệp cho mọi phong cách</h2>
            <p className="text-ink-500">Bấm vào từng mẫu để xem thiệp thật — màu sắc, font chữ, bố cục, hoa văn đều tùy chỉnh được.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {TEMPLATES.map(t => (
              <a key={t.id} href={`/i/demo?t=${t.id}`} target="_blank" className="group card-hover overflow-hidden">
                <div className="h-40 sm:h-44 relative flex flex-col items-center justify-center text-center" style={{ background: t.theme.background, backgroundImage: patternBg(t.theme.pattern, t.theme.primary), color: t.theme.primary }}>
                  <div className="absolute inset-3 border opacity-40 transition-all group-hover:inset-2" style={{ borderColor: t.theme.primary, borderRadius: t.theme.radius }}/>
                  <span className="text-[10px] tracking-[.35em] uppercase" style={{ color: t.theme.text, opacity: .6 }}>Save the date</span>
                  <span className="text-3xl sm:text-4xl my-1" style={{ fontFamily: `'${t.theme.heading_font}', cursive` }}>Anh &amp; Em</span>
                  <span className="text-xs tracking-widest" style={{ color: t.theme.text, opacity: .7 }}>{t.id === 'songhy' ? '囍 · 20.12' : '20 · 12'}</span>
                </div>
                <div className="p-3 sm:p-4 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm">{t.name} <span className="text-[10px] font-medium text-ink-400">· {TEMPLATE_CATEGORIES.find(c => c.id === t.category)?.label} · {LAYOUTS.find(l => l.id === t.theme.layout)?.label}</span></p>
                    <p className="text-xs text-ink-400 line-clamp-1">{t.tagline}</p>
                  </div>
                  <span className="text-sakura-500 group-hover:translate-x-1 transition">↗</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="font-display text-4xl font-bold mb-2">Mọi thứ cho ngày cưới</h2>
            <p className="text-ink-500">Từ lời mời đầu tiên đến bàn tiệc cuối cùng.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map(([i, t, d]) => (
              <div key={t} className="card p-5">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl mb-3" style={{ background: 'linear-gradient(135deg,rgba(255,61,120,.1),rgba(245,158,11,.1))' }}>{i}</div>
                <h3 className="font-semibold mb-1">{t}</h3>
                <p className="text-sm text-ink-500">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6 pb-20">
        <div className="hero max-w-6xl mx-auto p-10 sm:p-14 text-center">
          <div className="hero-bubble w-40 h-40 -top-10 -right-10"/>
          <div className="relative">
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-white mb-3">Bắt đầu hành trình hạnh phúc</h2>
            <p className="text-white/60 mb-8">Tạo thiệp cưới đầu tiên của bạn chỉ trong 5 phút.</p>
            <Link href={cta.href} className="btn btn-gold btn-lg">{cta.label}</Link>
          </div>
        </div>
      </section>
      <footer className="border-t border-ink-100/60 py-8 text-center text-xs text-ink-400">© {new Date().getFullYear()} Hỷ Sự · Quản lý lễ cưới & thiệp cưới online 💍</footer>
    </div>
  )
}
