'use client'
import { useMemo, useState } from 'react'
import { useHousehold } from '@/components/family/HouseholdProvider'
import { useRows, useCrud, useConfirm, FormModal, Stat, Panel, Empty, Tabs, RowActions, today, thisMonth, monthLabel, shiftMonth, daysUntil, type FieldDef } from '@/components/family/ui'
import { GroupedBars, RankBars, BudgetBar } from '@/components/family/charts'
import { T } from '@/lib/api/family'
import { EXPENSE_CATS, INCOME_CATS, WALLET_TYPES, catIcon, SERIES, billDue } from '@/lib/family/data'
import { vnd, cn, fmtDate, downloadCsv } from '@/lib/utils'
import type { Txn, Wallet, Bill, FinBudget } from '@/types'

type Tab = 'book' | 'budget' | 'bills' | 'wallets' | 'report'
const KIND = { expense: ['Chi', 'text-sakura-600', '−'], income: ['Thu', 'text-jade-600', '+'], transfer: ['Chuyển ví', 'text-blue-600', '⇄'] } as const

export default function FinancePage() {
  const { household, members, canEdit, userId } = useHousehold()
  const tx = useRows<Txn>(T.txns, 'transactions')
  const wl = useRows<Wallet>(T.wallets, 'wallets')
  const bl = useRows<Bill>(T.bills, 'recurring_bills')
  const bg = useRows<FinBudget>(T.budgets, 'fin_budgets')
  const ch = useRows(T.children, 'children')
  const txC = useCrud(T.txns, tx.reload, 'giao dịch'), wC = useCrud(T.wallets, wl.reload, 'ví'), bC = useCrud(T.bills, bl.reload, 'khoản định kỳ'), gC = useCrud(T.budgets, bg.reload, 'ngân sách')
  const [ask, confirmDialog] = useConfirm()
  const [tab, setTab] = useState<Tab>('book')
  const [month, setMonth] = useState(thisMonth())
  const [form, setForm] = useState<null | { kind: 'txn' | 'wallet' | 'bill' | 'budget'; row?: any; preset?: any }>(null)
  const [q, setQ] = useState(''); const [fKind, setFKind] = useState(''); const [fCat, setFCat] = useState(''); const [fWho, setFWho] = useState('')

  const wallets = wl.rows.filter(w => !w.archived)
  const memberName = (id: string | null) => members.find(m => m.user_id === id)?.full_name ?? members.find(m => m.user_id === id)?.email ?? ''
  const walletName = (id: string | null) => wl.rows.find(w => w.id === id)?.name ?? ''
  const childName = (id: string | null) => ch.rows.find(c => c.id === id)?.name ?? ''

  const inMonth = tx.rows.filter(t => t.date.startsWith(month))
  const income = inMonth.filter(t => t.kind === 'income').reduce((s, t) => s + Number(t.amount), 0)
  const expense = inMonth.filter(t => t.kind === 'expense').reduce((s, t) => s + Number(t.amount), 0)
  const byCat = useMemo(() => inMonth.filter(t => t.kind === 'expense').reduce((m, t) => m.set(t.category, (m.get(t.category) ?? 0) + Number(t.amount)), new Map<string, number>()), [inMonth])
  const balance = (w: Wallet) => Number(w.opening_balance) + tx.rows.reduce((s, t) => s
    + (t.kind === 'income' && t.wallet_id === w.id ? Number(t.amount) : 0)
    - ((t.kind === 'expense' || t.kind === 'transfer') && t.wallet_id === w.id ? Number(t.amount) : 0)
    + (t.kind === 'transfer' && t.to_wallet_id === w.id ? Number(t.amount) : 0), 0)
  const totalBalance = wallets.reduce((s, w) => s + (w.type === 'credit' ? 0 : balance(w)), 0)
  const budgetTotal = bg.rows.reduce((s, b) => s + Number(b.amount), 0)
  const overBudget = bg.rows.filter(b => (byCat.get(b.category) ?? 0) >= Number(b.amount) * 0.8 && Number(b.amount) > 0)

  // Khoản định kỳ trong tháng đang xem
  const billsThisMonth = bl.rows.filter(b => b.active).map(b => {
    const due = billDue(b, month)
    const paid = due ? tx.rows.find(t => t.bill_id === b.id && t.date.startsWith(month)) : undefined
    return { b, due, paid, left: due ? daysUntil(due) : null }
  }).filter(x => x.due)
  const billsDue = billsThisMonth.filter(x => !x.paid && x.left !== null && x.left <= x.b.remind_days)

  // ── Biểu mẫu ──
  const memberOpts = members.map(m => ({ value: m.user_id, label: `${m.full_name || m.email}${m.relation ? ` (${m.relation})` : ''}` }))
  const walletOpts = wallets.map(w => ({ value: w.id, label: `${WALLET_TYPES[w.type].icon} ${w.name}` }))
  const childOpts = ch.rows.map(c => ({ value: c.id, label: c.name }))
  const txnFields: FieldDef[] = [
    { key: 'kind', label: 'Loại', type: 'chips', required: true, options: [{ value: 'expense', label: '💸 Khoản chi' }, { value: 'income', label: '💰 Khoản thu' }, { value: 'transfer', label: '⇄ Chuyển giữa ví' }] },
    { key: 'amount', label: 'Số tiền', type: 'money', required: true, min: 1 },
    { key: 'category', label: 'Danh mục', type: 'chips', required: true, options: EXPENSE_CATS.map(c => ({ value: c.name, label: `${c.icon} ${c.name}` })), show: v => v.kind === 'expense' },
    { key: 'category', label: 'Nguồn thu', type: 'chips', required: true, options: INCOME_CATS.map(c => ({ value: c.name, label: `${c.icon} ${c.name}` })), show: v => v.kind === 'income' },
    { key: 'wallet_id', label: 'Từ ví', type: 'select', options: walletOpts, half: true, show: v => v.kind !== 'income' },
    { key: 'wallet_id', label: 'Vào ví', type: 'select', options: walletOpts, half: true, show: v => v.kind === 'income' },
    { key: 'to_wallet_id', label: 'Đến ví', type: 'select', options: walletOpts, half: true, required: true, show: v => v.kind === 'transfer' },
    { key: 'member_id', label: 'Người chi / nhận', type: 'select', options: memberOpts, half: true, show: v => v.kind !== 'transfer' },
    { key: 'date', label: 'Ngày', type: 'date', required: true, half: true },
    { key: 'child_id', label: 'Chi cho con', type: 'select', options: childOpts, half: true, show: v => v.kind === 'expense' && childOpts.length > 0 },
    { key: 'note', label: 'Ghi chú', placeholder: 'VD: Đi chợ cuối tuần' },
  ]
  const walletFields: FieldDef[] = [
    { key: 'name', label: 'Tên ví', required: true, placeholder: 'VD: Vietcombank của chồng' },
    { key: 'type', label: 'Loại', type: 'chips', required: true, options: Object.entries(WALLET_TYPES).map(([k, v]) => ({ value: k, label: `${v.icon} ${v.label}` })) },
    { key: 'opening_balance', label: 'Số dư ban đầu', type: 'money', half: true, hint: 'Thẻ tín dụng: để 0' },
    { key: 'owner_user', label: 'Của ai', type: 'select', options: memberOpts, half: true },
    { key: 'archived', label: 'Ẩn ví này (không còn dùng)', type: 'checkbox', show: v => !!v.id },
  ]
  const billFields: FieldDef[] = [
    { key: 'name', label: 'Tên khoản', required: true, placeholder: 'VD: Tiền điện, Học phí mầm non, Lương chồng' },
    { key: 'kind', label: 'Loại', type: 'chips', required: true, options: [{ value: 'expense', label: '💸 Khoản chi' }, { value: 'income', label: '💰 Khoản thu' }] },
    { key: 'amount', label: 'Số tiền (ước tính)', type: 'money', required: true, half: true },
    { key: 'category', label: 'Danh mục', type: 'select', required: true, half: true, options: [...EXPENSE_CATS, ...INCOME_CATS].map(c => c.name) },
    { key: 'frequency', label: 'Chu kỳ', type: 'select', required: true, half: true, options: [{ value: 'monthly', label: 'Hằng tháng' }, { value: 'quarterly', label: 'Hằng quý' }, { value: 'yearly', label: 'Hằng năm' }] },
    { key: 'day_of_month', label: 'Ngày đến hạn trong tháng', type: 'number', required: true, half: true, min: 1 },
    { key: 'start_month', label: 'Tháng bắt đầu chu kỳ', type: 'month', half: true, show: v => v.frequency !== 'monthly' },
    { key: 'remind_days', label: 'Nhắc trước (ngày)', type: 'number', half: true },
    { key: 'wallet_id', label: 'Ví mặc định', type: 'select', options: walletOpts, half: true },
    { key: 'child_id', label: 'Của con', type: 'select', options: childOpts, half: true, show: () => childOpts.length > 0 },
    { key: 'active', label: 'Đang áp dụng', type: 'checkbox' },
  ]

  async function save(v: Record<string, any>) {
    const k = form!.kind, id = form!.row?.id
    if (k === 'txn') {
      if (v.kind === 'transfer') { v.category = 'Chuyển ví'; if (v.wallet_id === v.to_wallet_id) return false }
      // Đổi loại thu ↔ chi mà danh mục cũ không còn hợp lệ → dùng danh mục mặc định
      if (v.kind === 'income' && !INCOME_CATS.some(c => c.name === v.category)) v.category = 'Thu nhập khác'
      if (v.kind === 'expense' && !EXPENSE_CATS.some(c => c.name === v.category)) v.category = 'Khác'
      const row = { ...v, to_wallet_id: v.kind === 'transfer' ? v.to_wallet_id : null, bill_id: form!.preset?.bill_id ?? form!.row?.bill_id ?? null, created_by: userId }
      return id ? txC.update(id, row) : txC.create(row)
    }
    if (k === 'wallet') return id ? wC.update(id, v) : wC.create({ ...v, opening_balance: v.opening_balance ?? 0 })
    if (k === 'bill') return id ? bC.update(id, v) : bC.create(v)
    if (k === 'budget') {
      const ex = bg.rows.find(b => b.category === v.category)
      if (!v.amount) return ex ? gC.remove(ex.id) : true
      return ex ? gC.update(ex.id, { amount: v.amount }) : gC.create(v)
    }
  }
  const openTxn = (row?: Txn, preset?: any) => setForm({ kind: 'txn', row, preset })
  const formCfg = form && {
    txn: { title: form.row ? 'Sửa giao dịch' : 'Ghi thu chi', fields: txnFields, initial: form.row ?? { kind: 'expense', date: today(), member_id: userId, wallet_id: wallets[0]?.id ?? '', category: 'Ăn uống', ...form.preset } },
    wallet: { title: form.row ? 'Sửa ví' : 'Thêm ví / tài khoản', fields: walletFields, initial: form.row ?? { type: 'cash', owner_user: userId } },
    bill: { title: form.row ? 'Sửa khoản định kỳ' : 'Thêm khoản định kỳ', fields: billFields, initial: form.row ?? { kind: 'expense', frequency: 'monthly', day_of_month: 5, remind_days: 3, active: true, category: 'Điện nước & internet', start_month: thisMonth() } },
    budget: { title: 'Hạn mức chi tiêu tháng', fields: [{ key: 'category', label: 'Danh mục', type: 'select', required: true, options: EXPENSE_CATS.map(c => c.name) }, { key: 'amount', label: 'Hạn mức mỗi tháng (để trống = bỏ hạn mức)', type: 'money' }] as FieldDef[], initial: form.row ?? { category: 'Ăn uống' } },
  }[form.kind]

  // ── Lọc sổ thu chi ──
  const list = inMonth.filter(t => (!fKind || t.kind === fKind) && (!fCat || t.category === fCat) && (!fWho || t.member_id === fWho)
    && (!q || `${t.note ?? ''} ${t.category} ${walletName(t.wallet_id)}`.toLowerCase().includes(q.toLowerCase())))
  const byDay = list.reduce((m, t) => m.set(t.date, [...(m.get(t.date) ?? []), t]), new Map<string, Txn[]>())

  // ── Báo cáo 12 tháng ──
  const months12 = Array.from({ length: 12 }, (_, i) => shiftMonth(month, i - 11))
  const sumBy = (m: string, k: 'income' | 'expense') => tx.rows.filter(t => t.kind === k && t.date.startsWith(m)).reduce((s, t) => s + Number(t.amount), 0)
  const year = month.slice(0, 4)
  const exportCsv = (rows: Txn[], name: string) => downloadCsv(name, [
    ['Ngày', 'Loại', 'Danh mục', 'Số tiền', 'Ví', 'Đến ví', 'Người', 'Con', 'Ghi chú'],
    ...rows.map(t => [fmtDate(t.date), KIND[t.kind][0], t.category, t.kind === 'expense' ? -t.amount : t.amount, walletName(t.wallet_id), walletName(t.to_wallet_id), memberName(t.member_id), childName(t.child_id), t.note]),
  ])

  const loading = tx.loading || wl.loading
  const migErr = tx.error || wl.error

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-4">
      {migErr && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">⚠️ {migErr}</div>}

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 card px-1.5 py-1">
          <button onClick={() => setMonth(m => shiftMonth(m, -1))} className="btn btn-ghost btn-xs btn-icon" aria-label="Tháng trước">‹</button>
          <input type="month" value={month} onChange={e => e.target.value && setMonth(e.target.value)} className="text-sm font-semibold text-ink-900 bg-transparent px-1 focus:outline-none"/>
          <button onClick={() => setMonth(m => shiftMonth(m, 1))} className="btn btn-ghost btn-xs btn-icon" aria-label="Tháng sau">›</button>
          {month !== thisMonth() && <button onClick={() => setMonth(thisMonth())} className="btn btn-ghost btn-xs">Tháng này</button>}
        </div>
        <div className="ml-auto flex gap-2">
          {canEdit && <button onClick={() => openTxn(undefined, { kind: 'income', category: 'Lương' })} className="btn btn-secondary btn-sm">💰 Ghi thu</button>}
          {canEdit && <button onClick={() => openTxn()} className="btn btn-primary btn-sm">💸 Ghi chi</button>}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat icon="💰" label={`Thu ${monthLabel(month).toLowerCase()}`} value={vnd(income)} tone="good"/>
        <Stat icon="💸" label="Chi" value={vnd(expense)} tone="brand" sub={budgetTotal ? `Hạn mức ${vnd(budgetTotal)}` : undefined}/>
        <Stat icon={income - expense >= 0 ? '📈' : '📉'} label="Còn lại" value={vnd(income - expense)} tone={income - expense >= 0 ? 'good' : 'bad'} sub={income ? `Tiết kiệm ${Math.round(((income - expense) / income) * 100)}% thu nhập` : undefined}/>
        <Stat icon="👛" label="Tổng tiền các ví" value={vnd(totalBalance)} sub={`${wallets.length} ví đang dùng`}/>
      </div>

      {(billsDue.length > 0 || overBudget.length > 0) && month === thisMonth() && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {billsDue.length > 0 && (
            <div className="min-w-0 rounded-2xl border border-gold-200 bg-gold-50 p-4">
              <p className="text-sm font-semibold text-gold-800 mb-2">🔔 {billsDue.length} khoản sắp / đã đến hạn</p>
              {billsDue.map(({ b, due, left }) => (
                <div key={b.id} className="flex items-center justify-between gap-2 text-sm py-1">
                  <span className="truncate text-ink-800">{b.name} · <b className="tabular">{vnd(b.amount)}</b> <span className={cn('text-xs', left! < 0 ? 'text-red-600 font-semibold' : 'text-gold-700')}>{left! < 0 ? `quá hạn ${-left!} ngày` : left === 0 ? 'hôm nay' : `còn ${left} ngày`} ({fmtDate(due!)})</span></span>
                  {canEdit && <button onClick={() => openTxn(undefined, { kind: b.kind, amount: b.amount, category: b.category, wallet_id: b.wallet_id ?? '', child_id: b.child_id ?? '', note: b.name, bill_id: b.id })} className="btn btn-gold btn-xs flex-shrink-0">Đã trả</button>}
                </div>
              ))}
            </div>
          )}
          {overBudget.length > 0 && (
            <div className="min-w-0 rounded-2xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-semibold text-red-700 mb-2">⚠️ Ngân sách cần chú ý</p>
              {overBudget.map(b => { const s = byCat.get(b.category) ?? 0; return (
                <p key={b.id} className="text-sm text-ink-800 py-0.5">{catIcon(b.category)} {b.category}: <b className="tabular">{vnd(s)}</b> / {vnd(b.amount)} {s >= Number(b.amount) ? <span className="text-red-600 font-semibold">⛔ vượt {vnd(s - Number(b.amount))}</span> : <span className="text-gold-700">⚠️ {Math.round((s / Number(b.amount)) * 100)}%</span>}</p>
              ) })}
            </div>
          )}
        </div>
      )}

      <Tabs value={tab} onChange={setTab} items={[['book', '📒 Sổ thu chi', inMonth.length], ['budget', '🎯 Ngân sách', bg.rows.length], ['bills', '🔁 Định kỳ', bl.rows.length], ['wallets', '👛 Ví', wallets.length], ['report', '📊 Báo cáo']]}/>

      {tab === 'book' && (
        <Panel title={`Sổ thu chi ${monthLabel(month).toLowerCase()}`} sub={`${list.length} giao dịch`} pad={false}
          right={<button onClick={() => exportCsv(inMonth, `thu-chi-${month}.csv`)} className="btn btn-secondary btn-xs">⬇ Excel</button>}>
          <div className="px-4 py-3 border-b border-ink-100 flex flex-wrap gap-2">
            <input className="input !py-1.5 !w-auto flex-1 min-w-[140px] text-sm" placeholder="🔍 Tìm ghi chú…" value={q} onChange={e => setQ(e.target.value)}/>
            <select className="input !py-1.5 !w-auto text-sm" value={fKind} onChange={e => setFKind(e.target.value)}><option value="">Thu & chi</option><option value="expense">Chỉ khoản chi</option><option value="income">Chỉ khoản thu</option><option value="transfer">Chuyển ví</option></select>
            <select className="input !py-1.5 !w-auto text-sm" value={fCat} onChange={e => setFCat(e.target.value)}><option value="">Mọi danh mục</option>{[...EXPENSE_CATS, ...INCOME_CATS].map(c => <option key={c.name} value={c.name}>{c.icon} {c.name}</option>)}</select>
            {members.length > 1 && <select className="input !py-1.5 !w-auto text-sm" value={fWho} onChange={e => setFWho(e.target.value)}><option value="">Mọi thành viên</option>{memberOpts.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}</select>}
          </div>
          {loading ? <div className="p-5 space-y-2">{[1, 2, 3].map(i => <div key={i} className="h-10 skeleton"/>)}</div>
            : list.length === 0 ? <Empty icon="📒" title="Chưa có giao dịch trong tháng này" text="Ghi lại từng khoản thu chi để biết tiền đi đâu, về đâu." action={canEdit && <button onClick={() => openTxn()} className="btn btn-primary btn-sm">💸 Ghi khoản chi đầu tiên</button>}/>
            : Array.from(byDay.entries()).map(([d, items]) => {
              const net = items.reduce((s, t) => s + (t.kind === 'income' ? Number(t.amount) : t.kind === 'expense' ? -Number(t.amount) : 0), 0)
              return (
                <div key={d}>
                  <div className="px-5 py-1.5 bg-ink-50/70 flex justify-between text-[11px] font-semibold text-ink-500"><span className="capitalize">{new Date(d + 'T12:00:00').toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' })}</span><span className={net >= 0 ? 'text-jade-600' : 'text-ink-600'}>{net >= 0 ? '+' : ''}{vnd(net)}</span></div>
                  {items.map(t => (
                    <div key={t.id} className="px-5 py-2.5 flex items-center gap-3 hover:bg-ink-50/40 group border-b border-ink-50 last:border-0">
                      <span className="w-9 h-9 rounded-xl bg-ink-50 flex items-center justify-center text-lg flex-shrink-0">{t.kind === 'transfer' ? '⇄' : catIcon(t.category)}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-ink-900 truncate">{t.note || t.category}</p>
                        <p className="text-[11px] text-ink-400 truncate">{[t.kind !== 'transfer' && t.note ? t.category : null, t.kind === 'transfer' ? `${walletName(t.wallet_id)} → ${walletName(t.to_wallet_id)}` : walletName(t.wallet_id), memberName(t.member_id), t.child_id && `🧒 ${childName(t.child_id)}`, t.bill_id && '🔁 định kỳ'].filter(Boolean).join(' · ')}</p>
                      </div>
                      <span className={cn('text-sm font-bold tabular flex-shrink-0', KIND[t.kind][1])}>{KIND[t.kind][2]}{vnd(t.amount)}</span>
                      {canEdit && <RowActions onEdit={() => openTxn(t)} onDelete={() => ask('Xóa giao dịch?', `${t.note || t.category} — ${vnd(t.amount)}`, () => txC.remove(t.id))}/>}
                    </div>
                  ))}
                </div>
              )
            })}
        </Panel>
      )}

      {tab === 'budget' && (
        <Panel title="Ngân sách chi tiêu hằng tháng" sub={`Áp dụng cho mọi tháng · đang xem ${monthLabel(month).toLowerCase()}`} right={canEdit && <button onClick={() => setForm({ kind: 'budget' })} className="btn btn-primary btn-xs">+ Đặt hạn mức</button>}>
          {bg.rows.length === 0 ? <Empty icon="🎯" title="Chưa đặt hạn mức nào" text="Đặt hạn mức cho các khoản như Ăn uống, Mua sắm… để được cảnh báo khi sắp tiêu quá tay." action={canEdit && <button onClick={() => setForm({ kind: 'budget' })} className="btn btn-primary btn-sm">Đặt hạn mức đầu tiên</button>}/> : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
              {bg.rows.map(b => { const s = byCat.get(b.category) ?? 0; return (
                <div key={b.id} className="group">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-sm font-medium text-ink-800">{catIcon(b.category)} {b.category}</span>
                    <span className="flex items-center gap-1 text-sm tabular"><b className="text-ink-900">{vnd(s)}</b><span className="text-ink-400">/ {vnd(b.amount)}</span>
                      {canEdit && <RowActions onEdit={() => setForm({ kind: 'budget', row: b })} onDelete={() => ask('Bỏ hạn mức?', b.category, () => gC.remove(b.id))}/>}</span>
                  </div>
                  <BudgetBar spent={s} limit={Number(b.amount)}/>
                  <p className="text-[11px] text-ink-400 mt-0.5">{s < Number(b.amount) ? `Còn ${vnd(Number(b.amount) - s)} được chi` : `Đã vượt ${vnd(s - Number(b.amount))}`}</p>
                </div>
              ) })}
            </div>
          )}
          {byCat.size > 0 && bg.rows.length > 0 && (() => { const no = Array.from(byCat.entries()).filter(([c]) => !bg.rows.some(b => b.category === c)); return no.length ? <p className="text-xs text-ink-400 mt-5">Chưa có hạn mức: {no.map(([c, v]) => `${c} (${vnd(v)})`).join(', ')}</p> : null })()}
        </Panel>
      )}

      {tab === 'bills' && (
        <Panel title="Khoản thu chi định kỳ" sub={`Tiền nhà, điện nước, học phí, trả góp, lương… · trạng thái ${monthLabel(month).toLowerCase()}`} pad={false} right={canEdit && <button onClick={() => setForm({ kind: 'bill' })} className="btn btn-primary btn-xs">+ Thêm khoản</button>}>
          {bl.rows.length === 0 ? <Empty icon="🔁" title="Chưa có khoản định kỳ" text="Thêm các khoản lặp lại hằng tháng/quý/năm để được nhắc trước hạn và ghi nhanh chỉ với 1 chạm." action={canEdit && <button onClick={() => setForm({ kind: 'bill' })} className="btn btn-primary btn-sm">+ Thêm khoản định kỳ</button>}/> : (
            <div className="divide-y divide-ink-50">
              {bl.rows.map(b => {
                const due = billDue(b, month), paid = due && tx.rows.find(t => t.bill_id === b.id && t.date.startsWith(month)), left = due ? daysUntil(due) : null
                const status = !b.active ? ['Tạm dừng', 'bg-ink-100 text-ink-500 border-ink-200'] : !due ? ['Không có kỳ tháng này', 'bg-ink-50 text-ink-400 border-ink-200']
                  : paid ? ['✓ Đã ghi', 'bg-jade-50 text-jade-700 border-jade-200'] : left! < 0 ? [`⛔ Quá hạn ${-left!} ngày`, 'bg-red-50 text-red-700 border-red-200']
                  : left! <= b.remind_days ? [`🔔 Còn ${left} ngày`, 'bg-gold-50 text-gold-700 border-gold-200'] : [`Hạn ${fmtDate(due)}`, 'bg-ink-50 text-ink-600 border-ink-200']
                return (
                  <div key={b.id} className={cn('px-5 py-3 flex items-center gap-3 group', !b.active && 'opacity-60')}>
                    <span className="w-9 h-9 rounded-xl bg-ink-50 flex items-center justify-center text-lg flex-shrink-0">{catIcon(b.category)}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-ink-900 truncate">{b.name}</p>
                      <p className="text-[11px] text-ink-400">{{ monthly: 'Hằng tháng', quarterly: 'Hằng quý', yearly: 'Hằng năm' }[b.frequency]} · ngày {b.day_of_month}{b.child_id && ` · 🧒 ${childName(b.child_id)}`}</p>
                    </div>
                    <span className={cn('text-sm font-bold tabular', b.kind === 'income' ? 'text-jade-600' : 'text-ink-900')}>{b.kind === 'income' ? '+' : ''}{vnd(b.amount)}</span>
                    <span className={cn('hidden sm:inline text-[10px] font-semibold px-2 py-0.5 rounded-full border', status[1])}>{status[0]}</span>
                    {canEdit && due && !paid && b.active && <button onClick={() => openTxn(undefined, { kind: b.kind, amount: b.amount, category: b.category, wallet_id: b.wallet_id ?? '', child_id: b.child_id ?? '', note: b.name, bill_id: b.id, date: today().startsWith(month) ? today() : due })} className="btn btn-gold btn-xs">Ghi</button>}
                    {canEdit && <RowActions onEdit={() => setForm({ kind: 'bill', row: b })} onDelete={() => ask('Xóa khoản định kỳ?', b.name, () => bC.remove(b.id))}/>}
                  </div>
                )
              })}
            </div>
          )}
        </Panel>
      )}

      {tab === 'wallets' && (
        <div className="space-y-3">
          <div className="flex justify-end gap-2">
            {canEdit && wallets.length > 1 && <button onClick={() => openTxn(undefined, { kind: 'transfer', category: 'Chuyển ví', to_wallet_id: wallets[1]?.id })} className="btn btn-secondary btn-sm">⇄ Chuyển tiền giữa ví</button>}
            {canEdit && <button onClick={() => setForm({ kind: 'wallet' })} className="btn btn-primary btn-sm">+ Thêm ví</button>}
          </div>
          {wl.rows.length === 0 ? <div className="card"><Empty icon="👛" title="Chưa có ví nào" text="Thêm tiền mặt, tài khoản ngân hàng, thẻ tín dụng, ví điện tử của từng người để theo dõi số dư." action={canEdit && <button onClick={() => setForm({ kind: 'wallet' })} className="btn btn-primary btn-sm">+ Thêm ví đầu tiên</button>}/></div> : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {wl.rows.map((w, i) => {
                const bal = balance(w), m = tx.rows.filter(t => t.date.startsWith(month) && (t.wallet_id === w.id || t.to_wallet_id === w.id))
                return (
                  <div key={w.id} className={cn('card p-4 group relative overflow-hidden', w.archived && 'opacity-50')}>
                    <span className="absolute inset-y-0 left-0 w-1" style={{ background: SERIES[i % SERIES.length] }}/>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0"><p className="font-semibold text-ink-900 truncate">{WALLET_TYPES[w.type].icon} {w.name}</p><p className="text-[11px] text-ink-400">{WALLET_TYPES[w.type].label}{w.owner_user && ` · ${memberName(w.owner_user)}`}{w.archived && ' · đã ẩn'}</p></div>
                      {canEdit && <RowActions onEdit={() => setForm({ kind: 'wallet', row: w })} onDelete={() => ask('Xóa ví?', `${w.name} — các giao dịch vẫn được giữ lại nhưng không còn gắn với ví này.`, () => wC.remove(w.id))}/>}
                    </div>
                    <p className={cn('font-display text-2xl font-bold tabular mt-3', bal < 0 ? 'text-red-600' : 'text-ink-900')}>{vnd(bal)}</p>
                    <p className="text-[11px] text-ink-400">{w.type === 'credit' ? 'Dư nợ thẻ (số âm = đang nợ)' : 'Số dư hiện tại'} · {m.length} giao dịch trong tháng</p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'report' && (
        <div className="space-y-4">
          <Panel title="Thu và chi 12 tháng gần nhất" sub={`Đến ${monthLabel(month).toLowerCase()} · rê chuột vào cột để xem chi tiết`} right={<button onClick={() => exportCsv(tx.rows.filter(t => t.date.startsWith(year)), `thu-chi-nam-${year}.csv`)} className="btn btn-secondary btn-xs">⬇ Excel năm {year}</button>}>
            <GroupedBars labels={months12.map(m => `T${Number(m.slice(5))}`)} series={[{ name: 'Thu', color: SERIES[0], values: months12.map(m => sumBy(m, 'income')) }, { name: 'Chi', color: SERIES[1], values: months12.map(m => sumBy(m, 'expense')) }]}/>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-xs min-w-[560px]">
                <thead><tr className="text-ink-400 text-left">{['Tháng', 'Thu', 'Chi', 'Còn lại', 'Tỉ lệ tiết kiệm'].map(h => <th key={h} className="py-1.5 font-semibold">{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-ink-50">
                  {[...months12].reverse().map(m => { const i = sumBy(m, 'income'), e = sumBy(m, 'expense'); return (
                    <tr key={m}><td className="py-1.5 text-ink-700">{monthLabel(m)}</td><td className="tabular text-ink-900">{vnd(i)}</td><td className="tabular text-ink-900">{vnd(e)}</td>
                      <td className={cn('tabular font-semibold', i - e >= 0 ? 'text-jade-700' : 'text-red-600')}>{vnd(i - e)}</td><td className="tabular text-ink-600">{i ? `${Math.round(((i - e) / i) * 100)}%` : '—'}</td></tr>
                  ) })}
                </tbody>
              </table>
            </div>
          </Panel>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Panel title={`Chi theo danh mục · ${monthLabel(month)}`} sub={vnd(expense)}><RankBars rows={Array.from(byCat.entries())} total={expense}/></Panel>
            <Panel title={`Chi theo thành viên · ${monthLabel(month)}`}>
              <RankBars rows={Array.from(inMonth.filter(t => t.kind === 'expense').reduce((m, t) => { const k = memberName(t.member_id) || 'Không rõ'; return m.set(k, (m.get(k) ?? 0) + Number(t.amount)) }, new Map<string, number>()).entries())} total={expense}/>
              {ch.rows.length > 0 && (
                <div className="mt-5 pt-4 border-t border-ink-100">
                  <p className="text-xs font-semibold text-ink-500 mb-2">Chi cho con trong tháng</p>
                  {ch.rows.map(c => <p key={c.id} className="text-sm flex justify-between py-0.5"><span>🧒 {c.name}</span><b className="tabular">{vnd(inMonth.filter(t => t.kind === 'expense' && t.child_id === c.id).reduce((s, t) => s + Number(t.amount), 0))}</b></p>)}
                </div>
              )}
            </Panel>
          </div>
        </div>
      )}

      {form && formCfg && <FormModal open key={form.kind + (form.row?.id ?? 'new')} title={formCfg.title} fields={formCfg.fields} initial={formCfg.initial} onClose={() => setForm(null)} onSubmit={save} size={form.kind === 'txn' ? 'lg' : 'md'}/>}
      {confirmDialog}
      <p className="text-center text-[11px] text-ink-300 pt-2">{household.name}</p>
    </div>
  )
}
