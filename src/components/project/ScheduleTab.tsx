'use client'
import { useState, FormEvent } from 'react'
import { Modal } from '@/components/ui/Modal'
import { cn, fmtDateFull } from '@/lib/utils'
import { solarToLunar, canChiYear } from '@/lib/invitation/datetime'
import type { ScheduleItem } from '@/types'
import type { ScheduleInput } from '@/lib/api/vendors'

interface Props {
  items: ScheduleItem[]; eventDate: string | null; canEdit: boolean; projectName: string
  onSave: (d: ScheduleInput, id?: string) => Promise<boolean>; onDelete: (id: string) => void
  onToggle: (it: ScheduleItem) => void; onUseTemplate: (day: string | null) => Promise<void>
}
const hm = (t: string | null) => (t ? t.slice(0, 5) : '')
const lunarOf = (d: string) => { const [y, m, dd] = d.split('-').map(Number); const l = solarToLunar(dd, m, y); return `${l.day}/${l.month} năm ${canChiYear(l.year)}` }

export function ScheduleTab({ items, eventDate, canEdit, projectName, onSave, onDelete, onToggle, onUseTemplate }: Props) {
  const [editing, setEditing] = useState<ScheduleItem | null | 'new'>(null)
  const [busy, setBusy] = useState(false)
  // Nhóm theo ngày; mục chưa có ngày gắn vào ngày cưới
  const groups = items.reduce((m, it) => {
    const k = it.day ?? eventDate ?? ''
    return m.set(k, [...(m.get(k) ?? []), it])
  }, new Map<string, ScheduleItem[]>())
  const days = Array.from(groups.keys()).sort()
  const now = new Date(), todayKey = now.toISOString().slice(0, 10), nowHm = now.toTimeString().slice(0, 5)

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex flex-wrap items-center gap-2 print:hidden">
        <div className="mr-auto">
          <h2 className="font-display text-2xl font-semibold text-ink-900">Lịch trình ngày cưới</h2>
          <p className="text-xs text-ink-400">Kịch bản theo từng giờ cho gia đình, ekip và nhà cung cấp — {items.length} mục</p>
        </div>
        {items.length > 0 && <button onClick={() => window.print()} className="btn btn-secondary btn-sm">🖨 In lịch trình</button>}
        {canEdit && <button onClick={() => setEditing('new')} className="btn btn-primary btn-sm">+ Thêm mục</button>}
      </div>

      {items.length === 0 ? (
        <div className="card text-center py-14 px-4">
          <div className="text-5xl mb-3 animate-float">🕰️</div>
          <h3 className="font-display text-2xl font-semibold text-ink-900 mb-2">Chưa có lịch trình</h3>
          <p className="text-sm text-ink-500 mb-6 max-w-md mx-auto">Dùng mẫu lịch trình lễ cưới truyền thống (trang điểm → lễ gia tiên → rước dâu → tiệc cưới → tiễn khách) rồi chỉnh theo gia đình bạn.</p>
          {canEdit && (
            <div className="flex flex-wrap gap-2 justify-center">
              <button disabled={busy} onClick={async () => { setBusy(true); await onUseTemplate(eventDate); setBusy(false) }} className="btn btn-primary">{busy ? 'Đang tạo…' : '✨ Dùng lịch trình mẫu'}</button>
              <button onClick={() => setEditing('new')} className="btn btn-secondary">+ Tự thêm</button>
            </div>
          )}
        </div>
      ) : days.map(day => (
        <section key={day || 'none'} className="card overflow-hidden print:shadow-none print:border-ink-300">
          <header className="px-5 py-3.5 border-b border-ink-100 flex items-center justify-between gap-3" style={{ background: 'linear-gradient(135deg,#fffdf9,#fff5ec)' }}>
            <div>
              <p className="font-semibold text-ink-900 first-letter:uppercase">{day ? fmtDateFull(day) : 'Chưa xác định ngày'}</p>
              {day && <p className="text-[11px] text-ink-400">Âm lịch {lunarOf(day)} · {projectName}</p>}
            </div>
            <span className="text-xs text-ink-400">{groups.get(day)!.filter(x => x.done).length}/{groups.get(day)!.length} xong</span>
          </header>
          <ol className="relative px-5 py-4">
            {/* đường trục = lề 1.25rem + cột giờ 4.2rem + khoảng cách 1rem → trùng tâm các chấm */}
            <span className="absolute left-[6.45rem] top-5 bottom-5 w-px bg-ink-200 print:hidden"/>
            {groups.get(day)!.map(it => {
              const live = day === todayKey && it.start_time && hm(it.start_time) <= nowHm && (!it.end_time || hm(it.end_time) >= nowHm)
              return (
                <li key={it.id} className={cn('relative grid grid-cols-[4.2rem_1fr_auto] gap-4 py-2.5 group', it.done && 'opacity-60')}>
                  <div className="text-right">
                    <p className={cn('font-bold tabular text-sm', live ? 'text-sakura-600' : 'text-ink-900')}>{hm(it.start_time) || '—'}</p>
                    {it.end_time && <p className="text-[11px] text-ink-400 tabular">→ {hm(it.end_time)}</p>}
                  </div>
                  <div className="relative min-w-0 pl-4">
                    <span className={cn('absolute -left-[3.5px] top-1.5 w-2 h-2 rounded-full ring-4 ring-white print:hidden', it.done ? 'bg-jade-500' : live ? 'bg-sakura-500 animate-pulse' : 'bg-gold-400')}/>
                    <p className={cn('text-sm font-semibold text-ink-900', it.done && 'line-through')}>{it.title}{live && <span className="ml-2 text-[10px] font-bold text-sakura-600 bg-sakura-50 border border-sakura-200 rounded-full px-1.5 py-0.5">ĐANG DIỄN RA</span>}</p>
                    <p className="text-xs text-ink-500">{[it.location && `📍 ${it.location}`, it.owner && `👤 ${it.owner}`].filter(Boolean).join('  ·  ')}</p>
                    {it.notes && <p className="text-xs text-ink-400 italic mt-0.5">{it.notes}</p>}
                  </div>
                  {canEdit && (
                    <div className="flex items-start gap-0.5 print:hidden">
                      <button onClick={() => onToggle(it)} title={it.done ? 'Bỏ đánh dấu' : 'Đã xong'} className={cn('w-6 h-6 rounded-md border-2 flex items-center justify-center text-[10px]', it.done ? 'bg-jade-500 border-jade-500 text-white' : 'border-ink-300 hover:border-jade-400')}>{it.done && '✓'}</button>
                      <span className="flex sm:opacity-0 group-hover:opacity-100">
                        <button onClick={() => setEditing(it)} className="btn btn-ghost btn-xs btn-icon" title="Sửa">✎</button>
                        <button onClick={() => onDelete(it.id)} className="btn btn-ghost btn-xs btn-icon hover:text-red-500" title="Xóa">✕</button>
                      </span>
                    </div>
                  )}
                </li>
              )
            })}
          </ol>
        </section>
      ))}

      {editing && <ScheduleModal key={editing === 'new' ? 'new' : editing.id} item={editing === 'new' ? undefined : editing} defaultDay={eventDate}
        onClose={() => setEditing(null)} onSave={async d => { const ok = await onSave(d, editing === 'new' ? undefined : editing.id); if (ok) setEditing(null); return ok }}/>}
    </div>
  )
}

function ScheduleModal({ item, defaultDay, onClose, onSave }: { item?: ScheduleItem; defaultDay: string | null; onClose: () => void; onSave: (d: ScheduleInput) => Promise<boolean> }) {
  const [f, setF] = useState({ title: item?.title ?? '', day: item?.day ?? defaultDay ?? '', start_time: hm(item?.start_time ?? null), end_time: hm(item?.end_time ?? null), location: item?.location ?? '', owner: item?.owner ?? '', notes: item?.notes ?? '' })
  const [saving, setSaving] = useState(false)
  const s = (k: keyof typeof f, v: string) => setF(x => ({ ...x, [k]: v }))
  async function submit(e?: FormEvent) {
    e?.preventDefault(); if (!f.title.trim()) return
    setSaving(true)
    await onSave({ title: f.title.trim(), day: f.day || null, start_time: f.start_time || null, end_time: f.end_time || null, location: f.location || null, owner: f.owner || null, notes: f.notes || null })
    setSaving(false)
  }
  return (
    <Modal open onClose={onClose} title={item ? 'Sửa mục lịch trình' : 'Thêm mục lịch trình'} size="md"
      footer={<><button onClick={onClose} className="btn btn-ghost btn-sm">Hủy</button><button onClick={() => submit()} disabled={saving || !f.title.trim()} className="btn btn-primary btn-sm">{saving ? 'Đang lưu…' : '✓ Lưu'}</button></>}>
      <form onSubmit={submit} className="space-y-3.5">
        <div><label className="label">Nội dung *</label><input className="input" value={f.title} onChange={e => s('title', e.target.value)} placeholder="VD: Lễ gia tiên nhà gái" autoFocus required/></div>
        <div className="grid grid-cols-3 gap-3">
          <div><label className="label">Ngày</label><input className="input" type="date" value={f.day} onChange={e => s('day', e.target.value)}/></div>
          <div><label className="label">Bắt đầu</label><input className="input" type="time" value={f.start_time} onChange={e => s('start_time', e.target.value)}/></div>
          <div><label className="label">Kết thúc</label><input className="input" type="time" value={f.end_time} onChange={e => s('end_time', e.target.value)}/></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Địa điểm</label><input className="input" value={f.location} onChange={e => s('location', e.target.value)} placeholder="Nhà gái / Nhà hàng"/></div>
          <div><label className="label">Người phụ trách</label><input className="input" value={f.owner} onChange={e => s('owner', e.target.value)} placeholder="MC, bác cả…"/></div>
        </div>
        <div><label className="label">Ghi chú</label><textarea className="input resize-none" rows={2} value={f.notes} onChange={e => s('notes', e.target.value)}/></div>
      </form>
    </Modal>
  )
}
