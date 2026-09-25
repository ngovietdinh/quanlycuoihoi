'use client'
import { useState, useEffect, FormEvent } from 'react'
import Link from 'next/link'
import { sb } from '@/lib/supabase/client'
import { AuthShell, AuthInput, Icon, GOOGLE_ENABLED } from '@/components/auth/AuthShell'
import { viAuthError } from '@/lib/authErrors'
import { cn } from '@/lib/utils'

type Mode = 'password' | 'magic' | 'forgot'
const safeNext = (n: string | null) => (n && n.startsWith('/') && !n.startsWith('//') ? n : '/dashboard')
const REMEMBER_KEY = 'hysu:last-email'

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('password')
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [remember, setRemember] = useState(true)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [info, setInfo] = useState('')
  const [unconfirmed, setUnconfirmed] = useState(false)
  const [next, setNext] = useState('/dashboard')

  useEffect(() => {
    const q = new URLSearchParams(window.location.search)
    if (q.get('error')) setErr(viAuthError(q.get('error')))
    setNext(safeNext(q.get('next')))
    try { const e = localStorage.getItem(REMEMBER_KEY); if (e) setEmail(e) } catch {}
  }, [])

  const callback = (to: string) => `${window.location.origin}/auth/callback?next=${encodeURIComponent(to)}`
  const reset = () => { setErr(''); setInfo(''); setUnconfirmed(false) }

  async function submit(e: FormEvent) {
    e.preventDefault(); reset(); setLoading(true)
    try { remember ? localStorage.setItem(REMEMBER_KEY, email) : localStorage.removeItem(REMEMBER_KEY) } catch {}

    if (mode === 'forgot') {
      const { error } = await sb().auth.resetPasswordForEmail(email, { redirectTo: callback('/account?reset=1') })
      setLoading(false)
      return error ? setErr(viAuthError(error.message)) : setInfo('Đã gửi email đặt lại mật khẩu. Hãy kiểm tra hộp thư (cả mục Spam).')
    }
    if (mode === 'magic') {
      const { error } = await sb().auth.signInWithOtp({ email, options: { emailRedirectTo: callback(next), shouldCreateUser: false } })
      setLoading(false)
      return error ? setErr(viAuthError(error.message)) : setInfo(`Đã gửi liên kết đăng nhập tới ${email}. Mở email trên thiết bị này và bấm vào liên kết.`)
    }
    const { error } = await sb().auth.signInWithPassword({ email, password: pw })
    if (error) {
      setErr(viAuthError(error.message)); setUnconfirmed(/not confirmed/i.test(error.message)); setLoading(false); return
    }
    // Tải lại toàn trang để middleware nhận cookie phiên mới
    window.location.href = next
  }

  async function resend() {
    setLoading(true)
    const { error } = await sb().auth.resend({ type: 'signup', email, options: { emailRedirectTo: callback('/dashboard') } })
    setLoading(false)
    if (error) setErr(viAuthError(error.message)); else { setUnconfirmed(false); setErr(''); setInfo('Đã gửi lại email xác nhận.') }
  }

  async function google() {
    reset()
    const { error } = await sb().auth.signInWithOAuth({ provider: 'google', options: { redirectTo: callback(next) } })
    if (error) setErr(viAuthError(error.message))
  }

  const TITLES: Record<Mode, [string, string]> = {
    password: ['Chào mừng trở lại 👋', 'Đăng nhập để tiếp tục chuẩn bị ngày vui'],
    magic:    ['Đăng nhập không cần mật khẩu', 'Nhận liên kết đăng nhập một chạm qua email'],
    forgot:   ['Quên mật khẩu?', 'Nhập email, chúng tôi sẽ gửi liên kết đặt lại mật khẩu'],
  }

  return (
    <AuthShell>
      <h1 className="font-display text-3xl sm:text-4xl font-bold text-ink-900">{TITLES[mode][0]}</h1>
      <p className="text-sm text-ink-500 mt-1.5 mb-7">{TITLES[mode][1]}</p>

      {mode !== 'forgot' && (
        <div className="grid grid-cols-2 p-1 rounded-2xl bg-ink-100/70 mb-5 text-sm">
          {(['password', 'magic'] as const).map(m => (
            <button key={m} type="button" onClick={() => { setMode(m); reset() }}
              className={cn('py-2 rounded-xl font-medium transition', mode === m ? 'bg-white shadow text-ink-900' : 'text-ink-500 hover:text-ink-800')}>
              {m === 'password' ? '🔑 Mật khẩu' : '✉️ Liên kết email'}
            </button>
          ))}
        </div>
      )}

      {err && (
        <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700" role="alert">
          ⚠️ {err}
          {unconfirmed && <button onClick={resend} disabled={loading} className="block mt-1.5 font-semibold underline">Gửi lại email xác nhận</button>}
        </div>
      )}
      {info && <div className="mb-4 p-3.5 rounded-xl bg-jade-50 border border-jade-200 text-sm text-jade-700" role="status">✉️ {info}</div>}

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label" htmlFor="email">Email</label>
          <AuthInput id="email" icon={Icon.mail} type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="ban@example.com" required autoFocus/>
        </div>
        {mode === 'password' && (
          <div>
            <div className="flex items-center justify-between">
              <label className="label" htmlFor="pw">Mật khẩu</label>
              <button type="button" onClick={() => { setMode('forgot'); reset() }} className="text-xs font-semibold text-sakura-600 hover:underline mb-1.5">Quên mật khẩu?</button>
            </div>
            <AuthInput id="pw" icon={Icon.lock} type={showPw ? 'text' : 'password'} autoComplete="current-password" value={pw} onChange={e => setPw(e.target.value)} placeholder="••••••••" required
              right={<button type="button" onClick={() => setShowPw(s => !s)} className="p-2 text-ink-400 hover:text-ink-700" aria-label={showPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>{Icon.eye(showPw)}</button>}/>
          </div>
        )}
        {mode !== 'forgot' && (
          <label className="flex items-center gap-2 text-sm text-ink-600 cursor-pointer select-none w-fit">
            <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} className="w-4 h-4 accent-sakura-500"/> Ghi nhớ email
          </label>
        )}
        <button type="submit" disabled={loading} className="btn btn-primary w-full h-12 text-base rounded-2xl">
          {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
            : mode === 'password' ? 'Đăng nhập' : mode === 'magic' ? 'Gửi liên kết đăng nhập' : 'Gửi liên kết đặt lại'}
        </button>
      </form>

      {mode === 'forgot' && (
        <button onClick={() => { setMode('password'); reset() }} className="mt-5 text-sm font-semibold text-sakura-600 hover:underline">← Quay lại đăng nhập</button>
      )}

      {GOOGLE_ENABLED && mode !== 'forgot' && (
        <>
          <div className="flex items-center gap-3 my-5 text-xs text-ink-400"><span className="flex-1 h-px bg-ink-200"/>hoặc<span className="flex-1 h-px bg-ink-200"/></div>
          <button onClick={google} className="btn btn-secondary w-full h-12 rounded-2xl">{Icon.google} Tiếp tục với Google</button>
        </>
      )}

      <p className="text-center text-sm text-ink-500 mt-8">
        Chưa có tài khoản? <Link href="/auth/register" className="text-sakura-600 font-semibold hover:underline">Đăng ký miễn phí</Link>
      </p>
    </AuthShell>
  )
}
