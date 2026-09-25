'use client'
import Link from 'next/link'
import { vnd, pct, cn, deadlineInfo, daysTo, fmtDate, PRI_LABELS, STATUS_LABELS } from '@/lib/utils'
import { solarToLunar, canChiYear } from '@/lib/invitation/datetime'
import { TagPill, Initial } from './shared'
import { ROLE_INFO } from './MembersPanel'
import type { Project, Task, TaskStatus, Vendor, ScheduleItem, ProjectMember, ProjectRole } from '@/types'
import type { ProjectInvitation } from '@/lib/api/vendors'

// ── Đầu trang dự án ───────────────────────────────────────────────────────────
export function ProjectHero({ project, tasks, totalSpent, role, onEdit, members }:
  { project: Project; tasks: Task[]; totalSpent: number; role: ProjectRole; onEdit?: () => void; members: ProjectMember[] }) {
  const done = tasks.filter(t => t.status === 'done').length
  const progress = pct(done, tasks.length)
  const days = daysTo(project.event_date)
  const budget = Number(project.budget_total)
  const used = budget ? (totalSpent / budget) * 100 : 0
  const lunar = project.event_date ? (() => { const [y, m, d] = project.event_date!.split('-').map(Number); const l = solarToLunar(d, m, y); return `${l.day}/${l.month} ${canChiYear(l.year)}` })() : null
  const weekday = project.event_date ? new Date(project.event_date + 'T12:00:00').toLocaleDateString('vi-VN', { weekday: 'long' }) : null
  const R = 30, C = 2 * Math.PI * R
  return (
    <div className="hero p-5 sm:p-7 text-white">
      <div className="hero-bubble w-40 h-40 -top-10 -right-10"/>
      <div className="relative grid lg:grid-cols-[1fr_auto] gap-6 items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className={cn('badge text-[10px]', ROLE_INFO[role].cls)}>{ROLE_INFO[role].label}</span>
            {(project.tags ?? []).map(t => <span key={t} className="tag border border-white/20 bg-white/10 text-white/80">{t}</span>)}
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold leading-tight">{project.name}</h1>
          <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-3 text-sm text-white/75">
            {project.event_date
              ? <span>📅 <span className="capitalize">{weekday}</span>, {fmtDate(project.event_date)} <span className="text-white/45">· ÂL {lunar}</span></span>
              : onEdit ? <button onClick={onEdit} className="underline decoration-white/30">📅 Đặt ngày tổ chức</button> : null}
            {project.venue && <span>📍 {project.venue}</span>}
          </div>
          {project.description && <p className="text-sm text-white/55 mt-2 line-clamp-2 max-w-2xl">{project.description}</p>}
          {members.length > 1 && (
            <div className="flex items-center gap-2 mt-3">
              <div className="flex -space-x-1.5">{members.slice(0, 5).map(m => <span key={m.user_id} className="ring-2 ring-ink-900 rounded-full"><Initial name={m.full_name || m.email} url={m.avatar_url} size="w-7 h-7 text-[11px]"/></span>)}</div>
              <span className="text-xs text-white/50">{members.length} người cùng chuẩn bị</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          {days !== null && (
            <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-center min-w-[92px]">
              <p className="font-display text-3xl font-bold tabular leading-none">{days < 0 ? '✓' : days}</p>
              <p className="text-[10px] uppercase tracking-widest text-white/55 mt-1">{days < 0 ? 'Đã diễn ra' : days === 0 ? 'Hôm nay!' : 'ngày nữa'}</p>
            </div>
          )}
          <div className="rounded-2xl border border-white/15 bg-white/10 px-3 py-2 flex items-center gap-2.5">
            <svg width="72" height="72" viewBox="0 0 72 72" className="-rotate-90">
              <circle cx="36" cy="36" r={R} fill="none" stroke="rgba(255,255,255,.15)" strokeWidth="7"/>
              <circle cx="36" cy="36" r={R} fill="none" stroke="#ff6b96" strokeWidth="7" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - progress / 100)} style={{ transition: 'stroke-dashoffset .8s' }}/>
            </svg>
            <div><p className="font-display text-2xl font-bold tabular leading-none">{progress}%</p><p className="text-[10px] text-white/55 mt-1">{done}/{tasks.length} việc</p></div>
          </div>
          {budget > 0 && (
            <div className="hidden sm:block rounded-2xl border border-white/15 bg-white/10 px-4 py-3 min-w-[150px]">
              <p className="text-[10px] uppercase tracking-widest text-white/55">Ngân sách</p>
              <p className="font-bold tabular text-sm mt-0.5">{vnd(totalSpent)}</p>
              <div className="h-1.5 rounded-full bg-white/15 mt-1.5 overflow-hidden"><div className={cn('h-full rounded-full', used > 100 ? 'bg-red-400' : 'bg-gold-400')} style={{ width: `${Math.min(100, used)}%` }}/></div>
              <p className={cn('text-[10px] mt-1', used > 100 ? 'text-red-300 font-semibold' : 'text-white/55')}>{Math.round(used)}% / {vnd(budget)}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Tab tổng quan ─────────────────────────────────────────────────────────────
interface Props {
  project: Project; tasks: Task[]; vendors: Vendor[]; schedule: ScheduleItem[]; invitations: ProjectInvitation[]
  totalSpent: number; remaining: number; committed: number; paidByVendor: Map<string, number>
  goTo: (tab: string) => void; onToggleTask: (t: Task) => void; canEdit: boolean
}
export function OverviewTab({ project, tasks, vendors, schedule, invitations, totalSpent, remaining, committed, paidByVendor, goTo, onToggleTask, canEdit }: Props) {
  const upcoming = tasks.filter(t => t.status !== 'done').sort((a, b) => (a.deadline ?? '9999').localeCompare(b.deadline ?? '9999')).slice(0, 6)
  const overdue = tasks.filter(t => t.status !== 'done' && t.deadline && deadlineInfo(t.deadline).overdue).length
  const high = tasks.filter(t => t.status !== 'done' && t.priority === 'high').length
  const budget = Number(project.budget_total)
  const booked = vendors.filter(v => v.status === 'booked')
  const toPay = booked.reduce((s, v) => s + Math.max(0, Number(v.total_cost) - (paidByVendor.get(v.id) ?? 0)), 0)
  const rsvp = invitations.flatMap(i => i.rsvps ?? [])
  const attending = rsvp.filter(r => r.attending === 'yes').reduce((s, r) => s + r.guest_count, 0)
  const maybe = rsvp.filter(r => r.attending === 'maybe').reduce((s, r) => s + r.guest_count, 0)
  const nextItems = schedule.filter(s => !s.done).slice(0, 4)

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-4">
        {/* Cảnh báo */}
        {(overdue > 0 || remaining < 0) && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 flex flex-wrap items-center gap-3 text-sm text-red-700">
            <span className="text-xl">⚠️</span>
            <span className="flex-1">
              {overdue > 0 && <><b>{overdue} việc quá hạn</b> cần xử lý. </>}
              {remaining < 0 && <>Đã <b>vượt ngân sách {vnd(-remaining)}</b>.</>}
            </span>
            {overdue > 0 && <button onClick={() => goTo('tasks')} className="btn btn-danger btn-xs">Xem việc quá hạn</button>}
          </div>
        )}

        {/* Việc tiếp theo */}
        <div className="card overflow-hidden">
          <div className="px-5 py-3.5 border-b border-ink-100 flex items-center justify-between">
            <div><h3 className="font-semibold text-ink-900">Việc tiếp theo</h3><p className="text-[11px] text-ink-400">{high} việc ưu tiên cao chưa xong</p></div>
            <button onClick={() => goTo('tasks')} className="text-xs font-semibold text-sakura-600 hover:underline">Tất cả →</button>
          </div>
          {upcoming.length === 0 ? (
            <div className="text-center py-10"><p className="text-3xl mb-2">🎉</p><p className="text-sm text-ink-500">{tasks.length ? 'Đã hoàn thành mọi việc!' : 'Chưa có đầu mục nào'}</p>
              {!tasks.length && <button onClick={() => goTo('tasks')} className="btn btn-primary btn-sm mt-3">Thêm việc cần làm</button>}</div>
          ) : (
            <ul className="divide-y divide-ink-50">
              {upcoming.map(t => {
                const dl = deadlineInfo(t.deadline)
                return (
                  <li key={t.id} className="px-5 py-3 flex items-center gap-3">
                    <input type="checkbox" disabled={!canEdit} checked={false} onChange={() => onToggleTask(t)} className="w-4 h-4 accent-jade-500 flex-shrink-0" aria-label="Hoàn thành"/>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-ink-900 truncate">{t.priority === 'high' && <span className="text-red-500 mr-1">●</span>}{t.title}</p>
                      <p className="text-[11px] text-ink-400">{STATUS_LABELS[t.status]} · {PRI_LABELS[t.priority]}</p>
                    </div>
                    <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0',
                      !t.deadline ? 'bg-ink-50 text-ink-400 border-ink-200' : dl.overdue ? 'bg-red-50 text-red-600 border-red-200' : dl.urgent ? 'bg-gold-50 text-gold-700 border-gold-200' : 'bg-ink-50 text-ink-500 border-ink-200')}>
                      {t.deadline ? dl.label : 'Không hạn'}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Phân bổ trạng thái */}
        <div className="card p-5">
          <h3 className="font-semibold text-ink-900 mb-3">Phân bổ đầu mục</h3>
          <div className="flex h-3 rounded-full overflow-hidden bg-ink-100 mb-3">
            {(['done', 'in_progress', 'todo'] as TaskStatus[]).map(s => {
              const n = tasks.filter(t => t.status === s).length
              return <span key={s} style={{ width: `${pct(n, tasks.length)}%` }} className={{ done: 'bg-jade-400', in_progress: 'bg-gold-400', todo: 'bg-ink-300' }[s]}/>
            })}
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            {(['todo', 'in_progress', 'done'] as TaskStatus[]).map(s => (
              <button key={s} onClick={() => goTo('tasks')} className="rounded-xl bg-ink-50/70 py-2.5 hover:bg-ink-100/70">
                <p className="font-display text-2xl font-bold text-ink-900 tabular">{tasks.filter(t => t.status === s).length}</p>
                <p className="text-[11px] text-ink-500">{STATUS_LABELS[s]}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Lịch trình */}
        <div className="card overflow-hidden">
          <div className="px-5 py-3.5 border-b border-ink-100 flex items-center justify-between">
            <h3 className="font-semibold text-ink-900">Lịch trình ngày cưới</h3>
            <button onClick={() => goTo('schedule')} className="text-xs font-semibold text-sakura-600 hover:underline">{schedule.length ? 'Xem đầy đủ →' : 'Lập lịch trình →'}</button>
          </div>
          {nextItems.length === 0 ? <p className="text-sm text-ink-400 text-center py-6">{schedule.length ? 'Đã hoàn tất lịch trình 🎉' : 'Chưa có lịch trình — dùng mẫu có sẵn chỉ với 1 chạm'}</p> : (
            <ul className="px-5 py-3 space-y-2">
              {nextItems.map(s => (
                <li key={s.id} className="flex items-center gap-3 text-sm">
                  <span className="w-14 font-bold tabular text-ink-900">{s.start_time?.slice(0, 5) ?? '—'}</span>
                  <span className="flex-1 truncate text-ink-700">{s.title}</span>
                  {s.location && <span className="text-[11px] text-ink-400 truncate max-w-[30%]">📍 {s.location}</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {/* Ngân sách */}
        <button onClick={() => goTo('budget')} className="card p-5 w-full text-left hover:shadow-card-hover transition">
          <div className="flex items-center justify-between mb-3"><h3 className="font-semibold text-ink-900">Ngân sách</h3><span className="text-xs text-sakura-600 font-semibold">Chi tiết →</span></div>
          {[
            ['Kế hoạch', vnd(budget), 'text-ink-800'],
            ['Đã chi', vnd(totalSpent), 'text-sakura-600'],
            ['Còn phải trả NCC', vnd(toPay), 'text-gold-700'],
            [remaining >= 0 ? 'Còn lại' : 'Vượt', vnd(Math.abs(remaining)), remaining >= 0 ? 'text-jade-600' : 'text-red-600'],
          ].map(([l, v, c]) => (
            <div key={l} className="flex justify-between py-1.5 text-sm border-b border-ink-50 last:border-0"><span className="text-ink-500">{l}</span><span className={cn('font-bold tabular', c)}>{v}</span></div>
          ))}
          <div className="progress-track h-2 mt-3"><div className={remaining < 0 ? 'progress-bar-danger h-full rounded-full' : 'progress-bar'} style={{ width: `${budget ? Math.min(100, (totalSpent / budget) * 100) : 0}%`, height: '100%' }}/></div>
        </button>

        {/* Khách mời từ thiệp online */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3"><h3 className="font-semibold text-ink-900">Khách mời</h3><Link href="/invitations" className="text-xs text-sakura-600 font-semibold hover:underline">Thiệp cưới →</Link></div>
          {invitations.length === 0 ? (
            <div className="text-center py-3">
              <p className="text-3xl mb-2">💌</p>
              <p className="text-xs text-ink-500 mb-3">Tạo thiệp cưới online và liên kết với dự án này để theo dõi số khách xác nhận.</p>
              <Link href="/invitations" className="btn btn-primary btn-sm">Tạo thiệp cưới</Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2 text-center mb-3">
                <div className="rounded-xl bg-jade-50 py-2"><p className="font-display text-2xl font-bold text-jade-700 tabular">{attending}</p><p className="text-[10px] text-jade-700">sẽ đến</p></div>
                <div className="rounded-xl bg-gold-50 py-2"><p className="font-display text-2xl font-bold text-gold-700 tabular">{maybe}</p><p className="text-[10px] text-gold-700">chưa chắc</p></div>
                <div className="rounded-xl bg-ink-50 py-2"><p className="font-display text-2xl font-bold text-ink-700 tabular">{rsvp.length}</p><p className="text-[10px] text-ink-500">phản hồi</p></div>
              </div>
              {invitations.map(i => (
                <Link key={i.id} href={`/invitations/${i.id}`} className="flex items-center justify-between text-sm py-1.5 hover:text-sakura-700">
                  <span className="truncate">💌 {i.title}</span>
                  <span className="text-[11px] text-ink-400 flex-shrink-0">{i.is_published ? `👁 ${i.view_count}` : 'Bản nháp'}</span>
                </Link>
              ))}
            </>
          )}
        </div>

        {/* Nhà cung cấp */}
        <button onClick={() => goTo('vendors')} className="card p-5 w-full text-left hover:shadow-card-hover transition">
          <div className="flex items-center justify-between mb-2"><h3 className="font-semibold text-ink-900">Nhà cung cấp</h3><span className="text-xs text-sakura-600 font-semibold">Quản lý →</span></div>
          {vendors.length === 0 ? <p className="text-xs text-ink-400">Chưa có nhà cung cấp — thêm nhà hàng, studio, trang điểm…</p> : (
            <>
              <p className="text-sm text-ink-600"><b className="text-ink-900">{booked.length}</b> đã chốt · {vendors.filter(v => v.status === 'considering').length} đang cân nhắc</p>
              <p className="text-xs text-ink-400 mt-1">Giá trị hợp đồng {vnd(committed)}</p>
            </>
          )}
        </button>

        {(project.tags?.length ?? 0) > 0 && <div className="flex flex-wrap gap-1">{project.tags.map(t => <TagPill key={t} tag={t}/>)}</div>}
      </div>
    </div>
  )
}
