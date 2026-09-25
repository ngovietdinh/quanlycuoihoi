'use client'
import { useEffect, useState, FormEvent } from 'react'
import { Modal } from '@/components/ui/Modal'
import { vnd, cn, EXPENSE_CATEGORIES, CATEGORY_ICONS } from '@/lib/utils'
import type { Task, TaskStatus, Expense, Project, ProjectMember, Vendor } from '@/types'

// ── Nhãn ──────────────────────────────────────────────────────────────────────
export const TASK_TAGS = ['Bắt buộc', 'Tùy chọn', 'Đã đặt cọc', 'Cần thanh toán', 'Ưu tiên cao', 'Đang chờ', 'Đã xong']
export const TAG_COLORS: Record<string, string> = {
  'Bắt buộc': 'bg-red-50 text-red-700 border-red-200', 'Tùy chọn': 'bg-blue-50 text-blue-700 border-blue-200',
  'Đã đặt cọc': 'bg-gold-50 text-gold-700 border-gold-200', 'Cần thanh toán': 'bg-sakura-50 text-sakura-700 border-sakura-200',
  'Ưu tiên cao': 'bg-orange-50 text-orange-700 border-orange-200', 'Đang chờ': 'bg-purple-50 text-purple-700 border-purple-200',
  'Đã xong': 'bg-jade-50 text-jade-700 border-jade-200',
  'truyền thống': 'bg-amber-50 text-amber-700 border-amber-200', 'hiện đại': 'bg-blue-50 text-blue-700 border-blue-200',
  'tiết kiệm': 'bg-jade-50 text-jade-700 border-jade-200', 'sang trọng': 'bg-sakura-50 text-sakura-700 border-sakura-200',
  'miền trung': 'bg-orange-50 text-orange-700 border-orange-200', 'miền bắc': 'bg-purple-50 text-purple-700 border-purple-200',
  'miền nam': 'bg-teal-50 text-teal-700 border-teal-200',
}
export const PROJECT_TAGS = ['truyền thống', 'hiện đại', 'tiết kiệm', 'sang trọng', 'miền trung', 'miền bắc', 'miền nam']

export function TagPill({ tag }: { tag: string }) {
  return <span className={`tag border ${TAG_COLORS[tag] ?? 'bg-ink-50 text-ink-600 border-ink-200'}`}>{tag}</span>
}
export function TagPicker({ all, value, onChange }: { all: string[]; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {all.map(tag => {
        const on = value.includes(tag)
        return (
          <button key={tag} type="button" onClick={() => onChange(on ? value.filter(t => t !== tag) : [...value, tag])}
            className={cn('tag border transition-all', on ? (TAG_COLORS[tag] ?? '') + ' ring-2 ring-offset-1 ring-sakura-300' : 'bg-ink-50 text-ink-500 border-ink-200 hover:border-ink-300')}>
            {on && '✓ '}{tag}
          </button>
        )
      })}
    </div>
  )
}

export function Initial({ name, url, size = 'w-6 h-6 text-[10px]' }: { name?: string | null; url?: string | null; size?: string }) {
  if (url) return <img src={url} alt={name ?? ''} title={name ?? ''} className={cn('rounded-full object-cover flex-shrink-0', size)}/>
  return (
    <span title={name ?? ''} className={cn('rounded-full flex items-center justify-center text-white font-bold flex-shrink-0', size)} style={{ background: 'linear-gradient(135deg,#ff6b96,#f59e0b)' }}>
      {(name || '?').trim()[0]?.toUpperCase()}
    </span>
  )
}

const Spinner = () => <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>

// ── Đầu mục công việc ─────────────────────────────────────────────────────────
export type TaskForm = { title: string; description: string; status: TaskStatus; priority: string; deadline: string; cost_estimate: number; cost_actual: number; tags: string[]; assigned_to: string | null }

/** Luôn được mount lại theo `key` khi mở → form không còn giữ dữ liệu của đầu mục trước (lỗi cũ) */
export function TaskModal({ open, onClose, onSave, task, defaultStatus, members }:
  { open: boolean; onClose: () => void; onSave: (d: TaskForm) => Promise<boolean | void>; task?: Task; defaultStatus: TaskStatus; members: ProjectMember[] }) {
  const [form, setForm] = useState({
    title: task?.title ?? '', description: task?.description ?? '', status: task?.status ?? defaultStatus, priority: task?.priority ?? 'medium',
    deadline: task?.deadline ?? '', cost_estimate: task?.cost_estimate ? String(task.cost_estimate) : '', cost_actual: task?.cost_actual ? String(task.cost_actual) : '',
    tags: (task?.tags ?? []) as string[], assigned_to: task?.assigned_to ?? '',
  })
  const [saving, setSaving] = useState(false)
  const sf = (k: keyof typeof form, v: any) => setForm(f => ({ ...f, [k]: v }))

  async function submit(e?: FormEvent) {
    e?.preventDefault(); if (!form.title.trim()) return
    setSaving(true)
    const ok = await onSave({ ...form, title: form.title.trim(), cost_estimate: Number(form.cost_estimate) || 0, cost_actual: Number(form.cost_actual) || 0, assigned_to: form.assigned_to || null })
    setSaving(false)
    if (ok !== false) onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={task ? 'Chỉnh sửa đầu mục' : 'Thêm đầu mục mới'} subtitle={task ? `Cập nhật “${task.title}”` : 'Tạo công việc cần theo dõi'} size="lg"
      footer={<>
        <button onClick={onClose} className="btn btn-ghost btn-sm">Hủy</button>
        <button onClick={() => submit()} disabled={saving || !form.title.trim()} className="btn btn-primary btn-sm">{saving ? <><Spinner/> Đang lưu…</> : task ? '✓ Lưu thay đổi' : '+ Thêm đầu mục'}</button>
      </>}>
      <form onSubmit={submit} className="space-y-4">
        <div><label className="label">Tên đầu mục *</label><input className="input" value={form.title} onChange={e => sf('title', e.target.value)} placeholder="VD: Đặt mâm quả trầu cau" autoFocus required/></div>
        <div><label className="label">Mô tả chi tiết</label><textarea className="input resize-none" rows={2} value={form.description} onChange={e => sf('description', e.target.value)} placeholder="Ghi chú, liên hệ, yêu cầu…"/></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Trạng thái</label>
            <select className="input" value={form.status} onChange={e => sf('status', e.target.value)}>
              <option value="todo">Chưa làm</option><option value="in_progress">Đang thực hiện</option><option value="done">Hoàn thành</option>
            </select></div>
          <div><label className="label">Mức ưu tiên</label>
            <select className="input" value={form.priority} onChange={e => sf('priority', e.target.value)}>
              <option value="low">🔵 Thấp</option><option value="medium">🟡 Trung bình</option><option value="high">🔴 Cao</option>
            </select></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Hạn chót</label><input className="input" type="date" value={form.deadline} onChange={e => sf('deadline', e.target.value)}/></div>
          <div><label className="label">Người phụ trách</label>
            <select className="input" value={form.assigned_to} onChange={e => sf('assigned_to', e.target.value)}>
              <option value="">— Chưa giao —</option>
              {members.map(m => <option key={m.user_id} value={m.user_id}>{m.full_name || m.email}</option>)}
            </select></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Chi phí dự kiến (VNĐ)</label><input className="input font-mono" type="number" min={0} value={form.cost_estimate} onChange={e => sf('cost_estimate', e.target.value)} placeholder="0"/></div>
          <div><label className="label">Chi phí thực tế (VNĐ)</label><input className="input font-mono" type="number" min={0} value={form.cost_actual} onChange={e => sf('cost_actual', e.target.value)} placeholder="0"/>
            <p className="text-[10px] text-ink-400 mt-1">Để so sánh — tổng đã chi lấy từ mục Chi tiêu</p></div>
        </div>
        <div><label className="label">Nhãn</label><TagPicker all={TASK_TAGS} value={form.tags} onChange={v => sf('tags', v)}/></div>
      </form>
    </Modal>
  )
}

// ── Chi tiêu (thêm / sửa) ─────────────────────────────────────────────────────
export type ExpenseForm = { amount: number; note: string; category: string; task_id: string | null; vendor_id: string | null; spent_at: string }
export function ExpenseModal({ open, onClose, onSave, tasks, vendors, expense, preset }:
  { open: boolean; onClose: () => void; onSave: (d: ExpenseForm) => Promise<boolean | void>; tasks: Task[]; vendors: Vendor[]; expense?: Expense; preset?: Partial<ExpenseForm> }) {
  const today = new Date().toISOString().slice(0, 10)
  const [form, setForm] = useState({
    amount: expense ? String(expense.amount) : preset?.amount ? String(preset.amount) : '', note: expense?.note ?? preset?.note ?? '',
    category: expense?.category ?? preset?.category ?? 'Khác', task_id: expense?.task_id ?? '', vendor_id: expense?.vendor_id ?? preset?.vendor_id ?? '',
    spent_at: expense?.spent_at ?? today,
  })
  const [saving, setSaving] = useState(false)
  const sf = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }))
  // Chọn nhà cung cấp → tự điền danh mục
  useEffect(() => {
    const v = vendors.find(x => x.id === form.vendor_id)
    if (v && EXPENSE_CATEGORIES.includes(v.category) && !expense) setForm(f => ({ ...f, category: v.category }))
  }, [form.vendor_id, vendors, expense])

  async function submit(e?: FormEvent) {
    e?.preventDefault(); if (!Number(form.amount)) return
    setSaving(true)
    const ok = await onSave({ ...form, amount: Number(form.amount), task_id: form.task_id || null, vendor_id: form.vendor_id || null })
    setSaving(false)
    if (ok !== false) onClose()
  }
  const quick = [500000, 1000000, 5000000, 10000000]
  return (
    <Modal open={open} onClose={onClose} title={expense ? 'Sửa khoản chi' : 'Ghi nhận chi tiêu'} subtitle="Chi tiêu được cộng vào tổng đã chi của dự án" size="md"
      footer={<>
        <button onClick={onClose} className="btn btn-ghost btn-sm">Hủy</button>
        <button onClick={() => submit()} disabled={saving || !Number(form.amount)} className="btn btn-gold btn-sm">{saving ? <><Spinner/> Đang lưu…</> : '💸 Lưu chi tiêu'}</button>
      </>}>
      <form onSubmit={submit} className="space-y-3.5">
        <div>
          <label className="label">Số tiền (VNĐ) *</label>
          <input className="input font-mono text-lg" type="number" min={1} value={form.amount} onChange={e => sf('amount', e.target.value)} placeholder="5000000" autoFocus required/>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {quick.map(q => <button key={q} type="button" onClick={() => sf('amount', String((Number(form.amount) || 0) + q))} className="tag border bg-ink-50 text-ink-600 border-ink-200 hover:border-ink-400">+{vnd(q)}</button>)}
          </div>
          {Number(form.amount) > 0 && <p className="text-sm font-bold text-jade-700 mt-1.5 tabular">= {vnd(Number(form.amount))}</p>}
        </div>
        <div>
          <label className="label">Danh mục</label>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
            {EXPENSE_CATEGORIES.map(c => (
              <button key={c} type="button" onClick={() => sf('category', c)}
                className={cn('px-2 py-2 rounded-xl border text-[11px] font-medium leading-tight text-center transition', form.category === c ? 'border-gold-500 bg-gold-50 text-gold-800' : 'border-ink-100 bg-white text-ink-600 hover:border-ink-300')}>
                <span className="block text-base">{CATEGORY_ICONS[c]}</span>{c}
              </button>
            ))}
          </div>
        </div>
        <div><label className="label">Ghi chú</label><input className="input" value={form.note} onChange={e => sf('note', e.target.value)} placeholder="VD: Đặt cọc nhà hàng 30%"/></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Nhà cung cấp</label>
            <select className="input" value={form.vendor_id} onChange={e => sf('vendor_id', e.target.value)}>
              <option value="">— Không —</option>
              {vendors.filter(v => v.status !== 'cancelled').map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select></div>
          <div><label className="label">Ngày chi</label><input className="input" type="date" value={form.spent_at} onChange={e => sf('spent_at', e.target.value)}/></div>
        </div>
        <div><label className="label">Liên kết đầu mục</label>
          <select className="input" value={form.task_id} onChange={e => sf('task_id', e.target.value)}>
            <option value="">— Không liên kết —</option>
            {tasks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select></div>
      </form>
    </Modal>
  )
}

// ── Sửa thông tin dự án ───────────────────────────────────────────────────────
export type ProjectForm = { name: string; description: string; event_date: string; venue: string; budget_total: number; tags: string[] }
export function EditProjectModal({ open, onClose, project, onSave }: { open: boolean; onClose: () => void; project: Project; onSave: (d: ProjectForm) => Promise<boolean | void> }) {
  const [form, setForm] = useState({ name: project.name, description: project.description ?? '', event_date: project.event_date ?? '', venue: project.venue ?? '', budget_total: String(project.budget_total ?? ''), tags: (project.tags ?? []) as string[] })
  const [saving, setSaving] = useState(false)
  const sf = (k: keyof typeof form, v: any) => setForm(f => ({ ...f, [k]: v }))
  async function submit(e?: FormEvent) {
    e?.preventDefault(); if (!form.name.trim()) return
    setSaving(true)
    const ok = await onSave({ ...form, name: form.name.trim(), budget_total: Number(form.budget_total) || 0 })
    setSaving(false)
    if (ok !== false) onClose()
  }
  return (
    <Modal open={open} onClose={onClose} title="Chỉnh sửa dự án" size="lg"
      footer={<>
        <button onClick={onClose} className="btn btn-ghost btn-sm">Hủy</button>
        <button onClick={() => submit()} disabled={saving} className="btn btn-primary btn-sm">{saving ? <Spinner/> : '✓ Lưu thay đổi'}</button>
      </>}>
      <form onSubmit={submit} className="space-y-4">
        <div><label className="label">Tên dự án *</label><input className="input" value={form.name} onChange={e => sf('name', e.target.value)} required/></div>
        <div><label className="label">Mô tả</label><textarea className="input resize-none" rows={2} value={form.description} onChange={e => sf('description', e.target.value)}/></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Ngày tổ chức</label><input className="input" type="date" value={form.event_date} onChange={e => sf('event_date', e.target.value)}/></div>
          <div><label className="label">Ngân sách (VNĐ)</label><input className="input font-mono" type="number" min={0} value={form.budget_total} onChange={e => sf('budget_total', e.target.value)}/>
            {Number(form.budget_total) > 0 && <p className="text-[11px] text-ink-400 mt-1 tabular">{vnd(Number(form.budget_total))}</p>}</div>
        </div>
        <div><label className="label">Địa điểm</label><input className="input" value={form.venue} onChange={e => sf('venue', e.target.value)}/></div>
        <div><label className="label">Nhãn dự án</label><TagPicker all={PROJECT_TAGS} value={form.tags} onChange={v => sf('tags', v)}/></div>
      </form>
    </Modal>
  )
}
