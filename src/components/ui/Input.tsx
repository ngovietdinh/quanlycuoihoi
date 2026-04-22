'use client'
import { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

const baseInput = 'w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-900 placeholder-stone-400 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-400 disabled:opacity-50 disabled:bg-stone-50'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string; error?: string; hint?: string; prefix?: React.ReactNode; suffix?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, prefix, suffix, className, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-stone-700">{label}</label>}
      <div className="relative">
        {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">{prefix}</span>}
        <input
          ref={ref}
          className={cn(baseInput, prefix && 'pl-9', suffix && 'pr-9', error && 'border-red-300 focus:ring-red-300 focus:border-red-400', className)}
          {...props}
        />
        {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400">{suffix}</span>}
      </div>
      {error && <p className="text-xs text-red-500 flex items-center gap-1"><span>⚠</span>{error}</p>}
      {hint && !error && <p className="text-xs text-stone-400">{hint}</p>}
    </div>
  )
)
Input.displayName = 'Input'

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; error?: string }>(
  ({ label, error, className, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-stone-700">{label}</label>}
      <textarea ref={ref} className={cn(baseInput, 'resize-none', error && 'border-red-300', className)} {...props} />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
)
Textarea.displayName = 'Textarea'

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & { label?: string }>(
  ({ label, className, children, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-stone-700">{label}</label>}
      <select ref={ref} className={cn(baseInput, 'cursor-pointer', className)} {...props}>{children}</select>
    </div>
  )
)
Select.displayName = 'Select'
