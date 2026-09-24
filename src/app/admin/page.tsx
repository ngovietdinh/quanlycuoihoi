'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Shell, TopBar } from '@/components/layout/Shell'
import { ToastProvider, useToast } from '@/components/ui/Toast'
import { ConfirmModal } from '@/components/ui/Modal'
import { useProfile } from '@/hooks/useProfile'
import { adminStats, adminListUsers, adminUpdateUser, adminListInvitations, adminListProjects } from '@/lib/api/account'
import { updateInvitation, deleteInvitation } from '@/lib/api/invitations'
import { deleteProject } from '@/lib/api/projects'
import { fmtDate, vnd, cn } from '@/lib/utils'
import type { AdminStats, AdminUserRow, AppRole } from '@/types'

type Tab = 'overview' | 'users' | 'invitations' | 'projects'

function AdminContent() {
  const { profile, isAdmin, loading: profLoading } = useProfile()
  const { success, error } = useToast()
  const [tab, setTab] = useState<Tab>('overview')
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [users, setUsers] = useState<AdminUserRow[]>([])
  const [invs, setInvs] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [q, setQ] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<null | { title: string; msg: string; label: string; run: () => Promise<void> }>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    const [s, u, i, p] = await Promise.all([adminStats(), adminListUsers(), adminListInvitations(), adminListProjects()])
    setErr(s.error || u.error)
    setStats(s.data); setUsers(u.data ?? []); setInvs(i.data ?? []); setProjects(p.data ?? [])
  }, [])
  useEffect(() => { if (isAdmin) load() }, [isAdmin, load])

  if (profLoading) return <div className="flex-1 flex items-center justify-center"><div className="text-4xl animate-float">🛡️</div></div>
  if (!isAdmin) return (
    <div className="flex-1 flex items-center justify-center p-6 text-center">
      <div><div className="text-5xl mb-3">🔒</div><h2 className="font-display text-2xl font-semibold mb-2">Không có quyền truy cập</h2><p className="text-ink-500 text-sm mb-4">Khu vực này chỉ dành cho quản trị viên.</p><Link href="/dashboard" className="btn btn-primary btn-sm">Về tổng quan</Link></div>
    </div>
  )

  const ownerOf = (uid: string) => users.find(u => u.id === uid)
  async function setRole(u: AdminUserRow, role: AppRole) {
    const r = await adminUpdateUser(u.id, { role })
    if (r.error) return error('Không đổi được vai trò', r.error)
    success(`${u.full_name || u.email} → ${role === 'admin' ? 'Quản trị viên' : 'Thành viên'}`); load()
  }
  async function setActive(u: AdminUserRow, is_active: boolean) {
    const r = await adminUpdateUser(u.id, { is_active })
    if (r.error) return error('Lỗi', r.error)
    success(is_active ? 'Đã mở khóa tài khoản' : 'Đã khóa tài khoản'); load()
  }
  const ask = (c: NonNullable<typeof confirm>) => setConfirm(c)
  async function runConfirm() { if (!confirm) return; setBusy(true); await confirm.run(); setBusy(false); setConfirm(null) }

  const match = (s: string) => !q || s.toLowerCase().includes(q.toLowerCase())
  const TABS: [Tab, string, number | null][] = [['overview', '📊 Tổng quan', null], ['users', '👤 Người dùng', users.length], ['invitations', '💌 Thiệp cưới', invs.length], ['projects', '🗂️ Dự án', projects.length]]

  return (
    <>
      <TopBar title="Quản trị hệ thống" subtitle="Quản lý người dùng, phân quyền và nội dung"
        right={<button onClick={load} className="btn btn-secondary btn-sm">↻ Làm mới</button>}/>
      <div className="sticky top-[61px] z-20 border-b border-ink-100 px-4 sm:px-6 flex overflow-x-auto no-scrollbar" style={{ background: 'rgba(255,253,249,0.95)' }}>
        {TABS.map(([id, l, n]) => (
          <button key={id} onClick={() => setTab(id)} className={cn(tab === id ? 'tab-active' : 'tab', 'whitespace-nowrap')}>{l}{n !== null && <span className="ml-1.5 text-[10px] bg-ink-100 rounded-full px-1.5">{n}</span>}</button>
        ))}
      </div>
      <div className="p-4 sm:p-6 max-w-6xl mx-auto w-full space-y-4">
        {err && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">⚠️ {err} — hãy chắc chắn đã chạy migration <code>002_invitations_roles.sql</code>.</div>}

        {tab === 'overview' && stats && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                ['👤', 'Người dùng', stats.users, `+${stats.new_users_7d} trong 7 ngày`],
                ['🛡️', 'Quản trị viên', stats.admins, `${stats.locked} tài khoản bị khóa`],
                ['🗂️', 'Dự án', stats.projects, 'kế hoạch cưới'],
                ['💌', 'Thiệp cưới', stats.invitations, `${stats.published} đã phát hành`],
                ['👁', 'Lượt xem thiệp', stats.views, 'tổng cộng'],
                ['✉️', 'Phản hồi RSVP', stats.rsvps, `${stats.attending_guests} khách sẽ đến`],
                ['💬', 'Lời chúc', stats.wishes, 'trong sổ lưu bút'],
                ['📈', 'Tỉ lệ phát hành', stats.invitations ? `${Math.round(stats.published / stats.invitations * 100)}%` : '—', 'thiệp đã gửi'],
              ].map(([i, l, v, s]) => (
                <div key={l as string} className="stat-card sakura">
                  <p className="text-2xl mb-1">{i}</p>
                  <p className="text-xs text-ink-400 font-medium">{l}</p>
                  <p className="font-display text-3xl font-bold text-ink-900 tabular">{v}</p>
                  <p className="text-[11px] text-ink-400">{s}</p>
                </div>
              ))}
            </div>
            <div className="card p-5">
              <h3 className="font-semibold text-ink-900 mb-3">Người dùng mới nhất</h3>
              <div className="divide-y divide-ink-50">
                {users.slice(0, 6).map(u => (
                  <div key={u.id} className="py-2.5 flex items-center justify-between text-sm">
                    <span className="font-medium text-ink-800">{u.full_name || '—'} <span className="text-ink-400 font-normal">· {u.email}</span></span>
                    <span className="text-xs text-ink-400">{fmtDate(u.created_at)}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {tab !== 'overview' && <input className="input max-w-sm" placeholder="🔍 Tìm kiếm…" value={q} onChange={e => setQ(e.target.value)}/>}

        {tab === 'users' && (
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-ink-50/70 border-b border-ink-100 text-left text-xs text-ink-500 uppercase">
                {['Người dùng', 'Vai trò', 'Dự án', 'Thiệp', 'Hoạt động', 'Trạng thái', ''].map(h => <th key={h} className="px-4 py-2.5 font-bold">{h}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-ink-50">
                {users.filter(u => match(`${u.full_name} ${u.email} ${u.phone}`)).map(u => {
                  const me = u.id === profile?.id
                  return (
                    <tr key={u.id} className={cn('hover:bg-ink-50/40', !u.is_active && 'opacity-60')}>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-ink-900">{u.full_name || '—'} {me && <span className="tag bg-sakura-50 text-sakura-600 border-sakura-200 ml-1">Bạn</span>}</p>
                        <p className="text-xs text-ink-400">{u.email}{u.phone && ` · ${u.phone}`}</p>
                      </td>
                      <td className="px-4 py-3">
                        <select disabled={me} className="input !py-1.5 !w-auto text-xs" value={u.role} onChange={e => setRole(u, e.target.value as AppRole)}>
                          <option value="user">Thành viên</option><option value="admin">Quản trị viên</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 tabular">{u.project_count}</td>
                      <td className="px-4 py-3 tabular">{u.invitation_count}</td>
                      <td className="px-4 py-3 text-xs text-ink-500">Tạo {fmtDate(u.created_at)}<br/>{u.last_seen_at ? `Truy cập ${fmtDate(u.last_seen_at)}` : 'Chưa truy cập'}</td>
                      <td className="px-4 py-3"><span className={cn('badge text-[10px]', u.is_active ? 'badge-done' : 'badge-overdue')}>{u.is_active ? 'Hoạt động' : 'Đã khóa'}</span></td>
                      <td className="px-4 py-3 text-right">
                        {!me && (u.is_active
                          ? <button onClick={() => ask({ title: 'Khóa tài khoản?', msg: `${u.email} sẽ không thể đăng nhập và thiệp của họ vẫn hiển thị.`, label: 'Khóa', run: () => setActive(u, false) })} className="btn btn-danger btn-xs">🔒 Khóa</button>
                          : <button onClick={() => setActive(u, true)} className="btn btn-secondary btn-xs">🔓 Mở khóa</button>)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'invitations' && (
          <div className="card divide-y divide-ink-50">
            {invs.filter(i => match(`${i.title} ${i.slug} ${ownerOf(i.user_id)?.email ?? ''}`)).map(i => (
              <div key={i.id} className="px-4 py-3 flex items-center gap-3 flex-wrap">
                <div className="w-10 h-10 rounded-xl flex-shrink-0" style={{ background: `linear-gradient(135deg, ${i.theme?.primary ?? '#ccc'}, ${i.theme?.accent ?? '#eee'})` }}/>
                <div className="flex-1 min-w-[180px]">
                  <p className="font-semibold text-ink-900 text-sm">{i.title}</p>
                  <p className="text-xs text-ink-400">/i/{i.slug} · {ownerOf(i.user_id)?.email ?? 'N/A'} · {i.view_count} lượt xem · {i.rsvp_count} phản hồi</p>
                </div>
                <span className={cn('badge text-[10px]', i.is_published ? 'badge-done' : 'badge-todo')}>{i.is_published ? 'Công khai' : 'Nháp'}</span>
                <a href={`/i/${i.slug}`} target="_blank" rel="noreferrer" className="btn btn-ghost btn-xs">Xem ↗</a>
                <button onClick={async () => { const r = await updateInvitation(i.id, { is_published: !i.is_published }); if (r.error) error('Lỗi', r.error); else { success(i.is_published ? 'Đã gỡ thiệp' : 'Đã phát hành'); load() } }} className="btn btn-secondary btn-xs">{i.is_published ? '⏸ Gỡ' : '🚀 Phát hành'}</button>
                <button onClick={() => ask({ title: 'Xóa thiệp?', msg: `Xóa vĩnh viễn thiệp "${i.title}" cùng khách mời và phản hồi.`, label: 'Xóa thiệp', run: async () => { const r = await deleteInvitation(i.id); if (r.error) error('Lỗi', r.error); else { success('Đã xóa thiệp'); load() } } })} className="btn btn-danger btn-xs">Xóa</button>
              </div>
            ))}
            {invs.length === 0 && <p className="text-center text-sm text-ink-400 py-10">Chưa có thiệp nào</p>}
          </div>
        )}

        {tab === 'projects' && (
          <div className="card divide-y divide-ink-50">
            {projects.filter(p => match(`${p.name} ${ownerOf(p.user_id)?.email ?? ''}`)).map(p => (
              <div key={p.id} className="px-4 py-3 flex items-center gap-3 flex-wrap">
                <div className="flex-1 min-w-[180px]">
                  <p className="font-semibold text-ink-900 text-sm">{p.name}</p>
                  <p className="text-xs text-ink-400">{ownerOf(p.user_id)?.email ?? 'N/A'} · {p.event_date ? fmtDate(p.event_date) : 'Chưa có ngày'} · {p.completed_tasks}/{p.total_tasks} đầu mục · {vnd(p.total_spent)} / {vnd(p.budget_total)}</p>
                </div>
                <Link href={`/projects/${p.id}`} className="btn btn-ghost btn-xs">Mở →</Link>
                <button onClick={() => ask({ title: 'Xóa dự án?', msg: `Xóa vĩnh viễn dự án "${p.name}" cùng đầu mục và chi tiêu.`, label: 'Xóa dự án', run: async () => { const r = await deleteProject(p.id); if (r.error) error('Lỗi', r.error); else { success('Đã xóa dự án'); load() } } })} className="btn btn-danger btn-xs">Xóa</button>
              </div>
            ))}
            {projects.length === 0 && <p className="text-center text-sm text-ink-400 py-10">Chưa có dự án nào</p>}
          </div>
        )}
      </div>
      <ConfirmModal open={!!confirm} onClose={() => setConfirm(null)} onConfirm={runConfirm} loading={busy}
        title={confirm?.title ?? ''} msg={confirm?.msg ?? ''} confirmLabel={confirm?.label}/>
    </>
  )
}

export default function AdminPage() {
  return <ToastProvider><Shell><AdminContent/></Shell></ToastProvider>
}
