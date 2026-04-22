'use client'
import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { sb } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  async function submit(e: FormEvent) {
    e.preventDefault(); setLoading(true); setErr('')
    const { error } = await sb().auth.signInWithPassword({ email, password: pw })
    if (error) { setErr(error.message); setLoading(false); return }
    router.push('/dashboard'); router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{background:'linear-gradient(135deg,#1c1917 0%,#44403c 40%,#78350f 100%)'}}>
      <div className="w-full max-w-md animate-fadeIn">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🌸</div>
          <h1 className="font-display text-4xl font-bold text-white mb-1">Lễ Ăn Hỏi</h1>
          <p className="text-stone-400 text-sm">Hệ thống quản lý sự kiện</p>
        </div>
        <div className="card p-8">
          <h2 className="font-display text-2xl font-semibold text-stone-800 mb-6">Đăng nhập</h2>
          {err && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{err}</div>}
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="email@example.com" required />
            </div>
            <div>
              <label className="label">Mật khẩu</label>
              <input className="input" type="password" value={pw} onChange={e=>setPw(e.target.value)} placeholder="••••••••" required />
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary w-full h-11 text-base mt-2 disabled:opacity-60">
              {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : 'Đăng nhập'}
            </button>
          </form>
          <p className="text-center text-sm text-stone-500 mt-5">
            Chưa có tài khoản?{' '}
            <Link href="/auth/register" className="text-rose-500 font-medium hover:underline">Đăng ký</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
