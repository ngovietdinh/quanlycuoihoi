'use client'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { solarToLunar, canChiYear } from '@/lib/invitation/datetime'
import { vnd, pct, cn, fmtDate } from '@/lib/utils'
import type { ProjectSummary } from '@/types'
import type { TaskWithProject, ActivityItem, DashboardData } from '@/lib/api/dashboard'

const dayDiff = (d: string) => {
  const a = new Date(d + (d.length === 10 ? 'T00:00:00' : '')); a.setHours(0, 0, 0, 0)
  const b = new Date(); b.setHours(0, 0, 0, 0)
  return Math.round((a.getTime() - b.getTime()) / 864e5)
}
const timeAgo = (iso: string) => {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'vừa xong'
  if (s < 3600) return `${Math.floor(s / 60)} phút trước`
  if (s < 86400) return `${Math.floor(s / 3600)} giờ trước`
  if (s < 86400 * 7) return `${Math.floor(s / 86400)} ngày trước`
  return fmtDate(iso)
}

// ── Lời chào + đếm ngược ──────────────────────────────────────────────────────
export function Greeting({ name, next, onCreateProject }: { name: string; next: ProjectSummary | null; onCreateProject: () => void }) {
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => { setNow(new Date()); const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t) }, [])
  const h = now?.getHours() ?? 9
  const hello = h < 11 ? 'Chào buổi sáng' : h < 14 ? 'Chào buổi trưa' : h < 18 ? 'Chào buổi chiều' : 'Chào buổi tối'
  const lunar = now ? solarToLunar(now.getDate(), now.getMonth() + 1, now.getFullYear()) : null
  const target = next?.event_date ? new Date(next.event_date + 'T00:00:00') : null
  const diff = target && now ? Math.max(0, target.getTime() - now.getTime()) : 0
  const parts = [[Math.floor(diff / 864e5), 'ngày'], [Math.floor(diff / 36e5) % 24, 'giờ'], [Math.floor(diff / 6e4) % 60, 'phút'], [Math.floor(diff / 1e3) % 60, 'giây']] as const

  return (
    <div className="hero p-6 sm:p-7 text-white">
      <div className="hero-bubble w-40 h-40 -top-10 -right-10"/>
      <div className="hero-bubble w-20 h-20 bottom-6 right-1/3" style={{ animationDelay: '2s' }}/>
      <div className="relative grid lg:grid-cols-[1fr_auto] gap-6 items-center">
        <div className="min-w-0">
          <p className="text-white/60 text-sm">{now ? now.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : ' '}
            {lunar && <span className="ml-2 text-white/40">· Âm lịch {lunar.day}/{lunar.month} {canChiYear(lunar.year)}</span>}</p>
          <h2 className="font-display text-2xl sm:text-4xl font-bold mt-1 leading-tight">{hello}{name ? `, ${name}` : ''} 👋</h2>
          {next ? (
            <p className="text-white/70 text-sm mt-2">{dayDiff(next.event_date!) === 0 ? <b className="text-white">Hôm nay là ngày vui! 🎊</b> : <>Còn <b className="text-white">{dayDiff(next.event_date!)} ngày</b> nữa</>} là tới <Link href={`/projects/${next.id}`} className="underline decoration-white/30 hover:decoration-white">{next.name}</Link>{next.venue ? ` · ${next.venue}` : ''}</p>
          ) : (
            <p className="text-white/70 text-sm mt-2">Hãy tạo dự án đầu tiên và đặt ngày cưới để bắt đầu đếm ngược 💕</p>
          )}
        </div>
        {next && target ? (
          <div className="flex gap-2 sm:gap-3">
            {parts.map(([v, l]) => (
              <div key={l} className="w-16 sm:w-20 rounded-2xl border border-white/15 bg-white/10 backdrop-blur py-3 text-center">
                <p className="font-display text-2xl sm:text-3xl font-bold tabular">{now ? String(v).padStart(2, '0') : '--'}</p>
                <p className="text-[10px] uppercase tracking-widest text-white/50">{l}</p>
              </div>
            ))}
          </div>
        ) : (
          <button onClick={onCreateProject} className="btn btn-gold btn-lg">+ Tạo dự án cưới</button>
        )}
      </div>
    </div>
  )
}

// ── Thao tác nhanh ────────────────────────────────────────────────────────────
export function QuickActions({ onCreateProject, firstProjectId }: { onCreateProject: () => void; firstProjectId?: string }) {
  const items: { icon: string; label: string; desc: string; href?: string; onClick?: () => void; color: string }[] = [
    { icon: '🗂️', label: 'Dự án mới', desc: 'Kèm 24 việc mẫu', onClick: onCreateProject, color: 'from-sakura-50 to-white' },
    { icon: '💌', label: 'Tạo thiệp', desc: '18 mẫu thiệp', href: '/invitations', color: 'from-gold-50 to-white' },
    { icon: '✅', label: 'Việc cần làm', desc: 'Bảng Kanban', href: firstProjectId ? `/projects/${firstProjectId}` : undefined, onClick: firstProjectId ? undefined : onCreateProject, color: 'from-jade-50 to-white' },
    { icon: '👁', label: 'Thiệp mẫu', desc: 'Xem thử', href: '/i/demo?t=royal', color: 'from-blue-50 to-white' },
  ]
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {items.map(it => {
        const inner = (
          <>
            <span className="w-11 h-11 rounded-2xl bg-white shadow-card flex items-center justify-center text-xl flex-shrink-0 group-hover:scale-110 transition-transform">{it.icon}</span>
            <span className="min-w-0"><span className="block font-semibold text-sm text-ink-900 truncate">{it.label}</span><span className="block text-[11px] text-ink-400 truncate">{it.desc}</span></span>
          </>
        )
        const cls = `group card p-3.5 flex items-center gap-3 bg-gradient-to-br ${it.color} hover:shadow-card-hover hover:-translate-y-0.5 transition-all text-left`
        return it.href
          ? <Link key={it.label} href={it.href} target={it.href.startsWith('/i/') ? '_blank' : undefined} className={cls}>{inner}</Link>
          : <button key={it.label} onClick={it.onClick} className={cls}>{inner}</button>
      })}
    </div>
  )
}

// ── Chỉ số ────────────────────────────────────────────────────────────────────
function Ring({ value, color }: { value: number; color: string }) {
  const r = 22, c = 2 * Math.PI * r
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" className="-rotate-90 flex-shrink-0">
      <circle cx="28" cy="28" r={r} fill="none" stroke="#f0ede6" strokeWidth="6"/>
      <circle cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(100, value) / 100)} style={{ transition: 'stroke-dashoffset .8s ease' }}/>
    </svg>
  )
}

export function Kpis({ projects, data }: { projects: ProjectSummary[]; data: DashboardData | null }) {
  const upcoming = projects.filter(p => p.event_date && dayDiff(p.event_date) >= 0).length
  const total = projects.reduce((s, p) => s + p.total_tasks, 0)
  const done = projects.reduce((s, p) => s + p.completed_tasks, 0)
  const budget = projects.reduce((s, p) => s + Number(p.budget_total), 0)
  const spent = projects.reduce((s, p) => s + Number(p.total_spent), 0)
  const usePct = budget ? Math.round((spent / budget) * 100) : 0
  const overdue = (data?.tasks ?? []).filter(t => t.deadline && dayDiff(t.deadline) < 0).length
  const inv = data?.invitationStats
  const tiles = [
    { label: 'Dự án', value: projects.length, sub: `${upcoming} sắp diễn ra`, ring: null, icon: '🗂️', tone: 'sakura' },
    { label: 'Tiến độ công việc', value: `${pct(done, total)}%`, sub: overdue ? `⚠ ${overdue} việc quá hạn` : `${done}/${total} việc hoàn thành`, ring: [pct(done, total), '#10b981'], icon: '✅', tone: 'jade', warn: overdue > 0 },
    { label: 'Ngân sách đã dùng', value: `${usePct}%`, sub: `${vnd(spent)} / ${vnd(budget)}`, ring: [usePct, usePct > 100 ? '#ef4444' : '#f59e0b'], icon: '💰', tone: 'gold', warn: usePct > 100 },
    { label: 'Khách sẽ đến', value: inv?.attending ?? 0, sub: `${inv?.rsvps ?? 0} phản hồi · ${inv?.views ?? 0} lượt xem thiệp`, ring: null, icon: '💌', tone: 'ink' },
  ] as const
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {tiles.map(t => (
        <div key={t.label} className={`stat-card ${t.tone} flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 !p-4 sm:!p-5`}>
          {t.ring ? <div className="relative"><Ring value={t.ring[0] as number} color={t.ring[1] as string}/><span className="absolute inset-0 flex items-center justify-center text-lg">{t.icon}</span></div>
            : <span className="w-14 h-14 rounded-2xl bg-ink-50 flex items-center justify-center text-2xl flex-shrink-0">{t.icon}</span>}
          <div className="min-w-0 w-full">
            <p className="text-[11px] text-ink-400 font-medium truncate">{t.label}</p>
            <p className="font-display text-2xl sm:text-3xl font-bold text-ink-900 tabular leading-tight">{t.value}</p>
            <p className={cn('text-[11px] truncate', 'warn' in t && t.warn ? 'text-red-500 font-semibold' : 'text-ink-400')}>{t.sub}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Việc sắp đến hạn ──────────────────────────────────────────────────────────
export function UpcomingTasks({ tasks, onDone, loading }: { tasks: TaskWithProject[]; onDone: (t: TaskWithProject) => void; loading: boolean }) {
  const [filter, setFilter] = useState<'soon' | 'overdue' | 'all'>('soon')
  const withDeadline = tasks.filter(t => t.deadline)
  const overdue = withDeadline.filter(t => dayDiff(t.deadline!) < 0)
  const list = (filter === 'overdue' ? overdue : filter === 'soon' ? withDeadline.filter(t => dayDiff(t.deadline!) <= 14) : [...withDeadline, ...tasks.filter(t => !t.deadline)]).slice(0, 8)
  const badge = (d: string) => {
    const n = dayDiff(d)
    if (n < 0) return ['bg-red-50 text-red-600 border-red-200', `Quá ${-n} ngày`]
    if (n === 0) return ['bg-sakura-50 text-sakura-700 border-sakura-200', 'Hôm nay']
    if (n === 1) return ['bg-gold-50 text-gold-700 border-gold-200', 'Ngày mai']
    if (n <= 7) return ['bg-gold-50 text-gold-700 border-gold-200', `${n} ngày nữa`]
    return ['bg-ink-50 text-ink-500 border-ink-200', fmtDate(d)]
  }
  return (
    <section className="card overflow-hidden flex flex-col">
      <header className="px-5 pt-4 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 border-b border-ink-100/70">
        <div><h3 className="font-semibold text-ink-900">Việc cần làm</h3><p className="text-[11px] text-ink-400">Tích chọn để đánh dấu hoàn thành</p></div>
        <div className="flex bg-ink-100/70 rounded-xl p-0.5 text-[11px] font-medium">
          {([['soon', '14 ngày'], ['overdue', `Quá hạn${overdue.length ? ` (${overdue.length})` : ''}`], ['all', 'Tất cả']] as const).map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)} className={cn('px-2.5 py-1 rounded-lg whitespace-nowrap', filter === k ? 'bg-white shadow text-ink-900' : 'text-ink-500', k === 'overdue' && overdue.length && filter !== k && 'text-red-500')}>{l}</button>
          ))}
        </div>
      </header>
      <div className="flex-1 divide-y divide-ink-50">
        {loading ? [1, 2, 3, 4].map(i => <div key={i} className="px-5 py-3.5"><div className="skeleton h-4 w-3/4"/></div>)
          : list.length === 0 ? (
            <div className="text-center py-10 px-4"><p className="text-3xl mb-2">🎉</p><p className="text-sm text-ink-500">{filter === 'overdue' ? 'Không có việc quá hạn' : 'Không có việc nào sắp đến hạn'}</p></div>
          ) : list.map(t => {
            const [cls, label] = t.deadline ? badge(t.deadline) : ['bg-ink-50 text-ink-400 border-ink-200', 'Không hạn']
            return (
              <div key={t.id} className="px-5 py-3 flex items-center gap-3 hover:bg-ink-50/50 group">
                <button onClick={() => onDone(t)} aria-label="Đánh dấu hoàn thành"
                  className="w-5 h-5 rounded-md border-2 border-ink-300 hover:border-jade-500 hover:bg-jade-50 flex-shrink-0 flex items-center justify-center text-[10px] text-jade-600 transition">
                  <span className="opacity-0 group-hover:opacity-100">✓</span>
                </button>
                <Link href={`/projects/${t.project_id}`} className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink-900 truncate">{t.priority === 'high' && <span className="text-red-500 mr-1">●</span>}{t.title}</p>
                  <p className="text-[11px] text-ink-400 truncate">{t.projects?.name}</p>
                </Link>
                <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0', cls)}>{label}</span>
              </div>
            )
          })}
      </div>
    </section>
  )
}

// ── Bảng tin phản hồi ─────────────────────────────────────────────────────────
export function ActivityFeed({ items, loading }: { items: ActivityItem[]; loading: boolean }) {
  const ATT = { yes: ['✅', 'sẽ tham dự', 'text-jade-600'], maybe: ['🤔', 'chưa chắc chắn', 'text-gold-600'], no: ['😢', 'không thể đến', 'text-red-500'] } as const
  return (
    <section className="card overflow-hidden flex flex-col">
      <header className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-ink-100/70">
        <div><h3 className="font-semibold text-ink-900">Hoạt động mới</h3><p className="text-[11px] text-ink-400">Phản hồi & lời chúc từ thiệp online</p></div>
        <Link href="/invitations" className="text-xs font-semibold text-sakura-600 hover:underline">Xem thiệp →</Link>
      </header>
      <div className="flex-1 divide-y divide-ink-50 max-h-[420px] overflow-y-auto">
        {loading ? [1, 2, 3].map(i => <div key={i} className="px-5 py-3.5"><div className="skeleton h-4 w-2/3"/></div>)
          : items.length === 0 ? (
            <div className="text-center py-10 px-4">
              <p className="text-3xl mb-2">💌</p>
              <p className="text-sm text-ink-500 mb-3">Chưa có phản hồi nào. Gửi thiệp để khách xác nhận tham dự!</p>
              <Link href="/invitations" className="btn btn-primary btn-sm">Tạo thiệp cưới</Link>
            </div>
          ) : items.map(a => (
            <Link key={a.kind + a.id} href={`/invitations/${a.invitation.id}`} className="px-5 py-3 flex gap-3 hover:bg-ink-50/50">
              <span className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: a.kind === 'wish' ? 'linear-gradient(135deg,#fff1f5,#fef3c7)' : '#ecfdf5' }}>
                {a.kind === 'wish' ? '💬' : ATT[a.data.attending][0]}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-ink-800">
                  <b>{a.data.name}</b>{' '}
                  {a.kind === 'rsvp'
                    ? <span className={ATT[a.data.attending][2]}>{ATT[a.data.attending][1]}{a.data.attending !== 'no' && a.data.guest_count > 1 ? ` (${a.data.guest_count} người)` : ''}</span>
                    : <span className="text-ink-500">gửi lời chúc</span>}
                </p>
                {(a.kind === 'wish' ? a.data.message : a.data.message) && <p className="text-xs text-ink-500 italic truncate">“{a.data.message}”</p>}
                <p className="text-[10px] text-ink-400 mt-0.5">{timeAgo(a.at)} · {a.invitation.title}</p>
              </div>
            </Link>
          ))}
      </div>
    </section>
  )
}

// ── Chi tiêu theo danh mục ────────────────────────────────────────────────────
const CAT_COLORS = ['#ff3d78', '#f59e0b', '#10b981', '#6366f1', '#ec4899', '#14b8a6', '#8b5cf6', '#957f63']
export function SpendingBreakdown({ data, budget, projects = [] }: { data: DashboardData['expenses']; budget: number; projects?: ProjectSummary[] }) {
  const rows = useMemo(() => {
    const m = new Map<string, number>()
    data.forEach(e => m.set(e.category || 'Khác', (m.get(e.category || 'Khác') ?? 0) + Number(e.amount)))
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1])
  }, [data])
  const total = rows.reduce((s, [, v]) => s + v, 0)
  const month = new Date().toISOString().slice(0, 7)
  const thisMonth = data.filter(e => e.spent_at?.startsWith(month)).reduce((s, e) => s + Number(e.amount), 0)
  return (
    <section className="card p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div><h3 className="font-semibold text-ink-900">Chi tiêu theo danh mục</h3><p className="text-[11px] text-ink-400">Tổng hợp mọi dự án · tháng này {vnd(thisMonth)}</p></div>
        <div className="text-right"><p className="font-display text-xl font-bold text-ink-900 tabular">{vnd(total)}</p><p className="text-[11px] text-ink-400">/ {vnd(budget)}</p></div>
      </div>
      {rows.length === 0 ? <p className="text-sm text-ink-400 text-center py-6">Chưa ghi nhận chi tiêu nào</p> : (
        <>
          <div className="flex h-3 rounded-full overflow-hidden bg-ink-100 mb-4">
            {rows.map(([c, v], i) => <span key={c} style={{ width: `${(v / total) * 100}%`, background: CAT_COLORS[i % CAT_COLORS.length] }} title={`${c}: ${vnd(v)}`}/>)}
          </div>
          <ul className="space-y-2">
            {rows.slice(0, 6).map(([c, v], i) => (
              <li key={c} className="flex items-center gap-2.5 text-sm">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: CAT_COLORS[i % CAT_COLORS.length] }}/>
                <span className="flex-1 text-ink-700 truncate">{c}</span>
                <span className="text-xs text-ink-400 tabular w-10 text-right">{Math.round((v / total) * 100)}%</span>
                <span className="font-semibold text-ink-900 tabular w-28 text-right">{vnd(v)}</span>
              </li>
            ))}
          </ul>
        </>
      )}
      {projects.length > 0 && (
        <div className="mt-5 pt-4 border-t border-ink-100">
          <p className="text-xs font-semibold text-ink-500 mb-3">Ngân sách theo dự án</p>
          <ul className="space-y-3">
            {projects.slice(0, 4).map(p => {
              const used = Number(p.budget_total) ? (Number(p.total_spent) / Number(p.budget_total)) * 100 : 0
              return (
                <li key={p.id}>
                  <Link href={`/projects/${p.id}`} className="flex items-center justify-between text-sm mb-1 gap-2 hover:text-sakura-700">
                    <span className="truncate text-ink-700">{p.name}</span>
                    <span className={cn('text-xs font-semibold tabular flex-shrink-0', used > 100 ? 'text-red-600' : 'text-ink-500')}>{Math.round(used)}% · còn {vnd(Math.max(0, Number(p.budget_total) - Number(p.total_spent)))}</span>
                  </Link>
                  <div className="progress-track h-1.5"><div className={used > 100 ? 'progress-bar-danger h-full rounded-full' : 'progress-bar'} style={{ width: `${Math.min(100, used)}%`, height: '100%' }}/></div>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </section>
  )
}

// ── Lịch tháng ────────────────────────────────────────────────────────────────
export function MonthCalendar({ projects, tasks }: { projects: ProjectSummary[]; tasks: TaskWithProject[] }) {
  const [cursor, setCursor] = useState<Date | null>(null)
  useEffect(() => { const d = new Date(); d.setDate(1); setCursor(d) }, [])
  const [sel, setSel] = useState<string | null>(null)
  const marks = useMemo(() => {
    const m = new Map<string, { events: ProjectSummary[]; tasks: TaskWithProject[] }>()
    const get = (k: string) => m.get(k) ?? (m.set(k, { events: [], tasks: [] }), m.get(k)!)
    projects.forEach(p => p.event_date && get(p.event_date).events.push(p))
    tasks.forEach(t => t.deadline && get(t.deadline).tasks.push(t))
    return m
  }, [projects, tasks])
  if (!cursor) return <section className="card p-5 h-80 skeleton"/>
  const y = cursor.getFullYear(), mo = cursor.getMonth()
  const offset = (new Date(y, mo, 1).getDay() + 6) % 7
  const days = new Date(y, mo + 1, 0).getDate()
  const key = (d: number) => `${y}-${String(mo + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  const today = new Date(); const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  const shift = (n: number) => { setSel(null); setCursor(new Date(y, mo + n, 1)) }
  const detail = sel ? marks.get(sel) : null
  return (
    <section className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-ink-900">Tháng {mo + 1} · {y}</h3>
        <div className="flex gap-1">
          <button onClick={() => shift(-1)} className="btn btn-ghost btn-xs btn-icon" aria-label="Tháng trước">‹</button>
          <button onClick={() => { const d = new Date(); d.setDate(1); setCursor(d); setSel(null) }} className="btn btn-ghost btn-xs">Hôm nay</button>
          <button onClick={() => shift(1)} className="btn btn-ghost btn-xs btn-icon" aria-label="Tháng sau">›</button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(d => <div key={d} className="text-[10px] font-bold text-ink-400 py-1">{d}</div>)}
        {Array.from({ length: offset }).map((_, i) => <div key={'e' + i}/>)}
        {Array.from({ length: days }, (_, i) => i + 1).map(d => {
          const k = key(d), m = marks.get(k), isToday = k === todayKey
          const lunar = solarToLunar(d, mo + 1, y)
          return (
            <button key={d} onClick={() => setSel(sel === k ? null : k)}
              className={cn('relative aspect-square rounded-xl flex flex-col items-center justify-center transition',
                m?.events.length ? 'bg-sakura-500 text-white font-bold shadow-glow-sakura' : isToday ? 'bg-ink-900 text-white font-semibold' : 'hover:bg-ink-50 text-ink-700',
                sel === k && 'ring-2 ring-sakura-300')}>
              <span className="leading-none">{d}</span>
              <span className={cn('text-[8px] leading-none mt-0.5', m?.events.length || isToday ? 'text-white/70' : 'text-ink-300')}>{lunar.day === 1 ? `${lunar.day}/${lunar.month}` : lunar.day}</span>
              {m?.tasks.length ? <span className={cn('absolute bottom-1 w-1 h-1 rounded-full', m.events.length || isToday ? 'bg-white' : 'bg-gold-500')}/> : null}
            </button>
          )
        })}
      </div>
      <div className="mt-3 flex items-center gap-4 text-[10px] text-ink-400">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-sakura-500"/>Ngày cưới</span>
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-gold-500"/>Hạn công việc</span>
        <span className="flex items-center gap-1"><span className="text-ink-300">1/8</span>Âm lịch</span>
      </div>
      {detail && (
        <div className="mt-3 pt-3 border-t border-ink-100 space-y-1.5 text-sm animate-fadeUp">
          {detail.events.map(p => <Link key={p.id} href={`/projects/${p.id}`} className="block text-sakura-700 font-semibold">💍 {p.name}</Link>)}
          {detail.tasks.map(t => <Link key={t.id} href={`/projects/${t.project_id}`} className="block text-ink-700 truncate">• {t.title} <span className="text-ink-400 text-xs">— {t.projects?.name}</span></Link>)}
        </div>
      )}
    </section>
  )
}
