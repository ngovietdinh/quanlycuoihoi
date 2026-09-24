'use client'
import { useEffect, useState, useCallback, FormEvent } from 'react'
import { getProjectMembers, addProjectMember, updateProjectMember, removeProjectMember } from '@/lib/api/account'
import { useToast } from '@/components/ui/Toast'
import { cn } from '@/lib/utils'
import type { ProjectMember, ProjectRole, MemberRole } from '@/types'

export const ROLE_INFO: Record<ProjectRole, { label: string; desc: string; cls: string }> = {
  owner:  { label: 'Chủ dự án',  desc: 'Toàn quyền, quản lý thành viên, xóa dự án', cls: 'badge-high' },
  admin:  { label: 'Quản trị',   desc: 'Quản trị viên hệ thống',                    cls: 'badge-high' },
  editor: { label: 'Biên tập',   desc: 'Thêm/sửa đầu mục và chi tiêu',             cls: 'badge-in_progress' },
  viewer: { label: 'Chỉ xem',    desc: 'Xem tiến độ và ngân sách',                 cls: 'badge-todo' },
}

/** Vai trò của người dùng hiện tại trong dự án */
export function useProjectRole(projectId: string, userId?: string | null) {
  const [members, setMembers] = useState<ProjectMember[]>([])
  const [loaded, setLoaded] = useState(false)
  const reload = useCallback(async () => {
    const r = await getProjectMembers(projectId)
    setMembers(r.data ?? []); setLoaded(true)
  }, [projectId])
  useEffect(() => { reload() }, [reload])
  const mine = members.find(m => m.user_id === userId)?.role
  // Chưa chạy migration (RPC lỗi) → coi như chủ dự án như trước đây
  const role: ProjectRole = !loaded || members.length === 0 ? 'owner' : mine ?? 'admin'
  return { members, role, reload, canEdit: role !== 'viewer', canManage: role === 'owner' || role === 'admin' }
}

export function MembersPanel({ projectId, members, canManage, reload, currentUserId }:
  { projectId: string; members: ProjectMember[]; canManage: boolean; reload: () => void; currentUserId?: string | null }) {
  const { success, error } = useToast()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<MemberRole>('editor')
  const [busy, setBusy] = useState(false)

  async function add(e: FormEvent) {
    e.preventDefault(); if (!email.trim()) return
    setBusy(true)
    const r = await addProjectMember(projectId, email.trim(), role)
    setBusy(false)
    if (r.error) return error('Không thêm được thành viên', r.error)
    success('Đã thêm thành viên 🎉'); setEmail(''); reload()
  }
  async function change(m: ProjectMember, r: MemberRole) {
    const x = await updateProjectMember(projectId, m.user_id, r)
    if (x.error) return error('Lỗi', x.error)
    success('Đã cập nhật quyền'); reload()
  }
  async function remove(m: ProjectMember) {
    const self = m.user_id === currentUserId
    if (!confirm(self ? 'Rời khỏi dự án này?' : `Xóa ${m.full_name || m.email} khỏi dự án?`)) return
    const x = await removeProjectMember(projectId, m.user_id)
    if (x.error) return error('Lỗi', x.error)
    if (self) { window.location.href = '/dashboard'; return }
    success('Đã xóa thành viên'); reload()
  }

  return (
    <div className="max-w-3xl space-y-5">
      <div className="grid sm:grid-cols-3 gap-3">
        {(['owner', 'editor', 'viewer'] as ProjectRole[]).map(r => (
          <div key={r} className="card p-4">
            <span className={cn('badge text-[10px]', ROLE_INFO[r].cls)}>{ROLE_INFO[r].label}</span>
            <p className="text-xs text-ink-500 mt-2">{ROLE_INFO[r].desc}</p>
          </div>
        ))}
      </div>

      {canManage && (
        <form onSubmit={add} className="card p-5 space-y-3">
          <h3 className="font-semibold text-ink-900 text-sm">Mời thành viên cùng lên kế hoạch</h3>
          <p className="text-xs text-ink-400">Người được mời cần đăng ký tài khoản trước bằng email này.</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input className="input flex-1" type="email" placeholder="email@example.com" value={email} onChange={e => setEmail(e.target.value)} required/>
            <select className="input sm:!w-36" value={role} onChange={e => setRole(e.target.value as MemberRole)}>
              <option value="editor">Biên tập</option><option value="viewer">Chỉ xem</option>
            </select>
            <button disabled={busy} className="btn btn-primary">{busy ? '…' : '＋ Mời'}</button>
          </div>
        </form>
      )}

      <div className="card divide-y divide-ink-50">
        {members.map(m => (
          <div key={m.user_id} className="px-4 py-3 flex items-center gap-3">
            {m.avatar_url
              ? <img src={m.avatar_url} alt="" className="w-9 h-9 rounded-xl object-cover"/>
              : <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm" style={{ background: 'linear-gradient(135deg,#ff6b96,#f59e0b)' }}>{(m.full_name || m.email || '?')[0]?.toUpperCase()}</div>}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-ink-900 truncate">{m.full_name || '—'} {m.user_id === currentUserId && <span className="text-xs text-ink-400 font-normal">(bạn)</span>}</p>
              <p className="text-xs text-ink-400 truncate">{m.email}</p>
            </div>
            {canManage && m.role !== 'owner' ? (
              <select className="input !py-1.5 !w-auto text-xs" value={m.role} onChange={e => change(m, e.target.value as MemberRole)}>
                <option value="editor">Biên tập</option><option value="viewer">Chỉ xem</option>
              </select>
            ) : <span className={cn('badge text-[10px]', ROLE_INFO[m.role].cls)}>{ROLE_INFO[m.role].label}</span>}
            {m.role !== 'owner' && (canManage || m.user_id === currentUserId) && (
              <button onClick={() => remove(m)} className="btn btn-ghost btn-xs hover:text-red-500">{m.user_id === currentUserId ? 'Rời' : '✕'}</button>
            )}
          </div>
        ))}
        {members.length === 0 && <p className="text-center text-sm text-ink-400 py-8">Chạy migration 002 để bật tính năng cộng tác.</p>}
      </div>
    </div>
  )
}
