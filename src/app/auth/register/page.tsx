'use client'
import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { sb } from '@/lib/supabase/client'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name:'', email:'', pw:'', pw2:'' })
  const [loading, setLoading] = useState(false)
  const [err, setErr]         = useState('')
  const sf = (k:string, v:string) => setForm(f=>({...f,[k]:v}))

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (form.pw !== form.pw2) { setErr('Mật khẩu không khớp'); return }
    if (form.pw.length < 6)   { setErr('Mật khẩu phải có ít nhất 6 ký tự'); return }
    setLoading(true); setErr('')
    const { error } = await sb().auth.signUp({ email: form.email, password: form.pw, options: { data: { full_name: form.name } } })
    if (error) { setErr(error.message); setLoading(false); return }
    router.push('/dashboard'); router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{background:'linear-gradient(135deg,#1a0d08 0%,#2c1810 35%,#4a2520 65%,#78350f 100%)'}}>
      <div className="fixed top-20 left-10 w-64 h-64 rounded-full opacity-10 blur-3xl" style={{background:'#ff3d78'}}/>
      <div className="fixed bottom-20 right-10 w-48 h-48 rounded-full opacity-10 blur-3xl" style={{background:'#f59e0b'}}/>

      <div className="w-full max-w-md relative animate-fadeUp">
        <div className="text-center mb-8">
          <div className="inline-flex w-20 h-20 rounded-3xl items-center justify-center text-4xl mb-4 shadow-glow-sakura animate-float"
            style={{background:'linear-gradient(135deg,#ff6b96,#ff3d78)'}}>🌸</div>
          <h1 className="font-display text-4xl font-bold text-white mb-2">Lễ Ăn Hỏi</h1>
          <p className="text-white/50 text-sm">Tạo tài khoản để bắt đầu</p>
        </div>

        <div className="rounded-3xl p-8 border border-white/10" style={{background:'rgba(255,253,249,0.96)',backdropFilter:'blur(20px)'}}>
          <h2 className="font-display text-2xl font-semibold text-ink-900 mb-6">Đăng ký tài khoản</h2>

          {err && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2">
              <span>⚠️</span> {err}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div><label className="label">Họ và tên</label><input className="input" value={form.name} onChange={e=>sf('name',e.target.value)} placeholder="Nguyễn Văn A" required/></div>
            <div><label className="label">Email</label><input className="input" type="email" value={form.email} onChange={e=>sf('email',e.target.value)} placeholder="email@example.com" required/></div>
            <div><label className="label">Mật khẩu</label><input className="input" type="password" value={form.pw} onChange={e=>sf('pw',e.target.value)} placeholder="Ít nhất 6 ký tự" required/></div>
            <div><label className="label">Xác nhận mật khẩu</label><input className="input" type="password" value={form.pw2} onChange={e=>sf('pw2',e.target.value)} placeholder="Nhập lại mật khẩu" required/></div>
            <button type="submit" disabled={loading} className="btn btn-primary btn-lg w-full mt-2 disabled:opacity-60">
              {loading
                ? <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/><span>Đang tạo tài khoản...</span></>
                : '🌸 Tạo tài khoản'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-ink-100 text-center">
            <p className="text-sm text-ink-500">Đã có tài khoản?{' '}
              <Link href="/auth/login" className="text-sakura-600 font-semibold hover:text-sakura-700 transition-colors">Đăng nhập</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
