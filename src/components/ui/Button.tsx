'use client'
import { forwardRef, ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'gold'
type Size    = 'xs' | 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: React.ReactNode
  iconRight?: React.ReactNode
}

const variants: Record<Variant, string> = {
  primary:   'bg-rose-500 text-white hover:bg-rose-600 shadow-rose active:scale-[0.97]',
  secondary: 'bg-white text-rose-600 border border-rose-200 hover:bg-rose-50 active:scale-[0.97]',
  ghost:     'text-stone-600 hover:bg-stone-100 active:scale-[0.97]',
  danger:    'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 active:scale-[0.97]',
  gold:      'bg-amber-400 text-white hover:bg-amber-500 shadow-amber active:scale-[0.97]',
}

const sizes: Record<Size, string> = {
  xs: 'h-7  px-2.5 text-xs  gap-1',
  sm: 'h-8  px-3   text-sm  gap-1.5',
  md: 'h-10 px-4   text-sm  gap-2',
  lg: 'h-11 px-5   text-base gap-2',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, icon, iconRight, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 select-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : icon}
      {children}
      {!loading && iconRight}
    </button>
  )
)
Button.displayName = 'Button'
