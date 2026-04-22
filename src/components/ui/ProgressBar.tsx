'use client'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface ProgressBarProps {
  value: number
  max?: number
  size?: 'xs' | 'sm' | 'md' | 'lg'
  variant?: 'rose' | 'amber' | 'emerald' | 'gradient'
  showLabel?: boolean
  animated?: boolean
  className?: string
}

const sizes = { xs: 'h-1', sm: 'h-1.5', md: 'h-2', lg: 'h-3' }

const fills = {
  rose:     'bg-rose-400',
  amber:    'bg-amber-400',
  emerald:  'bg-emerald-400',
  gradient: 'bg-gradient-to-r from-rose-400 via-rose-500 to-amber-400',
}

export function ProgressBar({ value, max = 100, size = 'md', variant = 'gradient', showLabel, animated = true, className }: ProgressBarProps) {
  const [width, setWidth] = useState(0)
  const pct = Math.min(100, Math.max(0, (value / max) * 100))

  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), 100)
    return () => clearTimeout(t)
  }, [pct])

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn('flex-1 bg-stone-100 rounded-full overflow-hidden', sizes[size])}>
        <div
          className={cn('h-full rounded-full', fills[variant], animated && 'transition-all duration-700 ease-out')}
          style={{ width: `${animated ? width : pct}%` }}
          role="progressbar"
          aria-valuenow={Math.round(pct)}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-medium text-stone-500 w-8 text-right tabular-nums">
          {Math.round(pct)}%
        </span>
      )}
    </div>
  )
}

export function CircularProgress({ value, size = 72, strokeWidth = 6 }: { value: number; size?: number; strokeWidth?: number }) {
  const [animated, setAnimated] = useState(0)
  const r = (size - strokeWidth) / 2
  const circ = 2 * Math.PI * r
  const dash = (animated / 100) * circ

  useEffect(() => {
    const t = setTimeout(() => setAnimated(Math.min(100, value)), 100)
    return () => clearTimeout(t)
  }, [value])

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f1f0ef" strokeWidth={strokeWidth} />
      <circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke="url(#progressGrad)" strokeWidth={strokeWidth}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.7s ease-out' }}
      />
      <defs>
        <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#fb7185" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
    </svg>
  )
}
