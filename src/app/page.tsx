import { Logo } from '@/components/brand/Logo'
import { Reveal, Spotlight, Tilt } from '@/components/motion'
import Link from 'next/link'
import { APP_NAME, AUTHOR, copyright } from '@/lib/brand'
import { sbServer } from '@/lib/supabase/server'
import { TEMPLATES, TEMPLATE_CATEGORIES, LAYOUTS, googleFontsHref, patternBg } from '@/lib/invitation/templates'

async function getUser() {
  try { const s = await sbServer(); return (await s.auth.getUser()).data.user } catch { return null }
}

const WEDDING = [
  ['💌', 'Thiệp cưới online', '18 mẫu thiệp, 7 bố cục bìa, hiệu ứng mở phong bì, nhạc nền, đếm ngược và ngày âm lịch.'],
  ['👥', 'Khách mời đúng tên', 'Mỗi khách một đường dẫn riêng, gửi nhanh qua Zalo, Messenger, SMS; xác nhận tham dự realtime.'],
  ['🎁', 'Hộp mừng cưới QR', 'Mã VietQR tự động cho mọi ngân hàng — khách quét là chuyển khoản ngay.'],
  ['📋', 'Kế hoạch & ngân sách cưới', 'Kanban công việc, nhà cung cấp, lịch trình ngày cưới, cảnh báo vượt ngân sách.'],
]
const FAMILY = [
  ['💰', 'Thu chi gia đình', 'Nhiều ví, thu nhập từng người, ngân sách tháng, khoản định kỳ có nhắc hạn, báo cáo & Excel.'],
  ['🤰', 'Thai sản', 'Theo dõi tuần thai, mốc khám, dự toán chi phí sinh, tính chế độ BHXH, danh sách đồ sơ sinh.'],
  ['🧒', 'Con cái', 'Lịch tiêm chủng tự động, biểu đồ tăng trưởng chuẩn WHO, học phí và nhật ký cột mốc.'],
  ['🐷', 'Tiết kiệm & tài sản', 'Mục tiêu tiết kiệm, khoản vay trả góp, sổ hiếu hỉ, tài sản và giấy tờ sắp hết hạn.'],
]
const JOURNEY = [
  ['💍', 'Cưới hỏi', 'Gửi thiệp, chốt khách, lo trọn ngày vui'],
  ['🏡', 'Về chung nhà', 'Ghi chép thu chi, đặt ngân sách tháng'],
  ['🤰', 'Đón con', 'Theo dõi thai kỳ, chuẩn bị chi phí sinh'],
  ['🧒', 'Nuôi con & tích lũy', 'Lịch tiêm, học phí, quỹ cho tương lai'],
]

export default async function Landing() {
  const user = await getUser()
  const cta = user ? { href: '/dashboard', label: 'Vào bảng điều khiển' } : { href: '/auth/register', label: 'Bắt đầu miễn phí' }
  return (
    <div className="min-h-screen bg-[#fdf8f0] text-ink-900">
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href={googleFontsHref(TEMPLATES.map(t => t.theme.heading_font))}/>
      <nav className="sticky top-0 z-40 border-b border-ink-100/60" style={{ background: 'rgba(253,248,240,.88)', backdropFilter: 'blur(16px)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo size={36} sub={false}/>
          </Link>
          <div className="flex items-center gap-2">
            <a href="#templates" className="btn btn-ghost btn-sm hidden sm:inline-flex">Mẫu thiệp</a>
            <a href="#journey" className="btn btn-ghost btn-sm hidden sm:inline-flex">Hành trình</a>
            <a href="#features" className="btn btn-ghost btn-sm hidden sm:inline-flex">Tính năng</a>
            {user
              ? <Link href="/dashboard" className="btn btn-primary btn-sm">Bảng điều khiển</Link>
              : <><Link href="/auth/login" className="btn btn-ghost btn-sm">Đăng nhập</Link><Link href="/auth/register" className="btn btn-primary btn-sm">Đăng ký</Link></>}
          </div>
        </div>
      </nav>

      <header className="relative overflow-hidden">
        <div className="hero-glow w-[28rem] h-[28rem] -top-32 -left-32" style={{ background: '#ff3d78' }}/>
        <div className="hero-glow w-[26rem] h-[26rem] top-40 -right-32" style={{ background: '#f59e0b', animationDelay: '-6s' }}/>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 grid lg:grid-cols-2 gap-12 items-center">
          <div className="stagger">
            <span className="badge badge-high mb-5 w-fit">✨ Thiệp cưới · Kế hoạch cưới · Tài chính gia đình</span>
            <h1 className="font-display text-5xl sm:text-6xl font-bold leading-[1.08] mb-5">
              Từ ngày cưới<br/><span className="text-gradient-sakura">tới cả tổ ấm</span>
            </h1>
            <p className="text-lg text-ink-600 mb-8 max-w-lg">Gửi thiệp cưới online đúng tên từng khách, lo trọn kế hoạch và ngân sách đám cưới — rồi tiếp tục cùng nhau quản lý thu chi, thai sản, con cái và tiết kiệm của gia đình.</p>
            <div className="flex flex-wrap gap-3">
              <Link href={cta.href} className="btn btn-primary btn-lg">{cta.label}</Link>
              <a href="/i/demo" target="_blank" className="btn btn-secondary btn-lg">👁 Xem thiệp mẫu</a>
            </div>
            <p className="text-xs text-ink-400 mt-5">Không cần cài đặt · Dùng chung cả nhà · Dữ liệu gia đình riêng tư</p>
          </div>
          <div className="relative flex justify-center animate-[fpIn_1s_cubic-bezier(.16,1,.3,1)_.25s_both]">
            <Tilt max={10}>
              <div className="phone-frame w-[300px] h-[600px] rotate-2 shadow-2xl">
                <iframe src="/i/demo?t=floral" title="Thiệp mẫu" className="w-full h-full bg-white" loading="lazy"/>
              </div>
            </Tilt>
            <div className="absolute -left-2 bottom-16 card px-4 py-3 animate-float hidden sm:block">
              <p className="text-[11px] text-ink-400">Xác nhận tham dự</p>
              <p className="font-bold text-jade-600">+ 128 khách sẽ đến 🎉</p>
            </div>
            <div className="absolute -right-2 top-16 card px-4 py-3 animate-float hidden sm:block" style={{ animationDelay: '1.5s' }}>
              <p className="text-[11px] text-ink-400">Ngân sách tháng này</p>
              <p className="font-semibold text-sm">Còn lại <span className="text-jade-600">8.650.000 ₫</span></p>
            </div>
          </div>
        </div>
      </header>

      <section id="journey" className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <Reveal className="text-center mb-12">
            <h2 className="font-display text-4xl font-bold mb-2">Một ứng dụng cho cả hành trình</h2>
            <p className="text-ink-500">Mỗi giai đoạn có công cụ riêng, dữ liệu nối tiếp nhau.</p>
          </Reveal>
          <ol className="relative grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4">
            <Reveal className="hidden lg:block absolute left-[12.5%] right-[12.5%] top-7 h-0.5 rounded-full bg-gradient-to-r from-sakura-300 via-sakura-400 to-gold-400 origin-left" y={0}><span/></Reveal>
            {JOURNEY.map(([i, t, d], k) => (
              <Reveal as="li" key={t} delay={k * 120} className="relative text-center">
                <span className="relative mx-auto w-14 h-14 rounded-2xl bg-white shadow-card border border-ink-100 flex items-center justify-center text-2xl">{i}
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-ink-900 text-white text-[11px] font-bold flex items-center justify-center">{k + 1}</span>
                </span>
                <h3 className="font-semibold mt-4">{t}</h3>
                <p className="text-sm text-ink-500 mt-1">{d}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section id="templates" className="py-16 sm:py-20 bg-white/60 border-y border-ink-100/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <Reveal className="text-center mb-10">
            <h2 className="font-display text-4xl font-bold mb-2">{TEMPLATES.length} mẫu thiệp cho mọi phong cách</h2>
            <p className="text-ink-500">Bấm vào từng mẫu để xem thiệp thật — màu sắc, font chữ, bố cục, hoa văn đều tùy chỉnh được.</p>
          </Reveal>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {TEMPLATES.map((t, k) => (
              <Reveal key={t.id} delay={(k % 4) * 70}><a href={`/i/demo?t=${t.id}`} target="_blank" className="group card-hover overflow-hidden block h-full">
                <div className="h-40 sm:h-44 relative flex flex-col items-center justify-center text-center" style={{ background: t.theme.background, backgroundImage: patternBg(t.theme.pattern, t.theme.primary), color: t.theme.primary }}>
                  <div className="absolute inset-3 border opacity-40 transition-all group-hover:inset-2" style={{ borderColor: t.theme.primary, borderRadius: t.theme.radius }}/>
                  <span className="text-[10px] tracking-[.35em] uppercase" style={{ color: t.theme.text, opacity: .6 }}>Save the date</span>
                  <span className="text-3xl sm:text-4xl my-1" style={{ fontFamily: `'${t.theme.heading_font}', cursive` }}>Anh &amp; Em</span>
                  <span className="text-xs tracking-widest" style={{ color: t.theme.text, opacity: .7 }}>{t.id === 'songhy' ? '囍 · 20.12' : '20 · 12'}</span>
                </div>
                <div className="p-3 sm:p-4 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm">{t.name} <span className="text-[11px] font-medium text-ink-400">· {TEMPLATE_CATEGORIES.find(c => c.id === t.category)?.label} · {LAYOUTS.find(l => l.id === t.theme.layout)?.label}</span></p>
                    <p className="text-xs text-ink-400 line-clamp-1">{t.tagline}</p>
                  </div>
                  <span className="text-sakura-500 group-hover:translate-x-1 transition">↗</span>
                </div>
              </a></Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-14">
          {([['Cho ngày cưới', 'Từ lời mời đầu tiên đến bàn tiệc cuối cùng.', WEDDING], ['Cho tổ ấm sau đó', 'Cả nhà cùng ghi chép, cùng theo dõi — mỗi người một quyền.', FAMILY]] as const).map(([h, sub, list]) => (
            <div key={h}>
              <Reveal className="mb-6 flex flex-wrap items-end justify-between gap-2">
                <h2 className="font-display text-3xl sm:text-4xl font-bold">{h}</h2>
                <p className="text-ink-500">{sub}</p>
              </Reveal>
              <Spotlight className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {list.map(([i, t, d], k) => (
                  <Reveal key={t} delay={k * 80} className="h-full">
                    <div className="spot card p-5 h-full transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-card-hover">
                      <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl mb-3" style={{ background: 'linear-gradient(135deg,rgba(255,61,120,.1),rgba(245,158,11,.1))' }}>{i}</div>
                      <h3 className="font-semibold mb-1">{t}</h3>
                      <p className="text-sm text-ink-500">{d}</p>
                    </div>
                  </Reveal>
                ))}
              </Spotlight>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 sm:px-6 pb-20">
        <Reveal><div className="hero max-w-6xl mx-auto p-10 sm:p-14 text-center">
          <div className="hero-bubble w-40 h-40 -top-10 -right-10"/>
          <div className="relative">
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-white mb-3">Bắt đầu hành trình của nhà mình</h2>
            <p className="text-white/60 mb-8">Tạo tài khoản miễn phí, mời người thân cùng dùng.</p>
            <Link href={cta.href} className="btn btn-gold btn-lg">{cta.label}</Link>
          </div>
        </div></Reveal>
      </section>
      <footer className="border-t border-ink-100/60 py-8 text-center text-xs text-ink-400 space-y-1">
        <p>{APP_NAME} · Thiệp cưới online, kế hoạch cưới &amp; quản lý gia đình</p>
        <p>{copyright()}</p>
        <p>Thiết kế &amp; phát triển bởi <b className="text-ink-600 whitespace-nowrap">{AUTHOR}</b></p>
      </footer>
    </div>
  )
}
