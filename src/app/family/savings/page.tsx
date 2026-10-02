'use client'
import { useState } from 'react'
import { useHousehold } from '@/components/family/HouseholdProvider'
import { useRows, useCrud, useConfirm, FormModal, Stat, Panel, Empty, Tabs, RowActions, today, daysUntil, type FieldDef } from '@/components/family/ui'
import { T } from '@/lib/api/family'
import { GOAL_IDEAS, ASSET_TYPES, DOC_TYPES, GIFT_EVENTS, loanSchedule } from '@/lib/family/data'
import { vnd, cn, fmtDate, downloadCsv } from '@/lib/utils'
import type { SavingsGoal, GoalContribution, Loan, LoanPayment, Debt, Gift, Asset, FamilyDoc } from '@/types'

type Tab = 'goals' | 'loans' | 'debts' | 'gifts' | 'assets' | 'docs'
type Kind = 'goal' | 'contrib' | 'loan' | 'pay' | 'debt' | 'gift' | 'asset' | 'doc'
const monthsBetween = (a: Date, b: string) => { const d = new Date(b + 'T12:00:00'); return Math.max(0, (d.getFullYear() - a.getFullYear()) * 12 + d.getMonth() - a.getMonth()) }

export default function SavingsPage() {
  const { household, canEdit, userId } = useHousehold()
  const goals = useRows<SavingsGoal>(T.goals, 'savings_goals'), contribs = useRows<GoalContribution>(T.contribs, 'goal_contributions')
  const loans = useRows<Loan>(T.loans, 'loans'), pays = useRows<LoanPayment>(T.loanPays, 'loan_payments')
  const debts = useRows<Debt>(T.debts, 'debts'), gifts = useRows<Gift>(T.gifts, 'gift_book')
  const assets = useRows<Asset>(T.assets, 'assets'), docs = useRows<FamilyDoc>(T.docs, 'family_documents')
  const C = {
    goal: useCrud(T.goals, goals.reload, 'mục tiêu'), contrib: useCrud(T.contribs, contribs.reload, 'khoản góp'),
    loan: useCrud(T.loans, loans.reload, 'khoản vay'), pay: useCrud(T.loanPays, pays.reload, 'kỳ trả nợ'),
    debt: useCrud(T.debts, debts.reload, 'khoản nợ'), gift: useCrud(T.gifts, gifts.reload, 'mục hiếu hỉ'),
    asset: useCrud(T.assets, assets.reload, 'tài sản'), doc: useCrud(T.docs, docs.reload, 'giấy tờ'),
  }
  const [tab, setTab] = useState<Tab>('goals')
  const [form, setForm] = useState<null | { kind: Kind; row?: any; preset?: any }>(null)
  const [openLoan, setOpenLoan] = useState<string | null>(null)
  const [giftQ, setGiftQ] = useState('')
  const [ask, confirmDialog] = useConfirm()

  const saved = (g: SavingsGoal) => contribs.rows.filter(c => c.goal_id === g.id).reduce((s, c) => s + Number(c.amount), 0)
  const loanPaid = (l: Loan) => pays.rows.filter(p => p.loan_id === l.id)
  const loanBalance = (l: Loan) => Number(l.principal) - loanPaid(l).reduce((s, p) => s + Number(p.principal), 0)
  const totalAssets = assets.rows.reduce((s, a) => s + Number(a.value), 0)
  const totalSaved = goals.rows.reduce((s, g) => s + saved(g), 0)
  const loanDebt = loans.rows.filter(l => !l.closed).reduce((s, l) => s + Math.max(0, loanBalance(l)), 0)
  const owe = debts.rows.filter(d => !d.settled && d.direction === 'borrowed').reduce((s, d) => s + Number(d.amount), 0)
  const lent = debts.rows.filter(d => !d.settled && d.direction === 'lent').reduce((s, d) => s + Number(d.amount), 0)
  const expiring = docs.rows.filter(d => d.expiry_date && daysUntil(d.expiry_date) <= 60)

  const F: Record<Kind, FieldDef[]> = {
    goal: [
      { key: 'icon', label: 'Biểu tượng', type: 'chips', options: ['🏠', '🚗', '🆘', '🎓', '✈️', '👶', '💍', '🏥', '💻', '🎯'] },
      { key: 'name', label: 'Tên mục tiêu', required: true, placeholder: 'VD: Mua nhà, Quỹ học vấn cho con' },
      { key: 'target', label: 'Số tiền cần', type: 'money', required: true, half: true },
      { key: 'deadline', label: 'Hạn hoàn thành', type: 'date', half: true },
      { key: 'done', label: 'Đã hoàn thành', type: 'checkbox', show: () => !!form?.row },
    ],
    contrib: [
      { key: 'direction', label: 'Loại', type: 'chips', required: true, options: [{ value: 'in', label: '➕ Góp thêm' }, { value: 'out', label: '➖ Rút ra' }] },
      { key: 'amount', label: 'Số tiền', type: 'money', required: true, half: true, min: 1 },
      { key: 'date', label: 'Ngày', type: 'date', required: true, half: true },
      { key: 'note', label: 'Ghi chú' },
    ],
    loan: [
      { key: 'name', label: 'Tên khoản vay', required: true, placeholder: 'VD: Vay mua nhà, Trả góp xe máy' },
      { key: 'lender', label: 'Vay của (ngân hàng / người)', half: true },
      { key: 'principal', label: 'Số tiền vay', type: 'money', required: true, half: true },
      { key: 'annual_rate', label: 'Lãi suất (%/năm)', type: 'number', step: '0.01', required: true, half: true },
      { key: 'term_months', label: 'Thời hạn (tháng)', type: 'number', required: true, half: true, min: 1 },
      { key: 'start_date', label: 'Ngày giải ngân', type: 'date', required: true, half: true },
      { key: 'method', label: 'Cách tính', type: 'select', required: true, half: true, options: [{ value: 'declining', label: 'Dư nợ giảm dần (gốc đều)' }, { value: 'annuity', label: 'Trả đều hằng tháng (gốc + lãi)' }] },
      { key: 'closed', label: 'Đã tất toán', type: 'checkbox', show: () => !!form?.row },
      { key: 'note', label: 'Ghi chú', type: 'textarea' },
    ],
    pay: [
      { key: 'period', label: 'Kỳ thứ', type: 'number', half: true },
      { key: 'date', label: 'Ngày trả', type: 'date', required: true, half: true },
      { key: 'principal', label: 'Tiền gốc', type: 'money', half: true },
      { key: 'interest', label: 'Tiền lãi', type: 'money', half: true },
      { key: 'add_txn', label: 'Ghi vào Thu chi (danh mục Trả nợ & trả góp)', type: 'checkbox', show: () => !form?.row?.id },
      { key: 'note', label: 'Ghi chú' },
    ],
    debt: [
      { key: 'direction', label: 'Loại', type: 'chips', required: true, options: [{ value: 'lent', label: '📤 Mình cho vay' }, { value: 'borrowed', label: '📥 Mình đi mượn' }] },
      { key: 'person', label: 'Người', required: true, half: true },
      { key: 'amount', label: 'Số tiền', type: 'money', required: true, half: true },
      { key: 'date', label: 'Ngày', type: 'date', required: true, half: true },
      { key: 'due_date', label: 'Hẹn trả', type: 'date', half: true },
      { key: 'settled', label: 'Đã trả xong', type: 'checkbox' },
      { key: 'note', label: 'Ghi chú' },
    ],
    gift: [
      { key: 'direction', label: 'Loại', type: 'chips', required: true, options: [{ value: 'received', label: '📥 Mình nhận' }, { value: 'given', label: '📤 Mình đi' }] },
      { key: 'person', label: 'Người / gia đình', required: true, half: true },
      { key: 'relation', label: 'Quan hệ', half: true, placeholder: 'Bạn ĐH, đồng nghiệp, họ hàng…' },
      { key: 'event', label: 'Sự kiện', type: 'select', required: true, half: true, options: GIFT_EVENTS },
      { key: 'date', label: 'Ngày', type: 'date', required: true, half: true },
      { key: 'amount', label: 'Số tiền', type: 'money', half: true },
      { key: 'gift', label: 'Hiện vật (nếu có)', half: true, placeholder: 'Vàng 1 chỉ, quà…' },
      { key: 'note', label: 'Ghi chú' },
    ],
    asset: [
      { key: 'name', label: 'Tên tài sản', required: true, placeholder: 'VD: Căn hộ Quận 7, Xe Honda SH' },
      { key: 'type', label: 'Loại', type: 'select', required: true, half: true, options: ASSET_TYPES },
      { key: 'value', label: 'Giá trị ước tính hiện tại', type: 'money', half: true },
      { key: 'acquired_date', label: 'Ngày sở hữu', type: 'date', half: true },
      { key: 'note', label: 'Ghi chú', half: true },
    ],
    doc: [
      { key: 'name', label: 'Tên giấy tờ', required: true, placeholder: 'VD: CCCD của vợ, Bảo hiểm xe' },
      { key: 'type', label: 'Loại', type: 'select', required: true, half: true, options: DOC_TYPES },
      { key: 'holder', label: 'Của ai', half: true },
      { key: 'number', label: 'Số hiệu', half: true },
      { key: 'issued_date', label: 'Ngày cấp', type: 'date', half: true },
      { key: 'expiry_date', label: 'Ngày hết hạn', type: 'date', half: true, hint: 'Sẽ được nhắc trước 60 ngày' },
      { key: 'note', label: 'Nơi cất giữ / ghi chú', half: true },
    ],
  }
  const TITLE: Record<Kind, string> = { goal: 'mục tiêu tiết kiệm', contrib: 'góp / rút tiền', loan: 'khoản vay', pay: 'kỳ trả nợ', debt: 'khoản cho vay / mượn', gift: 'sổ hiếu hỉ', asset: 'tài sản', doc: 'giấy tờ' }
  const DEFAULT: Partial<Record<Kind, any>> = {
    goal: { icon: '🎯' }, contrib: { direction: 'in', date: today() }, loan: { method: 'declining', start_date: today(), annual_rate: 8, term_months: 12 },
    debt: { direction: 'lent', date: today() }, gift: { direction: 'received', event: 'Đám cưới', date: today() }, asset: { type: 'Bất động sản' }, doc: { type: 'CCCD' }, pay: { date: today(), add_txn: true },
  }

  async function save(v: Record<string, any>) {
    const { kind, row, preset } = form!
    const id = row?.id
    if (kind === 'contrib') {
      const amount = (v.direction === 'out' ? -1 : 1) * Number(v.amount)
      const data = { goal_id: preset.goal_id, amount, date: v.date, note: v.note }
      return id ? C.contrib.update(id, data) : C.contrib.create(data)
    }
    if (kind === 'pay') {
      const { add_txn, ...data } = v
      const ok = id ? await C.pay.update(id, data) : await C.pay.create({ ...data, loan_id: preset.loan_id, principal: data.principal ?? 0, interest: data.interest ?? 0 })
      const total = Number(data.principal ?? 0) + Number(data.interest ?? 0)
      if (ok && add_txn && total > 0) {
        const l = loans.rows.find(x => x.id === preset.loan_id)
        await T.txns.create(household.id, { kind: 'expense', amount: total, category: 'Trả nợ & trả góp', date: data.date, note: `${l?.name ?? 'Trả nợ'}${data.period ? ` — kỳ ${data.period}` : ''}`, member_id: userId, created_by: userId })
      }
      return ok
    }
    if (kind === 'debt' && v.settled && !row?.settled) v.settled_date = today()
    const c = C[kind] as any
    return id ? c.update(id, v) : c.create(v)
  }
  const open = (kind: Kind, row?: any, preset?: any) => setForm({ kind, row, preset })

  const tabs: [Tab, string, number?][] = [['goals', '🎯 Mục tiêu', goals.rows.length], ['loans', '🏦 Khoản vay', loans.rows.filter(l => !l.closed).length], ['debts', '🤝 Cho vay / mượn', debts.rows.filter(d => !d.settled).length], ['gifts', '🧧 Sổ hiếu hỉ', gifts.rows.length], ['assets', '🏠 Tài sản', assets.rows.length], ['docs', '📄 Giấy tờ', expiring.length || undefined]]
  const err = goals.error || loans.error

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-4">
      {err && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">⚠️ {err}</div>}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 stagger">
        <Stat icon="🏠" label="Tài sản" value={vnd(totalAssets + totalSaved)} sub={`Tài sản ${vnd(totalAssets)} · quỹ ${vnd(totalSaved)}`}/>
        <Stat icon="🏦" label="Dư nợ vay" value={vnd(loanDebt + owe)} tone={loanDebt + owe ? 'bad' : 'ink'} sub={`Ngân hàng ${vnd(loanDebt)} · mượn người ${vnd(owe)}`}/>
        <Stat icon="📈" label="Giá trị ròng" value={vnd(totalAssets + totalSaved + lent - loanDebt - owe)} tone="good" sub="Tài sản + quỹ + cho vay − nợ"/>
        <Stat icon="📄" label="Giấy tờ sắp hết hạn" value={expiring.length} tone={expiring.length ? 'warn' : 'ink'} sub={expiring[0] ? `${expiring[0].name}: ${fmtDate(expiring[0].expiry_date)}` : 'Trong 60 ngày tới'}/>
      </div>
      <Tabs value={tab} onChange={setTab} items={tabs}/>

      {tab === 'goals' && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {canEdit && GOAL_IDEAS.filter(([, n]) => !goals.rows.some(g => g.name === n)).map(([i, n]) => <button key={n} onClick={() => open('goal', undefined, { icon: i, name: n })} className="tag border bg-white text-ink-600 border-ink-200 hover:border-sakura-400 normal-case tracking-normal text-xs">+ {i} {n}</button>)}
            {canEdit && <button onClick={() => open('goal')} className="btn btn-primary btn-sm ml-auto">+ Mục tiêu</button>}
          </div>
          {goals.rows.length === 0 ? <div className="card"><Empty icon="🎯" title="Chưa có mục tiêu tiết kiệm" text="Đặt mục tiêu (mua nhà, quỹ khẩn cấp, học phí cho con…) — hệ thống tính mỗi tháng cần để dành bao nhiêu."/></div> : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {goals.rows.map(g => {
                const s = saved(g), t = Number(g.target), p = t ? Math.min(100, (s / t) * 100) : 0
                const m = g.deadline ? monthsBetween(new Date(), g.deadline) : null
                const perMonth = m && s < t ? Math.ceil((t - s) / Math.max(1, m)) : 0
                const hist = contribs.rows.filter(c => c.goal_id === g.id)
                return (
                  <div key={g.id} className={cn('card p-4 group', g.done && 'opacity-70')}>
                    <div className="flex items-start gap-3">
                      <span className="w-11 h-11 rounded-2xl bg-gold-50 flex items-center justify-center text-2xl flex-shrink-0">{g.icon || '🎯'}</span>
                      <div className="min-w-0 flex-1"><p className="font-semibold text-ink-900 truncate">{g.name}{g.done && ' ✓'}</p><p className="text-xs text-ink-400">{g.deadline ? `Hạn ${fmtDate(g.deadline)}${m !== null ? ` · còn ${m} tháng` : ''}` : 'Không đặt hạn'}</p></div>
                      {canEdit && <RowActions onEdit={() => open('goal', g)} onDelete={() => ask('Xóa mục tiêu?', `${g.name} cùng lịch sử góp tiền`, () => C.goal.remove(g.id))}/>}
                    </div>
                    <div className="mt-3 flex items-end justify-between"><p className="tracking-tight text-xl font-bold text-ink-900 tabular">{vnd(s)}</p><p className="text-xs text-ink-400 tabular">/ {vnd(t)}</p></div>
                    <div className="h-2 rounded-full bg-ink-100 mt-1.5 overflow-hidden"><div className="h-full rounded-full bg-jade-500 transition-all" style={{ width: `${p}%` }}/></div>
                    <p className="text-xs mt-1 text-ink-500">{s >= t ? '🎉 Đã đạt mục tiêu!' : `${Math.round(p)}% · còn ${vnd(t - s)}`}{perMonth ? ` · cần góp ~${vnd(perMonth)}/tháng` : ''}</p>
                    {hist.length > 0 && <p className="text-xs text-ink-400 mt-1">Lần gần nhất: {fmtDate(hist[0].date)} {Number(hist[0].amount) > 0 ? '+' : ''}{vnd(hist[0].amount)}</p>}
                    {canEdit && !g.done && <button onClick={() => open('contrib', undefined, { goal_id: g.id })} className="btn btn-secondary btn-xs w-full mt-3">+ Góp / rút tiền</button>}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'loans' && (
        <div className="space-y-3">
          <div className="flex justify-end">{canEdit && <button onClick={() => open('loan')} className="btn btn-primary btn-sm">+ Khoản vay / trả góp</button>}</div>
          {loans.rows.length === 0 ? <div className="card"><Empty icon="🏦" title="Chưa có khoản vay" text="Thêm khoản vay ngân hàng, trả góp xe, điện thoại… để xem lịch trả gốc + lãi từng tháng và dư nợ còn lại."/></div>
            : loans.rows.map(l => {
              const sched = loanSchedule(Number(l.principal), Number(l.annual_rate), l.term_months, l.start_date, l.method)
              const paidRows = loanPaid(l), bal = loanBalance(l), paidPeriods = new Set(paidRows.map(p => p.period))
              const next = sched.find(r => !paidPeriods.has(r.period))
              const totalInterest = sched.reduce((s, r) => s + r.interest, 0)
              return (
                <Panel key={l.id} title={<>{l.name}{l.closed && <span className="ml-2 text-[11px] text-jade-700 bg-jade-50 border border-jade-200 rounded-full px-1.5">Đã tất toán</span>}</>}
                  sub={`${l.lender ?? ''} · ${vnd(l.principal)} · ${l.annual_rate}%/năm · ${l.term_months} tháng · ${l.method === 'declining' ? 'dư nợ giảm dần' : 'trả đều'}`}
                  right={canEdit && <RowActions onEdit={() => open('loan', l)} onDelete={() => ask('Xóa khoản vay?', l.name, () => C.loan.remove(l.id))}/>}>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                    <div><p className="text-xs text-ink-400">Dư nợ gốc</p><p className="font-bold text-red-600 tabular">{vnd(Math.max(0, bal))}</p></div>
                    <div><p className="text-xs text-ink-400">Đã trả</p><p className="font-bold text-ink-900 tabular">{paidRows.length}/{l.term_months} kỳ</p></div>
                    <div><p className="text-xs text-ink-400">Kỳ tới</p><p className="font-bold text-ink-900 tabular">{next ? `${vnd(next.payment)}` : '—'}</p>{next && <p className={cn('text-xs', daysUntil(next.date) < 0 ? 'text-red-600 font-semibold' : 'text-ink-400')}>{fmtDate(next.date)}{daysUntil(next.date) < 0 && ' (quá hạn)'}</p>}</div>
                    <div><p className="text-xs text-ink-400">Tổng lãi dự kiến</p><p className="font-bold text-ink-900 tabular">{vnd(totalInterest)}</p></div>
                  </div>
                  <div className="h-2 rounded-full bg-ink-100 mt-3 overflow-hidden"><div className="h-full rounded-full bg-jade-500" style={{ width: `${Math.min(100, ((Number(l.principal) - bal) / Number(l.principal)) * 100)}%` }}/></div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {canEdit && next && !l.closed && <button onClick={() => open('pay', undefined, { loan_id: l.id, period: next.period, principal: next.principal, interest: next.interest })} className="btn btn-gold btn-xs">💸 Ghi trả kỳ {next.period}</button>}
                    <button onClick={() => setOpenLoan(openLoan === l.id ? null : l.id)} className="btn btn-secondary btn-xs">{openLoan === l.id ? 'Ẩn lịch trả nợ' : '📅 Xem lịch trả nợ'}</button>
                    <button onClick={() => downloadCsv(`lich-tra-no-${l.name}.csv`, [['Kỳ', 'Ngày', 'Gốc', 'Lãi', 'Tổng trả', 'Dư nợ', 'Đã trả'], ...sched.map(r => [r.period, fmtDate(r.date), r.principal, r.interest, r.payment, r.balance, paidPeriods.has(r.period) ? 'x' : ''])])} className="btn btn-secondary btn-xs">⬇ Excel</button>
                  </div>
                  {openLoan === l.id && (
                    <div className="overflow-x-auto mt-3 max-h-80 overflow-y-auto border border-ink-100 rounded-xl">
                      <table className="w-full text-xs min-w-[520px]">
                        <thead className="sticky top-0 bg-ink-50"><tr className="text-left text-ink-500">{['Kỳ', 'Ngày', 'Gốc', 'Lãi', 'Tổng', 'Dư nợ', ''].map(h => <th key={h} className="px-3 py-1.5 font-semibold">{h}</th>)}</tr></thead>
                        <tbody className="divide-y divide-ink-50">
                          {sched.map(r => { const paid = paidRows.find(p => p.period === r.period); return (
                            <tr key={r.period} className={paid ? 'bg-jade-50/50 text-ink-400' : ''}>
                              <td className="px-3 py-1.5">{r.period}</td><td className="px-3 py-1.5">{fmtDate(r.date)}</td><td className="px-3 py-1.5 tabular">{vnd(r.principal)}</td>
                              <td className="px-3 py-1.5 tabular">{vnd(r.interest)}</td><td className="px-3 py-1.5 tabular font-semibold">{vnd(r.payment)}</td><td className="px-3 py-1.5 tabular">{vnd(r.balance)}</td>
                              <td className="px-3 py-1.5">{paid ? <span className="text-jade-600 font-semibold">✓ {fmtDate(paid.date)}</span> : canEdit && !l.closed && <button onClick={() => open('pay', undefined, { loan_id: l.id, period: r.period, principal: r.principal, interest: r.interest })} className="text-sakura-600 font-semibold hover:underline">Ghi trả</button>}</td>
                            </tr>
                          ) })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Panel>
              )
            })}
        </div>
      )}

      {tab === 'debts' && (
        <Panel title="Cho vay & mượn tiền" sub={`Người khác nợ mình ${vnd(lent)} · mình nợ người khác ${vnd(owe)}`} pad={false} right={canEdit && <button onClick={() => open('debt')} className="btn btn-primary btn-xs">+ Ghi khoản</button>}>
          {debts.rows.length === 0 ? <Empty icon="🤝" title="Chưa có khoản cho vay / mượn" text="Ghi lại để không quên ai đang nợ mình, mình đang nợ ai và hẹn trả khi nào."/> : (
            <div className="divide-y divide-ink-50">
              {[...debts.rows].sort((a, b) => Number(a.settled) - Number(b.settled)).map(d => (
                <div key={d.id} className={cn('px-5 py-3 flex items-center gap-3 group', d.settled && 'opacity-50')}>
                  <span className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', d.direction === 'lent' ? 'bg-jade-50' : 'bg-red-50')}>{d.direction === 'lent' ? '📤' : '📥'}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink-900">{d.direction === 'lent' ? `${d.person} nợ mình` : `Mình nợ ${d.person}`}</p>
                    <p className="text-xs text-ink-400">{fmtDate(d.date)}{d.due_date && !d.settled && <span className={daysUntil(d.due_date) < 0 ? 'text-red-600 font-semibold' : ''}> · hẹn trả {fmtDate(d.due_date)}{daysUntil(d.due_date) < 0 && ' (quá hạn)'}</span>}{d.settled && d.settled_date && ` · đã trả ${fmtDate(d.settled_date)}`}{d.note && ` · ${d.note}`}</p>
                  </div>
                  <b className={cn('tabular text-sm', d.direction === 'lent' ? 'text-jade-700' : 'text-red-600')}>{vnd(d.amount)}</b>
                  {canEdit && !d.settled && <button onClick={() => C.debt.update(d.id, { settled: true, settled_date: today() })} className="btn btn-secondary btn-xs">✓ Đã trả</button>}
                  {canEdit && <RowActions onEdit={() => open('debt', d)} onDelete={() => ask('Xóa khoản?', d.person, () => C.debt.remove(d.id))}/>}
                </div>
              ))}
            </div>
          )}
        </Panel>
      )}

      {tab === 'gifts' && (() => {
        const list = gifts.rows.filter(g => !giftQ || `${g.person} ${g.relation ?? ''} ${g.event}`.toLowerCase().includes(giftQ.toLowerCase()))
        const rec = gifts.rows.filter(g => g.direction === 'received').reduce((s, g) => s + Number(g.amount), 0), giv = gifts.rows.filter(g => g.direction === 'given').reduce((s, g) => s + Number(g.amount), 0)
        return (
          <Panel title="Sổ hiếu hỉ" sub={`Đã nhận ${vnd(rec)} · đã đi ${vnd(giv)} — tra cứu để đáp lễ cho đúng`} pad={false}
            right={<>{gifts.rows.length > 0 && <button onClick={() => downloadCsv('so-hieu-hi.csv', [['Ngày', 'Loại', 'Người', 'Quan hệ', 'Sự kiện', 'Số tiền', 'Hiện vật', 'Ghi chú'], ...gifts.rows.map(g => [fmtDate(g.date), g.direction === 'received' ? 'Nhận' : 'Đi', g.person, g.relation, g.event, g.amount, g.gift, g.note])])} className="btn btn-secondary btn-xs">⬇ Excel</button>}
              {canEdit && <button onClick={() => open('gift')} className="btn btn-primary btn-xs">+ Ghi</button>}</>}>
            <div className="px-4 py-3 border-b border-ink-100"><input className="input !py-1.5 text-sm" placeholder="🔍 Tìm tên người, sự kiện… (VD: trước khi đi đám cưới, tra xem họ từng mừng mình bao nhiêu)" value={giftQ} onChange={e => setGiftQ(e.target.value)}/></div>
            {list.length === 0 ? <Empty icon="🧧" title={gifts.rows.length ? 'Không tìm thấy' : 'Sổ hiếu hỉ trống'} text="Ghi tiền mừng cưới, đầy tháng, tân gia… đã nhận và đã đi."/> : (
              <div className="divide-y divide-ink-50">
                {list.map(g => (
                  <div key={g.id} className="px-5 py-2.5 flex items-center gap-3 group">
                    <span className={cn('text-[11px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0', g.direction === 'received' ? 'bg-jade-50 text-jade-700 border-jade-200' : 'bg-gold-50 text-gold-700 border-gold-200')}>{g.direction === 'received' ? 'NHẬN' : 'ĐI'}</span>
                    <div className="min-w-0 flex-1"><p className="text-sm font-medium text-ink-900 truncate">{g.person}{g.relation && <span className="text-ink-400 font-normal"> · {g.relation}</span>}</p><p className="text-xs text-ink-400">{g.event} · {fmtDate(g.date)}{g.gift && ` · 🎁 ${g.gift}`}</p></div>
                    <b className="tabular text-sm text-ink-900">{Number(g.amount) ? vnd(g.amount) : ''}</b>
                    {canEdit && <RowActions onEdit={() => open('gift', g)} onDelete={() => ask('Xóa?', g.person, () => C.gift.remove(g.id))}/>}
                  </div>
                ))}
              </div>
            )}
          </Panel>
        )
      })()}

      {tab === 'assets' && (
        <Panel title="Tài sản gia đình" sub={`Tổng giá trị ước tính ${vnd(totalAssets)}`} pad={false} right={canEdit && <button onClick={() => open('asset')} className="btn btn-primary btn-xs">+ Tài sản</button>}>
          {assets.rows.length === 0 ? <Empty icon="🏠" title="Chưa có tài sản nào" text="Ghi nhà, xe, vàng, sổ tiết kiệm, chứng khoán… để biết tổng tài sản và giá trị ròng của gia đình."/> : (
            <div className="divide-y divide-ink-50">
              {assets.rows.map(a => (
                <div key={a.id} className="px-5 py-3 flex items-center gap-3 group">
                  <div className="min-w-0 flex-1"><p className="text-sm font-medium text-ink-900">{a.name}</p><p className="text-xs text-ink-400">{a.type}{a.acquired_date && ` · từ ${fmtDate(a.acquired_date)}`}{a.note && ` · ${a.note}`}</p></div>
                  <span className="text-xs text-ink-400 tabular">{totalAssets ? `${Math.round((Number(a.value) / totalAssets) * 100)}%` : ''}</span>
                  <b className="tabular text-sm text-ink-900">{vnd(a.value)}</b>
                  {canEdit && <RowActions onEdit={() => open('asset', a)} onDelete={() => ask('Xóa tài sản?', a.name, () => C.asset.remove(a.id))}/>}
                </div>
              ))}
            </div>
          )}
        </Panel>
      )}

      {tab === 'docs' && (
        <Panel title="Giấy tờ quan trọng" sub="CCCD, hộ chiếu, khai sinh, sổ đỏ, bảo hiểm… — nhắc trước 60 ngày khi sắp hết hạn" pad={false} right={canEdit && <button onClick={() => open('doc')} className="btn btn-primary btn-xs">+ Giấy tờ</button>}>
          {docs.rows.length === 0 ? <Empty icon="📄" title="Chưa có giấy tờ" text="Lưu số hiệu, ngày hết hạn và nơi cất giữ để khỏi mất công tìm khi cần."/> : (
            <div className="divide-y divide-ink-50">
              {docs.rows.map(d => {
                const left = d.expiry_date ? daysUntil(d.expiry_date) : null
                const st = left === null ? null : left < 0 ? ['⛔ Đã hết hạn', 'bg-red-50 text-red-700 border-red-200'] : left <= 60 ? [`⚠️ Còn ${left} ngày`, 'bg-gold-50 text-gold-700 border-gold-200'] : [`HH ${fmtDate(d.expiry_date)}`, 'bg-ink-50 text-ink-500 border-ink-200']
                return (
                  <div key={d.id} className="px-5 py-3 flex items-center gap-3 group">
                    <div className="min-w-0 flex-1"><p className="text-sm font-medium text-ink-900">{d.name}</p><p className="text-xs text-ink-400">{d.type}{d.holder && ` · ${d.holder}`}{d.number && ` · số ${d.number}`}{d.note && ` · ${d.note}`}</p></div>
                    {st && <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0', st[1])}>{st[0]}</span>}
                    {canEdit && <RowActions onEdit={() => open('doc', d)} onDelete={() => ask('Xóa giấy tờ?', d.name, () => C.doc.remove(d.id))}/>}
                  </div>
                )
              })}
            </div>
          )}
        </Panel>
      )}

      {form && <FormModal open key={form.kind + (form.row?.id ?? 'new')} title={`${form.row ? 'Sửa' : 'Thêm'} ${TITLE[form.kind]}`} fields={F[form.kind]}
        initial={form.row ? (form.kind === 'contrib' ? { ...form.row, direction: Number(form.row.amount) < 0 ? 'out' : 'in', amount: Math.abs(Number(form.row.amount)) } : form.row) : { ...DEFAULT[form.kind], ...form.preset }}
        onClose={() => setForm(null)} onSubmit={save} size="lg"/>}
      {confirmDialog}
    </div>
  )
}
