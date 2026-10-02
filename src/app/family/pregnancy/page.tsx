'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useHousehold } from '@/components/family/HouseholdProvider'
import { useRows, useCrud, useConfirm, FormModal, Stat, Panel, Empty, Tabs, RowActions, today, daysUntil, type FieldDef } from '@/components/family/ui'
import { T } from '@/lib/api/family'
import { useToast } from '@/components/ui/Toast'
import { FETAL, PRENATAL_MILESTONES, PREGNANCY_COST_TEMPLATE, BABY_ITEMS, VISIT_TYPES, gestation, dueFromLmp, maternityBenefit } from '@/lib/family/data'
import { vnd, cn, fmtDate, downloadCsv } from '@/lib/utils'
import type { Pregnancy, PregVisit, PregCost, BabyItem } from '@/types'

type Tab = 'milestones' | 'visits' | 'costs' | 'items'

export default function PregnancyPage() {
  const { household, canEdit, userId } = useHousehold()
  const { success, error } = useToast()
  const pg = useRows<Pregnancy>(T.pregnancies, 'pregnancies')
  const pC = useCrud(T.pregnancies, pg.reload, 'thai kỳ')
  const [sel, setSel] = useState<string | null>(null)
  const [form, setForm] = useState<null | { kind: 'preg' | 'visit' | 'cost' | 'item'; row?: any }>(null)
  const [tab, setTab] = useState<Tab>('milestones')
  const [ask, confirmDialog] = useConfirm()

  const preg = pg.rows.find(p => p.id === sel) ?? pg.rows.find(p => p.status === 'active') ?? pg.rows[0]
  const filter = preg ? { pregnancy_id: preg.id } : { pregnancy_id: '00000000-0000-0000-0000-000000000000' }
  const vs = useRows<PregVisit>(T.visits, 'pregnancy_visits', filter)
  const cs = useRows<PregCost>(T.pregCosts, 'pregnancy_costs', filter)
  const it = useRows<BabyItem>(T.babyItems, 'baby_items', filter)
  const vC = useCrud(T.visits, vs.reload, 'lần khám'), cC = useCrud(T.pregCosts, cs.reload, 'khoản chi phí'), iC = useCrud(T.babyItems, it.reload, 'món đồ')

  const pregFields: FieldDef[] = [
    { key: 'mother_name', label: 'Tên mẹ', half: true },
    { key: 'baby_name', label: 'Tên dự kiến của bé', half: true, placeholder: 'Có thể để trống' },
    { key: 'lmp', label: 'Ngày đầu kỳ kinh cuối', type: 'date', half: true, hint: 'Nhập ngày này để tự tính ngày dự sinh' },
    { key: 'due_date', label: 'Ngày dự sinh', type: 'date', half: true, hint: 'Hoặc nhập theo siêu âm / bác sĩ' },
    { key: 'hospital', label: 'Nơi khám / dự sinh', half: true },
    { key: 'doctor', label: 'Bác sĩ theo dõi', half: true },
    { key: 'status', label: 'Trạng thái', type: 'select', required: true, options: [{ value: 'active', label: 'Đang mang thai' }, { value: 'born', label: 'Đã sinh' }, { value: 'ended', label: 'Đã kết thúc' }], show: v => !!v.id },
    { key: 'notes', label: 'Ghi chú', type: 'textarea' },
  ]
  const visitFields: FieldDef[] = [
    { key: 'date', label: 'Ngày khám', type: 'date', required: true, half: true },
    { key: 'type', label: 'Loại', type: 'select', required: true, half: true, options: VISIT_TYPES },
    { key: 'place', label: 'Nơi khám', half: true },
    { key: 'cost', label: 'Chi phí', type: 'money', half: true },
    { key: 'mom_weight', label: 'Cân nặng mẹ (kg)', type: 'number', step: '0.1', half: true },
    { key: 'blood_pressure', label: 'Huyết áp', half: true, placeholder: '110/70' },
    { key: 'fetal_weight', label: 'Cân nặng thai ước tính (g)', type: 'number', half: true },
    { key: 'add_txn', label: 'Ghi chi phí này vào Thu chi (danh mục Thai sản)', type: 'checkbox', show: v => !v.id && Number(v.cost) > 0 },
    { key: 'notes', label: 'Kết quả / lời dặn bác sĩ', type: 'textarea' },
  ]
  const costFields: FieldDef[] = [
    { key: 'item', label: 'Khoản', required: true },
    { key: 'estimate', label: 'Dự toán', type: 'money', half: true },
    { key: 'actual', label: 'Thực chi', type: 'money', half: true },
  ]
  const itemFields: FieldDef[] = [
    { key: 'name', label: 'Tên đồ', required: true },
    { key: 'grp', label: 'Nhóm', type: 'select', required: true, options: BABY_ITEMS.map(g => g.grp), half: true },
    { key: 'qty', label: 'Số lượng', type: 'number', min: 1, half: true },
    { key: 'price', label: 'Đơn giá', type: 'money', half: true },
    { key: 'essential', label: 'Thiết yếu', type: 'checkbox' },
    { key: 'bought', label: 'Đã mua', type: 'checkbox' },
  ]

  async function save(v: Record<string, any>) {
    const k = form!.kind, id = form!.row?.id
    if (k === 'preg') {
      if (!v.due_date && v.lmp) v.due_date = dueFromLmp(v.lmp)
      if (!v.due_date) { error('Cần ngày dự sinh', 'Nhập ngày đầu kỳ kinh cuối hoặc ngày dự sinh'); return false }
      if (id) return pC.update(id, v)
      const r = await T.pregnancies.create(household.id, { ...v, status: 'active' })
      if (r.error || !r.data) { error('Không tạo được', r.error ?? ''); return false }
      const pid = r.data[0].id
      // Tạo sẵn dự toán chi phí + danh sách đồ sơ sinh
      await T.pregCosts.create(household.id, PREGNANCY_COST_TEMPLATE.map(([item, estimate], i) => ({ pregnancy_id: pid, item, estimate, position: i })))
      let pos = 0
      await T.babyItems.create(household.id, BABY_ITEMS.flatMap(g => g.items.map(([name, qty, price, essential]) => ({ pregnancy_id: pid, grp: g.grp, name, qty, price, essential, position: pos++ }))))
      success('Đã tạo hồ sơ thai kỳ 🤰', 'Kèm dự toán chi phí và danh sách đồ sơ sinh'); setSel(pid); await pg.reload(); return true
    }
    if (k === 'visit') {
      const { add_txn, ...row } = v
      const ok = id ? await vC.update(id, row) : await vC.create({ ...row, pregnancy_id: preg!.id, cost: row.cost ?? 0 })
      if (ok && add_txn && row.cost > 0) await T.txns.create(household.id, { kind: 'expense', amount: row.cost, category: 'Thai sản', date: row.date, note: `${row.type}${row.place ? ` — ${row.place}` : ''}`, member_id: userId, created_by: userId })
      return ok
    }
    if (k === 'cost') return id ? cC.update(id, v) : cC.create({ ...v, pregnancy_id: preg!.id, estimate: v.estimate ?? 0, actual: v.actual ?? 0, position: cs.rows.length })
    if (k === 'item') return id ? iC.update(id, v) : iC.create({ ...v, pregnancy_id: preg!.id, qty: v.qty || 1, price: v.price ?? 0, position: it.rows.length })
  }
  const cfg = form && {
    preg: { title: form.row ? 'Sửa thông tin thai kỳ' : 'Bắt đầu theo dõi thai kỳ', fields: pregFields, initial: form.row },
    visit: { title: form.row ? 'Sửa lần khám' : 'Ghi lần khám thai', fields: visitFields, initial: form.row ?? { date: today(), type: 'Khám định kỳ', place: preg?.hospital, add_txn: true } },
    cost: { title: form.row ? 'Sửa khoản chi phí' : 'Thêm khoản chi phí', fields: costFields, initial: form.row },
    item: { title: form.row ? 'Sửa món đồ' : 'Thêm đồ cần mua', fields: itemFields, initial: form.row ?? { grp: BABY_ITEMS[1].grp, qty: 1, essential: true } },
  }[form.kind]

  if (pg.loading) return <div className="p-6 max-w-6xl mx-auto w-full"><div className="h-48 skeleton"/></div>
  if (!preg) return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto w-full">
      {pg.error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 mb-4">⚠️ {pg.error}</div>}
      <div className="card"><Empty icon="🤰" title="Theo dõi hành trình mang thai" text="Tính tuần thai tự động, nhắc các mốc khám quan trọng, ghi nhật ký khám, dự toán chi phí sinh và chuẩn bị đồ sơ sinh."
        action={canEdit && <button onClick={() => setForm({ kind: 'preg' })} className="btn btn-primary">🤰 Bắt đầu theo dõi thai kỳ</button>}/></div>
      {form && cfg && <FormModal open key="new" title={cfg.title} fields={cfg.fields} initial={cfg.initial} onClose={() => setForm(null)} onSubmit={save} size="lg"/>}
    </div>
  )

  const g = gestation(preg.due_date)
  const wk = Math.min(40, Math.max(4, g.weeks))
  const fetal = FETAL[wk]
  const left = daysUntil(preg.due_date)
  const done = preg.status !== 'active'
  const visits = vs.rows
  const weights = visits.filter(v => v.mom_weight).sort((a, b) => a.date.localeCompare(b.date))
  const estTotal = cs.rows.reduce((s, c) => s + Number(c.estimate), 0), actTotal = cs.rows.reduce((s, c) => s + Number(c.actual), 0)
  const visitSpend = visits.reduce((s, v) => s + Number(v.cost), 0)
  const itemsTotal = it.rows.reduce((s, i) => s + Number(i.price) * i.qty, 0), itemsBought = it.rows.filter(i => i.bought).reduce((s, i) => s + Number(i.price) * i.qty, 0)

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-4">
      {pg.rows.length > 1 && (
        <div className="flex flex-wrap gap-1.5">{pg.rows.map(p => <button key={p.id} onClick={() => setSel(p.id)} className={cn('px-3 py-1.5 rounded-full text-xs font-medium border', p.id === preg.id ? 'bg-ink-900 text-white border-ink-900' : 'bg-white border-ink-200 text-ink-600')}>{p.baby_name || p.mother_name || 'Thai kỳ'} · dự sinh {fmtDate(p.due_date)}</button>)}
          {canEdit && <button onClick={() => setForm({ kind: 'preg' })} className="px-3 py-1.5 rounded-full text-xs font-medium border border-dashed border-ink-300 text-ink-500">+ Thai kỳ mới</button>}</div>
      )}

      {/* Đầu trang */}
      <div className="hero p-5 sm:p-7 text-white">
        <div className="relative grid lg:grid-cols-[1fr_auto] gap-6 items-center">
          <div>
            <p className="text-white/60 text-sm">{preg.mother_name ? `Mẹ ${preg.mother_name}` : 'Hành trình mang thai'}{preg.baby_name && ` · bé ${preg.baby_name}`}</p>
            {done ? <h1 className="font-display text-3xl sm:text-4xl font-bold mt-1">{preg.status === 'born' ? '👶 Bé đã chào đời!' : 'Thai kỳ đã kết thúc'}</h1>
              : <h1 className="font-display text-3xl sm:text-4xl font-bold mt-1">Tuần {g.weeks} <span className="text-white/60 text-2xl">+ {g.days} ngày</span></h1>}
            {!done && <p className="text-white/70 text-sm mt-1">Tam cá nguyệt thứ {g.trimester} · {left > 0 ? `còn ${left} ngày đến ngày dự sinh ${fmtDate(preg.due_date)}` : left === 0 ? 'hôm nay là ngày dự sinh!' : `đã quá ngày dự sinh ${-left} ngày`}</p>}
            {!done && (
              <div className="mt-4 max-w-xl">
                <div className="relative h-2.5 rounded-full bg-white/15 overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-sakura-400 to-gold-400" style={{ width: `${Math.min(100, (g.totalDays / 280) * 100)}%` }}/></div>
                <div className="flex justify-between text-[11px] text-white/45 mt-1"><span>Tuần 0</span><span>13</span><span>27</span><span>40</span></div>
              </div>
            )}
            <div className="flex flex-wrap gap-2 mt-4">
              {canEdit && <button onClick={() => setForm({ kind: 'preg', row: preg })} className="btn btn-sm text-white border border-white/25 bg-white/10 hover:bg-white/20">✎ Sửa thông tin</button>}
              {canEdit && !done && <button onClick={() => ask('Đánh dấu đã sinh?', 'Thai kỳ chuyển sang "Đã sinh". Bạn có thể tạo hồ sơ cho bé ở mục Con cái.', () => pC.update(preg.id, { status: 'born' }))} className="btn btn-sm text-white border border-white/25 bg-white/10 hover:bg-white/20">👶 Bé đã chào đời</button>}
              {preg.status === 'born' && <Link href="/family/children" className="btn btn-gold btn-sm">🧒 Tạo hồ sơ cho bé</Link>}
            </div>
          </div>
          {!done && fetal && (
            <div className="rounded-2xl border border-white/15 bg-white/10 p-5 text-center min-w-[200px]">
              <p className="text-[11px]st text-white/55">Bé bây giờ to bằng</p>
              <p className="font-display text-2xl font-bold mt-1 first-letter:uppercase">{fetal[2]}</p>
              <p className="text-xs text-white/60 mt-1">{fetal[0] >= 1 ? `~${fetal[0]} cm` : `~${fetal[0] * 10} mm`}{fetal[1] ? ` · ~${fetal[1] >= 1000 ? `${(fetal[1] / 1000).toFixed(1)} kg` : `${fetal[1]} g`}` : ''}</p>
              <p className="text-[11px] text-white/40 mt-2">Số đo ước tính trung bình</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat icon="🩺" label="Số lần khám" value={visits.length} sub={visits[0] ? `Gần nhất ${fmtDate(visits[0].date)}` : 'Chưa ghi lần khám'}/>
        <Stat icon="⚖️" label="Cân nặng mẹ" value={weights.length ? `${weights[weights.length - 1].mom_weight} kg` : '—'} sub={weights.length > 1 ? `Tăng ${(Number(weights[weights.length - 1].mom_weight) - Number(weights[0].mom_weight)).toFixed(1)} kg từ ${fmtDate(weights[0].date)}` : 'Ghi khi đi khám'}/>
        <Stat icon="💰" label="Chi phí thai sản" value={vnd(actTotal || visitSpend)} sub={`Dự toán ${vnd(estTotal)}`} tone={actTotal > estTotal && estTotal > 0 ? 'bad' : 'ink'}/>
        <Stat icon="🧺" label="Đồ sơ sinh" value={`${it.rows.filter(i => i.bought).length}/${it.rows.length}`} sub={`Đã mua ${vnd(itemsBought)} / ${vnd(itemsTotal)}`}/>
      </div>

      <Tabs value={tab} onChange={setTab} items={[['milestones', '📍 Mốc khám'], ['visits', '🩺 Nhật ký khám', visits.length], ['costs', '💰 Chi phí & chế độ'], ['items', '🧺 Đồ sơ sinh', it.rows.filter(i => !i.bought).length]]}/>

      {tab === 'milestones' && (
        <Panel title="Các mốc khám thai quan trọng" sub="Tham khảo — luôn theo lịch hẹn của bác sĩ">
          <ol className="relative border-l-2 border-ink-100 ml-2 space-y-4">
            {PRENATAL_MILESTONES.map(m => {
              const st = done || g.weeks > m.to ? 'past' : g.weeks >= m.from ? 'now' : 'next'
              const hasVisit = visits.some(v => { const w = gestation(preg.due_date, new Date(v.date + 'T12:00:00')).weeks; return w >= m.from && w <= m.to })
              return (
                <li key={m.title} className="pl-5 relative">
                  <span className={cn('absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center text-[11px] text-white',
                    hasVisit ? 'bg-jade-500' : st === 'now' ? 'bg-sakura-500 animate-pulse' : st === 'past' ? 'bg-ink-300' : 'bg-gold-300')}>{hasVisit && '✓'}</span>
                  <p className={cn('text-sm font-semibold', st === 'now' ? 'text-sakura-700' : 'text-ink-900')}>
                    Tuần {m.from}–{m.to}: {m.title}
                    {st === 'now' && <span className="ml-2 text-[11px] font-bold bg-sakura-50 text-sakura-700 border border-sakura-200 rounded-full px-1.5">Đang đến</span>}
                    {hasVisit && <span className="ml-2 text-[11px] font-bold bg-jade-50 text-jade-700 border border-jade-200 rounded-full px-1.5">✓ Đã khám</span>}
                    {st === 'past' && !hasVisit && <span className="ml-2 text-[11px] text-ink-400">(chưa ghi lần khám)</span>}
                  </p>
                  <p className="text-xs text-ink-500 mt-0.5">{m.detail}</p>
                  {!done && st !== 'past' && <p className="text-xs text-ink-400 mt-0.5">Khoảng {fmtDate(new Date(new Date(preg.due_date + 'T12:00:00').getTime() - (280 - m.from * 7) * 864e5).toISOString().slice(0, 10))} – {fmtDate(new Date(new Date(preg.due_date + 'T12:00:00').getTime() - (280 - m.to * 7 - 6) * 864e5).toISOString().slice(0, 10))}</p>}
                </li>
              )
            })}
          </ol>
        </Panel>
      )}

      {tab === 'visits' && (
        <Panel title="Nhật ký khám thai" sub="Cân nặng, huyết áp, kết quả siêu âm, lời dặn bác sĩ" pad={false} right={canEdit && <button onClick={() => setForm({ kind: 'visit' })} className="btn btn-primary btn-xs">+ Ghi lần khám</button>}>
          {visits.length === 0 ? <Empty icon="🩺" title="Chưa ghi lần khám nào" action={canEdit && <button onClick={() => setForm({ kind: 'visit' })} className="btn btn-primary btn-sm">+ Ghi lần khám đầu tiên</button>}/> : (
            <div className="divide-y divide-ink-50">
              {visits.map(v => { const w = gestation(preg.due_date, new Date(v.date + 'T12:00:00')); return (
                <div key={v.id} className="px-5 py-3 flex gap-3 group">
                  <div className="w-14 text-center flex-shrink-0"><p className="font-display text-xl font-bold text-sakura-600 leading-none">{w.weeks}</p><p className="text-[11px] text-ink-400">tuần {w.days ? `+${w.days}` : ''}</p></div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink-900">{v.type}{v.place && <span className="font-normal text-ink-500"> · {v.place}</span>}</p>
                    <p className="text-xs text-ink-400">{fmtDate(v.date)}{v.mom_weight && ` · ⚖️ ${v.mom_weight} kg`}{v.blood_pressure && ` · 🩸 ${v.blood_pressure}`}{v.fetal_weight && ` · 👶 ${v.fetal_weight} g`}</p>
                    {v.notes && <p className="text-xs text-ink-600 mt-1 whitespace-pre-line">{v.notes}</p>}
                  </div>
                  {Number(v.cost) > 0 && <span className="text-sm font-bold text-ink-900 tabular flex-shrink-0">{vnd(v.cost)}</span>}
                  {canEdit && <RowActions onEdit={() => setForm({ kind: 'visit', row: v })} onDelete={() => ask('Xóa lần khám?', fmtDate(v.date), () => vC.remove(v.id))}/>}
                </div>
              ) })}
            </div>
          )}
        </Panel>
      )}

      {tab === 'costs' && (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] gap-4 items-start">
          <Panel title="Dự toán chi phí sinh" sub={`Dự toán ${vnd(estTotal)} · đã chi ${vnd(actTotal)}`} pad={false}
            right={<>{cs.rows.length > 0 && <button onClick={() => downloadCsv('chi-phi-thai-san.csv', [['Khoản', 'Dự toán', 'Thực chi', 'Chênh lệch'], ...cs.rows.map(c => [c.item, c.estimate, c.actual, Number(c.actual) - Number(c.estimate)]), ['TỔNG', estTotal, actTotal, actTotal - estTotal]])} className="btn btn-secondary btn-xs">⬇ Excel</button>}
              {canEdit && <button onClick={() => setForm({ kind: 'cost' })} className="btn btn-primary btn-xs">+ Khoản</button>}</>}>
            <table className="w-full text-sm">
              <thead><tr className="text-xs text-ink-400 text-left bg-ink-50/60">{['Khoản', 'Dự toán', 'Thực chi', ''].map(h => <th key={h} className="px-4 py-2 font-semibold">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-ink-50">
                {cs.rows.map(c => (
                  <tr key={c.id} className="group">
                    <td className="px-4 py-2.5 text-ink-800">{c.item}</td>
                    <td className="px-4 py-2.5 tabular text-ink-600 whitespace-nowrap">{vnd(c.estimate)}</td>
                    <td className={cn('px-4 py-2.5 tabular font-semibold whitespace-nowrap', Number(c.actual) > Number(c.estimate) ? 'text-red-600' : 'text-ink-900')}>{Number(c.actual) ? vnd(c.actual) : '—'}</td>
                    <td className="px-2 py-2.5">{canEdit && <RowActions onEdit={() => setForm({ kind: 'cost', row: c })} onDelete={() => ask('Xóa khoản?', c.item, () => cC.remove(c.id))}/>}</td>
                  </tr>
                ))}
                <tr className="bg-ink-50 font-bold"><td className="px-4 py-2.5">TỔNG</td><td className="px-4 py-2.5 tabular">{vnd(estTotal)}</td><td className={cn('px-4 py-2.5 tabular', actTotal > estTotal ? 'text-red-600' : 'text-jade-700')}>{vnd(actTotal)}</td><td/></tr>
              </tbody>
            </table>
          </Panel>
          <MaternityCalc/>
        </div>
      )}

      {tab === 'items' && (
        <Panel title="Danh sách đồ đi sinh & sơ sinh" sub={`${it.rows.filter(i => i.bought).length}/${it.rows.length} món đã mua · còn cần ${vnd(itemsTotal - itemsBought)}`} pad={false} right={canEdit && <button onClick={() => setForm({ kind: 'item' })} className="btn btn-primary btn-xs">+ Thêm đồ</button>}>
          {Array.from(new Set(it.rows.map(i => i.grp))).map(grp => (
            <div key={grp}>
              <p className="px-5 py-2 bg-ink-50/70 text-xs font-semibold text-ink-600 flex justify-between"><span>{grp}</span><span>{it.rows.filter(i => i.grp === grp && i.bought).length}/{it.rows.filter(i => i.grp === grp).length}</span></p>
              {it.rows.filter(i => i.grp === grp).map(i => (
                <div key={i.id} className={cn('px-5 py-2.5 flex items-center gap-3 group border-b border-ink-50', i.bought && 'opacity-60')}>
                  <input type="checkbox" disabled={!canEdit} checked={i.bought} onChange={() => iC.update(i.id, { bought: !i.bought }, true)} className="w-4 h-4 accent-jade-500 flex-shrink-0" aria-label="Đã mua"/>
                  <span className={cn('flex-1 text-sm text-ink-800', i.bought && 'line-through')}>{i.name}{!i.essential && <span className="ml-1.5 text-[11px] text-ink-400 border border-ink-200 rounded-full px-1.5">tùy chọn</span>}</span>
                  <span className="text-xs text-ink-400 tabular">{i.qty > 1 && `${i.qty} × `}{Number(i.price) ? vnd(i.price) : ''}</span>
                  {canEdit && <RowActions onEdit={() => setForm({ kind: 'item', row: i })} onDelete={() => ask('Xóa món đồ?', i.name, () => iC.remove(i.id))}/>}
                </div>
              ))}
            </div>
          ))}
          {it.rows.length === 0 && <Empty icon="🧺" title="Danh sách trống" action={canEdit && <button onClick={() => setForm({ kind: 'item' })} className="btn btn-primary btn-sm">+ Thêm đồ</button>}/>}
        </Panel>
      )}

      {form && cfg && <FormModal open key={form.kind + (form.row?.id ?? 'new')} title={cfg.title} fields={cfg.fields} initial={cfg.initial} onClose={() => setForm(null)} onSubmit={save} size="lg"/>}
      {confirmDialog}
    </div>
  )
}

/** Máy tính ước tính chế độ thai sản BHXH */
function MaternityCalc() {
  const [salary, setSalary] = useState('10000000')
  const [base, setBase] = useState('2340000')
  const [kids, setKids] = useState(1)
  const [fatherDays, setFatherDays] = useState(5)
  const r = maternityBenefit(Number(salary) || 0, Number(base) || 0, 6, kids, fatherDays)
  return (
    <Panel title="Ước tính chế độ thai sản BHXH" sub="Theo Luật BHXH 2024 (từ 1/7/2025) — chỉ để tham khảo">
      <div className="space-y-3">
        <div><label className="label !text-xs">Lương bình quân đóng BHXH 6 tháng trước khi nghỉ (mẹ)</label><input className="input font-mono" type="number" value={salary} onChange={e => setSalary(e.target.value)}/></div>
        <div className="grid grid-cols-3 gap-2">
          <div><label className="label !text-xs">Mức tham chiếu / lương cơ sở</label><input className="input font-mono !text-xs" type="number" value={base} onChange={e => setBase(e.target.value)}/></div>
          <div><label className="label !text-xs">Số con sinh</label><select className="input" value={kids} onChange={e => setKids(+e.target.value)}><option value={1}>1</option><option value={2}>2 (song sinh)</option><option value={3}>3</option></select></div>
          <div><label className="label !text-xs">Bố nghỉ (ngày)</label><select className="input" value={fatherDays} onChange={e => setFatherDays(+e.target.value)}><option value={5}>5 – sinh thường</option><option value={7}>7 – sinh mổ / &lt;32 tuần</option><option value={10}>10 – sinh đôi</option><option value={14}>14 – đôi + mổ</option></select></div>
        </div>
        <div className="rounded-xl bg-jade-50 border border-jade-200 p-4 space-y-1.5 text-sm">
          <p className="flex justify-between"><span className="text-ink-600">Trợ cấp một lần</span><b className="tabular">{vnd(r.oneTime)}</b></p>
          <p className="flex justify-between"><span className="text-ink-600">Nghỉ sinh {6 + kids - 1} tháng (100% lương BQ)</span><b className="tabular">{vnd(r.leave)}</b></p>
          <p className="flex justify-between border-t border-jade-200 pt-1.5"><span className="font-semibold text-jade-800">Mẹ nhận khoảng</span><b className="text-jade-800 text-lg tabular">{vnd(r.total)}</b></p>
          <p className="flex justify-between text-xs"><span className="text-ink-500">Bố nghỉ {fatherDays} ngày (nếu đóng BHXH)</span><span className="tabular">{vnd(r.father)}</span></p>
        </div>
        <p className="text-xs text-ink-400">Điều kiện thường gặp: đóng BHXH đủ 6 tháng trong 12 tháng trước khi sinh. Kiểm tra mức tham chiếu hiện hành và hỏi bộ phận nhân sự / cơ quan BHXH để có số chính xác.</p>
      </div>
    </Panel>
  )
}
