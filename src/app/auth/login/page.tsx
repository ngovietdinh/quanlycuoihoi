'use client'
import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSupabaseClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const sb = getSupabaseClient()
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const [loading,setLoading]=useState(false)
  const [error,setError]=useState<string|null>(null)

  async function handleSubmit(e:FormEvent) {
    e.preventDefault(); setLoading(true); setError(null)
    const {error}=await sb.auth.signInWithPassword({email,password})
    if(error){setError(error.message);setLoading(false);return}
    router.push('/dashboard'); router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{background:'linear-gradient(135deg,#2C1810 0%,#8B1A1A 50%,#C9A84C 100%)'}}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 border border-white/20"
            style={{background:'rgba(255,255,255,0.1)',backdropFilter:'blur(8px)'}}>
            <span className="text-3xl">🌸</span>
          </div>
          <h1 className="text-white text-3xl font-display font-bold mb-1">Lễ Ăn Hỏi</h1>
          <p className="text-white/60 text-sm">Hệ thống quản lý sự kiện trọn vẹn</p>
        </div>
        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          <h2 className="text-xl font-semibold text-[#2C1810] mb-6">Đăng nhập</h2>
          {error && <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input type="email" className="input" value={email} onChange={e=>setEmail(e.target.value)} placeholder="email@example.com" required />
            </div>
            <div>
              <label className="label">Mật khẩu</label>
              <input type="password" className="input" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            <button type="submit" disabled={loading}
              className="btn-primary w-full justify-center py-3 mt-2 disabled:opacity-60 disabled:cursor-not-allowed">
              {loading?'Đang đăng nhập...':'Đăng nhập'}
            </button>
          </form>
          <p className="text-center text-sm text-[#A89080] mt-6">
            Chưa có tài khoản?{' '}
            <Link href="/auth/register" className="text-[#C41E3A] font-medium hover:underline">Đăng ký ngay</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
