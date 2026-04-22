import { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type BadgeVariant = 'todo' | 'in_progress' | 'done' | 'overdue' | 'low' | 'medium' | 'high' | 'default'

const variants: Record<BadgeVariant, string> = {
  todo:        'bg-stone-100  text-stone-600  border-stone-200',
  in_progress: 'bg-amber-50   text-amber-700  border-amber-200',
  done:        'bg-emerald-50 text-emerald-700 border-emerald-200',
  overdue:     'bg-red-50     text-red-600    border-red-200',
  low:         'bg-sky-50     text-sky-600    border-sky-200',
  medium:      'bg-amber-50   text-amber-700  border-amber-200',
  high:        'bg-rose-50    text-rose-600   border-rose-200',
  default:     'bg-stone-100  text-stone-600  border-stone-200',
}

const dots: Record<BadgeVariant, string> = {
  todo:        'bg-stone-400',
  in_progress: 'bg-amber-400',
  done:        'bg-emerald-500',
  overdue:     'bg-red-500',
  low:         'bg-sky-400',
  medium:      'bg-amber-400',
  high:        'bg-rose-500',
  default:     'bg-stone-400',
}

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  dot?: boolean
}

export function Badge({ variant = 'default', dot = false, className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
        variants[variant],
        className
      )}
      {...props}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', dots[variant])} />}
      {children}
    </span>
  )
}
