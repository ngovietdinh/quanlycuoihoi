'use client'
import { useState, useEffect, FormEvent } from 'react'
import Link from 'next/link'
import { sb } from '@/lib/supabase/client'

const safeNext = (n: string | null) => (n && n.startsWith('/') && !n.startsWith('//') ? n : '/dashboard')

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'forgot'>('login')
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [info, setInfo] = useState('')

  useEffect(() => {
    const e = new URLSearchParams(window.location.search).get('error')
    if (e) setErr(e)
  }, [])

  async function submit(e: FormEvent) {
    e.preventDefault(); setLoading(true); setErr(''); setInfo('')
    if (mode === 'forgot') {
      const { error } = await sb().auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent('/account?reset=1')}`,
      })
      setLoading(false)
      if (error) { setErr(error.message); return }
      setInfo('Đã gửi email đặt lại mật khẩu. Vui lòng kiểm tra hộp thư của bạn.')
      return
    }
    const { error } = await sb().auth.signInWithPassword({ email, password: pw })
    if (error) {
      setErr(error.message === 'Invalid login credentials' ? 'Email hoặc mật khẩu không đúng' : error.message)
      setLoading(false); return
    }
    // Tải lại toàn trang để middleware nhận cookie phiên mới
    window.location.href = safeNext(new URLSearchParams(window.location.search).get('next'))
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{background:'linear-gradient(135deg,#1a0d08 0%,#2c1810 35%,#4a2520 65%,#78350f 100%)'}}>
      <div className="fixed top-20 left-10 w-64 h-64 rounded-full opacity-10 blur-3xl" style={{background:'#ff3d78'}}/>
      <div className="fixed bottom-20 right-10 w-48 h-48 rounded-full opacity-10 blur-3xl" style={{background:'#f59e0b'}}/>
      <div className="w-full max-w-md relative animate-fadeUp">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex w-20 h-20 rounded-3xl items-center justify-center text-4xl mb-4 shadow-glow-sakura animate-float"
            style={{background:'linear-gradient(135deg,#ff6b96,#ff3d78)'}}>💍</Link>
          <h1 className="font-display text-4xl font-bold text-white mb-1">Hỷ Sự</h1>
          <p className="text-white/50 text-sm">Quản lý lễ cưới & thiệp cưới online</p>
        </div>
        <div className="rounded-3xl p-8 border border-white/10" style={{background:'rgba(255,253,249,0.96)',backdropFilter:'blur(20px)'}}>
          <h2 className="font-display text-2xl font-semibold text-ink-900 mb-1">{mode === 'login' ? 'Đăng nhập' : 'Quên mật khẩu'}</h2>
          <p className="text-sm text-ink-500 mb-6">{mode === 'login' ? 'Chào mừng bạn quay lại 👋' : 'Nhập email để nhận liên kết đặt lại mật khẩu'}</p>
          {err  && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">⚠️ {err}</div>}
          {info && <div className="mb-4 p-3 bg-jade-50 border border-jade-200 rounded-xl text-sm text-jade-700">✉️ {info}</div>}
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="email@example.com" required />
            </div>
            {mode === 'login' && (
              <div>
                <div className="flex items-center justify-between">
                  <label className="label">Mật khẩu</label>
                  <button type="button" onClick={()=>{setMode('forgot');setErr('')}} className="text-xs text-sakura-600 hover:underline mb-1.5">Quên mật khẩu?</button>
                </div>
                <div className="relative">
                  <input className="input pr-10" type={showPw?'text':'password'} autoComplete="current-password" value={pw} onChange={e=>setPw(e.target.value)} placeholder="••••••••" required />
                  <button type="button" onClick={()=>setShowPw(s=>!s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 text-sm" aria-label="Hiện mật khẩu">{showPw?'🙈':'👁️'}</button>
                </div>
              </div>
            )}
            <button type="submit" disabled={loading} className="btn btn-primary btn-lg w-full mt-2 disabled:opacity-60">
              {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : mode === 'login' ? 'Đăng nhập' : 'Gửi liên kết'}
            </button>
          </form>
          <div className="mt-6 pt-5 border-t border-ink-100 text-center text-sm text-ink-500">
            {mode === 'forgot'
              ? <button onClick={()=>{setMode('login');setInfo('')}} className="text-sakura-600 font-semibold hover:underline">← Quay lại đăng nhập</button>
              : <>Chưa có tài khoản? <Link href="/auth/register" className="text-sakura-600 font-semibold hover:underline">Đăng ký miễn phí</Link></>}
          </div>
        </div>
      </div>
    </div>
  )
}
