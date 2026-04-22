'use client'
import { useState, useEffect, FormEvent } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, formatDate, STATUS_LABELS, PRIORITY_LABELS } from '@/lib/utils'
import type { Task, TaskStatus, TaskPriority } from '@/types'

interface TaskModalProps {
  open: boolean
  onClose: () => void
  onSave: (data: Partial<Task>) => Promise<void>
  task?: Task
  defaultStatus?: TaskStatus
}

export function TaskModal({ open, onClose, onSave, task, defaultStatus = 'todo' }: TaskModalProps) {
  const [form, setForm] = useState({
    title: '', description: '', status: defaultStatus as TaskStatus,
    priority: 'medium' as TaskPriority, deadline: '', cost_estimate: '', cost_actual: '',
  })
  const [saving, setSaving] = useState(false)
  const sf = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title, description: task.description || '',
        status: task.status, priority: task.priority,
        deadline: task.deadline || '', cost_estimate: String(task.cost_estimate || ''),
        cost_actual: String(task.cost_actual || ''),
      })
    } else {
      setForm({ title:'', description:'', status:defaultStatus, priority:'medium', deadline:'', cost_estimate:'', cost_actual:'' })
    }
  }, [task, defaultStatus, open])

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) return
    setSaving(true)
    await onSave({ ...form, cost_estimate: Number(form.cost_estimate) || 0, cost_actual: Number(form.cost_actual) || 0 })
    setSaving(false)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={task ? 'Chỉnh sửa đầu mục' : 'Thêm đầu mục mới'}
      description={task ? `Cập nhật thông tin cho "${task.title}"` : 'Tạo một đầu mục công việc mới'}
      size="lg"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>Hủy</Button>
          <Button size="sm" loading={saving} onClick={handleSave as any}>
            {task ? 'Lưu thay đổi' : 'Thêm đầu mục'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSave} className="space-y-4">
        <Input
          label="Tên đầu mục *"
          value={form.title}
          onChange={e => sf('title', e.target.value)}
          placeholder="VD: Đặt mâm quả trầu cau"
          required
        />

        <Textarea
          label="Mô tả"
          value={form.description}
          onChange={e => sf('description', e.target.value)}
          placeholder="Chi tiết cần chuẩn bị..."
          rows={3}
        />

        <div className="grid grid-cols-2 gap-3">
          <Select label="Trạng thái" value={form.status} onChange={e => sf('status', e.target.value)}>
            <option value="todo">Chưa làm</option>
            <option value="in_progress">Đang thực hiện</option>
            <option value="done">Hoàn thành</option>
          </Select>
          <Select label="Ưu tiên" value={form.priority} onChange={e => sf('priority', e.target.value)}>
            <option value="low">Thấp</option>
            <option value="medium">Trung bình</option>
            <option value="high">Cao</option>
          </Select>
        </div>

        <Input
          label="Hạn chót"
          type="date"
          value={form.deadline}
          onChange={e => sf('deadline', e.target.value)}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Chi phí dự kiến (VNĐ)"
            type="number"
            value={form.cost_estimate}
            onChange={e => sf('cost_estimate', e.target.value)}
            placeholder="0"
          />
          <Input
            label="Chi phí thực tế (VNĐ)"
            type="number"
            value={form.cost_actual}
            onChange={e => sf('cost_actual', e.target.value)}
            placeholder="0"
          />
        </div>

        {/* Preview badges */}
        {form.title && (
          <div className="p-3 bg-stone-50 rounded-xl border border-stone-100">
            <p className="text-xs text-stone-400 mb-2">Xem trước</p>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={form.priority as any} dot>{PRIORITY_LABELS[form.priority]}</Badge>
              <Badge variant={form.status as any} dot>{STATUS_LABELS[form.status]}</Badge>
              {form.deadline && <Badge variant="default">📅 {formatDate(form.deadline)}</Badge>}
              {form.cost_estimate && <Badge variant="default">💰 {formatCurrency(Number(form.cost_estimate))}</Badge>}
            </div>
          </div>
        )}
      </form>
    </Modal>
  )
}
