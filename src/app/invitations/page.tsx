'use client'
import { useEffect, useState, FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Shell, TopBar } from '@/components/layout/Shell'
import { ToastProvider, useToast } from '@/components/ui/Toast'
import { Modal, ConfirmModal } from '@/components/ui/Modal'
import { getMyInvitations, createInvitation, deleteInvitation, duplicateInvitation, updateInvitation } from '@/lib/api/invitations'
import { getProjects } from '@/lib/api/projects'
import { TEMPLATES, templateById } from '@/lib/invitation/templates'
import { fmtDay } from '@/lib/invitation/datetime'
import { cn } from '@/lib/utils'
import { TemplatePicker } from '@/components/invitation/editor/TemplateSwatch'
import { FontLoader } from '@/components/invitation/effects'
import type { InvitationListItem, ProjectSummary, TemplateId } from '@/types'

function CreateModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter()
  const { error: toastErr } = useToast()
  const [form, setForm] = useState({ groom: '', bride: '', event_date: '', template: 'classic' as TemplateId, project_id: '' })
  const [projects, setProjects] = useState<ProjectSummary[]>([])
  const [loading, setLoading] = useState(false)
  useEffect(() => { if (open) getProjects().then(r => setProjects(r.data ?? [])) }, [open])
  const sf = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  function pickProject(id: string) {
    const p = projects.find(x => x.id === id)
    setForm(f => ({ ...f, project_id: id, event_date: f.event_date || (p?.event_date ? `${p.event_date}T11:00` : '') }))
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!form.groom.trim() || !form.bride.trim()) return
    setLoading(true)
    const { data, error } = await createInvitation({ ...form, event_date: form.event_date || undefined, project_id: form.project_id || undefined })
    setLoading(false)
    if (error || !data) { toastErr('Không tạo được thiệp', error ?? ''); return }
    router.push(`/invitations/${data.id}`)
  }

  return (
    <Modal open={open} onClose={onClose} title="Tạo thiệp cưới online" subtitle="Chọn mẫu yêu thích — bạn có thể tùy chỉnh mọi thứ sau" size="lg"
      footer={<>
        <button onClick={onClose} className="btn btn-ghost btn-sm">Hủy</button>
        <button onClick={submit} disabled={loading} className="btn btn-primary btn-sm">{loading ? 'Đang tạo…' : '💌 Tạo & thiết kế'}</button>
      </>}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Tên chú rể *</label><input className="input" value={form.groom} onChange={e => sf('groom', e.target.value)} placeholder="Minh Anh" required/></div>
          <div><label className="label">Tên cô dâu *</label><input className="input" value={form.bride} onChange={e => sf('bride', e.target.value)} placeholder="Thu Trang" required/></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Ngày giờ tiệc cưới</label><input className="input" type="datetime-local" value={form.event_date} onChange={e => sf('event_date', e.target.value)}/></div>
          <div>
            <label className="label">Liên kết dự án</label>
            <select className="input" value={form.project_id} onChange={e => pickProject(e.target.value)}>
              <option value="">— Không —</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="label">Chọn mẫu thiệp</label>
          <div className="max-h-[46vh] overflow-y-auto -mr-2 pr-2"><TemplatePicker value={form.template} onChange={id => sf('template', id)}/></div>
          <a href={`/i/demo?t=${form.template}`} target="_blank" rel="noreferrer" className="text-xs text-sakura-600 hover:underline mt-2 inline-block">👁 Xem thiệp mẫu “{templateById(form.template).name}” ↗</a>
        </div>
      </form>
    </Modal>
  )
}

function InvitationCard({ inv, onChanged }: { inv: InvitationListItem; onChanged: () => void }) {
  const { success, error } = useToast()
  const [confirm, setConfirm] = useState(false)
  const [busy, setBusy] = useState(false)
  const t = inv.theme
  const url = typeof window !== 'undefined' ? `${window.location.origin}/i/${inv.slug}` : `/i/${inv.slug}`

  async function copy() { await navigator.clipboard.writeText(url); success('Đã sao chép liên kết thiệp') }
  async function togglePublish() {
    const r = await updateInvitation(inv.id, { is_published: !inv.is_published })
    if (r.error) return error('Lỗi', r.error)
    success(inv.is_published ? 'Đã chuyển về bản nháp' : 'Đã phát hành thiệp 🎉'); onChanged()
  }
  async function dup() {
    const r = await duplicateInvitation(inv)
    if (r.error) return error('Không nhân bản được', r.error)
    success('Đã nhân bản thiệp'); onChanged()
  }
  async function del() {
    setBusy(true); const r = await deleteInvitation(inv.id); setBusy(false); setConfirm(false)
    if (r.error) return error('Không xóa được', r.error)
    success('Đã xóa thiệp'); onChanged()
  }

  return (
    <div className="card overflow-hidden flex flex-col group">
      <Link href={`/invitations/${inv.id}`} className="block relative h-44 overflow-hidden" style={{ background: t.background }}>
        {inv.content.cover_url && <img src={inv.content.cover_url} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"/>}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4"
          style={{ background: inv.content.cover_url ? 'linear-gradient(180deg,rgba(0,0,0,.15),rgba(0,0,0,.55))' : undefined, color: inv.content.cover_url ? '#fff' : t.primary }}>
          <span className="text-[9px] tracking-[.3em] uppercase opacity-80">{inv.content.headline}</span>
          <span style={{ fontFamily: `'${t.heading_font}', cursive` }} className="text-3xl leading-tight">{inv.content.groom.name} &amp; {inv.content.bride.name}</span>
          {inv.event_date && <span className="text-xs mt-1 opacity-90">{fmtDay(inv.event_date)}</span>}
        </div>
        <span className={cn('absolute top-3 left-3 badge text-[10px]', inv.is_published ? 'badge-done' : 'badge-todo')}>
          {inv.is_published ? '● Đã phát hành' : '○ Bản nháp'}
        </span>
      </Link>
      <div className="p-4 flex-1 flex flex-col gap-3">
        <div className="grid grid-cols-3 text-center rounded-xl border border-ink-100 divide-x divide-ink-100">
          <div className="py-2"><p className="text-[10px] text-ink-400">Lượt xem</p><p className="font-bold text-ink-800 text-sm tabular">{inv.view_count}</p></div>
          <div className="py-2"><p className="text-[10px] text-ink-400">Phản hồi</p><p className="font-bold text-sakura-600 text-sm tabular">{inv.rsvp_count}</p></div>
          <div className="py-2"><p className="text-[10px] text-ink-400">Lời chúc</p><p className="font-bold text-gold-600 text-sm tabular">{inv.wish_count}</p></div>
        </div>
        <p className="text-xs text-ink-400 font-mono truncate">/i/{inv.slug}</p>
        <div className="flex gap-1.5 mt-auto">
          <Link href={`/invitations/${inv.id}`} className="btn btn-primary btn-sm flex-1">✏️ Thiết kế</Link>
          <a href={`/i/${inv.slug}`} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm btn-icon" title="Mở thiệp">↗</a>
          <button onClick={copy} className="btn btn-secondary btn-sm btn-icon" title="Sao chép liên kết">🔗</button>
          <button onClick={togglePublish} className="btn btn-secondary btn-sm btn-icon" title={inv.is_published ? 'Hủy phát hành' : 'Phát hành'}>{inv.is_published ? '⏸' : '🚀'}</button>
          <button onClick={dup} className="btn btn-secondary btn-sm btn-icon" title="Nhân bản">⧉</button>
          <button onClick={() => setConfirm(true)} className="btn btn-ghost btn-sm btn-icon hover:bg-red-50 hover:text-red-500" title="Xóa">🗑</button>
        </div>
      </div>
      <ConfirmModal open={confirm} onClose={() => setConfirm(false)} onConfirm={del} loading={busy}
        title="Xóa thiệp cưới?" msg="Toàn bộ khách mời, phản hồi và lời chúc của thiệp sẽ bị xóa vĩnh viễn." confirmLabel="Xóa thiệp"/>
    </div>
  )
}

function InvitationsContent() {
  const [items, setItems] = useState<InvitationListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  async function load() {
    setLoading(true)
    const r = await getMyInvitations()
    setItems(r.data ?? []); setErr(r.error); setLoading(false)
  }
  useEffect(() => { load() }, [])
  const totals = items.reduce((a, i) => ({ views: a.views + i.view_count, rsvps: a.rsvps + (i.rsvp_count ?? 0), wishes: a.wishes + (i.wish_count ?? 0) }), { views: 0, rsvps: 0, wishes: 0 })

  return (
    <>
      <FontLoader fonts={TEMPLATES.map(t => t.theme.heading_font)}/>
      <TopBar title="Thiệp cưới online" subtitle="Thiết kế, gửi thiệp và theo dõi khách mời xác nhận"
        right={<button onClick={() => setShowCreate(true)} className="btn btn-primary btn-sm">+ Tạo thiệp</button>}/>
      <div className="p-4 sm:p-6 max-w-6xl mx-auto w-full space-y-5">
        <div className="hero p-6 sm:p-8">
          <div className="hero-bubble w-32 h-32 top-0 right-0 translate-x-8 -translate-y-8"/>
          <div className="relative grid sm:grid-cols-[1fr_auto] gap-5 items-center">
            <div>
              <p className="text-white/60 text-sm mb-1">💌 Thiệp cưới online</p>
              <h2 className="font-display text-3xl font-bold text-white mb-2">Gửi lời mời theo cách của riêng bạn</h2>
              <p className="text-white/60 text-sm max-w-lg">18 mẫu thiệp, 7 bố cục, tùy biến màu sắc – font chữ – hiệu ứng, nhạc nền, album ảnh, bản đồ, xác nhận tham dự, sổ lưu bút và hộp mừng cưới QR.</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[['👁', 'Lượt xem', totals.views], ['✉️', 'Phản hồi', totals.rsvps], ['💌', 'Lời chúc', totals.wishes]].map(([i, l, v]) => (
                <div key={l as string} className="rounded-xl p-3 border border-white/15 text-center" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <p className="text-lg">{i}</p><p className="text-[10px] text-white/50">{l}</p><p className="text-sm font-bold text-white tabular">{v}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {err && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">⚠️ {err}<br/><span className="text-xs">Nếu bạn vừa nâng cấp, hãy chạy <code>supabase/migrations/002_invitations_roles.sql</code> trong Supabase SQL Editor.</span></div>}

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">{[1, 2, 3].map(i => <div key={i} className="card h-80 skeleton"/>)}</div>
        ) : items.length === 0 ? (
          <div className="card text-center py-16 px-4">
            <div className="text-6xl mb-4 animate-float">💌</div>
            <h3 className="font-display text-2xl font-semibold text-ink-800 mb-2">Chưa có thiệp cưới nào</h3>
            <p className="text-ink-500 text-sm mb-6 max-w-sm mx-auto">Tạo thiệp online chỉ trong vài phút, gửi link qua Zalo, Messenger và theo dõi ai sẽ đến dự.</p>
            <div className="flex gap-2 justify-center flex-wrap">
              <button onClick={() => setShowCreate(true)} className="btn btn-primary btn-lg">💌 Tạo thiệp đầu tiên</button>
              <a href="/i/demo" target="_blank" className="btn btn-secondary btn-lg">Xem thiệp mẫu</a>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map(i => <InvitationCard key={i.id} inv={i} onChanged={load}/>)}
          </div>
        )}
      </div>
      <CreateModal open={showCreate} onClose={() => setShowCreate(false)}/>
    </>
  )
}

export default function InvitationsPage() {
  return <ToastProvider><Shell><InvitationsContent/></Shell></ToastProvider>
}
