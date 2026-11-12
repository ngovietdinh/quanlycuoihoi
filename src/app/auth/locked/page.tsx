'use client'
import { useEffect } from 'react'
import Link from 'next/link'
import { sb } from '@/lib/supabase/client'

export default function LockedPage() {
  useEffect(() => { sb().auth.signOut() }, [])
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-hero">
      <div className="card max-w-md w-full p-8 text-center animate-fadeUp">
        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4 text-3xl">🔒</div>
        <h1 className="font-display text-2xl font-semibold text-ink-900 mb-2">Tài khoản đã bị khóa</h1>
        <p className="text-sm text-ink-500 mb-6">Tài khoản của bạn đã bị quản trị viên tạm khóa. Vui lòng liên hệ quản trị viên để được hỗ trợ.</p>
        <Link href="/auth/login" className="btn btn-primary btn-sm">Quay lại đăng nhập</Link>
      </div>
    </div>
  )
}
