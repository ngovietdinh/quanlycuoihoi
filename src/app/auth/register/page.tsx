'use client'
import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSupabaseClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const router = useRouter()
  const sb = getSupabaseClient()
  const [form,setForm]=useState({fullName:'',email:'',password:'',confirm:''})
  const [loading,setLoading]=useState(false)
  const [error,setError]=useState<string|null>(null)
  const sf=(k:string,v:string)=>setForm(f=>({...f,[k]:v}))

  async function handleSubmit(e:FormEvent) {
    e.preventDefault()
    if(form.password!==form.confirm){setError('Mật khẩu xác nhận không khớp');return}
    if(form.password.length<6){setError('Mật khẩu phải có ít nhất 6 ký tự');return}
    setLoading(true); setError(null)
    const {error}=await sb.auth.signUp({
      email:form.email,password:form.password,
      options:{data:{full_name:form.fullName}}
    })
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
          <p className="text-white/60 text-sm">Tạo tài khoản quản lý sự kiện</p>
        </div>
        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          <h2 className="text-xl font-semibold text-[#2C1810] mb-6">Đăng ký</h2>
          {error&&<div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Họ và tên</label>
              <input type="text" className="input" value={form.fullName} onChange={e=>sf('fullName',e.target.value)} placeholder="Nguyễn Văn A" required/>
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" className="input" value={form.email} onChange={e=>sf('email',e.target.value)} placeholder="email@example.com" required/>
            </div>
            <div>
              <label className="label">Mật khẩu</label>
              <input type="password" className="input" value={form.password} onChange={e=>sf('password',e.target.value)} placeholder="Ít nhất 6 ký tự" required/>
            </div>
            <div>
              <label className="label">Xác nhận mật khẩu</label>
              <input type="password" className="input" value={form.confirm} onChange={e=>sf('confirm',e.target.value)} placeholder="Nhập lại mật khẩu" required/>
            </div>
            <button type="submit" disabled={loading}
              className="btn-primary w-full justify-center py-3 mt-2 disabled:opacity-60 disabled:cursor-not-allowed">
              {loading?'Đang tạo tài khoản...':'Tạo tài khoản'}
            </button>
          </form>
          <p className="text-center text-sm text-[#A89080] mt-6">
            Đã có tài khoản?{' '}
            <Link href="/auth/login" className="text-[#C41E3A] font-medium hover:underline">Đăng nhập</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
