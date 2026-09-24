import type {
  InvitationContent, InvitationTheme, TemplateId, TemplateCategory, EffectId, CoverLayout, PatternId, SectionConfig, SectionId, Invitation,
} from '@/types'

// ── Mẫu thiệp ─────────────────────────────────────────────────────────────────
export type OrnamentId = 'line' | 'floral' | 'geo' | 'songhy' | 'leaf' | 'star' | 'lotus' | 'deco' | 'wave' | 'heart'
export interface TemplateDef {
  id: TemplateId
  name: string
  tagline: string
  category: TemplateCategory
  theme: Omit<InvitationTheme, 'template' | 'music_url' | 'envelope'>
  ornament: OrnamentId
}

export const TEMPLATE_CATEGORIES: { id: TemplateCategory | 'all'; label: string }[] = [
  { id:'all', label:'Tất cả' }, { id:'traditional', label:'Truyền thống' }, { id:'romantic', label:'Lãng mạn' },
  { id:'modern', label:'Hiện đại' }, { id:'luxury', label:'Sang trọng' }, { id:'nature', label:'Thiên nhiên' },
]

const T = (id: TemplateId, name: string, tagline: string, category: TemplateCategory, ornament: OrnamentId,
  theme: TemplateDef['theme']): TemplateDef => ({ id, name, tagline, category, ornament, theme })

export const TEMPLATES: TemplateDef[] = [
  // Truyền thống
  T('songhy', 'Song Hỷ', 'Đỏ son & vàng kim, đậm bản sắc cưới Việt', 'traditional', 'songhy',
    { layout:'overlay', primary:'#b3121f', accent:'#e6b74a', background:'#fff8ee', text:'#3d0d0d', heading_font:'Playfair Display', body_font:'Be Vietnam Pro', effect:'sparkles', overlay:50, radius:12, pattern:'damask' }),
  T('lotus', 'Sen hồng', 'Hoa sen thanh khiết, nét duyên Á Đông', 'traditional', 'lotus',
    { layout:'circle', primary:'#b8466b', accent:'#f7d7dc', background:'#fff7f3', text:'#43222c', heading_font:'Playfair Display', body_font:'Be Vietnam Pro', effect:'petals', overlay:30, radius:16, pattern:'none' }),
  T('indochine', 'Đông Dương', 'Xanh ngọc & vàng đồng, hoài niệm Indochine', 'traditional', 'deco',
    { layout:'frame', primary:'#0f5257', accent:'#c9a45c', background:'#f3efe4', text:'#1d2b2c', heading_font:'Playfair Display', body_font:'Lora', effect:'none', overlay:40, radius:2, pattern:'grid' }),
  T('vintage', 'Hoài cổ', 'Giấy kraft & mực nâu, như lá thư tay xưa', 'traditional', 'line',
    { layout:'frame', primary:'#8b5e3c', accent:'#e3d3bb', background:'#f4ecdf', text:'#3e2b1c', heading_font:'Charm', body_font:'Lora', effect:'none', overlay:35, radius:4, pattern:'paper' }),
  // Lãng mạn
  T('floral', 'Hoa hồng', 'Hồng phấn dịu dàng, cánh hoa bay lãng mạn', 'romantic', 'floral',
    { layout:'arch', primary:'#c96b83', accent:'#f6d5dd', background:'#fff6f8', text:'#4a2f36', heading_font:'Dancing Script', body_font:'Lora', effect:'petals', overlay:30, radius:24, pattern:'none' }),
  T('sakura', 'Anh đào', 'Mùa xuân anh đào, ảnh polaroid xinh xắn', 'romantic', 'floral',
    { layout:'polaroid', primary:'#e0789a', accent:'#fde2ea', background:'#fff8fa', text:'#4b2a36', heading_font:'Dancing Script', body_font:'Quicksand', effect:'petals', overlay:25, radius:18, pattern:'dots' }),
  T('lavender', 'Oải hương', 'Tím oải hương mơ màng, ngọt ngào', 'romantic', 'heart',
    { layout:'circle', primary:'#7a5c99', accent:'#e8def3', background:'#faf7fd', text:'#33263f', heading_font:'Great Vibes', body_font:'Lora', effect:'hearts', overlay:30, radius:20, pattern:'hearts' }),
  T('classic', 'Cổ điển', 'Ngà & vàng ánh kim, thanh lịch vượt thời gian', 'romantic', 'line',
    { layout:'overlay', primary:'#b08d57', accent:'#e9dcc3', background:'#fbf8f1', text:'#3b3024', heading_font:'Great Vibes', body_font:'Cormorant Garamond', effect:'sparkles', overlay:45, radius:4, pattern:'none' }),
  // Hiện đại
  T('modern', 'Tối giản', 'Đen trắng hiện đại, typography làm chủ đạo', 'modern', 'geo',
    { layout:'split', primary:'#111111', accent:'#c9a96e', background:'#ffffff', text:'#1b1b1b', heading_font:'Playfair Display', body_font:'Montserrat', effect:'none', overlay:20, radius:0, pattern:'none' }),
  T('pure', 'Thuần khiết', 'Trắng tinh khôi, bạc nhẹ nhàng, tuyết rơi', 'modern', 'line',
    { layout:'minimal', primary:'#6b7280', accent:'#eef0f3', background:'#ffffff', text:'#1f2937', heading_font:'Cormorant Garamond', body_font:'Montserrat', effect:'snow', overlay:25, radius:6, pattern:'none' }),
  T('mint', 'Bạc hà', 'Xanh bạc hà tươi mát, trẻ trung năng động', 'modern', 'geo',
    { layout:'polaroid', primary:'#2f8f7a', accent:'#d3efe6', background:'#f4fbf8', text:'#173b33', heading_font:'Playfair Display', body_font:'Nunito', effect:'confetti', overlay:25, radius:14, pattern:'dots' }),
  T('party', 'Tiệc vui', 'Rực rỡ pháo giấy, cho cặp đôi cá tính', 'modern', 'heart',
    { layout:'circle', primary:'#ff5a5f', accent:'#ffd166', background:'#fffaf0', text:'#2d2327', heading_font:'Lobster', body_font:'Nunito', effect:'confetti', overlay:25, radius:22, pattern:'none' }),
  // Sang trọng
  T('royal', 'Hoàng gia', 'Đỏ rượu vang & vàng kim, quý phái', 'luxury', 'deco',
    { layout:'frame', primary:'#7b1e3a', accent:'#d4af37', background:'#fbf6ef', text:'#2e1018', heading_font:'Great Vibes', body_font:'Cormorant Garamond', effect:'sparkles', overlay:45, radius:4, pattern:'damask' }),
  T('blackgold', 'Đen & Vàng', 'Nền đen ánh vàng, đẳng cấp tiệc tối', 'luxury', 'deco',
    { layout:'split', primary:'#d4af37', accent:'#2a2a2a', background:'#121212', text:'#f5efe0', heading_font:'Playfair Display', body_font:'Montserrat', effect:'sparkles', overlay:50, radius:2, pattern:'none' }),
  T('midnight', 'Đêm sao', 'Xanh đêm & ánh vàng, sang trọng huyền ảo', 'luxury', 'star',
    { layout:'minimal', primary:'#d9b77e', accent:'#233452', background:'#0f1a2b', text:'#f1ece2', heading_font:'Great Vibes', body_font:'Cormorant Garamond', effect:'sparkles', overlay:55, radius:8, pattern:'none' }),
  // Thiên nhiên
  T('garden', 'Khu vườn', 'Xanh lá xô thơm, phong cách tiệc ngoài trời', 'nature', 'leaf',
    { layout:'arch', primary:'#5f7a5b', accent:'#dfe6d3', background:'#f5f7f0', text:'#2c3a2a', heading_font:'Great Vibes', body_font:'Lora', effect:'leaves', overlay:35, radius:28, pattern:'none' }),
  T('ocean', 'Biển xanh', 'Cưới bên biển, sóng xanh & bong bóng', 'nature', 'wave',
    { layout:'overlay', primary:'#1f6f8b', accent:'#cde8ef', background:'#f3f9fb', text:'#15303a', heading_font:'Dancing Script', body_font:'Quicksand', effect:'bubbles', overlay:35, radius:20, pattern:'waves' }),
  T('autumn', 'Thu vàng', 'Lá phong đỏ cam, ấm áp mùa thu', 'nature', 'leaf',
    { layout:'arch', primary:'#b5542c', accent:'#f2d7b6', background:'#fdf6ec', text:'#3b2417', heading_font:'Great Vibes', body_font:'Lora', effect:'leaves', overlay:35, radius:24, pattern:'paper' }),
]
export const templateById = (id?: string) => TEMPLATES.find(t => t.id === id) ?? TEMPLATES.find(t => t.id === 'classic')!

// Font hỗ trợ tiếng Việt trên Google Fonts
export const HEADING_FONTS = ['Great Vibes','Dancing Script','Bonheur Royale','Moon Dance','Mea Culpa','Charm','Playfair Display','Cormorant Garamond','Lora','Be Vietnam Pro','Montserrat','Josefin Sans','Pacifico','Lobster']
export const BODY_FONTS    = ['Cormorant Garamond','Lora','Noto Serif','Montserrat','Be Vietnam Pro','Nunito','Quicksand','Josefin Sans','Playfair Display','Roboto Slab']
export const SCRIPT_FONTS  = new Set(['Great Vibes','Dancing Script','Bonheur Royale','Moon Dance','Mea Culpa','Charm','Pacifico','Lobster'])

export const googleFontsHref = (fonts: string[]) =>
  'https://fonts.googleapis.com/css2?' +
  Array.from(new Set(fonts.filter(Boolean)))
    .map(f => `family=${encodeURIComponent(f).replace(/%20/g, '+')}:ital,wght@0,400;0,500;0,600;0,700;1,400`)
    .join('&') + '&display=swap&subset=vietnamese'

export const EFFECTS: { id: EffectId; label: string; icon: string }[] = [
  { id:'petals',   label:'Cánh hoa',  icon:'🌸' },
  { id:'hearts',   label:'Trái tim',  icon:'💗' },
  { id:'sparkles', label:'Lấp lánh',  icon:'✨' },
  { id:'leaves',   label:'Lá rơi',    icon:'🍃' },
  { id:'snow',     label:'Tuyết',     icon:'❄️' },
  { id:'confetti', label:'Pháo giấy', icon:'🎊' },
  { id:'bubbles',  label:'Bong bóng', icon:'🫧' },
  { id:'none',     label:'Không',     icon:'⦸'  },
]

export const LAYOUTS: { id: CoverLayout; label: string; desc: string }[] = [
  { id:'overlay', label:'Toàn màn hình', desc:'Ảnh bìa phủ kín, chữ nổi trên ảnh' },
  { id:'arch',    label:'Khung vòm',     desc:'Ảnh trong khung vòm cổng cưới' },
  { id:'split',   label:'Chia đôi',      desc:'Ảnh một bên, chữ một bên' },
  { id:'minimal', label:'Tối giản',      desc:'Chỉ chữ và hoa văn, không ảnh' },
  { id:'frame',   label:'Khung ảnh',     desc:'Ảnh trong khung viền kép trên nền mờ' },
  { id:'circle',  label:'Vòng tròn',     desc:'Ảnh tròn, chữ chạy vòng quanh' },
  { id:'polaroid',label:'Polaroid',      desc:'Ảnh polaroid xếp nghiêng tinh nghịch' },
]

export const PATTERNS: { id: PatternId; label: string }[] = [
  { id:'none', label:'Trơn' }, { id:'dots', label:'Chấm bi' }, { id:'grid', label:'Ô lưới' }, { id:'damask', label:'Hoa văn' },
  { id:'waves', label:'Sóng' }, { id:'paper', label:'Giấy' }, { id:'hearts', label:'Trái tim' },
]

/** Hoa văn nền dạng SVG (màu theo màu chủ đạo, rất mờ) */
export function patternBg(id: PatternId | undefined, color: string): string | undefined {
  const c = encodeURIComponent(color)
  const svg = (w: number, h: number, body: string) =>
    `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'%3E${body}%3C/svg%3E")`
  switch (id) {
    case 'dots':   return svg(22, 22, `%3Ccircle cx='3' cy='3' r='1.6' fill='${c}' fill-opacity='.14'/%3E`)
    case 'grid':   return svg(28, 28, `%3Cpath d='M28 0H0v28' fill='none' stroke='${c}' stroke-opacity='.08'/%3E`)
    case 'damask': return svg(60, 60, `%3Cpath d='M30 8c6 8 14 10 14 22S36 50 30 52C24 50 16 42 16 30S24 16 30 8z' fill='none' stroke='${c}' stroke-opacity='.09'/%3E%3Ccircle cx='30' cy='30' r='3' fill='${c}' fill-opacity='.08'/%3E%3Ccircle cx='0' cy='0' r='3' fill='${c}' fill-opacity='.08'/%3E%3Ccircle cx='60' cy='60' r='3' fill='${c}' fill-opacity='.08'/%3E`)
    case 'waves':  return svg(80, 20, `%3Cpath d='M0 10c10-8 30-8 40 0s30 8 40 0' fill='none' stroke='${c}' stroke-opacity='.1'/%3E`)
    case 'paper':  return svg(120, 120, `%3Cpath d='M0 20h120M0 57h120M0 94h120' stroke='${c}' stroke-opacity='.045'/%3E%3Cpath d='M33 0v120M88 0v120' stroke='${c}' stroke-opacity='.03'/%3E`)
    case 'hearts': return svg(48, 48, `%3Cpath d='M24 34s-9-5.5-11-10.5C11.5 19 14 15 18 15c2.6 0 4.3 1.5 6 3.8 1.7-2.3 3.4-3.8 6-3.8 4 0 6.5 4 5 8.5C33 28.5 24 34 24 34z' fill='${c}' fill-opacity='.06'/%3E`)
    default: return undefined
  }
}

export const SECTION_LABELS: Record<SectionId, { label: string; icon: string; title: string }> = {
  countdown: { label:'Đếm ngược',       icon:'⏳', title:'Đếm ngược đến ngày vui' },
  couple:    { label:'Cô dâu & chú rể', icon:'💑', title:'Cô dâu & Chú rể' },
  story:     { label:'Chuyện tình yêu', icon:'📖', title:'Chuyện chúng mình' },
  events:    { label:'Sự kiện',         icon:'📍', title:'Thông tin lễ cưới' },
  gallery:   { label:'Album ảnh',        icon:'🖼️', title:'Album ảnh cưới' },
  rsvp:      { label:'Xác nhận tham dự', icon:'✉️', title:'Xác nhận tham dự' },
  wishes:    { label:'Sổ lưu bút',       icon:'💌', title:'Gửi lời chúc' },
  gift:      { label:'Hộp mừng cưới',    icon:'🎁', title:'Hộp mừng cưới' },
}
export const DEFAULT_SECTIONS: SectionConfig[] =
  (['countdown','couple','story','events','gallery','rsvp','wishes','gift'] as SectionId[]).map(id => ({ id, visible: true }))

// Ngân hàng phổ biến (mã dùng cho VietQR)
export const BANKS: { code: string; name: string }[] = [
  { code:'VCB', name:'Vietcombank' }, { code:'TCB', name:'Techcombank' }, { code:'MB', name:'MB Bank' },
  { code:'ICB', name:'VietinBank' },  { code:'BIDV', name:'BIDV' },       { code:'VBA', name:'Agribank' },
  { code:'ACB', name:'ACB' },         { code:'VPB', name:'VPBank' },      { code:'TPB', name:'TPBank' },
  { code:'STB', name:'Sacombank' },   { code:'HDB', name:'HDBank' },      { code:'VIB', name:'VIB' },
  { code:'SHB', name:'SHB' },         { code:'MSB', name:'MSB' },         { code:'OCB', name:'OCB' },
  { code:'SEAB', name:'SeABank' },    { code:'EIB', name:'Eximbank' },    { code:'LPB', name:'LPBank' },
  { code:'CAKE', name:'CAKE by VPBank' }, { code:'TIMO', name:'Timo' },
]
export const bankName = (code: string) => BANKS.find(b => b.code === code)?.name ?? code
export const vietQrUrl = (bank: string, acc: string, name: string, info = 'Mung cuoi') =>
  `https://img.vietqr.io/image/${encodeURIComponent(bank)}-${encodeURIComponent(acc)}-compact2.png?accountName=${encodeURIComponent(name)}&addInfo=${encodeURIComponent(info)}`

// ── Mặc định ──────────────────────────────────────────────────────────────────
export const uid = () => Math.random().toString(36).slice(2, 10)
const emptyPerson = { name:'', full_name:'', father:'', mother:'', bio:'', photo:'' }

export function defaultTheme(template: TemplateId = 'classic'): InvitationTheme {
  const t = templateById(template)
  return { template: t.id, ...t.theme, envelope: true, music_url: '' }
}

export function defaultContent(): InvitationContent {
  return {
    groom: { ...emptyPerson }, bride: { ...emptyPerson },
    headline: 'Save the date',
    invite_text: 'Trân trọng kính mời quý khách đến dự buổi tiệc chung vui cùng gia đình chúng tôi',
    quote: 'Yêu là cùng nhau nhìn về một hướng.',
    cover_url: '', hashtag: '', dress_code: [],
    story: [], events: [], gallery: [], gifts: [],
    sections: DEFAULT_SECTIONS.map(s => ({ ...s })),
    closing: 'Sự hiện diện của quý khách là niềm vinh hạnh cho gia đình chúng tôi!',
  }
}

/** Gộp dữ liệu từ DB (có thể thiếu trường do phiên bản cũ) với giá trị mặc định */
export function normalizeInvitation<T extends Pick<Invitation,'content'|'theme'>>(inv: T): T {
  const c = { ...defaultContent(), ...(inv.content ?? {}) } as InvitationContent
  c.groom = { ...emptyPerson, ...(c.groom ?? {}) }
  c.bride = { ...emptyPerson, ...(c.bride ?? {}) }
  const known = new Set(c.sections?.map(s => s.id))
  c.sections = [...(c.sections ?? []), ...DEFAULT_SECTIONS.filter(s => !known.has(s.id))]
  const th = { ...defaultTheme((inv.theme as any)?.template), ...(inv.theme ?? {}) } as InvitationTheme
  return { ...inv, content: c, theme: th }
}

export function slugify(s: string) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40)
}
export const makeSlug = (groom: string, bride: string) =>
  `${slugify(groom || 'chu-re')}-${slugify(bride || 'co-dau')}-${Math.random().toString(36).slice(2, 6)}`

// ── Dữ liệu mẫu (trang /i/demo) ───────────────────────────────────────────────
const img = (id: string, w = 1200) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=75`

export function demoInvitation(template: TemplateId = 'classic'): Invitation {
  // Mọi mốc giờ tính theo giờ Việt Nam (+07:00), không phụ thuộc múi giờ máy chủ
  const year = new Date().getFullYear() - 2
  const d = (m: number, day: number) => new Date(`${year}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}T12:00:00+07:00`).toISOString()
  const day = new Date(Date.now() + 45 * 864e5 + 7 * 36e5).toISOString().slice(0, 10)
  const wedding = new Date(`${day}T11:00:00+07:00`)
  const ceremony = new Date(`${day}T08:30:00+07:00`)
  return {
    id: 'demo', user_id: 'demo', project_id: null, slug: 'demo', title: 'Minh Anh & Thu Trang',
    event_date: wedding.toISOString(), is_published: true, view_count: 1024,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    theme: defaultTheme(template),
    content: {
      groom: { name:'Minh Anh', full_name:'Nguyễn Minh Anh', father:'Ông Nguyễn Văn Hùng', mother:'Bà Trần Thị Lan',
        bio:'Kỹ sư phần mềm, mê cà phê và những chuyến đi xa. Người luôn làm cô ấy cười mỗi ngày.', photo: img('photo-1507003211169-0a1dd7228f2d', 600) },
      bride: { name:'Thu Trang', full_name:'Lê Thu Trang', father:'Ông Lê Quang Minh', mother:'Bà Phạm Thị Hoa',
        bio:'Cô giáo mầm non, yêu hoa và làm bánh. Người đã khiến anh ấy tin vào định mệnh.', photo: img('photo-1494790108377-be9c29b29330', 600) },
      headline: 'Save the date',
      invite_text: 'Trân trọng kính mời quý khách đến dự buổi tiệc chung vui cùng gia đình chúng tôi',
      quote: 'Có những người gặp nhau là để thương nhau cả một đời.',
      cover_url: img('photo-1519741497674-611481863552', 1600),
      hashtag: '#MinhAnhThuTrang',
      dress_code: ['#f3e5d8', '#d8b4a0', '#8a9a7b', '#ffffff'],
      story: [
        { id:'s1', date:d(3,14), title:'Lần đầu gặp gỡ', text:'Một buổi chiều mưa ở quán cà phê nhỏ trên phố cổ, hai người vô tình ngồi chung bàn.', image: img('photo-1516589178581-6cd7833ae3b2', 800) },
        { id:'s2', date:d(9,2), title:'Chính thức hẹn hò', text:'Sau nửa năm làm bạn, anh lấy hết can đảm để nói lời thương.', image: img('photo-1522673607200-164d1b6ce486', 800) },
        { id:'s3', date:d(12,24), title:'Lời cầu hôn', text:'Đêm Giáng sinh dưới ánh đèn lung linh, cô ấy đã nói "Đồng ý".', image: img('photo-1515934751635-c81c6bc9a2d8', 800) },
      ],
      events: [
        { id:'e1', name:'Lễ Vu Quy', start: ceremony.toISOString(), venue:'Tư gia nhà gái', address:'12 Lê Lợi, phường Vĩnh Ninh, TP. Huế', map_url:'', note:'Lễ gia tiên & rước dâu' },
        { id:'e2', name:'Tiệc Cưới', start: wedding.toISOString(), venue:'Trung tâm tiệc cưới Tịnh Gia Viên', address:'7/28 Lê Thánh Tôn, TP. Huế', map_url:'', note:'Đón khách 10:30 · Khai tiệc 11:00' },
      ],
      gallery: [
        'photo-1511285560929-80b456fea0bc','photo-1537633552985-df8429e8048b','photo-1465495976277-4387d4b0b4c6',
        'photo-1520854221256-17451cc331bf','photo-1583939003579-730e3918a45a','photo-1591604466107-ec97de577aff',
      ].map(id => img(id, 900)),
      gifts: [
        { id:'g1', side:'groom', label:'Mừng cưới chú rể', bank:'VCB', account_number:'0123456789', account_name:'NGUYEN MINH ANH' },
        { id:'g2', side:'bride', label:'Mừng cưới cô dâu', bank:'TCB', account_number:'1903456789', account_name:'LE THU TRANG' },
      ],
      sections: DEFAULT_SECTIONS.map(s => ({ ...s })),
      closing: 'Sự hiện diện của quý khách là niềm vinh hạnh cho gia đình chúng tôi!',
    },
  }
}
