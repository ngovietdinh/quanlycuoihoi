'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useHousehold } from '@/components/family/HouseholdProvider'
import { useRows, useCrud, useConfirm, FormModal, Stat, Panel, Empty, Tabs, RowActions, today, daysUntil, type FieldDef } from '@/components/family/ui'
import { GrowthChart, RankBars } from '@/components/family/charts'
import { T } from '@/lib/api/family'
import { useToast } from '@/components/ui/Toast'
import { VACCINE_SCHEDULE, WHO, WHO_CV, MILESTONE_IDEAS, addMonths, ageText, ageMonths, growthStatus, catIcon } from '@/lib/family/data'
import { vnd, cn, fmtDate } from '@/lib/utils'
import type { Child, Vaccination, GrowthRecord, ChildEvent, Txn } from '@/types'

type Tab = 'vaccines' | 'growth' | 'costs' | 'diary'

export default function ChildrenPage() {
  const { household, canEdit } = useHousehold()
  const { success, error } = useToast()
  const kids = useRows<Child>(T.children, 'children')
  const kC = useCrud(T.children, kids.reload, 'hồ sơ con')
  const [sel, setSel] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('vaccines')
  const [form, setForm] = useState<null | { kind: 'child' | 'vaccine' | 'growth' | 'event'; row?: any; preset?: any }>(null)
  const [ask, confirmDialog] = useConfirm()

  const child = kids.rows.find(c => c.id === sel) ?? kids.rows[0]
  const filter = { child_id: child?.id ?? '00000000-0000-0000-0000-000000000000' }
  const vx = useRows<Vaccination>(T.vaccines, 'vaccinations', filter)
  const gr = useRows<GrowthRecord>(T.growth, 'growth_records', filter)
  const ev = useRows<ChildEvent>(T.childEvents, 'child_events', filter)
  const tx = useRows<Txn>(T.txns, 'transactions', filter)
  const vC = useCrud(T.vaccines, vx.reload, 'mũi tiêm'), gC = useCrud(T.growth, gr.reload, 'số đo'), eC = useCrud(T.childEvents, ev.reload, 'nhật ký')

  const childFields: FieldDef[] = [
    { key: 'name', label: 'Họ tên', required: true, half: true },
    { key: 'nickname', label: 'Tên ở nhà', half: true },
    { key: 'dob', label: 'Ngày sinh', type: 'date', required: true, half: true },
    { key: 'gender', label: 'Giới tính', type: 'chips', required: true, half: true, options: [{ value: 'male', label: '👦 Bé trai' }, { value: 'female', label: '👧 Bé gái' }] },
    { key: 'blood_type', label: 'Nhóm máu', type: 'select', half: true, options: ['A', 'B', 'AB', 'O', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
    { key: 'allergies', label: 'Dị ứng', half: true, placeholder: 'Thuốc, thức ăn…' },
    { key: 'seed', label: 'Tạo lịch tiêm chủng tham khảo theo ngày sinh', type: 'checkbox', show: v => !v.id },
    { key: 'notes', label: 'Ghi chú', type: 'textarea' },
  ]
  const vaccineFields: FieldDef[] = [
    { key: 'vaccine', label: 'Vắc-xin', required: true },
    { key: 'dose', label: 'Mũi / liều', half: true },
    { key: 'program', label: 'Chương trình', type: 'select', required: true, half: true, options: [{ value: 'epi', label: 'Tiêm chủng mở rộng (miễn phí)' }, { value: 'service', label: 'Tiêm dịch vụ' }] },
    { key: 'due_date', label: 'Ngày dự kiến', type: 'date', required: true, half: true },
    { key: 'done_date', label: 'Ngày đã tiêm', type: 'date', half: true },
    { key: 'place', label: 'Nơi tiêm', half: true },
    { key: 'cost', label: 'Chi phí (ghi vào Thu chi)', type: 'money', half: true, show: v => !!v.done_date && !vx.rows.find(x => x.id === form?.row?.id)?.done_date },
    { key: 'note', label: 'Ghi chú / phản ứng sau tiêm', type: 'textarea' },
  ]
  const growthFields: FieldDef[] = [
    { key: 'date', label: 'Ngày đo', type: 'date', required: true },
    { key: 'weight_kg', label: 'Cân nặng (kg)', type: 'number', step: '0.01', half: true },
    { key: 'height_cm', label: 'Chiều cao (cm)', type: 'number', step: '0.1', half: true },
    { key: 'head_cm', label: 'Vòng đầu (cm)', type: 'number', step: '0.1', half: true },
    { key: 'note', label: 'Ghi chú', half: true },
  ]
  const eventFields: FieldDef[] = [
    { key: 'kind', label: 'Loại', type: 'chips', required: true, options: [{ value: 'milestone', label: '⭐ Cột mốc' }, { value: 'medical', label: '🏥 Khám bệnh / ốm' }] },
    { key: 'title', label: 'Nội dung', required: true, placeholder: 'VD: Bước đi đầu tiên / Sốt siêu vi' },
    { key: 'date', label: 'Ngày', type: 'date', required: true, half: true },
    { key: 'photo_url', label: 'Link ảnh (tùy chọn)', half: true },
    { key: 'note', label: 'Chi tiết (chẩn đoán, thuốc, cảm nhận…)', type: 'textarea' },
  ]

  async function save(v: Record<string, any>) {
    const k = form!.kind, id = form!.row?.id
    if (k === 'child') {
      const { seed, ...row } = v
      if (id) return kC.update(id, row)
      const r = await T.children.create(household.id, row)
      if (r.error || !r.data) { error('Không tạo được hồ sơ', r.error ?? ''); return false }
      const cid = r.data[0].id
      if (seed) await T.vaccines.create(household.id, VACCINE_SCHEDULE.map(s => ({ child_id: cid, vaccine: s.vaccine, dose: s.dose, program: s.program, due_date: addMonths(row.dob, s.m) })))
      success(`Đã tạo hồ sơ cho ${row.name} 👶`, seed ? `Kèm ${VACCINE_SCHEDULE.length} mũi tiêm tham khảo` : undefined)
      setSel(cid); await kids.reload(); return true
    }
    if (k === 'vaccine') {
      const { cost, ...row } = v
      const ok = id ? await vC.update(id, row) : await vC.create({ ...row, child_id: child!.id })
      if (ok && cost > 0) await T.txns.create(household.id, { kind: 'expense', amount: cost, category: 'Sức khỏe & thuốc', child_id: child!.id, date: row.done_date || today(), note: `Tiêm ${row.vaccine}${row.dose ? ` (${row.dose})` : ''}` })
      return ok
    }
    if (k === 'growth') return id ? gC.update(id, v) : gC.create({ ...v, child_id: child!.id })
    if (k === 'event') return id ? eC.update(id, v) : eC.create({ ...v, child_id: child!.id })
  }
  const cfg = form && {
    child: { title: form.row ? 'Sửa hồ sơ' : 'Thêm hồ sơ con', fields: childFields, initial: form.row ?? { gender: 'male', seed: true } },
    vaccine: { title: form.row ? 'Cập nhật mũi tiêm' : 'Thêm mũi tiêm', fields: vaccineFields, initial: form.row ?? { program: 'service', due_date: today(), ...form.preset } },
    growth: { title: form.row ? 'Sửa số đo' : 'Ghi cân nặng / chiều cao', fields: growthFields, initial: form.row ?? { date: today() } },
    event: { title: form.row ? 'Sửa nhật ký' : 'Ghi nhật ký', fields: eventFields, initial: form.row ?? { kind: 'milestone', date: today(), ...form.preset } },
  }[form.kind]

  if (kids.loading) return <div className="p-6 max-w-6xl mx-auto w-full"><div className="h-48 skeleton"/></div>
  if (!child) return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto w-full">
      {kids.error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 mb-4">⚠️ {kids.error}</div>}
      <div className="card"><Empty icon="🧒" title="Hồ sơ các con" text="Lịch tiêm chủng tự động theo ngày sinh, biểu đồ cân nặng – chiều cao so với chuẩn WHO, chi phí nuôi con và nhật ký những cột mốc đáng nhớ."
        action={canEdit && <button onClick={() => setForm({ kind: 'child' })} className="btn btn-primary">👶 Thêm hồ sơ con</button>}/></div>
      {form && cfg && <FormModal open key="new" title={cfg.title} fields={cfg.fields} initial={cfg.initial} onClose={() => setForm(null)} onSubmit={save} size="lg"/>}
    </div>
  )

  const months = ageMonths(child.dob)
  const vacs = vx.rows
  const overdue = vacs.filter(v => !v.done_date && daysUntil(v.due_date) < 0)
  const upcoming = vacs.filter(v => !v.done_date && daysUntil(v.due_date) >= 0).slice(0, 3)
  const latest = [...gr.rows].sort((a, b) => b.date.localeCompare(a.date))[0]
  const spentYear = tx.rows.filter(t => t.kind === 'expense' && t.date.startsWith(String(new Date().getFullYear()))).reduce((s, t) => s + Number(t.amount), 0)
  const spentAll = tx.rows.filter(t => t.kind === 'expense').reduce((s, t) => s + Number(t.amount), 0)

  const bands = (idx: 1 | 2, cv: number) => WHO[child.gender].filter(r => r[0] <= Math.max(12, Math.ceil(months) + 6)).map(r => ({ x: r[0], med: r[idx], lo: +(r[idx] * (1 - 2 * cv)).toFixed(2), hi: +(r[idx] * (1 + 2 * cv)).toFixed(2) }))
  const pts = (key: 'weight_kg' | 'height_cm') => gr.rows.filter(r => r[key] != null && ageMonths(child.dob, r.date) <= 60).map(r => ({ x: +ageMonths(child.dob, r.date).toFixed(1), y: Number(r[key]), label: fmtDate(r.date) }))
  const wStat = latest?.weight_kg ? growthStatus('weight', child.gender, ageMonths(child.dob, latest.date), Number(latest.weight_kg)) : null
  const hStat = latest?.height_cm ? growthStatus('height', child.gender, ageMonths(child.dob, latest.date), Number(latest.height_cm)) : null
  const TONE = { good: 'text-jade-700', warn: 'text-gold-700', bad: 'text-red-600' }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-4">
      <div className="flex flex-wrap gap-2">
        {kids.rows.map(c => (
          <button key={c.id} onClick={() => setSel(c.id)} className={cn('flex items-center gap-2 pl-1.5 pr-3.5 py-1.5 rounded-full border text-sm', c.id === child.id ? 'bg-ink-900 text-white border-ink-900' : 'bg-white border-ink-200 text-ink-700')}>
            <span className="w-7 h-7 rounded-full flex items-center justify-center text-base bg-white/20">{c.gender === 'male' ? '👦' : '👧'}</span>{c.nickname || c.name}
          </button>
        ))}
        {canEdit && <button onClick={() => setForm({ kind: 'child' })} className="px-3.5 py-1.5 rounded-full text-sm border border-dashed border-ink-300 text-ink-500 hover:border-sakura-400">+ Thêm con</button>}
      </div>

      <div className="hero p-5 sm:p-7 text-white">
        <div className="relative flex flex-wrap items-center gap-5">
          <div className="w-20 h-20 rounded-3xl bg-white/15 border border-white/20 flex items-center justify-center text-4xl overflow-hidden">
            {child.avatar_url ? <img src={child.avatar_url} alt="" className="w-full h-full object-cover"/> : child.gender === 'male' ? '👦' : '👧'}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-3xl font-bold">{child.name}{child.nickname && <span className="text-white/60 text-xl"> ({child.nickname})</span>}</h1>
            <p className="text-white/70 text-sm">{ageText(child.dob)} · sinh {fmtDate(child.dob)}{child.blood_type && ` · nhóm máu ${child.blood_type}`}</p>
            {child.allergies && <p className="text-sm mt-1"><span className="bg-red-500/80 rounded-full px-2 py-0.5 text-xs font-semibold">⚠ Dị ứng: {child.allergies}</span></p>}
          </div>
          {canEdit && <button onClick={() => setForm({ kind: 'child', row: child })} className="btn btn-sm text-white border border-white/25 bg-white/10 hover:bg-white/20">✎ Sửa hồ sơ</button>}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 stagger">
        <Stat icon="💉" label="Tiêm chủng" value={`${vacs.filter(v => v.done_date).length}/${vacs.length}`} tone={overdue.length ? 'bad' : 'ink'} sub={overdue.length ? `⛔ ${overdue.length} mũi quá hạn` : upcoming[0] ? `Tiếp theo: ${fmtDate(upcoming[0].due_date)}` : 'Không có mũi sắp tới'}/>
        <Stat icon="⚖️" label="Cân nặng" value={latest?.weight_kg ? `${latest.weight_kg} kg` : '—'} sub={wStat ? <span className={TONE[wStat.tone]}>{wStat.label}</span> : 'Chưa có số đo'}/>
        <Stat icon="📏" label="Chiều cao" value={latest?.height_cm ? `${latest.height_cm} cm` : '—'} sub={hStat ? <span className={TONE[hStat.tone]}>{hStat.label}</span> : latest ? `Đo ngày ${fmtDate(latest.date)}` : 'Chưa có số đo'}/>
        <Stat icon="💰" label={`Chi cho con năm ${new Date().getFullYear()}`} value={vnd(spentYear)} sub={`Tổng từ trước tới nay ${vnd(spentAll)}`}/>
      </div>

      <Tabs value={tab} onChange={setTab} items={[['vaccines', '💉 Tiêm chủng', overdue.length || undefined], ['growth', '📈 Tăng trưởng', gr.rows.length], ['costs', '💰 Chi phí'], ['diary', '📔 Nhật ký', ev.rows.length]]}/>

      {tab === 'vaccines' && (
        <Panel title="Lịch tiêm chủng" sub="Tham khảo chương trình TCMR & tiêm dịch vụ phổ biến — theo chỉ định của bác sĩ" pad={false} right={canEdit && <button onClick={() => setForm({ kind: 'vaccine' })} className="btn btn-primary btn-xs">+ Thêm mũi</button>}>
          {vacs.length === 0 ? <Empty icon="💉" title="Chưa có lịch tiêm" action={canEdit && <button onClick={async () => { const ok = await vC.create(VACCINE_SCHEDULE.map(s => ({ child_id: child.id, vaccine: s.vaccine, dose: s.dose, program: s.program, due_date: addMonths(child.dob, s.m) })), true); if (ok) success('Đã tạo lịch tiêm tham khảo') }} className="btn btn-primary btn-sm">✨ Tạo lịch tiêm theo ngày sinh</button>}/> : (
            <div className="divide-y divide-ink-50">
              {vacs.map(v => {
                const d = daysUntil(v.due_date)
                const st = v.done_date ? ['✓ Đã tiêm', 'bg-jade-50 text-jade-700 border-jade-200'] : d < 0 ? [`⛔ Quá ${-d} ngày`, 'bg-red-50 text-red-700 border-red-200'] : d <= 14 ? [`🔔 Còn ${d} ngày`, 'bg-gold-50 text-gold-700 border-gold-200'] : [fmtDate(v.due_date), 'bg-ink-50 text-ink-500 border-ink-200']
                return (
                  <div key={v.id} className={cn('px-5 py-2.5 flex items-center gap-3 group', v.done_date && 'opacity-70')}>
                    <input type="checkbox" disabled={!canEdit} checked={!!v.done_date} onChange={() => v.done_date ? vC.update(v.id, { done_date: null }, true) : setForm({ kind: 'vaccine', row: { ...v, done_date: today() } })} className="w-4 h-4 accent-jade-500 flex-shrink-0" aria-label="Đã tiêm"/>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-ink-900">{v.vaccine} {v.dose && <span className="text-ink-400 font-normal">· {v.dose}</span>}</p>
                      <p className="text-xs text-ink-400">{v.program === 'epi' ? '🏛 TCMR miễn phí' : '💉 Dịch vụ'} · dự kiến {fmtDate(v.due_date)}{v.done_date && ` · đã tiêm ${fmtDate(v.done_date)}`}{v.place && ` · ${v.place}`}</p>
                    </div>
                    <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0', st[1])}>{st[0]}</span>
                    {canEdit && <RowActions onEdit={() => setForm({ kind: 'vaccine', row: v })} onDelete={() => ask('Xóa mũi tiêm?', v.vaccine, () => vC.remove(v.id))}/>}
                  </div>
                )
              })}
            </div>
          )}
        </Panel>
      )}

      {tab === 'growth' && (
        <div className="space-y-4">
          <div className="flex justify-end">{canEdit && <button onClick={() => setForm({ kind: 'growth' })} className="btn btn-primary btn-sm">+ Ghi số đo</button>}</div>
          {months > 60 && <p className="text-xs text-ink-500 card p-3">Biểu đồ so sánh chuẩn WHO áp dụng cho trẻ 0–5 tuổi. Các số đo sau 5 tuổi vẫn được lưu trong bảng.</p>}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Panel title="Cân nặng theo tháng tuổi (kg)" sub="So với chuẩn WHO — gần đúng, chỉ tham khảo"><GrowthChart points={pts('weight_kg')} bands={bands(1, WHO_CV.weight)} unit="kg"/></Panel>
            <Panel title="Chiều cao theo tháng tuổi (cm)" sub="So với chuẩn WHO — gần đúng, chỉ tham khảo"><GrowthChart points={pts('height_cm')} bands={bands(2, WHO_CV.height)} unit="cm"/></Panel>
          </div>
          <Panel title="Bảng số đo" pad={false}>
            {gr.rows.length === 0 ? <Empty icon="📏" title="Chưa có số đo" text="Ghi cân nặng, chiều cao mỗi lần khám hoặc mỗi tháng để theo dõi bé phát triển."/> : (
              <div className="overflow-x-auto"><table className="w-full text-sm min-w-[520px]">
                <thead><tr className="text-xs text-ink-400 text-left bg-ink-50/60">{['Ngày', 'Tuổi', 'Cân nặng', 'Chiều cao', 'Vòng đầu', ''].map(h => <th key={h} className="px-4 py-2 font-semibold">{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-ink-50">
                  {[...gr.rows].reverse().map(r => { const m = ageMonths(child.dob, r.date); const w = r.weight_kg ? growthStatus('weight', child.gender, m, Number(r.weight_kg)) : null; const h = r.height_cm ? growthStatus('height', child.gender, m, Number(r.height_cm)) : null; return (
                    <tr key={r.id} className="group">
                      <td className="px-4 py-2">{fmtDate(r.date)}</td><td className="px-4 py-2 text-ink-500">{ageText(child.dob, new Date(r.date + 'T12:00:00'))}</td>
                      <td className="px-4 py-2 tabular">{r.weight_kg ?? '—'} {w && m <= 60 && <span className={cn('text-[11px] ml-1', TONE[w.tone])}>{w.label}</span>}</td>
                      <td className="px-4 py-2 tabular">{r.height_cm ?? '—'} {h && m <= 60 && <span className={cn('text-[11px] ml-1', TONE[h.tone])}>{h.label}</span>}</td>
                      <td className="px-4 py-2 tabular">{r.head_cm ?? '—'}</td>
                      <td className="px-2 py-2">{canEdit && <RowActions onEdit={() => setForm({ kind: 'growth', row: r })} onDelete={() => ask('Xóa số đo?', fmtDate(r.date), () => gC.remove(r.id))}/>}</td>
                    </tr>
                  ) })}
                </tbody>
              </table></div>
            )}
          </Panel>
        </div>
      )}

      {tab === 'costs' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
          <Panel title={`Chi phí nuôi ${child.nickname || child.name} theo danh mục`} sub={`Tổng ${vnd(spentAll)} · ghi ở mục Thu chi, chọn "Chi cho con"`} right={<Link href="/family/finance" className="btn btn-secondary btn-xs">Mở Thu chi →</Link>}>
            <RankBars rows={Array.from(tx.rows.filter(t => t.kind === 'expense').reduce((m, t) => m.set(t.category, (m.get(t.category) ?? 0) + Number(t.amount)), new Map<string, number>()).entries())} total={spentAll}/>
          </Panel>
          <Panel title="Các khoản chi gần đây" pad={false}>
            {tx.rows.length === 0 ? <Empty icon="🧾" title="Chưa có khoản chi nào cho bé" text="Khi ghi chi tiêu ở mục Thu chi (sữa, bỉm, học phí, khám bệnh…), chọn tên bé ở ô “Chi cho con”."/> : (
              <div className="divide-y divide-ink-50 max-h-[420px] overflow-y-auto">
                {tx.rows.slice(0, 40).map(t => (
                  <div key={t.id} className="px-5 py-2.5 flex items-center gap-3 text-sm">
                    <span className="text-lg">{catIcon(t.category)}</span>
                    <div className="min-w-0 flex-1"><p className="truncate text-ink-800">{t.note || t.category}</p><p className="text-xs text-ink-400">{fmtDate(t.date)} · {t.category}</p></div>
                    <b className="tabular text-ink-900">{vnd(t.amount)}</b>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>
      )}

      {tab === 'diary' && (
        <Panel title="Nhật ký của bé" sub="Cột mốc đáng nhớ & sổ khám bệnh" pad={false} right={canEdit && <button onClick={() => setForm({ kind: 'event' })} className="btn btn-primary btn-xs">+ Ghi nhật ký</button>}>
          {canEdit && <div className="px-5 py-3 border-b border-ink-100 flex flex-wrap gap-1.5">{MILESTONE_IDEAS.filter(m => !ev.rows.some(e => e.title === m)).map(m => <button key={m} onClick={() => setForm({ kind: 'event', preset: { title: m } })} className="tag border bg-white text-ink-600 border-ink-200 hover:border-sakura-400 normal-case tracking-normal text-xs">+ {m}</button>)}</div>}
          {ev.rows.length === 0 ? <Empty icon="📔" title="Chưa có nhật ký" text="Lưu lại lần đầu bé lẫy, mọc răng, tập đi… và các lần ốm, thuốc đã dùng để tiện theo dõi."/> : (
            <ol className="px-5 py-4 space-y-4 relative">
              {ev.rows.map(e => (
                <li key={e.id} className="flex gap-3 group">
                  <span className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', e.kind === 'milestone' ? 'bg-gold-50' : 'bg-red-50')}>{e.kind === 'milestone' ? '⭐' : '🏥'}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink-900">{e.title}</p>
                    <p className="text-xs text-ink-400">{fmtDate(e.date)} · {ageText(child.dob, new Date(e.date + 'T12:00:00'))}</p>
                    {e.note && <p className="text-xs text-ink-600 mt-1 whitespace-pre-line">{e.note}</p>}
                    {e.photo_url && <img src={e.photo_url} alt="" className="mt-2 rounded-xl max-h-48 object-cover"/>}
                  </div>
                  {canEdit && <RowActions onEdit={() => setForm({ kind: 'event', row: e })} onDelete={() => ask('Xóa nhật ký?', e.title, () => eC.remove(e.id))}/>}
                </li>
              ))}
            </ol>
          )}
        </Panel>
      )}

      {form && cfg && <FormModal open key={form.kind + (form.row?.id ?? 'new') + (form.preset?.title ?? '')} title={cfg.title} fields={cfg.fields} initial={cfg.initial} onClose={() => setForm(null)} onSubmit={save} size="lg"/>}
      {confirmDialog}
    </div>
  )
}
