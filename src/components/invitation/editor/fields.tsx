'use client'
import { useRef, useState } from 'react'
import { uploadMedia } from '@/lib/api/invitations'
import { cn } from '@/lib/utils'

export function Box({ title, desc, children, right }: { title: string; desc?: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="card p-4 sm:p-5">
      <div className={cn('flex justify-between gap-3 mb-4', desc ? 'items-start' : 'items-center')}>
        <div>
          <h3 className="font-semibold text-ink-900 text-sm">{title}</h3>
          {desc && <p className="text-xs text-ink-400 mt-0.5">{desc}</p>}
        </div>
        {right}
      </div>
      <div className="space-y-3.5">{children}</div>
    </div>
  )
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label !text-xs">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-ink-400 mt-1">{hint}</p>}
    </div>
  )
}

export function Text({ value, onChange, placeholder, area, rows = 3, maxLength }:
  { value: string; onChange: (v: string) => void; placeholder?: string; area?: boolean; rows?: number; maxLength?: number }) {
  return area
    ? <textarea className="input resize-none" rows={rows} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} maxLength={maxLength}/>
    : <input className="input" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} maxLength={maxLength}/>
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="inline-flex items-center gap-2 text-sm text-ink-700">
      <span className={cn('w-10 h-6 rounded-full relative transition-colors', checked ? 'bg-sakura-500' : 'bg-ink-200')}>
        <span className={cn('absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all', checked ? 'left-[18px]' : 'left-0.5')}/>
      </span>
      {label}
    </button>
  )
}

export function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex items-center gap-2.5 p-2 rounded-xl border border-ink-100 bg-white cursor-pointer hover:border-ink-300">
      <input type="color" value={value} onChange={e => onChange(e.target.value)} className="w-9 h-9 rounded-lg border-0 p-0 cursor-pointer bg-transparent"/>
      <span className="min-w-0">
        <span className="block text-xs font-semibold text-ink-700">{label}</span>
        <span className="block text-[11px] font-mono text-ink-400 uppercase">{value}</span>
      </span>
    </label>
  )
}

/** Ô nhập ảnh: dán URL hoặc tải lên Supabase Storage */
export function ImageInput({ value, onChange, invitationId, round, aspect = 'aspect-video', accept = 'image/*' }:
  { value: string; onChange: (v: string) => void; invitationId: string; round?: boolean; aspect?: string; accept?: string }) {
  const ref = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  async function pick(f?: File) {
    if (!f) return
    setBusy(true); setErr(null)
    const r = await uploadMedia(f, invitationId)
    setBusy(false)
    if (r.error) setErr(r.error); else if (r.data) onChange(r.data)
  }
  const isAudio = accept.startsWith('audio')
  const fileInput = <input ref={ref} type="file" accept={accept} className="hidden" onChange={e => { pick(e.target.files?.[0]); e.target.value = '' }}/>
  // Ảnh tròn (chân dung): gọn, không chiếm cả cột
  if (round) return (
    <div className="flex flex-col items-center gap-1.5 w-24 flex-shrink-0">
      <div onClick={() => ref.current?.click()}
        className="relative w-24 h-24 rounded-full overflow-hidden bg-ink-50 border-2 border-dashed border-ink-200 hover:border-sakura-300 cursor-pointer flex items-center justify-center text-ink-400 text-[11px] text-center group">
        {value ? <img src={value} alt="" className="absolute inset-0 w-full h-full object-cover"/> : <span>{busy ? 'Đang tải…' : '＋ Ảnh'}</span>}
        {value && <span className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition">{busy ? '…' : 'Đổi ảnh'}</span>}
      </div>
      <div className="flex gap-1">
        <button type="button" onClick={() => { const u = prompt('Dán link ảnh (https://…)', value); if (u !== null) onChange(u.trim()) }} className="text-[10px] text-ink-500 hover:text-sakura-600">🔗 Link</button>
        {value && <button type="button" onClick={() => onChange('')} className="text-[10px] text-ink-400 hover:text-red-500">✕ Xóa</button>}
      </div>
      {err && <p className="text-[10px] text-red-500 text-center">{err}</p>}
      {fileInput}
    </div>
  )
  return (
    <div className="space-y-2">
      {!isAudio && (
        <div onClick={() => ref.current?.click()}
          className={cn('relative overflow-hidden bg-ink-50 border-2 border-dashed border-ink-200 hover:border-sakura-300 cursor-pointer flex items-center justify-center text-ink-400 text-xs w-full rounded-xl', aspect)}>
          {value ? <img src={value} alt="" className="absolute inset-0 w-full h-full object-cover"/> : <span>{busy ? 'Đang tải…' : '＋ Chọn ảnh'}</span>}
          {busy && value && <span className="absolute inset-0 bg-white/70 flex items-center justify-center">Đang tải…</span>}
        </div>
      )}
      <div className="flex gap-1.5">
        <input className="input !py-2 text-xs" value={value} onChange={e => onChange(e.target.value)} placeholder={isAudio ? 'Dán link nhạc .mp3 hoặc tải lên' : 'Dán link ảnh hoặc tải lên'}/>
        <button type="button" onClick={() => ref.current?.click()} disabled={busy} className="btn btn-secondary btn-sm flex-shrink-0">{busy ? '…' : '⬆'}</button>
        {value && <button type="button" onClick={() => onChange('')} className="btn btn-ghost btn-sm flex-shrink-0" title="Xóa">✕</button>}
      </div>
      {err && <p className="text-[11px] text-red-500">{err}</p>}
      {fileInput}
    </div>
  )
}

/** Nút sắp xếp / xóa cho phần tử trong danh sách */
export function ItemTools({ onUp, onDown, onRemove }: { onUp?: () => void; onDown?: () => void; onRemove: () => void }) {
  return (
    <div className="flex gap-1">
      <button type="button" disabled={!onUp} onClick={onUp} className="btn btn-ghost btn-xs btn-icon disabled:opacity-30" title="Lên">↑</button>
      <button type="button" disabled={!onDown} onClick={onDown} className="btn btn-ghost btn-xs btn-icon disabled:opacity-30" title="Xuống">↓</button>
      <button type="button" onClick={onRemove} className="btn btn-ghost btn-xs btn-icon hover:bg-red-50 hover:text-red-500" title="Xóa">✕</button>
    </div>
  )
}

export function move<T>(arr: T[], i: number, d: number): T[] {
  const j = i + d
  if (j < 0 || j >= arr.length) return arr
  const next = [...arr];[next[i], next[j]] = [next[j], next[i]]
  return next
}

/** ISO ⇄ giá trị cho <input type="datetime-local"> theo giờ máy người dùng */
export const toLocalInput = (iso: string) => {
  if (!iso) return ''
  const d = new Date(iso)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}
export const fromLocalInput = (v: string) => (v ? new Date(v).toISOString() : '')
