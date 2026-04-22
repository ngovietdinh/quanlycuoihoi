'use client'
import { useState, useCallback, useRef } from 'react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatCurrency, formatDate, getDeadlineLabel, STATUS_LABELS, PRIORITY_LABELS } from '@/lib/utils'
import type { Task, TaskStatus } from '@/types'

const COLUMNS: { id: TaskStatus; label: string; color: string; bg: string; border: string }[] = [
  { id: 'todo',        label: STATUS_LABELS.todo,        color: 'text-stone-600', bg: 'bg-stone-50',   border: 'border-stone-200' },
  { id: 'in_progress', label: STATUS_LABELS.in_progress, color: 'text-amber-700', bg: 'bg-amber-50/60', border: 'border-amber-200' },
  { id: 'done',        label: STATUS_LABELS.done,        color: 'text-emerald-700', bg: 'bg-emerald-50/60', border: 'border-emerald-200' },
]

interface KanbanBoardProps {
  tasks: Task[]
  onMoveTask: (id: string, status: TaskStatus) => Promise<void>
  onEditTask: (task: Task) => void
  onDeleteTask: (id: string) => void
  onAddTask: (status: TaskStatus) => void
}

function KanbanCard({
  task, onEdit, onDelete, isDragging, onDragStart,
}: {
  task: Task; onEdit: () => void; onDelete: () => void; isDragging: boolean; onDragStart: () => void
}) {
  const dl = getDeadlineLabel(task.deadline)
  const priorityVariant = task.priority as 'low' | 'medium' | 'high'

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className={cn(
        'bg-white rounded-xl border border-stone-100 p-3.5 cursor-grab active:cursor-grabbing',
        'shadow-sm hover:shadow-medium hover:-translate-y-0.5 transition-all duration-150 select-none group',
        isDragging && 'opacity-40 scale-95 rotate-1 shadow-lg'
      )}
    >
      {/* Priority + Actions */}
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <Badge variant={priorityVariant} dot className="text-[10px]">
          {PRIORITY_LABELS[task.priority]}
        </Badge>
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={e => { e.stopPropagation(); onEdit() }}
            className="p-1 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button
            onClick={e => { e.stopPropagation(); onDelete() }}
            className="p-1 rounded-lg hover:bg-red-50 text-stone-400 hover:text-red-500 transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Title */}
      <p className="text-sm font-medium text-stone-800 leading-snug mb-1.5">{task.title}</p>
      {task.description && (
        <p className="text-xs text-stone-400 line-clamp-2 mb-2.5">{task.description}</p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2.5 border-t border-stone-50 mt-1">
        {task.deadline ? (
          <span className={cn(
            'text-xs flex items-center gap-1',
            dl.overdue ? 'text-red-500 font-medium' : dl.urgent ? 'text-amber-600' : 'text-stone-400'
          )}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            {dl.label}
          </span>
        ) : <span />}
        {task.cost_estimate > 0 && (
          <span className="text-xs font-medium text-amber-600 tabular-nums">
            {formatCurrency(task.cost_estimate)}
          </span>
        )}
      </div>
    </div>
  )
}

export function KanbanBoard({ tasks, onMoveTask, onEditTask, onDeleteTask, onAddTask }: KanbanBoardProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverCol, setDragOverCol] = useState<TaskStatus | null>(null)
  const dragCount = useRef(0)

  const handleDrop = useCallback(async (status: TaskStatus) => {
    if (!draggingId) return
    setDraggingId(null); setDragOverCol(null); dragCount.current = 0
    await onMoveTask(draggingId, status)
  }, [draggingId, onMoveTask])

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 min-h-[60vh]" style={{ scrollSnapType: 'x mandatory' }}>
      {COLUMNS.map(col => {
        const colTasks = tasks.filter(t => t.status === col.id)
        const isOver = dragOverCol === col.id

        return (
          <div
            key={col.id}
            className={cn(
              'flex-shrink-0 w-[320px] sm:w-72 md:flex-1 md:min-w-0 rounded-2xl border-2 transition-all duration-150 flex flex-col',
              col.bg, isOver ? 'border-rose-300 shadow-rose/20 shadow-lg' : col.border
            )}
            style={{ scrollSnapAlign: 'start' }}
            onDragOver={e => { e.preventDefault(); setDragOverCol(col.id) }}
            onDragEnter={e => { e.preventDefault(); dragCount.current++; setDragOverCol(col.id) }}
            onDragLeave={() => { dragCount.current--; if (dragCount.current === 0) setDragOverCol(null) }}
            onDrop={() => handleDrop(col.id)}
          >
            {/* Column header */}
            <div className="flex items-center justify-between px-4 pt-4 pb-3 flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className={cn('text-sm font-semibold', col.color)}>{col.label}</span>
                <span className={cn(
                  'text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center',
                  col.color, col.bg
                )}>
                  {colTasks.length}
                </span>
              </div>
              <button
                onClick={() => onAddTask(col.id)}
                className="p-1 rounded-lg hover:bg-white/80 text-stone-400 hover:text-stone-600 transition-colors"
                title="Thêm đầu mục"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </button>
            </div>

            {/* Cards */}
            <div className="flex-1 px-3 pb-3 space-y-2.5 overflow-y-auto min-h-[200px]">
              {colTasks.length === 0 && !isOver && (
                <div className="flex items-center justify-center h-24 rounded-xl border-2 border-dashed border-stone-200 text-xs text-stone-300">
                  Kéo thả vào đây
                </div>
              )}
              {isOver && draggingId && (
                <div className="h-16 rounded-xl border-2 border-dashed border-rose-300 bg-rose-50/50 animate-pulse" />
              )}
              {colTasks.map(task => (
                <KanbanCard
                  key={task.id}
                  task={task}
                  onEdit={() => onEditTask(task)}
                  onDelete={() => onDeleteTask(task.id)}
                  isDragging={draggingId === task.id}
                  onDragStart={() => setDraggingId(task.id)}
                />
              ))}
            </div>

            {/* Add button */}
            <button
              onClick={() => onAddTask(col.id)}
              className="mx-3 mb-3 flex items-center gap-1.5 py-2 px-3 rounded-xl text-xs text-stone-400 hover:text-stone-600 hover:bg-white/60 transition-all border border-dashed border-stone-200 hover:border-stone-300 flex-shrink-0"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Thêm đầu mục
            </button>
          </div>
        )
      })}
    </div>
  )
}
