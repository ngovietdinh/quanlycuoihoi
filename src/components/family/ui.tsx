'use client'
import { useCallback, useEffect, useRef, useState, FormEvent } from 'react'
import { Modal, ConfirmModal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { sb } from '@/lib/supabase/client'
import { vnd, cn } from '@/lib/utils'
import { useHousehold } from './HouseholdProvider'
import type { famTable } from '@/lib/api/family'

type Table<T extends { id: string }> = ReturnType<typeof famTable<T>>

/** Nạp danh sách một bảng của gia đình hiện tại + tự cập nhật realtime khi thành viên khác sửa */
export function useRows<T extends { id: string }>(table: Table<T>, realtimeTable: string, filter?: Record<string, string>) {
  const { household } = useHousehold()
  const [rows, setRows] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const fkey = JSON.stringify(filter ?? {})
  const reload = useCallback(async () => {
    const r = await table.list(household.id, JSON.parse(fkey))
    if (r.error) setError(r.error); else { setError(null); setRows(r.data!) }
    setLoading(false)
  }, [household.id, table, fkey])
  useEffect(() => { setLoading(true); reload() }, [reload])
  useEffect(() => {
    const c = sb()
    const ch = c.channel(`fam:${realtimeTable}:${household.id}:${fkey}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: realtimeTable, filter: `household_id=eq.${household.id}` }, () => reload())
      .subscribe()
    return () => { c.removeChannel(ch) }
  }, [household.id, realtimeTable, reload, fkey])
  return { rows, setRows, loading, error, reload }
}

/** Thao tác CRUD có thông báo, dùng chung cho mọi phân hệ */
export function useCrud<T extends { id: string }>(table: Table<T>, reload: () => Promise<void>, noun: string) {
  const { household } = useHousehold()
  const { success, error } = useToast()
  return {
    async create(row: Partial<T> | Partial<T>[], quiet = false) {
      const r = await table.create(household.id, row)
      if (r.error) { error(`Không thêm được ${noun}`, r.error); return false }
      if (!quiet) success(`Đã thêm ${noun} ✓`); await reload(); return true
    },
    async update(id: string, patch: Partial<T>, quiet = false) {
      const r = await table.update(id, patch)
      if (r.error) { error(`Không cập nhật được ${noun}`, r.error); return false }
      if (!quiet) success(`Đã cập nhật ${noun} ✓`); await reload(); return true
    },
    async remove(id: string) {
      const r = await table.remove(id)
      if (r.error) { error(`Không xóa được ${noun}`, r.error); return false }
      success(`Đã xóa ${noun}`); await reload(); return true
    },
  }
}

/** Hộp xác nhận xóa dùng một lần gọi: const [ask, dialog] = useConfirm() */
export function useConfirm() {
  const [c, setC] = useState<{ title: string; msg: string; run: () => Promise<unknown> } | null>(null)
  const [busy, setBusy] = useState(false)
  const dialog = (
    <ConfirmModal open={!!c} onClose={() => setC(null)} loading={busy} title={c?.title ?? ''} msg={c?.msg ?? ''} confirmLabel="Xóa"
      onConfirm={async () => { if (!c) return; setBusy(true); await c.run(); setBusy(false); setC(null) }}/>
  )
  return [(title: string, msg: string, run: () => Promise<unknown>) => setC({ title, msg, run }), dialog] as const
}

// ── Biểu mẫu tạo từ cấu hình ──────────────────────────────────────────────────
export type Opt = string | { value: string; label: string }
export interface FieldDef {
  key: string; label: string
  type?: 'text' | 'textarea' | 'number' | 'money' | 'date' | 'month' | 'time' | 'select' | 'checkbox' | 'chips'
  options?: Opt[]; required?: boolean; placeholder?: string; half?: boolean; hint?: string; min?: number; step?: string
  show?: (v: Record<string, any>) => boolean
}
const optV = (o: Opt) => (typeof o === 'string' ? o : o.value)
const optL = (o: Opt) => (typeof o === 'string' ? o : o.label)

export function FormModal({ open, title, subtitle, fields, initial, onClose, onSubmit, submitLabel = '✓ Lưu', size = 'md' }:
  { open: boolean; title: string; subtitle?: string; fields: FieldDef[]; initial?: Record<string, any>; onClose: () => void
    onSubmit: (v: Record<string, any>) => Promise<boolean | void>; submitLabel?: string; size?: 'sm' | 'md' | 'lg' }) {
  const [v, setV] = useState<Record<string, any>>({})
  const [saving, setSaving] = useState(false)
  const opened = useRef(false)
  useEffect(() => {
    // Chỉ khởi tạo lại khi mở modal (tránh lỗi form giữ dữ liệu cũ)
    if (open && !opened.current) {
      const init: Record<string, any> = {}
      fields.forEach(f => { init[f.key] = initial?.[f.key] ?? (f.type === 'checkbox' ? false : f.type === 'select' && f.options?.length && f.required ? optV(f.options[0]) : '') })
      setV(init)
    }
    opened.current = open
  }, [open, fields, initial])
  const set = (k: string, val: any) => setV(x => ({ ...x, [k]: val }))
  const visible = fields.filter(f => !f.show || f.show(v))
  async function submit(e?: FormEvent) {
    e?.preventDefault()
    if (visible.some(f => f.required && (v[f.key] === '' || v[f.key] == null))) return
    const out: Record<string, any> = {}
    visible.forEach(f => { out[f.key] = (f.type === 'number' || f.type === 'money') ? (v[f.key] === '' ? null : Number(v[f.key])) : v[f.key] })
    setSaving(true)
    const ok = await onSubmit(out)
    setSaving(false)
    if (ok !== false) onClose()
  }
  const invalid = visible.some(f => f.required && (v[f.key] === '' || v[f.key] == null))
  return (
    <Modal open={open} onClose={onClose} title={title} subtitle={subtitle} size={size}
      footer={<><button onClick={onClose} className="btn btn-ghost btn-sm">Hủy</button>
        <button onClick={() => submit()} disabled={saving || invalid} className="btn btn-primary btn-sm">{saving ? 'Đang lưu…' : submitLabel}</button></>}>
      <form onSubmit={submit} className="grid grid-cols-2 gap-x-3 gap-y-3.5">
        {visible.map((f, i) => (
          <div key={f.key} className={f.half ? 'col-span-1' : 'col-span-2'}>
            {f.type !== 'checkbox' && <label className="label !text-xs">{f.label}{f.required && ' *'}</label>}
            {f.type === 'textarea' ? <textarea className="input resize-none" rows={2} value={v[f.key] ?? ''} placeholder={f.placeholder} onChange={e => set(f.key, e.target.value)}/>
              : f.type === 'select' ? (
                <select className="input" value={v[f.key] ?? ''} onChange={e => set(f.key, e.target.value)}>
                  {!f.required && <option value="">— Không —</option>}
                  {f.options?.map(o => <option key={optV(o)} value={optV(o)}>{optL(o)}</option>)}
                </select>
              ) : f.type === 'chips' ? (
                <div className="flex flex-wrap gap-1.5">
                  {f.options?.map(o => (
                    <button key={optV(o)} type="button" onClick={() => set(f.key, optV(o))}
                      className={cn('px-2.5 py-1.5 rounded-xl border text-xs font-medium', v[f.key] === optV(o) ? 'border-sakura-500 bg-sakura-50 text-sakura-800' : 'border-ink-100 bg-white text-ink-600 hover:border-ink-300')}>{optL(o)}</button>
                  ))}
                </div>
              ) : f.type === 'checkbox' ? (
                <label className="flex items-center gap-2 text-sm text-ink-700 cursor-pointer"><input type="checkbox" checked={!!v[f.key]} onChange={e => set(f.key, e.target.checked)} className="w-4 h-4 accent-sakura-500"/>{f.label}</label>
              ) : (
                <input className={cn('input', (f.type === 'money' || f.type === 'number') && 'font-mono')} autoFocus={i === 0}
                  type={f.type === 'money' ? 'number' : f.type ?? 'text'} min={f.min ?? (f.type === 'money' ? 0 : undefined)} step={f.step}
                  value={v[f.key] ?? ''} placeholder={f.placeholder} onChange={e => set(f.key, e.target.value)}/>
              )}
            {f.type === 'money' && Number(v[f.key]) > 0 && <p className="text-xs text-jade-700 font-semibold mt-1 tabular">{vnd(Number(v[f.key]))}</p>}
            {f.hint && <p className="text-xs text-ink-400 mt-1">{f.hint}</p>}
          </div>
        ))}
      </form>
    </Modal>
  )
}

// ── Thành phần hiển thị ───────────────────────────────────────────────────────
export function Stat({ icon, label, value, sub, tone = 'ink' }: { icon: string; label: string; value: React.ReactNode; sub?: React.ReactNode; tone?: 'ink' | 'good' | 'bad' | 'warn' | 'brand' }) {
  const c = { ink: 'text-ink-900', good: 'text-jade-600', bad: 'text-red-600', warn: 'text-gold-700', brand: 'text-sakura-600' }[tone]
  return (
    <div className="card p-4 min-w-0">
      <p className="text-xs text-ink-500 font-semibold flex items-center gap-1.5 leading-snug"><span className="text-base">{icon}</span>{label}</p>
      <p className={cn('text-lg sm:text-2xl tracking-tight font-bold tabular mt-1 truncate', c)}>{value}</p>
      {sub && <p className="text-xs text-ink-400 truncate">{sub}</p>}
    </div>
  )
}

export function Panel({ title, sub, right, children, className, pad = true }: { title: React.ReactNode; sub?: React.ReactNode; right?: React.ReactNode; children: React.ReactNode; className?: string; pad?: boolean }) {
  return (
    <section className={cn('card overflow-hidden', className)}>
      <header className="px-5 py-3.5 border-b border-ink-100/70 flex items-center justify-between gap-3">
        <div className="min-w-0"><h3 className="font-semibold text-ink-900">{title}</h3>{sub && <p className="text-xs text-ink-400">{sub}</p>}</div>
        {right && <div className="flex items-center gap-2 flex-shrink-0">{right}</div>}
      </header>
      <div className={pad ? 'p-5' : ''}>{children}</div>
    </section>
  )
}

export function Empty({ icon, title, text, action }: { icon: string; title: string; text?: string; action?: React.ReactNode }) {
  return (
    <div className="text-center py-10 px-4">
      <div className="text-4xl mb-2 animate-float">{icon}</div>
      <p className="font-semibold text-ink-800">{title}</p>
      {text && <p className="text-sm text-ink-500 mt-1 max-w-md mx-auto">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function Tabs<K extends string>({ value, onChange, items }: { value: K; onChange: (k: K) => void; items: [K, string, (number | string)?][] }) {
  return (
    <div className="flex gap-1 overflow-x-auto no-scrollbar">
      {items.map(([k, l, n]) => (
        <button key={k} onClick={() => onChange(k)} className={cn('flex-shrink-0 px-3.5 py-2 rounded-xl text-sm font-medium transition',
          value === k ? 'bg-white shadow-card text-sakura-700 font-semibold' : 'text-ink-500 hover:text-ink-900 hover:bg-white/60')}>
          {l}{n !== undefined && n !== 0 && <span className="ml-1.5 text-[11px] font-bold bg-ink-100 text-ink-600 rounded-full px-1.5">{n}</span>}
        </button>
      ))}
    </div>
  )
}

export const RowActions = ({ onEdit, onDelete }: { onEdit?: () => void; onDelete?: () => void }) => (
  <span className="flex gap-0.5 sm:opacity-0 group-hover:opacity-100 focus-within:opacity-100 flex-shrink-0">
    {onEdit && <button onClick={onEdit} className="btn btn-ghost btn-xs btn-icon" title="Sửa">✎</button>}
    {onDelete && <button onClick={onDelete} className="btn btn-ghost btn-xs btn-icon hover:text-red-500" title="Xóa">✕</button>}
  </span>
)

export const today = () => new Date().toISOString().slice(0, 10)
export const thisMonth = () => new Date().toISOString().slice(0, 7)
export const monthLabel = (m: string) => { const [y, mo] = m.split('-'); return `Tháng ${Number(mo)}/${y}` }
export const shiftMonth = (m: string, n: number) => { const [y, mo] = m.split('-').map(Number); const d = new Date(y, mo - 1 + n, 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` }
export const daysUntil = (d: string) => { const a = new Date(d + 'T00:00:00'), b = new Date(); b.setHours(0, 0, 0, 0); return Math.round((a.getTime() - b.getTime()) / 864e5) }
export const short = (n: number) => Math.abs(n) >= 1e9 ? `${(n / 1e9).toFixed(1).replace('.0', '')} tỷ` : Math.abs(n) >= 1e6 ? `${(n / 1e6).toFixed(1).replace('.0', '')} tr` : Math.abs(n) >= 1e3 ? `${Math.round(n / 1e3)}k` : String(n)
