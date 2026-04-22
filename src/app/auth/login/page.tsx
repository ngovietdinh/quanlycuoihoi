'use client'
import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { sb } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [pw, setPw]       = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr]     = useState('')

  async function submit(e: FormEvent) {
    e.preventDefault(); setLoading(true); setErr('')
    const { error } = await sb().auth.signInWithPassword({ email, password: pw })
    if (error) { setErr(error.message); setLoading(false); return }
    router.push('/dashboard'); router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{background:'linear-gradient(135deg,#1a0d08 0%,#2c1810 35%,#4a2520 65%,#78350f 100%)'}}>
      {/* Decorative bubbles */}
      <div className="fixed top-20 left-10 w-64 h-64 rounded-full opacity-10 blur-3xl" style={{background:'#ff3d78'}}/>
      <div className="fixed bottom-20 right-10 w-48 h-48 rounded-full opacity-10 blur-3xl" style={{background:'#f59e0b'}}/>

      <div className="w-full max-w-md relative animate-fadeUp">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex w-20 h-20 rounded-3xl items-center justify-center text-4xl mb-4 shadow-glow-sakura animate-float"
            style={{background:'linear-gradient(135deg,#ff6b96,#ff3d78)'}}>🌸</div>
          <h1 className="font-display text-4xl font-bold text-white mb-2">Lễ Ăn Hỏi</h1>
          <p className="text-white/50 text-sm">Hệ thống quản lý sự kiện cưới hỏi</p>
        </div>

        {/* Card */}
        <div className="rounded-3xl p-8 border border-white/10" style={{background:'rgba(255,253,249,0.96)',backdropFilter:'blur(20px)'}}>
          <h2 className="font-display text-2xl font-semibold text-ink-900 mb-6">Đăng nhập</h2>

          {err && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2">
              <span>⚠️</span> {err}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="email@example.com" required/>
            </div>
            <div>
              <label className="label">Mật khẩu</label>
              <input className="input" type="password" value={pw} onChange={e=>setPw(e.target.value)} placeholder="••••••••" required/>
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary btn-lg w-full mt-2 disabled:opacity-60">
              {loading
                ? <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/><span>Đang đăng nhập...</span></>
                : '🌸 Đăng nhập'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-ink-100 text-center">
            <p className="text-sm text-ink-500">Chưa có tài khoản?{' '}
              <Link href="/auth/register" className="text-sakura-600 font-semibold hover:text-sakura-700 transition-colors">Đăng ký ngay</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
