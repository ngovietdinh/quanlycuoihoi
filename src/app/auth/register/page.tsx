'use client'
import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { sb } from '@/lib/supabase/client'
import { AuthShell, AuthInput, Icon, GOOGLE_ENABLED } from '@/components/auth/AuthShell'
import { viAuthError, passwordScore, SCORE_LABEL, SCORE_COLOR } from '@/lib/authErrors'
import { cn } from '@/lib/utils'

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', pw: '', pw2: '' })
  const [show, setShow] = useState(false)
  const [agree, setAgree] = useState(false)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [resent, setResent] = useState(false)
  const sf = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }))
  const score = passwordScore(form.pw)
  const mismatch = form.pw2.length > 0 && form.pw !== form.pw2
  const callback = () => `${window.location.origin}/auth/callback?next=/dashboard`

  async function submit(e: FormEvent) {
    e.preventDefault(); setErr('')
    if (form.name.trim().length < 2) return setErr('Vui lòng nhập họ tên')
    if (form.pw.length < 6) return setErr('Mật khẩu phải có ít nhất 6 ký tự')
    if (form.pw !== form.pw2) return setErr('Mật khẩu xác nhận không khớp')
    if (!agree) return setErr('Bạn cần đồng ý với điều khoản sử dụng')
    setLoading(true)
    const { data, error } = await sb().auth.signUp({
      email: form.email.trim(), password: form.pw,
      options: { data: { full_name: form.name.trim() }, emailRedirectTo: callback() },
    })
    if (error) { setErr(viAuthError(error.message)); setLoading(false); return }
    // Supabase trả user không có identities khi email đã tồn tại (chống dò email)
    if (data.user && data.user.identities?.length === 0) { setErr(viAuthError('User already registered')); setLoading(false); return }
    if (!data.session) { setSentTo(form.email.trim()); setLoading(false); return }
    window.location.href = '/dashboard'
  }

  async function resend() {
    if (!sentTo) return
    const { error } = await sb().auth.resend({ type: 'signup', email: sentTo, options: { emailRedirectTo: callback() } })
    if (error) setErr(viAuthError(error.message)); else setResent(true)
  }

  if (sentTo) return (
    <AuthShell>
      <div className="text-center">
        <div className="w-20 h-20 rounded-3xl mx-auto mb-5 flex items-center justify-center text-4xl animate-float" style={{ background: 'linear-gradient(135deg,rgba(255,61,120,.12),rgba(245,158,11,.12))' }}>📬</div>
        <h1 className="font-display text-3xl font-bold text-ink-900 mb-2">Kiểm tra hộp thư của bạn</h1>
        <p className="text-sm text-ink-500 mb-6">Chúng tôi đã gửi liên kết xác nhận tới <b className="text-ink-800">{sentTo}</b>. Bấm vào liên kết trong email để kích hoạt tài khoản.</p>
        <ol className="text-left text-sm text-ink-600 space-y-2 bg-white border border-ink-100 rounded-2xl p-4 mb-6">
          <li>1. Mở email từ <b>Supabase / Hỷ Sự</b> (có thể nằm trong mục Spam, Quảng cáo).</li>
          <li>2. Bấm <b>Confirm your mail</b> / <b>Xác nhận</b>.</li>
          <li>3. Bạn sẽ được chuyển thẳng vào trang tổng quan.</li>
        </ol>
        {err && <p className="text-sm text-red-600 mb-3">⚠️ {err}</p>}
        <div className="flex flex-col gap-2">
          <button onClick={resend} disabled={resent} className="btn btn-secondary h-11 rounded-2xl">{resent ? '✓ Đã gửi lại' : 'Chưa nhận được? Gửi lại email'}</button>
          <Link href="/auth/login" className="btn btn-ghost h-11">← Về trang đăng nhập</Link>
        </div>
      </div>
    </AuthShell>
  )

  return (
    <AuthShell>
      <h1 className="font-display text-3xl sm:text-4xl font-bold text-ink-900">Tạo tài khoản miễn phí</h1>
      <p className="text-sm text-ink-500 mt-1.5 mb-7">Bắt đầu lên kế hoạch và tạo thiệp cưới trong 5 phút ✨</p>

      {err && <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700" role="alert">⚠️ {err}</div>}

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label" htmlFor="name">Họ và tên</label>
          <AuthInput id="name" icon={Icon.user} value={form.name} onChange={e => sf('name', e.target.value)} placeholder="Nguyễn Văn A" autoComplete="name" required autoFocus/>
        </div>
        <div>
          <label className="label" htmlFor="email">Email</label>
          <AuthInput id="email" icon={Icon.mail} type="email" value={form.email} onChange={e => sf('email', e.target.value)} placeholder="ban@example.com" autoComplete="email" required/>
        </div>
        <div>
          <label className="label" htmlFor="pw">Mật khẩu</label>
          <AuthInput id="pw" icon={Icon.lock} type={show ? 'text' : 'password'} value={form.pw} onChange={e => sf('pw', e.target.value)} placeholder="Ít nhất 6 ký tự" autoComplete="new-password" required
            right={<button type="button" onClick={() => setShow(s => !s)} className="p-2 text-ink-400 hover:text-ink-700" aria-label="Hiện mật khẩu">{Icon.eye(show)}</button>}/>
          {form.pw && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 grid grid-cols-4 gap-1">
                {[1, 2, 3, 4].map(k => <span key={k} className={cn('h-1.5 rounded-full transition-colors', score >= k ? SCORE_COLOR[score] : 'bg-ink-100')}/>)}
              </div>
              <span className="text-[11px] font-semibold text-ink-500 w-20 text-right">{SCORE_LABEL[score]}</span>
            </div>
          )}
        </div>
        <div>
          <label className="label" htmlFor="pw2">Nhập lại mật khẩu</label>
          <AuthInput id="pw2" icon={Icon.lock} type={show ? 'text' : 'password'} value={form.pw2} onChange={e => sf('pw2', e.target.value)} placeholder="Nhập lại mật khẩu" autoComplete="new-password" required
            className={mismatch ? '!border-red-300' : form.pw2 && !mismatch ? '!border-jade-300' : ''}
            right={form.pw2 ? <span className={cn('p-2 text-sm', mismatch ? 'text-red-500' : 'text-jade-600')}>{mismatch ? '✕' : '✓'}</span> : undefined}/>
          {mismatch && <p className="text-xs text-red-500 mt-1">Mật khẩu chưa khớp</p>}
        </div>
        <label className="flex items-start gap-2.5 text-sm text-ink-600 cursor-pointer select-none">
          <input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} className="w-4 h-4 mt-0.5 accent-sakura-500"/>
          <span>Tôi đồng ý với điều khoản sử dụng và cho phép lưu thông tin để quản lý kế hoạch cưới, khách mời của tôi.</span>
        </label>
        <button type="submit" disabled={loading} className="btn btn-primary w-full h-12 text-base rounded-2xl">
          {loading ? <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/> Đang tạo tài khoản…</> : '💍 Tạo tài khoản'}
        </button>
      </form>

      {GOOGLE_ENABLED && (
        <>
          <div className="flex items-center gap-3 my-5 text-xs text-ink-400"><span className="flex-1 h-px bg-ink-200"/>hoặc<span className="flex-1 h-px bg-ink-200"/></div>
          <button onClick={() => sb().auth.signInWithOAuth({ provider: 'google', options: { redirectTo: callback() } }).then(({ error }) => error && setErr(viAuthError(error.message)))}
            className="btn btn-secondary w-full h-12 rounded-2xl">{Icon.google} Đăng ký bằng Google</button>
        </>
      )}

      <p className="text-center text-sm text-ink-500 mt-8">
        Đã có tài khoản? <Link href="/auth/login" className="text-sakura-600 font-semibold hover:underline">Đăng nhập</Link>
      </p>
    </AuthShell>
  )
}
