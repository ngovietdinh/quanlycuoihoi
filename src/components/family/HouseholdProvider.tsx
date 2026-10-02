'use client'
import { createContext, useCallback, useContext, useEffect, useState, FormEvent } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { listHouseholds, listHouseholdMembers, createHousehold } from '@/lib/api/family'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import type { Household, HouseholdMember } from '@/types'

interface Ctx {
  household: Household; households: Household[]; members: HouseholdMember[]
  role: 'owner' | 'editor' | 'viewer'; canEdit: boolean; isOwner: boolean; userId: string | null
  select: (id: string) => void; reload: () => Promise<void>; reloadMembers: () => Promise<void>
}
const C = createContext<Ctx | null>(null)
export const useHousehold = () => { const c = useContext(C); if (!c) throw new Error('Thiếu HouseholdProvider'); return c }
const KEY = 'hysu:household'

export const FAMILY_NAV = [
  { href: '/family',           icon: '🏡', label: 'Tổng quan' },
  { href: '/family/finance',   icon: '💰', label: 'Thu chi' },
  { href: '/family/pregnancy', icon: '🤰', label: 'Thai sản' },
  { href: '/family/children',  icon: '🧒', label: 'Con cái' },
  { href: '/family/savings',   icon: '🐷', label: 'Tiết kiệm & tài sản' },
]
export const RELATIONS = ['Chồng', 'Vợ', 'Bố', 'Mẹ', 'Ông', 'Bà', 'Anh', 'Chị', 'Em', 'Con', 'Khác']

export function HouseholdProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [households, setHouseholds] = useState<Household[] | null>(null)
  const [members, setMembers] = useState<HouseholdMember[]>([])
  const [current, setCurrent] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const path = usePathname()

  const reload = useCallback(async () => {
    const r = await listHouseholds()
    if (r.error) { setErr(r.error); setHouseholds([]); return }
    setErr(null); setHouseholds(r.data!)
    let saved: string | null = null
    try { saved = localStorage.getItem(KEY) } catch {}
    setCurrent(c => (c && r.data!.some(h => h.id === c) ? c : r.data!.find(h => h.id === saved)?.id ?? r.data![0]?.id ?? null))
  }, [])
  useEffect(() => { reload() }, [reload])
  const reloadMembers = useCallback(async () => {
    if (!current) return
    const r = await listHouseholdMembers(current); setMembers(r.data ?? [])
  }, [current])
  useEffect(() => { reloadMembers() }, [reloadMembers])

  const select = (id: string) => { setCurrent(id); try { localStorage.setItem(KEY, id) } catch {} }
  const household = households?.find(h => h.id === current)

  if (households === null) return <div className="p-6 max-w-6xl mx-auto w-full space-y-4"><div className="h-24 skeleton"/><div className="h-64 skeleton"/></div>
  if (err) return (
    <div className="p-6 max-w-2xl mx-auto w-full"><div className="card p-6 text-center">
      <div className="text-4xl mb-3">🛠️</div><p className="text-sm text-ink-600">{err}</p>
    </div></div>
  )
  if (!household) return <CreateHousehold onCreated={async id => { await reload(); select(id) }}/>

  const me = members.find(m => m.user_id === user?.id)
  const role = (me?.role ?? (household.owner_id === user?.id ? 'owner' : 'viewer')) as Ctx['role']
  const value: Ctx = { household, households, members, role, canEdit: role !== 'viewer', isOwner: role === 'owner', userId: user?.id ?? null, select, reload, reloadMembers }

  return (
    <C.Provider value={value}>
      <div className="sticky top-0 z-30 border-b border-ink-100/60 print:hidden" style={{ background: 'rgba(255,253,249,0.94)', backdropFilter: 'blur(20px)' }}>
        <div className="px-4 sm:px-6 h-[58px] flex items-center gap-3">
          <span className="text-2xl">🏡</span>
          <div className="min-w-0 flex-1">
            {households.length > 1 ? (
              <select value={household.id} onChange={e => select(e.target.value)} className="font-display text-lg font-semibold text-ink-900 bg-transparent focus:outline-none max-w-full truncate">
                {households.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
            ) : <p className="font-display text-lg font-semibold text-ink-900 truncate">{household.name}</p>}
            <p className="text-xs text-ink-400 -mt-0.5">{members.length} thành viên · {role === 'owner' ? 'Chủ gia đình' : role === 'editor' ? 'Biên tập' : 'Chỉ xem'}</p>
          </div>
          <div className="hidden sm:flex -space-x-1.5">
            {members.slice(0, 5).map(m => (
              <span key={m.user_id} title={`${m.full_name ?? m.email}${m.relation ? ` (${m.relation})` : ''}`} className="w-8 h-8 rounded-full ring-2 ring-white flex items-center justify-center text-white text-xs font-bold overflow-hidden" style={{ background: 'linear-gradient(135deg,#ff6b96,#f59e0b)' }}>
                {m.avatar_url ? <img src={m.avatar_url} alt="" className="w-full h-full object-cover"/> : (m.full_name || m.email || '?')[0]?.toUpperCase()}
              </span>
            ))}
          </div>
        </div>
        <nav className="px-2 sm:px-5 flex gap-1 overflow-x-auto no-scrollbar -mb-px">
          {FAMILY_NAV.map(n => {
            const active = n.href === '/family' ? path === '/family' : path.startsWith(n.href)
            return (
              <Link key={n.href} href={n.href} className={cn('flex-shrink-0 flex items-center gap-1.5 px-3 py-2.5 text-sm border-b-2 transition',
                active ? 'border-sakura-500 text-sakura-700 font-semibold' : 'border-transparent text-ink-500 hover:text-ink-900')}>
                <span>{n.icon}</span>{n.label}
              </Link>
            )
          })}
        </nav>
      </div>
      {role === 'viewer' && <div className="mx-4 sm:mx-6 mt-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm text-blue-700">👁 Bạn đang xem với quyền <b>chỉ xem</b>.</div>}
      {children}
    </C.Provider>
  )
}

function CreateHousehold({ onCreated }: { onCreated: (id: string) => void }) {
  const { user } = useAuth()
  const last = (user?.user_metadata?.full_name as string | undefined)?.trim().split(/\s+/)[0]
  const [name, setName] = useState(last ? `Gia đình nhà ${last}` : 'Gia đình nhỏ của chúng mình')
  const [rel, setRel] = useState('Chồng')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setErr(null)
    const r = await createHousehold(name.trim(), rel)
    setBusy(false)
    if (r.error || !r.data) setErr(r.error); else onCreated(r.data.id)
  }
  const FEATURES = [['💰', 'Thu chi sinh hoạt', 'Nhiều ví, ngân sách tháng, khoản định kỳ, báo cáo'], ['🤰', 'Thai sản', 'Theo dõi thai kỳ, mốc khám, chi phí sinh, đồ sơ sinh'], ['🧒', 'Con cái', 'Tiêm chủng, tăng trưởng, chi phí nuôi con, nhật ký'], ['🐷', 'Tiết kiệm & tài sản', 'Mục tiêu, khoản vay, sổ hiếu hỉ, giấy tờ']]
  return (
    <div className="p-4 sm:p-8 max-w-3xl mx-auto w-full">
      <div className="hero p-7 sm:p-10 text-white text-center mb-5">
        <div className="relative">
          <div className="text-5xl mb-3 animate-float">🏡</div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold mb-2">Quản lý gia đình</h1>
          <p className="text-white/60 max-w-lg mx-auto">Sau ngày cưới là cả một hành trình. Cùng vợ/chồng và người thân ghi chép thu chi, theo dõi thai kỳ, chăm con và tích lũy cho tương lai.</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
        {FEATURES.map(([i, t, d]) => <div key={t} className="card p-4 flex gap-3"><span className="text-2xl">{i}</span><div><p className="font-semibold text-sm text-ink-900">{t}</p><p className="text-xs text-ink-500">{d}</p></div></div>)}
      </div>
      <form onSubmit={submit} className="card p-5 space-y-4">
        <h2 className="font-semibold text-ink-900">Tạo gia đình của bạn</h2>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_160px] gap-3">
          <div><label className="label">Tên gia đình</label><input className="input" value={name} onChange={e => setName(e.target.value)} required/></div>
          <div><label className="label">Bạn là</label><select className="input" value={rel} onChange={e => setRel(e.target.value)}>{RELATIONS.map(r => <option key={r}>{r}</option>)}</select></div>
        </div>
        {err && <p className="text-sm text-red-600">⚠️ {err}</p>}
        <button disabled={busy || !name.trim()} className="btn btn-primary w-full h-11">{busy ? 'Đang tạo…' : '🏡 Tạo gia đình'}</button>
        <p className="text-xs text-ink-400 text-center">Dữ liệu gia đình là riêng tư — chỉ thành viên bạn mời mới xem được.</p>
      </form>
    </div>
  )
}
