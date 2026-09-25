'use client'
import { useState, FormEvent } from 'react'
import { Modal } from '@/components/ui/Modal'
import { vnd, cn, fmtDate, EXPENSE_CATEGORIES, CATEGORY_ICONS, downloadCsv, deadlineInfo } from '@/lib/utils'
import type { Vendor, VendorStatus } from '@/types'
import type { VendorInput } from '@/lib/api/vendors'

export const VENDOR_STATUS: Record<VendorStatus, { label: string; cls: string }> = {
  considering: { label: 'Đang cân nhắc', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  booked:      { label: 'Đã chốt',       cls: 'bg-jade-50 text-jade-700 border-jade-200' },
  cancelled:   { label: 'Đã hủy',        cls: 'bg-ink-100 text-ink-500 border-ink-200' },
}

interface Props {
  vendors: Vendor[]; paidByVendor: Map<string, number>; canEdit: boolean; projectName: string
  onSave: (d: VendorInput, id?: string) => Promise<boolean>; onDelete: (v: Vendor) => void; onPay: (v: Vendor, remaining: number) => void
}

export function VendorsTab({ vendors, paidByVendor, canEdit, projectName, onSave, onDelete, onPay }: Props) {
  const [editing, setEditing] = useState<Vendor | null | 'new'>(null)
  const [status, setStatus] = useState<'' | VendorStatus>('')
  const [cat, setCat] = useState('')
  const list = vendors.filter(v => (!status || v.status === status) && (!cat || v.category === cat))
  const booked = vendors.filter(v => v.status === 'booked')
  const total = booked.reduce((s, v) => s + Number(v.total_cost), 0)
  const paid = booked.reduce((s, v) => s + (paidByVendor.get(v.id) ?? 0), 0)
  const cats = Array.from(new Set(vendors.map(v => v.category)))

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          ['🤝', 'Nhà cung cấp', `${booked.length}/${vendors.length}`, 'đã chốt / tổng'],
          ['📄', 'Giá trị hợp đồng', vnd(total), 'các nhà cung cấp đã chốt'],
          ['✅', 'Đã thanh toán', vnd(paid), total ? `${Math.round((paid / total) * 100)}% giá trị hợp đồng` : ''],
          ['⏳', 'Còn phải trả', vnd(Math.max(0, total - paid)), 'ghi thanh toán để cập nhật'],
        ].map(([i, l, v, s]) => (
          <div key={l} className="card p-4">
            <p className="text-[11px] text-ink-400 font-semibold uppercase tracking-wide flex items-center gap-1.5"><span className="text-lg">{i}</span>{l}</p>
            <p className="font-display text-xl sm:text-2xl font-bold text-ink-900 tabular mt-1">{v}</p>
            <p className="text-[11px] text-ink-400 truncate">{s}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1.5">
          {([['', 'Tất cả'], ['booked', 'Đã chốt'], ['considering', 'Đang cân nhắc'], ['cancelled', 'Đã hủy']] as const).map(([k, l]) => (
            <button key={k} onClick={() => setStatus(k)} className={cn('px-3 py-1.5 rounded-full text-xs font-medium border', status === k ? 'bg-ink-900 text-white border-ink-900' : 'bg-white text-ink-600 border-ink-200')}>
              {l} <span className="opacity-60">{k ? vendors.filter(v => v.status === k).length : vendors.length}</span>
            </button>
          ))}
        </div>
        {cats.length > 1 && (
          <select className="input !py-1.5 !w-auto text-xs" value={cat} onChange={e => setCat(e.target.value)}>
            <option value="">Mọi loại dịch vụ</option>{cats.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
        <div className="ml-auto flex gap-2">
          {vendors.length > 0 && <button onClick={() => downloadCsv(`nha-cung-cap-${projectName}.csv`, [
            ['Tên', 'Dịch vụ', 'Trạng thái', 'Liên hệ', 'SĐT', 'Email', 'Website', 'Giá trị', 'Đã trả', 'Còn lại', 'Hạn thanh toán', 'Ghi chú'],
            ...vendors.map(v => { const p = paidByVendor.get(v.id) ?? 0; return [v.name, v.category, VENDOR_STATUS[v.status].label, v.contact_name, v.phone, v.email, v.website, v.total_cost, p, Math.max(0, Number(v.total_cost) - p), v.due_date ? fmtDate(v.due_date) : '', v.notes] }),
          ])} className="btn btn-secondary btn-sm">⬇ Excel</button>}
          {canEdit && <button onClick={() => setEditing('new')} className="btn btn-primary btn-sm">+ Thêm nhà cung cấp</button>}
        </div>
      </div>

      {vendors.length === 0 ? (
        <div className="card text-center py-14 px-4">
          <div className="text-5xl mb-3 animate-float">🤝</div>
          <h3 className="font-display text-2xl font-semibold text-ink-900 mb-2">Quản lý nhà cung cấp</h3>
          <p className="text-sm text-ink-500 mb-6 max-w-md mx-auto">Lưu nhà hàng, studio ảnh, trang điểm, xe hoa… kèm liên hệ, giá hợp đồng. Ghi thanh toán sẽ tự cộng vào mục Ngân sách.</p>
          {canEdit && <button onClick={() => setEditing('new')} className="btn btn-primary">+ Thêm nhà cung cấp đầu tiên</button>}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {list.map(v => {
            const p = paidByVendor.get(v.id) ?? 0, cost = Number(v.total_cost), rest = Math.max(0, cost - p)
            const pctPaid = cost ? Math.min(100, (p / cost) * 100) : 0
            const due = v.due_date && rest > 0 && v.status === 'booked' ? deadlineInfo(v.due_date) : null
            return (
              <div key={v.id} className={cn('card p-4 flex flex-col gap-3', v.status === 'cancelled' && 'opacity-60')}>
                <div className="flex items-start gap-3">
                  <span className="w-11 h-11 rounded-2xl bg-gold-50 flex items-center justify-center text-2xl flex-shrink-0">{CATEGORY_ICONS[v.category] ?? '🤝'}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-ink-900 leading-snug line-clamp-2">{v.name}</p>
                    <p className="text-xs text-ink-400">{v.category}{v.rating ? ` · ${'★'.repeat(v.rating)}` : ''}</p>
                  </div>
                  <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0', VENDOR_STATUS[v.status].cls)}>{VENDOR_STATUS[v.status].label}</span>
                </div>
                {(v.contact_name || v.phone || v.email || v.website) && (
                  <div className="text-xs text-ink-600 space-y-1">
                    {v.contact_name && <p>👤 {v.contact_name}</p>}
                    <div className="flex flex-wrap gap-1.5">
                      {v.phone && <a href={`tel:${v.phone}`} className="tag border bg-white text-ink-600 border-ink-200 hover:border-jade-400 normal-case tracking-normal text-[11px]">📞 {v.phone}</a>}
                      {v.phone && <a href={`https://zalo.me/${v.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="tag border bg-white text-blue-600 border-blue-200 normal-case tracking-normal text-[11px]">Zalo</a>}
                      {v.email && <a href={`mailto:${v.email}`} className="tag border bg-white text-ink-600 border-ink-200 normal-case tracking-normal text-[11px]">✉️ Email</a>}
                      {v.website && <a href={/^https?:/.test(v.website) ? v.website : `https://${v.website}`} target="_blank" rel="noreferrer" className="tag border bg-white text-ink-600 border-ink-200 normal-case tracking-normal text-[11px]">🌐 Web</a>}
                    </div>
                  </div>
                )}
                {cost > 0 && (
                  <div>
                    <div className="flex justify-between text-xs mb-1"><span className="text-ink-500">Đã trả {vnd(p)}</span><span className="font-bold text-ink-900 tabular">{vnd(cost)}</span></div>
                    <div className="progress-track h-1.5"><div className="h-full rounded-full bg-jade-500 transition-all" style={{ width: `${pctPaid}%` }}/></div>
                    <p className={cn('text-[11px] mt-1', rest ? 'text-gold-700' : 'text-jade-600 font-semibold')}>{rest ? `Còn ${vnd(rest)}` : '✓ Đã thanh toán đủ'}{due && <span className={cn('ml-1', due.overdue ? 'text-red-600 font-semibold' : '')}>· hạn {due.label.toLowerCase()}</span>}</p>
                  </div>
                )}
                {v.notes && <p className="text-xs text-ink-500 italic line-clamp-2">“{v.notes}”</p>}
                {canEdit && (
                  <div className="flex gap-1.5 mt-auto pt-1">
                    {v.status === 'booked' && rest > 0 && <button onClick={() => onPay(v, rest)} className="btn btn-gold btn-xs flex-1">💸 Ghi thanh toán</button>}
                    {v.status === 'considering' && <button onClick={() => onSave({ name: v.name, status: 'booked' }, v.id)} className="btn btn-primary btn-xs flex-1">✓ Chốt</button>}
                    <button onClick={() => setEditing(v)} className="btn btn-secondary btn-xs">Sửa</button>
                    <button onClick={() => onDelete(v)} className="btn btn-ghost btn-xs btn-icon hover:text-red-500" title="Xóa">✕</button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {editing && <VendorModal key={editing === 'new' ? 'new' : editing.id} vendor={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)}
        onSave={async d => { const ok = await onSave(d, editing === 'new' ? undefined : editing.id); if (ok) setEditing(null); return ok }}/>}
    </div>
  )
}

function VendorModal({ vendor, onClose, onSave }: { vendor?: Vendor; onClose: () => void; onSave: (d: VendorInput) => Promise<boolean> }) {
  const [f, setF] = useState({
    name: vendor?.name ?? '', category: vendor?.category ?? 'Tiệc & đồ ăn', status: vendor?.status ?? 'considering' as VendorStatus,
    contact_name: vendor?.contact_name ?? '', phone: vendor?.phone ?? '', email: vendor?.email ?? '', website: vendor?.website ?? '',
    total_cost: vendor?.total_cost ? String(vendor.total_cost) : '', due_date: vendor?.due_date ?? '', rating: vendor?.rating ?? 0, notes: vendor?.notes ?? '',
  })
  const [saving, setSaving] = useState(false)
  const s = (k: keyof typeof f, v: any) => setF(x => ({ ...x, [k]: v }))
  async function submit(e?: FormEvent) {
    e?.preventDefault(); if (!f.name.trim()) return
    setSaving(true)
    await onSave({
      name: f.name.trim(), category: f.category, status: f.status, contact_name: f.contact_name || null, phone: f.phone || null,
      email: f.email || null, website: f.website || null, total_cost: Number(f.total_cost) || 0, due_date: f.due_date || null,
      rating: f.rating || null, notes: f.notes || null,
    })
    setSaving(false)
  }
  return (
    <Modal open onClose={onClose} title={vendor ? 'Sửa nhà cung cấp' : 'Thêm nhà cung cấp'} size="lg"
      footer={<><button onClick={onClose} className="btn btn-ghost btn-sm">Hủy</button><button onClick={() => submit()} disabled={saving || !f.name.trim()} className="btn btn-primary btn-sm">{saving ? 'Đang lưu…' : '✓ Lưu'}</button></>}>
      <form onSubmit={submit} className="space-y-3.5">
        <div className="grid grid-cols-[1fr_auto] gap-3">
          <div><label className="label">Tên nhà cung cấp *</label><input className="input" value={f.name} onChange={e => s('name', e.target.value)} placeholder="VD: Trung tâm tiệc cưới Tịnh Gia Viên" autoFocus required/></div>
          <div><label className="label">Đánh giá</label>
            <div className="flex h-[42px] items-center">{[1, 2, 3, 4, 5].map(n => <button key={n} type="button" onClick={() => s('rating', f.rating === n ? 0 : n)} className={cn('text-xl px-0.5', n <= f.rating ? 'text-gold-500' : 'text-ink-200')}>★</button>)}</div>
          </div>
        </div>
        <div><label className="label">Loại dịch vụ</label>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
            {EXPENSE_CATEGORIES.map(c => (
              <button key={c} type="button" onClick={() => s('category', c)} className={cn('px-2 py-2 rounded-xl border text-[11px] font-medium leading-tight', f.category === c ? 'border-sakura-500 bg-sakura-50 text-sakura-800' : 'border-ink-100 bg-white text-ink-600')}>
                <span className="block text-base">{CATEGORY_ICONS[c]}</span>{c}
              </button>
            ))}
          </div>
        </div>
        <div><label className="label">Trạng thái</label>
          <div className="grid grid-cols-3 gap-1.5">
            {(Object.keys(VENDOR_STATUS) as VendorStatus[]).map(k => (
              <button key={k} type="button" onClick={() => s('status', k)} className={cn('py-2 rounded-xl border text-xs font-semibold', f.status === k ? VENDOR_STATUS[k].cls + ' ring-2 ring-offset-1 ring-sakura-200' : 'border-ink-100 bg-white text-ink-500')}>{VENDOR_STATUS[k].label}</button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Giá trị hợp đồng (VNĐ)</label><input className="input font-mono" type="number" min={0} value={f.total_cost} onChange={e => s('total_cost', e.target.value)} placeholder="0"/>
            {Number(f.total_cost) > 0 && <p className="text-[11px] text-ink-400 mt-1">{vnd(Number(f.total_cost))}</p>}</div>
          <div><label className="label">Hạn thanh toán</label><input className="input" type="date" value={f.due_date} onChange={e => s('due_date', e.target.value)}/></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Người liên hệ</label><input className="input" value={f.contact_name} onChange={e => s('contact_name', e.target.value)} placeholder="Chị Mai"/></div>
          <div><label className="label">Số điện thoại</label><input className="input" value={f.phone} onChange={e => s('phone', e.target.value)} placeholder="0901 234 567" inputMode="tel"/></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Email</label><input className="input" type="email" value={f.email} onChange={e => s('email', e.target.value)}/></div>
          <div><label className="label">Website / Fanpage</label><input className="input" value={f.website} onChange={e => s('website', e.target.value)} placeholder="facebook.com/…"/></div>
        </div>
        <div><label className="label">Ghi chú</label><textarea className="input resize-none" rows={2} value={f.notes} onChange={e => s('notes', e.target.value)} placeholder="Gói dịch vụ, điều khoản, lưu ý…"/></div>
      </form>
    </Modal>
  )
}
