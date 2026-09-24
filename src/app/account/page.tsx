'use client'
import { useEffect, useState, FormEvent } from 'react'
import { Shell, TopBar } from '@/components/layout/Shell'
import { ToastProvider, useToast } from '@/components/ui/Toast'
import { useProfile } from '@/hooks/useProfile'
import { useAuth } from '@/hooks/useAuth'
import { updateMyProfile, changePassword } from '@/lib/api/account'
import { ImageInput } from '@/components/invitation/editor/fields'
import { fmtDate } from '@/lib/utils'

function AccountContent() {
  const { profile, refresh, isAdmin } = useProfile()
  const { user, signOut } = useAuth()
  const { success, error } = useToast()
  const [form, setForm] = useState({ full_name: '', phone: '', avatar_url: '' })
  const [pw, setPw] = useState({ a: '', b: '' })
  const [saving, setSaving] = useState(false)
  const [reset, setReset] = useState(false)

  useEffect(() => { if (profile) setForm({ full_name: profile.full_name ?? '', phone: profile.phone ?? '', avatar_url: profile.avatar_url ?? '' }) }, [profile])
  useEffect(() => { setReset(new URLSearchParams(window.location.search).get('reset') === '1') }, [])

  async function saveProfile(e: FormEvent) {
    e.preventDefault(); setSaving(true)
    const r = await updateMyProfile(form)
    setSaving(false)
    if (r.error) return error('Không lưu được', r.error)
    success('Đã cập nhật hồ sơ ✓'); refresh()
  }
  async function savePw(e: FormEvent) {
    e.preventDefault()
    if (pw.a.length < 6) return error('Mật khẩu phải có ít nhất 6 ký tự')
    if (pw.a !== pw.b) return error('Mật khẩu xác nhận không khớp')
    const r = await changePassword(pw.a)
    if (r.error) return error('Không đổi được mật khẩu', r.error)
    setPw({ a: '', b: '' }); setReset(false); success('Đã đổi mật khẩu 🔐')
  }

  return (
    <>
      <TopBar title="Tài khoản của tôi" subtitle={user?.email ?? ''}/>
      <div className="p-4 sm:p-6 max-w-3xl mx-auto w-full space-y-5">
        {reset && <div className="rounded-xl border border-gold-200 bg-gold-50 p-4 text-sm text-gold-800">🔐 Bạn đang đặt lại mật khẩu — hãy nhập mật khẩu mới bên dưới.</div>}

        <div className="hero p-6 flex items-center gap-5">
          {form.avatar_url
            ? <img src={form.avatar_url} alt="" className="relative w-20 h-20 rounded-2xl object-cover border-2 border-white/30"/>
            : <div className="relative w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold text-white" style={{ background: 'linear-gradient(135deg,#ff6b96,#f59e0b)' }}>{(form.full_name || user?.email || '?')[0]?.toUpperCase()}</div>}
          <div className="relative min-w-0">
            <h2 className="font-display text-2xl font-bold text-white truncate">{profile?.full_name || 'Chưa đặt tên'}</h2>
            <p className="text-white/60 text-sm truncate">{user?.email}</p>
            <div className="flex gap-2 mt-2">
              <span className={`badge text-[10px] ${isAdmin ? 'badge-high' : 'badge-todo'}`}>{isAdmin ? '🛡️ Quản trị viên' : '👤 Thành viên'}</span>
              {profile?.created_at && <span className="badge text-[10px] bg-white/10 text-white/80 border-white/20">Tham gia {fmtDate(profile.created_at)}</span>}
            </div>
          </div>
        </div>

        <form onSubmit={saveProfile} className="card p-5 space-y-4">
          <h3 className="font-semibold text-ink-900">Thông tin cá nhân</h3>
          <div className="grid sm:grid-cols-[auto_1fr] gap-5 items-start">
            <div><label className="label !text-xs">Ảnh đại diện</label><ImageInput value={form.avatar_url} onChange={v => setForm(f => ({ ...f, avatar_url: v }))} invitationId="avatar" round/></div>
            <div className="space-y-3">
              <div><label className="label">Họ và tên</label><input className="input" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}/></div>
              <div><label className="label">Số điện thoại</label><input className="input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="09xx xxx xxx"/></div>
              <div><label className="label">Email</label><input className="input" value={user?.email ?? ''} disabled/></div>
            </div>
          </div>
          <div className="flex justify-end"><button disabled={saving} className="btn btn-primary btn-sm">{saving ? 'Đang lưu…' : '✓ Lưu thông tin'}</button></div>
        </form>

        <form onSubmit={savePw} className="card p-5 space-y-4">
          <h3 className="font-semibold text-ink-900">Đổi mật khẩu</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><label className="label">Mật khẩu mới</label><input type="password" className="input" value={pw.a} onChange={e => setPw(p => ({ ...p, a: e.target.value }))} autoComplete="new-password" placeholder="Ít nhất 6 ký tự"/></div>
            <div><label className="label">Nhập lại</label><input type="password" className="input" value={pw.b} onChange={e => setPw(p => ({ ...p, b: e.target.value }))} autoComplete="new-password"/></div>
          </div>
          <div className="flex justify-end"><button className="btn btn-secondary btn-sm">🔐 Đổi mật khẩu</button></div>
        </form>

        <div className="card p-5 flex items-center justify-between gap-4">
          <div><h3 className="font-semibold text-ink-900">Đăng xuất</h3><p className="text-xs text-ink-400">Kết thúc phiên đăng nhập trên thiết bị này</p></div>
          <button onClick={signOut} className="btn btn-danger btn-sm">⏻ Đăng xuất</button>
        </div>
      </div>
    </>
  )
}

export default function AccountPage() {
  return <ToastProvider><Shell><AccountContent/></Shell></ToastProvider>
}
