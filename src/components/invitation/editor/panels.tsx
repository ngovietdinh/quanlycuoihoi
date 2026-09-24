'use client'
import { useEffect, useRef, useState } from 'react'
import type { Invitation, InvitationContent, InvitationTheme, Person, Side, TemplateId, ProjectSummary } from '@/types'
import { HEADING_FONTS, BODY_FONTS, EFFECTS, LAYOUTS, PATTERNS, patternBg, SECTION_LABELS, BANKS, templateById, uid, slugify, googleFontsHref } from '@/lib/invitation/templates'
import { getProjects } from '@/lib/api/projects'
import { uploadMedia } from '@/lib/api/invitations'
import { Box, Field, Text, Toggle, ColorInput, ImageInput, ItemTools, move, toLocalInput, fromLocalInput } from './fields'
import { TemplatePicker } from './TemplateSwatch'
import { cn } from '@/lib/utils'

export interface PanelProps {
  inv: Invitation
  setContent: (patch: Partial<InvitationContent>) => void
  setTheme: (patch: Partial<InvitationTheme>) => void
  setInv: (patch: Partial<Invitation>) => void
}

// ── Nội dung chính ────────────────────────────────────────────────────────────
function PersonBox({ title, p, onChange, invId, icon }: { title: string; p: Person; onChange: (p: Person) => void; invId: string; icon: string }) {
  const s = (k: keyof Person) => (v: string) => onChange({ ...p, [k]: v })
  return (
    <Box title={`${icon} ${title}`}>
      <div className="flex gap-4 items-start">
        <ImageInput value={p.photo} onChange={s('photo')} invitationId={invId} round/>
        <div className="flex-1 space-y-3">
          <Field label="Tên gọi (hiển thị lớn)"><Text value={p.name} onChange={s('name')} placeholder="Minh Anh" maxLength={40}/></Field>
          <Field label="Họ và tên đầy đủ"><Text value={p.full_name} onChange={s('full_name')} placeholder="Nguyễn Minh Anh"/></Field>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Bố"><Text value={p.father} onChange={s('father')} placeholder="Ông Nguyễn Văn A"/></Field>
        <Field label="Mẹ"><Text value={p.mother} onChange={s('mother')} placeholder="Bà Trần Thị B"/></Field>
      </div>
      <Field label="Giới thiệu ngắn"><Text area rows={2} value={p.bio} onChange={s('bio')} placeholder="Vài dòng về bản thân…" maxLength={300}/></Field>
    </Box>
  )
}

export function ContentPanel({ inv, setContent, setInv }: PanelProps) {
  const c = inv.content
  return (
    <div className="space-y-4">
      <Box title="🖼️ Trang bìa" desc="Ảnh bìa và dòng chữ chào đầu thiệp">
        <ImageInput value={c.cover_url} onChange={v => setContent({ cover_url: v })} invitationId={inv.id}/>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Dòng tiêu đề nhỏ"><Text value={c.headline} onChange={v => setContent({ headline: v })} placeholder="Save the date"/></Field>
          <Field label="Hashtag"><Text value={c.hashtag} onChange={v => setContent({ hashtag: v })} placeholder="#AnhVaEm"/></Field>
        </div>
        <Field label="Ngày cưới chính" hint="Dùng cho đếm ngược, lịch tháng và ảnh chia sẻ. Để trống sẽ lấy sự kiện cuối cùng.">
          <input type="datetime-local" className="input" value={toLocalInput(inv.event_date ?? '')} onChange={e => setInv({ event_date: fromLocalInput(e.target.value) || null })}/>
        </Field>
      </Box>
      <PersonBox title="Chú rể" icon="🤵" p={c.groom} onChange={groom => { setContent({ groom }); setInv({ title: `${groom.name} & ${c.bride.name}` }) }} invId={inv.id}/>
      <PersonBox title="Cô dâu" icon="👰" p={c.bride} onChange={bride => { setContent({ bride }); setInv({ title: `${c.groom.name} & ${bride.name}` }) }} invId={inv.id}/>
      <Box title="✍️ Lời mời">
        <Field label="Câu trích dẫn"><Text area rows={2} value={c.quote} onChange={v => setContent({ quote: v })}/></Field>
        <Field label="Lời mời"><Text area rows={3} value={c.invite_text} onChange={v => setContent({ invite_text: v })}/></Field>
        <Field label="Lời kết"><Text area rows={2} value={c.closing} onChange={v => setContent({ closing: v })}/></Field>
      </Box>
    </div>
  )
}

// ── Sự kiện ───────────────────────────────────────────────────────────────────
const EVENT_PRESETS = ['Lễ Ăn Hỏi', 'Lễ Vu Quy', 'Lễ Thành Hôn', 'Lễ Gia Tiên', 'Tiệc Cưới Nhà Trai', 'Tiệc Cưới Nhà Gái', 'Tiệc Cưới']

export function EventsPanel({ inv, setContent }: PanelProps) {
  const ev = inv.content.events
  const set = (events: typeof ev) => setContent({ events })
  const upd = (i: number, patch: Partial<(typeof ev)[number]>) => set(ev.map((e, j) => (j === i ? { ...e, ...patch } : e)))
  const [color, setColor] = useState('#d8b4a0')
  return (
    <div className="space-y-4">
      {ev.map((e, i) => (
        <Box key={e.id} title={`📍 ${e.name || 'Sự kiện'}`} right={<ItemTools onUp={i ? () => set(move(ev, i, -1)) : undefined} onDown={i < ev.length - 1 ? () => set(move(ev, i, 1)) : undefined} onRemove={() => set(ev.filter((_, j) => j !== i))}/>}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tên sự kiện">
              <input className="input" list="event-presets" value={e.name} onChange={x => upd(i, { name: x.target.value })}/>
            </Field>
            <Field label="Thời gian"><input type="datetime-local" className="input" value={toLocalInput(e.start)} onChange={x => upd(i, { start: fromLocalInput(x.target.value) })}/></Field>
          </div>
          <Field label="Địa điểm"><Text value={e.venue} onChange={v => upd(i, { venue: v })} placeholder="Trung tâm tiệc cưới…"/></Field>
          <Field label="Địa chỉ" hint="Bản đồ Google Maps được tạo tự động từ địa chỉ"><Text value={e.address} onChange={v => upd(i, { address: v })} placeholder="Số nhà, đường, quận, thành phố"/></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Link Google Maps (tùy chọn)"><Text value={e.map_url} onChange={v => upd(i, { map_url: v })} placeholder="https://maps.app.goo.gl/…"/></Field>
            <Field label="Ghi chú"><Text value={e.note} onChange={v => upd(i, { note: v })} placeholder="Đón khách 17:00"/></Field>
          </div>
        </Box>
      ))}
      <datalist id="event-presets">{EVENT_PRESETS.map(p => <option key={p} value={p}/>)}</datalist>
      <button onClick={() => set([...ev, { id: uid(), name: ev.length ? 'Tiệc Cưới' : 'Lễ Vu Quy', start: '', venue: '', address: '', map_url: '', note: '' }])}
        className="btn btn-secondary w-full border-dashed">＋ Thêm sự kiện</button>
      <Box title="👗 Dress code" desc="Gợi ý bảng màu trang phục cho khách mời">
        <div className="flex flex-wrap items-center gap-2">
          {inv.content.dress_code.map((col, i) => (
            <button key={col + i} onClick={() => setContent({ dress_code: inv.content.dress_code.filter((_, j) => j !== i) })}
              className="w-9 h-9 rounded-full border-2 border-white shadow ring-1 ring-ink-200 relative group" style={{ background: col }} title="Bấm để xóa">
              <span className="absolute inset-0 hidden group-hover:flex items-center justify-center text-white text-xs bg-black/30 rounded-full">✕</span>
            </button>
          ))}
          <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-9 h-9 rounded-full cursor-pointer"/>
          <button onClick={() => setContent({ dress_code: [...inv.content.dress_code, color].slice(0, 8) })} className="btn btn-secondary btn-xs">＋ Thêm màu</button>
        </div>
      </Box>
    </div>
  )
}

// ── Chuyện tình ───────────────────────────────────────────────────────────────
export function StoryPanel({ inv, setContent }: PanelProps) {
  const st = inv.content.story
  const set = (story: typeof st) => setContent({ story })
  const upd = (i: number, patch: Partial<(typeof st)[number]>) => set(st.map((e, j) => (j === i ? { ...e, ...patch } : e)))
  return (
    <div className="space-y-4">
      {st.length === 0 && <p className="text-sm text-ink-400 text-center py-4">Kể lại hành trình yêu của hai bạn qua từng cột mốc 💞</p>}
      {st.map((s, i) => (
        <Box key={s.id} title={`${i + 1}. ${s.title || 'Cột mốc'}`} right={<ItemTools onUp={i ? () => set(move(st, i, -1)) : undefined} onDown={i < st.length - 1 ? () => set(move(st, i, 1)) : undefined} onRemove={() => set(st.filter((_, j) => j !== i))}/>}>
          <div className="grid grid-cols-[1fr_140px] gap-3">
            <Field label="Tiêu đề"><Text value={s.title} onChange={v => upd(i, { title: v })} placeholder="Lần đầu gặp gỡ"/></Field>
            <Field label="Ngày"><input type="date" className="input" value={s.date ? s.date.slice(0, 10) : ''} onChange={e => upd(i, { date: e.target.value ? new Date(e.target.value + 'T12:00').toISOString() : '' })}/></Field>
          </div>
          <Field label="Câu chuyện"><Text area rows={3} value={s.text} onChange={v => upd(i, { text: v })}/></Field>
          <Field label="Ảnh"><ImageInput value={s.image} onChange={v => upd(i, { image: v })} invitationId={inv.id} aspect="aspect-[4/3]"/></Field>
        </Box>
      ))}
      <button onClick={() => set([...st, { id: uid(), title: '', date: '', text: '', image: '' }])} className="btn btn-secondary w-full border-dashed">＋ Thêm cột mốc</button>
    </div>
  )
}

// ── Album ─────────────────────────────────────────────────────────────────────
export function GalleryPanel({ inv, setContent }: PanelProps) {
  const g = inv.content.gallery
  const [url, setUrl] = useState('')
  const [busy, setBusy] = useState(0)
  const [err, setErr] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  // Giữ danh sách mới nhất khi tải nhiều ảnh song song
  const latest = useRef(g); latest.current = g
  const set = (gallery: string[]) => setContent({ gallery })

  async function upload(files: FileList | null) {
    if (!files?.length) return
    setErr(null); setBusy(files.length)
    for (const f of Array.from(files)) {
      const r = await uploadMedia(f, inv.id)
      if (r.data) set([...latest.current, r.data]); else setErr(r.error)
      setBusy(b => b - 1)
    }
  }
  return (
    <div className="space-y-4">
      <Box title="🖼️ Album ảnh cưới" desc={`${g.length} ảnh · di chuột vào ảnh để sắp xếp hoặc xóa`}>
        <div className="grid grid-cols-3 gap-2">
          {g.map((src, i) => (
            <div key={src + i} className="relative group aspect-square rounded-xl overflow-hidden bg-ink-50">
              <img src={src} alt="" className="w-full h-full object-cover"/>
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1">
                <button onClick={() => set(move(g, i, -1))} className="w-7 h-7 rounded-full bg-white/90 text-xs">←</button>
                <button onClick={() => set(g.filter((_, j) => j !== i))} className="w-7 h-7 rounded-full bg-white/90 text-xs text-red-600">✕</button>
                <button onClick={() => set(move(g, i, 1))} className="w-7 h-7 rounded-full bg-white/90 text-xs">→</button>
              </div>
            </div>
          ))}
          <button onClick={() => fileRef.current?.click()} disabled={busy > 0}
            className="aspect-square rounded-xl border-2 border-dashed border-ink-200 hover:border-sakura-300 text-ink-400 text-xs flex flex-col items-center justify-center gap-1">
            <span className="text-2xl">{busy ? '⏳' : '＋'}</span>{busy ? `Đang tải ${busy}…` : 'Tải ảnh lên'}
          </button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={e => { upload(e.target.files); e.target.value = '' }}/>
        <div className="flex gap-1.5">
          <input className="input !py-2 text-xs" value={url} onChange={e => setUrl(e.target.value)} placeholder="Hoặc dán link ảnh (https://…)"/>
          <button disabled={!/^https?:\/\//.test(url)} onClick={() => { set([...g, url.trim()]); setUrl('') }} className="btn btn-secondary btn-sm flex-shrink-0">Thêm</button>
        </div>
        {err && <p className="text-[11px] text-red-500">{err}</p>}
      </Box>
    </div>
  )
}

// ── Mừng cưới ─────────────────────────────────────────────────────────────────
export function GiftPanel({ inv, setContent }: PanelProps) {
  const gs = inv.content.gifts
  const set = (gifts: typeof gs) => setContent({ gifts })
  const upd = (i: number, patch: Partial<(typeof gs)[number]>) => set(gs.map((e, j) => (j === i ? { ...e, ...patch } : e)))
  return (
    <div className="space-y-4">
      <p className="text-xs text-ink-500 bg-gold-50 border border-gold-200 rounded-xl p-3">💡 Mã QR VietQR được tạo tự động — khách chỉ cần quét bằng app ngân hàng để chuyển khoản mừng cưới.</p>
      {gs.map((g, i) => (
        <Box key={g.id} title={`🎁 ${g.label || 'Tài khoản'}`} right={<ItemTools onRemove={() => set(gs.filter((_, j) => j !== i))}/>}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nhãn hiển thị"><Text value={g.label} onChange={v => upd(i, { label: v })} placeholder="Mừng cưới chú rể"/></Field>
            <Field label="Bên">
              <select className="input" value={g.side} onChange={e => upd(i, { side: e.target.value as Side })}>
                <option value="groom">Nhà trai</option><option value="bride">Nhà gái</option><option value="both">Chung</option>
              </select>
            </Field>
          </div>
          <Field label="Ngân hàng">
            <select className="input" value={g.bank} onChange={e => upd(i, { bank: e.target.value })}>
              <option value="">— Chọn ngân hàng —</option>
              {BANKS.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Số tài khoản"><Text value={g.account_number} onChange={v => upd(i, { account_number: v.replace(/\s/g, '') })}/></Field>
            <Field label="Chủ tài khoản"><Text value={g.account_name} onChange={v => upd(i, { account_name: v.toUpperCase() })} placeholder="NGUYEN VAN A"/></Field>
          </div>
        </Box>
      ))}
      <button onClick={() => set([...gs, { id: uid(), side: gs.length ? 'bride' : 'groom', label: gs.length ? 'Mừng cưới cô dâu' : 'Mừng cưới chú rể', bank: '', account_number: '', account_name: '' }])}
        className="btn btn-secondary w-full border-dashed">＋ Thêm tài khoản</button>
    </div>
  )
}

// ── Thiết kế giao diện ────────────────────────────────────────────────────────
const PALETTES: { name: string; p: string; a: string; bg: string; tx: string }[] = [
  { name: 'Champagne', p: '#b08d57', a: '#e9dcc3', bg: '#fbf8f1', tx: '#3b3024' },
  { name: 'Hồng đào',  p: '#c96b83', a: '#f6d5dd', bg: '#fff6f8', tx: '#4a2f36' },
  { name: 'Đỏ son',    p: '#b3121f', a: '#e6b74a', bg: '#fff8ee', tx: '#3d0d0d' },
  { name: 'Xô thơm',   p: '#5f7a5b', a: '#dfe6d3', bg: '#f5f7f0', tx: '#2c3a2a' },
  { name: 'Xanh navy', p: '#1f3a60', a: '#d9e2ef', bg: '#f7f9fc', tx: '#1a2433' },
  { name: 'Tím oải hương', p: '#7a5c99', a: '#e8def3', bg: '#faf7fd', tx: '#33263f' },
  { name: 'Đất nung',  p: '#b45f3c', a: '#f1d9c9', bg: '#fdf6f0', tx: '#3e2418' },
  { name: 'Đêm sao',   p: '#d9b77e', a: '#233452', bg: '#0f1a2b', tx: '#f1ece2' },
]

export function DesignPanel({ inv, setTheme, setContent }: PanelProps) {
  const t = inv.theme
  const secs = inv.content.sections
  const setSecs = (sections: typeof secs) => setContent({ sections })
  useEffect(() => {
    // Nạp toàn bộ font để xem trước trong danh sách chọn
    const id = 'editor-fonts'
    if (document.getElementById(id)) return
    const l = document.createElement('link'); l.id = id; l.rel = 'stylesheet'
    l.href = googleFontsHref([...HEADING_FONTS, ...BODY_FONTS]); document.head.appendChild(l)
  }, [])

  function applyTemplate(id: TemplateId) {
    const tpl = templateById(id)
    setTheme({ template: id, ...tpl.theme })
  }

  return (
    <div className="space-y-4">
      <Box title="🎨 Mẫu thiệp" desc="Đổi mẫu sẽ áp dụng bộ màu, font và bố cục của mẫu đó">
        <TemplatePicker value={t.template} onChange={applyTemplate}/>
      </Box>

      <Box title="🌈 Màu sắc">
        <div className="flex flex-wrap gap-1.5">
          {PALETTES.map(p => (
            <button key={p.name} onClick={() => setTheme({ primary: p.p, accent: p.a, background: p.bg, text: p.tx })}
              className="flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-full border border-ink-200 hover:border-ink-400 text-[11px] font-medium bg-white">
              <span className="flex -space-x-1">{[p.p, p.a, p.bg].map(c => <span key={c} className="w-4 h-4 rounded-full border border-white" style={{ background: c }}/>)}</span>{p.name}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <ColorInput label="Màu chủ đạo" value={t.primary} onChange={v => setTheme({ primary: v })}/>
          <ColorInput label="Màu nhấn" value={t.accent} onChange={v => setTheme({ accent: v })}/>
          <ColorInput label="Màu nền" value={t.background} onChange={v => setTheme({ background: v })}/>
          <ColorInput label="Màu chữ" value={t.text} onChange={v => setTheme({ text: v })}/>
        </div>
      </Box>

      <Box title="🔤 Font chữ">
        <Field label="Font tiêu đề">
          <div className="grid grid-cols-2 gap-1.5">
            {HEADING_FONTS.map(f => (
              <button key={f} onClick={() => setTheme({ heading_font: f })}
                className={cn('px-3 py-2 rounded-xl border text-left transition', t.heading_font === f ? 'border-sakura-500 bg-sakura-50' : 'border-ink-100 hover:border-ink-300 bg-white')}>
                <span className="block text-xl leading-tight truncate" style={{ fontFamily: `'${f}'` }}>Hạnh Phúc</span>
                <span className="block text-[10px] text-ink-400">{f}</span>
              </button>
            ))}
          </div>
        </Field>
        <Field label="Font nội dung">
          <select className="input" value={t.body_font} onChange={e => setTheme({ body_font: e.target.value })} style={{ fontFamily: `'${t.body_font}'` }}>
            {BODY_FONTS.map(f => <option key={f} value={f} style={{ fontFamily: `'${f}'` }}>{f}</option>)}
          </select>
        </Field>
      </Box>

      <Box title="🧩 Bố cục & hiệu ứng">
        <Field label="Bố cục trang bìa">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {LAYOUTS.map(l => (
              <button key={l.id} onClick={() => setTheme({ layout: l.id })}
                className={cn('p-2.5 rounded-xl border text-left', t.layout === l.id ? 'border-sakura-500 bg-sakura-50' : 'border-ink-100 bg-white hover:border-ink-300')}>
                <span className="block text-xs font-semibold text-ink-800">{l.label}</span>
                <span className="block text-[10px] text-ink-400 leading-snug">{l.desc}</span>
              </button>
            ))}
          </div>
        </Field>
        <Field label="Hiệu ứng">
          <div className="flex flex-wrap gap-1.5">
            {EFFECTS.map(e => (
              <button key={e.id} onClick={() => setTheme({ effect: e.id })}
                className={cn('px-3 py-1.5 rounded-full border text-xs font-medium', t.effect === e.id ? 'border-sakura-500 bg-sakura-50 text-sakura-700' : 'border-ink-200 bg-white text-ink-600')}>
                {e.icon} {e.label}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Hoa văn nền">
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
            {PATTERNS.map(p => (
              <button key={p.id} onClick={() => setTheme({ pattern: p.id })} title={p.label}
                className={cn('rounded-xl border overflow-hidden text-[10px] font-medium', t.pattern === p.id ? 'border-sakura-500 ring-2 ring-sakura-200' : 'border-ink-100 hover:border-ink-300')}>
                <span className="block h-10" style={{ background: t.background, backgroundImage: patternBg(p.id, t.primary) }}/>
                <span className="block py-1 bg-white text-ink-600">{p.label}</span>
              </button>
            ))}
          </div>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={`Độ tối ảnh bìa: ${t.overlay}%`}><input type="range" min={0} max={80} value={t.overlay} onChange={e => setTheme({ overlay: +e.target.value })} className="w-full accent-sakura-500"/></Field>
          <Field label={`Bo góc: ${t.radius}px`}><input type="range" min={0} max={32} value={t.radius} onChange={e => setTheme({ radius: +e.target.value })} className="w-full accent-sakura-500"/></Field>
        </div>
        <Toggle checked={t.envelope} onChange={v => setTheme({ envelope: v })} label="Hiệu ứng mở phong bì khi vào thiệp"/>
      </Box>

      <Box title="🎵 Nhạc nền" desc="Phát sau khi khách mở phong bì. Hỗ trợ .mp3 (tối đa 10MB).">
        <ImageInput value={t.music_url} onChange={v => setTheme({ music_url: v })} invitationId={inv.id} accept="audio/*"/>
        {t.music_url && <audio src={t.music_url} controls className="w-full h-10"/>}
      </Box>

      <Box title="📑 Các phần của thiệp" desc="Bật/tắt, đổi thứ tự và đặt lại tiêu đề từng phần">
        {secs.map((s, i) => (
          <div key={s.id} className={cn('flex items-center gap-2 p-2 rounded-xl border', s.visible ? 'border-ink-100 bg-white' : 'border-dashed border-ink-200 bg-ink-50/50 opacity-70')}>
            <Toggle checked={s.visible} onChange={v => setSecs(secs.map((x, j) => (j === i ? { ...x, visible: v } : x)))}/>
            <span className="text-base">{SECTION_LABELS[s.id].icon}</span>
            <input className="flex-1 min-w-0 bg-transparent text-sm font-medium text-ink-800 focus:outline-none border-b border-transparent focus:border-sakura-300"
              value={s.title ?? SECTION_LABELS[s.id].title} onChange={e => setSecs(secs.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))}/>
            <ItemTools onUp={i ? () => setSecs(move(secs, i, -1)) : undefined} onDown={i < secs.length - 1 ? () => setSecs(move(secs, i, 1)) : undefined}
              onRemove={() => setSecs(secs.map((x, j) => (j === i ? { ...x, visible: false } : x)))}/>
          </div>
        ))}
      </Box>
    </div>
  )
}

// ── Cài đặt & chia sẻ ─────────────────────────────────────────────────────────
export function SettingsPanel({ inv, setInv, onDelete }: PanelProps & { onDelete: () => void }) {
  const [projects, setProjects] = useState<ProjectSummary[]>([])
  const [origin, setOrigin] = useState('')
  useEffect(() => { getProjects().then(r => setProjects(r.data ?? [])); setOrigin(window.location.origin) }, [])
  const url = `${origin}/i/${inv.slug}`
  const msg = `💌 Trân trọng kính mời bạn đến dự lễ cưới của ${inv.content.groom.name} & ${inv.content.bride.name}. Xem thiệp tại: ${url}`
  return (
    <div className="space-y-4">
      <Box title="🚀 Phát hành" desc="Chỉ thiệp đã phát hành mới xem được bởi khách mời">
        <Toggle checked={inv.is_published} onChange={v => setInv({ is_published: v })} label={inv.is_published ? 'Đang công khai' : 'Bản nháp (chỉ bạn xem được)'}/>
        <Field label="Đường dẫn thiệp" hint="Chữ thường không dấu, số và dấu gạch ngang">
          <div className="flex items-center rounded-xl border border-ink-200 bg-ink-50 overflow-hidden">
            <span className="px-3 text-xs text-ink-400 whitespace-nowrap">/i/</span>
            <input className="flex-1 min-w-0 px-2 py-2.5 text-sm bg-white focus:outline-none font-mono" value={inv.slug}
              onChange={e => setInv({ slug: slugify(e.target.value).slice(0, 60) || inv.slug })}/>
          </div>
        </Field>
      </Box>
      <Box title="🔗 Chia sẻ thiệp">
        <div className="flex gap-4 items-center">
          {origin && <img src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${encodeURIComponent(url)}`} alt="QR thiệp" className="w-28 h-28 rounded-xl border border-ink-100"/>}
          <div className="flex-1 min-w-0 space-y-2">
            <p className="text-xs font-mono text-ink-600 break-all bg-ink-50 rounded-lg p-2">{url}</p>
            <div className="flex flex-wrap gap-1.5">
              <button onClick={() => navigator.clipboard.writeText(url)} className="btn btn-secondary btn-xs">📋 Sao chép</button>
              <button onClick={() => navigator.clipboard.writeText(msg)} className="btn btn-secondary btn-xs">✉️ Chép lời mời</button>
              <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`} target="_blank" rel="noreferrer" className="btn btn-secondary btn-xs">Facebook</a>
              <a href={`https://zalo.me/share?url=${encodeURIComponent(url)}`} target="_blank" rel="noreferrer" className="btn btn-secondary btn-xs">Zalo</a>
            </div>
          </div>
        </div>
      </Box>
      <Box title="🗂️ Liên kết dự án" desc="Gắn thiệp với dự án cưới để quản lý tập trung">
        <select className="input" value={inv.project_id ?? ''} onChange={e => setInv({ project_id: e.target.value || null })}>
          <option value="">— Không liên kết —</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </Box>
      <Box title="⚠️ Vùng nguy hiểm">
        <button onClick={onDelete} className="btn btn-danger btn-sm">Xóa thiệp này</button>
      </Box>
    </div>
  )
}
