'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Shell } from '@/components/layout/Shell'
import { ToastProvider, useToast } from '@/components/ui/Toast'
import { ConfirmModal } from '@/components/ui/Modal'
import { getInvitation, updateInvitation, deleteInvitation } from '@/lib/api/invitations'
import { ContentPanel, EventsPanel, StoryPanel, GalleryPanel, GiftPanel, DesignPanel, SettingsPanel, type PanelProps } from '@/components/invitation/editor/panels'
import { GuestsPanel, ResponsesPanel } from '@/components/invitation/editor/manage'
import { cn } from '@/lib/utils'
import type { Invitation, InvitationContent, InvitationTheme } from '@/types'

const TABS = [
  { id: 'content',   icon: '✍️', label: 'Nội dung',   sec: 'cover' },
  { id: 'design',    icon: '🎨', label: 'Giao diện',  sec: 'cover' },
  { id: 'events',    icon: '📍', label: 'Sự kiện',    sec: 'events' },
  { id: 'story',     icon: '📖', label: 'Chuyện tình', sec: 'story' },
  { id: 'gallery',   icon: '🖼️', label: 'Album',      sec: 'gallery' },
  { id: 'gift',      icon: '🎁', label: 'Mừng cưới',  sec: 'gift' },
  { id: 'guests',    icon: '👥', label: 'Khách mời',  sec: null },
  { id: 'responses', icon: '📊', label: 'Phản hồi',   sec: null },
  { id: 'settings',  icon: '⚙️', label: 'Phát hành',  sec: null },
] as const
type TabId = (typeof TABS)[number]['id']
type SaveState = 'saved' | 'dirty' | 'saving' | 'error'

function Editor() {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const { success, error: toastErr } = useToast()
  const [draft, setDraft] = useState<Invitation | null>(null)
  const [loadErr, setLoadErr] = useState<string | null>(null)
  const [tab, setTab] = useState<TabId>('content')
  const [save, setSave] = useState<SaveState>('saved')
  const [saveErr, setSaveErr] = useState<string | null>(null)
  const [device, setDevice] = useState<'mobile' | 'desktop'>('mobile')
  const [mobilePreview, setMobilePreview] = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)
  const frame = useRef<HTMLIFrameElement>(null)
  const mobileFrame = useRef<HTMLIFrameElement>(null)
  const version = useRef(0)

  useEffect(() => {
    getInvitation(id).then(r => { if (r.data) setDraft(r.data); else setLoadErr(r.error) })
  }, [id])

  // ── Cập nhật bản nháp ──
  const touch = () => { version.current++; setSave('dirty') }
  const setContent = useCallback((patch: Partial<InvitationContent>) => { touch(); setDraft(d => d && { ...d, content: { ...d.content, ...patch } }) }, [])
  const setTheme   = useCallback((patch: Partial<InvitationTheme>) => { touch(); setDraft(d => d && { ...d, theme: { ...d.theme, ...patch } }) }, [])
  const setInv     = useCallback((patch: Partial<Invitation>) => { touch(); setDraft(d => d && { ...d, ...patch }) }, [])

  // ── Lưu (tự động sau 1.5s không thao tác) ──
  const doSave = useCallback(async (d: Invitation) => {
    const v = version.current
    setSave('saving')
    const { error } = await updateInvitation(d.id, {
      slug: d.slug, title: d.title, event_date: d.event_date || null, content: d.content, theme: d.theme,
      is_published: d.is_published, project_id: d.project_id,
    })
    if (error) { setSave('error'); setSaveErr(error); return }
    setSaveErr(null)
    setSave(version.current === v ? 'saved' : 'dirty')
  }, [])
  useEffect(() => {
    if (save !== 'dirty' || !draft) return
    const t = setTimeout(() => doSave(draft), 1500)
    return () => clearTimeout(t)
  }, [draft, save, doSave])
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); if (draft) doSave(draft) } }
    const unload = (e: BeforeUnloadEvent) => { if (save === 'dirty' || save === 'saving') { e.preventDefault(); e.returnValue = '' } }
    window.addEventListener('keydown', key); window.addEventListener('beforeunload', unload)
    return () => { window.removeEventListener('keydown', key); window.removeEventListener('beforeunload', unload) }
  }, [draft, save, doSave])

  // ── Đồng bộ bản xem trước (iframe) ──
  const post = useCallback((extra: Record<string, unknown> = {}) => {
    if (!draft) return
    const msg = { type: 'inv-preview', invitation: draft, showEnvelope: false, ...extra }
    ;[frame.current, mobileFrame.current].forEach(f => f?.contentWindow?.postMessage(msg, window.location.origin))
  }, [draft])
  useEffect(() => { const t = setTimeout(() => post(), 120); return () => clearTimeout(t) }, [post])
  useEffect(() => {
    const onMsg = (e: MessageEvent) => { if (e.origin === window.location.origin && e.data?.type === 'inv-preview-ready') post() }
    window.addEventListener('message', onMsg); return () => window.removeEventListener('message', onMsg)
  }, [post])
  function selectTab(t: TabId) {
    setTab(t)
    const sec = TABS.find(x => x.id === t)?.sec
    if (sec) post({ scrollTo: sec })
  }

  async function handleDelete() {
    const r = await deleteInvitation(id)
    if (r.error) return toastErr('Không xóa được', r.error)
    success('Đã xóa thiệp'); router.push('/invitations')
  }

  if (loadErr) return (
    <div className="flex-1 flex items-center justify-center p-6 text-center">
      <div><div className="text-4xl mb-3">⚠️</div><p className="text-ink-500 mb-4">{loadErr}</p><Link href="/invitations" className="btn btn-primary btn-sm">← Danh sách thiệp</Link></div>
    </div>
  )
  if (!draft) return <div className="flex-1 flex items-center justify-center"><div className="text-5xl animate-float">💌</div></div>

  const props: PanelProps = { inv: draft, setContent, setTheme, setInv }
  const SAVE_UI: Record<SaveState, [string, string]> = {
    saved: ['✓ Đã lưu', 'text-jade-600'], dirty: ['● Chưa lưu', 'text-gold-600'], saving: ['Đang lưu…', 'text-ink-400'], error: ['⚠ Lỗi lưu', 'text-red-600'],
  }
  const previewFrame = (ref: React.RefObject<HTMLIFrameElement>, cls: string) => (
    <iframe ref={ref} src="/preview" title="Xem trước thiệp" className={cls}/>
  )

  return (
    <>
      <header className="sticky top-0 z-30 px-4 sm:px-6 py-3 border-b border-ink-100/60 flex items-center gap-3"
        style={{ background: 'rgba(255,253,249,0.94)', backdropFilter: 'blur(20px)' }}>
        <Link href="/invitations" className="btn btn-ghost btn-sm btn-icon" title="Quay lại">←</Link>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-lg sm:text-xl font-semibold text-ink-900 truncate leading-tight">{draft.title || 'Thiệp cưới'}</h1>
          <p className="text-[11px] flex items-center gap-2">
            <span className={SAVE_UI[save][1]}>{SAVE_UI[save][0]}</span>
            <span className={cn('font-semibold', draft.is_published ? 'text-jade-600' : 'text-ink-400')}>{draft.is_published ? '· Đã phát hành' : '· Bản nháp'}</span>
          </p>
        </div>
        <button onClick={() => setMobilePreview(true)} className="btn btn-secondary btn-sm xl:hidden">👁 Xem</button>
        <a href={`/i/${draft.slug}`} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm hidden sm:inline-flex">Mở thiệp ↗</a>
        {!draft.is_published
          ? <button onClick={() => { setInv({ is_published: true }); success('Thiệp sẽ được phát hành 🎉', 'Hãy gửi link cho khách mời') }} className="btn btn-primary btn-sm">🚀 Phát hành</button>
          : <button onClick={() => doSave(draft)} disabled={save === 'saving'} className="btn btn-primary btn-sm">Lưu</button>}
      </header>
      {saveErr && <div className="mx-4 sm:mx-6 mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">⚠️ {saveErr}</div>}

      <div className="flex-1 grid xl:grid-cols-[minmax(0,1fr)_440px] 2xl:grid-cols-[minmax(0,1fr)_520px] gap-0">
        <div className="min-w-0 flex flex-col md:flex-row">
          {/* Thanh công cụ */}
          <nav className="md:w-28 flex-shrink-0 md:border-r border-b md:border-b-0 border-ink-100/60 bg-white/40 flex md:flex-col overflow-x-auto no-scrollbar md:py-3 md:sticky md:top-[61px] md:h-[calc(100vh-61px)]">
            {TABS.map(t => (
              <button key={t.id} onClick={() => selectTab(t.id)}
                className={cn('flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2.5 md:mx-2 md:mb-1 rounded-xl text-[11px] font-medium transition',
                  tab === t.id ? 'bg-sakura-50 text-sakura-700 font-semibold' : 'text-ink-500 hover:bg-ink-50')}>
                <span className="text-lg leading-none">{t.icon}</span>{t.label}
              </button>
            ))}
          </nav>
          {/* Nội dung tab */}
          <div className="flex-1 min-w-0 p-4 sm:p-6 max-w-3xl">
            {tab === 'content'   && <ContentPanel {...props}/>}
            {tab === 'design'    && <DesignPanel {...props}/>}
            {tab === 'events'    && <EventsPanel {...props}/>}
            {tab === 'story'     && <StoryPanel {...props}/>}
            {tab === 'gallery'   && <GalleryPanel {...props}/>}
            {tab === 'gift'      && <GiftPanel {...props}/>}
            {tab === 'guests'    && <GuestsPanel inv={draft}/>}
            {tab === 'responses' && <ResponsesPanel inv={draft}/>}
            {tab === 'settings'  && <SettingsPanel {...props} onDelete={() => setConfirmDel(true)}/>}
          </div>
        </div>

        {/* Xem trước trực tiếp */}
        <aside className="hidden xl:flex flex-col items-center border-l border-ink-100/60 bg-ink-50/40 sticky top-[61px] h-[calc(100vh-61px)] py-4">
          <div className="flex items-center gap-1 mb-3 bg-white rounded-xl p-1 border border-ink-100 text-xs">
            {(['mobile', 'desktop'] as const).map(d => (
              <button key={d} onClick={() => setDevice(d)} className={cn('px-3 py-1 rounded-lg', device === d ? 'bg-ink-900 text-white' : 'text-ink-500')}>{d === 'mobile' ? '📱 Điện thoại' : '🖥 Máy tính'}</button>
            ))}
            <button onClick={() => post({ showEnvelope: true, replay: true })} className="px-3 py-1 rounded-lg text-ink-500 hover:bg-ink-50" title="Xem hiệu ứng mở phong bì">✉️ Phong bì</button>
          </div>
          {device === 'mobile' ? (
            <div className="phone-frame w-[340px] h-[min(700px,calc(100vh-140px))]">{previewFrame(frame, 'w-full h-full bg-white')}</div>
          ) : (
            <div className="w-full flex-1 px-3 overflow-hidden">
              <div className="rounded-xl overflow-hidden border border-ink-200 shadow-card origin-top-left" style={{ width: '1280px', height: 'calc((100vh - 140px) / 0.33)', transform: 'scale(0.33)' }}>
                {previewFrame(frame, 'w-full h-full bg-white')}
              </div>
            </div>
          )}
        </aside>
      </div>

      {mobilePreview && (
        <div className="fixed inset-0 z-50 bg-black/80 flex flex-col xl:hidden">
          <div className="flex justify-between items-center p-3 text-white text-sm">
            <span>Xem trước</span>
            <div className="flex gap-2">
              <button onClick={() => post({ showEnvelope: true, replay: true })} className="px-3 py-1 rounded-lg bg-white/15">✉️ Phong bì</button>
              <button onClick={() => setMobilePreview(false)} className="px-3 py-1 rounded-lg bg-white/15">✕ Đóng</button>
            </div>
          </div>
          {previewFrame(mobileFrame, 'flex-1 w-full max-w-md mx-auto bg-white rounded-t-2xl')}
        </div>
      )}
      <ConfirmModal open={confirmDel} onClose={() => setConfirmDel(false)} onConfirm={handleDelete}
        title="Xóa thiệp cưới?" msg="Khách mời, phản hồi và lời chúc sẽ bị xóa vĩnh viễn." confirmLabel="Xóa thiệp"/>
    </>
  )
}

export default function InvitationEditorPage() {
  return <ToastProvider><Shell><Editor/></Shell></ToastProvider>
}
