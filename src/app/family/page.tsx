'use client'
import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { useHousehold, RELATIONS } from '@/components/family/HouseholdProvider'
import { useRows, useConfirm, Stat, Panel, thisMonth, monthLabel, daysUntil } from '@/components/family/ui'
import { useToast } from '@/components/ui/Toast'
import { T, addHouseholdMember, updateHouseholdMember, removeHouseholdMember, updateHousehold, deleteHousehold, createHousehold } from '@/lib/api/family'
import { billDue, gestation, ageText, loanSchedule } from '@/lib/family/data'
import { vnd, cn, fmtDate } from '@/lib/utils'
import type { Txn, Bill, FinBudget, Pregnancy, Child, Vaccination, FamilyDoc, Loan, LoanPayment, Debt, SavingsGoal, GoalContribution } from '@/types'

type Alert = { icon: string; text: React.ReactNode; when: string; href: string; tone: 'bad' | 'warn' | 'info' }

export default function FamilyOverview() {
  const { household, households, members, isOwner, canEdit, userId, reload, reloadMembers, select } = useHousehold()
  const { success, error } = useToast()
  const tx = useRows<Txn>(T.txns, 'transactions'), bills = useRows<Bill>(T.bills, 'recurring_bills'), budgets = useRows<FinBudget>(T.budgets, 'fin_budgets')
  const pregs = useRows<Pregnancy>(T.pregnancies, 'pregnancies'), kids = useRows<Child>(T.children, 'children'), vacs = useRows<Vaccination>(T.vaccines, 'vaccinations')
  const docs = useRows<FamilyDoc>(T.docs, 'family_documents'), loans = useRows<Loan>(T.loans, 'loans'), pays = useRows<LoanPayment>(T.loanPays, 'loan_payments')
  const debts = useRows<Debt>(T.debts, 'debts'), goals = useRows<SavingsGoal>(T.goals, 'savings_goals'), contribs = useRows<GoalContribution>(T.contribs, 'goal_contributions')
  const [ask, confirmDialog] = useConfirm()
  const [inv, setInv] = useState({ email: '', role: 'editor' as 'editor' | 'viewer', relation: 'Vợ' })
  const [busy, setBusy] = useState(false)
  const [name, setName] = useState<string | null>(null)

  const m = thisMonth()
  const inMonth = tx.rows.filter(t => t.date.startsWith(m))
  const income = inMonth.filter(t => t.kind === 'income').reduce((s, t) => s + Number(t.amount), 0)
  const expense = inMonth.filter(t => t.kind === 'expense').reduce((s, t) => s + Number(t.amount), 0)
  const preg = pregs.rows.find(p => p.status === 'active')

  // ── Gom nhắc nhở từ mọi phân hệ ──
  const alerts: Alert[] = []
  bills.rows.filter(b => b.active).forEach(b => {
    const due = billDue(b, m); if (!due) return
    const paid = tx.rows.some(t => t.bill_id === b.id && t.date.startsWith(m)), d = daysUntil(due)
    if (!paid && d <= b.remind_days) alerts.push({ icon: '🔁', text: <><b>{b.name}</b> {vnd(b.amount)}</>, when: d < 0 ? `quá hạn ${-d} ngày` : d === 0 ? 'hôm nay' : `còn ${d} ngày`, href: '/family/finance', tone: d < 0 ? 'bad' : 'warn' })
  })
  budgets.rows.forEach(b => {
    const s = inMonth.filter(t => t.kind === 'expense' && t.category === b.category).reduce((a, t) => a + Number(t.amount), 0)
    if (Number(b.amount) && s >= Number(b.amount)) alerts.push({ icon: '⛔', text: <>Vượt ngân sách <b>{b.category}</b> ({vnd(s)} / {vnd(b.amount)})</>, when: monthLabel(m), href: '/family/finance', tone: 'bad' })
  })
  vacs.rows.filter(v => !v.done_date && daysUntil(v.due_date) <= 14).forEach(v => {
    const k = kids.rows.find(c => c.id === v.child_id), d = daysUntil(v.due_date)
    alerts.push({ icon: '💉', text: <>{k?.nickname || k?.name}: <b>{v.vaccine}</b> {v.dose && `(${v.dose})`}</>, when: d < 0 ? `quá ${-d} ngày` : d === 0 ? 'hôm nay' : `còn ${d} ngày`, href: '/family/children', tone: d < 0 ? 'bad' : 'warn' })
  })
  docs.rows.filter(x => x.expiry_date && daysUntil(x.expiry_date) <= 60).forEach(x => {
    const d = daysUntil(x.expiry_date!)
    alerts.push({ icon: '📄', text: <><b>{x.name}</b> {d < 0 ? 'đã hết hạn' : 'sắp hết hạn'}</>, when: fmtDate(x.expiry_date), href: '/family/savings', tone: d < 0 ? 'bad' : 'warn' })
  })
  loans.rows.filter(l => !l.closed).forEach(l => {
    const done = new Set(pays.rows.filter(p => p.loan_id === l.id).map(p => p.period))
    const next = loanSchedule(Number(l.principal), Number(l.annual_rate), l.term_months, l.start_date, l.method).find(r => !done.has(r.period))
    if (next && daysUntil(next.date) <= 7) alerts.push({ icon: '🏦', text: <>Trả <b>{l.name}</b> kỳ {next.period}: {vnd(next.payment)}</>, when: daysUntil(next.date) < 0 ? `quá hạn ${-daysUntil(next.date)} ngày` : `còn ${daysUntil(next.date)} ngày`, href: '/family/savings', tone: daysUntil(next.date) < 0 ? 'bad' : 'warn' })
  })
  debts.rows.filter(x => !x.settled && x.due_date && daysUntil(x.due_date) <= 7).forEach(x => alerts.push({ icon: '🤝', text: <>{x.direction === 'lent' ? `${x.person} hẹn trả mình` : `Mình hẹn trả ${x.person}`} <b>{vnd(x.amount)}</b></>, when: fmtDate(x.due_date), href: '/family/savings', tone: daysUntil(x.due_date!) < 0 ? 'bad' : 'info' }))
  alerts.sort((a, b) => (a.tone === 'bad' ? 0 : a.tone === 'warn' ? 1 : 2) - (b.tone === 'bad' ? 0 : b.tone === 'warn' ? 1 : 2))

  async function invite(e: FormEvent) {
    e.preventDefault(); setBusy(true)
    const r = await addHouseholdMember(household.id, inv.email.trim(), inv.role, inv.relation)
    setBusy(false)
    if (r.error) return error('Không mời được', r.error)
    success('Đã thêm thành viên 🎉', 'Người được mời cần có tài khoản Hỷ Sự với email này'); setInv(i => ({ ...i, email: '' })); reloadMembers()
  }
  const saved = goals.rows.reduce((s, g) => s + contribs.rows.filter(c => c.goal_id === g.id).reduce((a, c) => a + Number(c.amount), 0), 0)
  const MOD = [
    { href: '/family/finance', icon: '💰', title: 'Thu chi', line: `Tháng này: thu ${vnd(income)} · chi ${vnd(expense)}` },
    { href: '/family/pregnancy', icon: '🤰', title: 'Thai sản', line: preg ? `Tuần ${gestation(preg.due_date).weeks} · dự sinh ${fmtDate(preg.due_date)}` : 'Theo dõi thai kỳ, chi phí sinh, đồ sơ sinh' },
    { href: '/family/children', icon: '🧒', title: 'Con cái', line: kids.rows.length ? kids.rows.map(k => `${k.nickname || k.name} ${ageText(k.dob)}`).join(' · ') : 'Tiêm chủng, tăng trưởng, chi phí nuôi con' },
    { href: '/family/savings', icon: '🐷', title: 'Tiết kiệm & tài sản', line: goals.rows.length ? `${goals.rows.length} mục tiêu · đã để dành ${vnd(saved)}` : 'Mục tiêu, khoản vay, hiếu hỉ, giấy tờ' },
  ]

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat icon="💰" label={`Thu ${monthLabel(m).toLowerCase()}`} value={vnd(income)} tone="good"/>
        <Stat icon="💸" label="Chi" value={vnd(expense)} tone="brand"/>
        <Stat icon="📈" label="Còn lại" value={vnd(income - expense)} tone={income - expense >= 0 ? 'good' : 'bad'} sub={income ? `Tiết kiệm ${Math.round(((income - expense) / income) * 100)}%` : undefined}/>
        <Stat icon="🔔" label="Việc cần chú ý" value={alerts.length} tone={alerts.some(a => a.tone === 'bad') ? 'bad' : alerts.length ? 'warn' : 'ink'} sub={alerts.length ? 'Xem danh sách bên dưới' : 'Mọi thứ đều ổn 🎉'}/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] gap-4 items-start">
        <div className="space-y-4">
          <Panel title="Cần chú ý" sub="Khoản đến hạn, mũi tiêm, giấy tờ, nợ, ngân sách" pad={false}>
            {alerts.length === 0 ? <p className="text-sm text-ink-500 text-center py-8">🎉 Không có việc gì cần xử lý gấp</p> : (
              <ul className="divide-y divide-ink-50">
                {alerts.slice(0, 12).map((a, i) => (
                  <li key={i}><Link href={a.href} className="px-5 py-2.5 flex items-center gap-3 hover:bg-ink-50/50">
                    <span className="text-lg">{a.icon}</span><span className="flex-1 text-sm text-ink-800 min-w-0 sm:truncate">{a.text}</span>
                    <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0', { bad: 'bg-red-50 text-red-700 border-red-200', warn: 'bg-gold-50 text-gold-700 border-gold-200', info: 'bg-blue-50 text-blue-700 border-blue-200' }[a.tone])}>{a.tone === 'bad' ? '⛔ ' : a.tone === 'warn' ? '⚠️ ' : ''}{a.when}</span>
                  </Link></li>
                ))}
              </ul>
            )}
          </Panel>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {MOD.map(x => (
              <Link key={x.href} href={x.href} className="card-hover p-4 flex gap-3">
                <span className="w-11 h-11 rounded-2xl bg-sakura-50 flex items-center justify-center text-2xl flex-shrink-0">{x.icon}</span>
                <span className="min-w-0"><span className="block font-semibold text-ink-900">{x.title}</span><span className="block text-xs text-ink-500 line-clamp-2">{x.line}</span></span>
              </Link>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <Panel title="Thành viên gia đình" sub="Cùng ghi chép, cùng theo dõi" pad={false}>
            <ul className="divide-y divide-ink-50">
              {members.map(mb => (
                <li key={mb.user_id} className="px-5 py-3 flex items-center gap-3">
                  <span className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0 overflow-hidden" style={{ background: 'linear-gradient(135deg,#ff6b96,#f59e0b)' }}>
                    {mb.avatar_url ? <img src={mb.avatar_url} alt="" className="w-full h-full object-cover"/> : (mb.full_name || mb.email || '?')[0]?.toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink-900 truncate">{mb.full_name || mb.email} {mb.user_id === userId && <span className="text-xs font-normal text-ink-400">(bạn)</span>}</p>
                    <p className="text-[11px] text-ink-400 truncate">{mb.relation ?? '—'} · {mb.role === 'owner' ? 'Chủ gia đình' : mb.role === 'editor' ? 'Biên tập' : 'Chỉ xem'}</p>
                  </div>
                  {isOwner && mb.role !== 'owner' && (
                    <>
                      <select className="input !py-1 !w-auto text-xs" value={mb.role} onChange={async e => { const r = await updateHouseholdMember(household.id, mb.user_id, { role: e.target.value as 'editor' | 'viewer' }); if (r.error) error('Lỗi', r.error); else { success('Đã đổi quyền'); reloadMembers() } }}>
                        <option value="editor">Biên tập</option><option value="viewer">Chỉ xem</option>
                      </select>
                      <button onClick={() => ask('Xóa thành viên?', `${mb.full_name || mb.email} sẽ không còn xem được dữ liệu gia đình.`, async () => { const r = await removeHouseholdMember(household.id, mb.user_id); if (r.error) error('Lỗi', r.error); else reloadMembers() })} className="btn btn-ghost btn-xs btn-icon hover:text-red-500" title="Xóa">✕</button>
                    </>
                  )}
                  {!isOwner && mb.user_id === userId && <button onClick={() => ask('Rời gia đình?', 'Bạn sẽ không còn xem được dữ liệu gia đình này.', async () => { await removeHouseholdMember(household.id, mb.user_id); await reload() })} className="btn btn-ghost btn-xs">Rời</button>}
                </li>
              ))}
            </ul>
            {isOwner && (
              <form onSubmit={invite} className="px-5 py-4 border-t border-ink-100 space-y-2 bg-ink-50/40">
                <p className="text-xs font-semibold text-ink-600">Mời vợ/chồng, bố mẹ… (cần có tài khoản Hỷ Sự)</p>
                <input className="input !py-2 text-sm" type="email" required placeholder="email@example.com" value={inv.email} onChange={e => setInv(i => ({ ...i, email: e.target.value }))}/>
                <div className="flex gap-2">
                  <select className="input !py-2 text-sm" value={inv.relation} onChange={e => setInv(i => ({ ...i, relation: e.target.value }))}>{RELATIONS.map(r => <option key={r}>{r}</option>)}</select>
                  <select className="input !py-2 text-sm" value={inv.role} onChange={e => setInv(i => ({ ...i, role: e.target.value as any }))}><option value="editor">Biên tập</option><option value="viewer">Chỉ xem</option></select>
                  <button disabled={busy} className="btn btn-primary btn-sm flex-shrink-0">{busy ? '…' : 'Mời'}</button>
                </div>
              </form>
            )}
          </Panel>

          <Panel title="Cài đặt gia đình">
            <div className="space-y-3">
              {isOwner && (name === null
                ? <p className="text-sm flex items-center justify-between gap-2"><span className="text-ink-700">{household.name}</span><button onClick={() => setName(household.name)} className="btn btn-ghost btn-xs">✎ Đổi tên</button></p>
                : <form className="flex gap-2" onSubmit={async e => { e.preventDefault(); const r = await updateHousehold(household.id, { name: name.trim() }); if (r.error) error('Lỗi', r.error); else { setName(null); reload() } }}>
                    <input className="input !py-2 text-sm" value={name} onChange={e => setName(e.target.value)} autoFocus/><button className="btn btn-primary btn-sm">Lưu</button></form>)}
              <button onClick={async () => { const r = await createHousehold(`Gia đình ${households.length + 1}`); if (r.error) error('Lỗi', r.error); else { await reload(); select(r.data!.id); success('Đã tạo gia đình mới') } }} className="btn btn-secondary btn-sm w-full">+ Tạo thêm một gia đình khác</button>
              {isOwner && <button onClick={() => ask('Xóa gia đình?', `Toàn bộ dữ liệu của “${household.name}” (thu chi, thai sản, con cái, tài sản…) sẽ bị xóa vĩnh viễn.`, async () => { const r = await deleteHousehold(household.id); if (r.error) error('Lỗi', r.error); else { success('Đã xóa gia đình'); await reload() } })} className="btn btn-danger btn-sm w-full">🗑 Xóa gia đình này</button>}
              {!canEdit && <p className="text-xs text-ink-400">Bạn đang có quyền chỉ xem.</p>}
            </div>
          </Panel>
        </div>
      </div>
      {confirmDialog}
    </div>
  )
}
