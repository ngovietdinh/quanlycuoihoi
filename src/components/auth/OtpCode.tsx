'use client'
import { useState, FormEvent } from 'react'
import { sb } from '@/lib/supabase/client'
import { viAuthError } from '@/lib/authErrors'

/**
 * Nhập mã số trong email thay cho bấm liên kết — dùng được khi mở email trên máy khác
 * (điện thoại, ứng dụng Gmail…). Cần mẫu email có {{ .Token }} (xem supabase/email-templates).
 */
export function OtpCode({ email, type, next = '/dashboard' }: { email: string; type: 'email' | 'signup'; next?: string }) {
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  async function submit(e: FormEvent) {
    e.preventDefault(); setErr(''); setBusy(true)
    const { error } = await sb().auth.verifyOtp({ email, token: code.trim(), type })
    if (error) { setErr(viAuthError(error.message)); setBusy(false); return }
    window.location.href = next
  }
  return (
    <form onSubmit={submit} className="mt-4 p-4 rounded-2xl border border-ink-100 bg-white text-left">
      <label htmlFor="otp" className="label">Hoặc nhập mã trong email</label>
      <div className="flex gap-2">
        <input id="otp" inputMode="numeric" autoComplete="one-time-code" maxLength={10} value={code}
          onChange={e => setCode(e.target.value.replace(/\D/g, ''))} placeholder="123456"
          className="input text-center text-xl font-bold tracking-[.4em] tabular flex-1"/>
        <button disabled={busy || code.length < 6} className="btn btn-primary h-12 px-5 rounded-xl">{busy ? '…' : 'Xác nhận'}</button>
      </div>
      {err && <p className="text-sm text-red-600 mt-2">⚠️ {err}</p>}
      <p className="text-xs text-ink-400 mt-2">Mã dùng được trên mọi thiết bị, kể cả khi bạn mở email trên điện thoại.</p>
    </form>
  )
}
