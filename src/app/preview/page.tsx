'use client'
import { useEffect, useState } from 'react'
import { InvitationView } from '@/components/invitation/InvitationView'
import type { Invitation } from '@/types'

/** Khung xem trước trong trình thiết kế thiệp — nhận dữ liệu qua postMessage */
export default function PreviewFrame() {
  const [state, setState] = useState<{ invitation: Invitation; showEnvelope: boolean; key: number } | null>(null)
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.data?.type !== 'inv-preview') return
      setState(s => ({ invitation: e.data.invitation, showEnvelope: !!e.data.showEnvelope, key: e.data.replay ? Date.now() : s?.key ?? 0 }))
      if (typeof e.data.scrollTo === 'string') document.getElementById(`sec-${e.data.scrollTo}`)?.scrollIntoView({ behavior: 'smooth' })
    }
    window.addEventListener('message', onMsg)
    window.parent?.postMessage({ type: 'inv-preview-ready' }, window.location.origin)
    return () => window.removeEventListener('message', onMsg)
  }, [])
  if (!state) return <div className="min-h-screen flex items-center justify-center text-ink-400 text-sm">Đang tải bản xem trước…</div>
  return <InvitationView key={state.key} invitation={state.invitation} preview showEnvelope={state.showEnvelope}/>
}
