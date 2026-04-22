import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean
  glass?: boolean
  gradient?: boolean
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, hover, glass, gradient, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-2xl border border-rose-100/60 bg-white shadow-soft',
        hover && 'transition-all duration-200 hover:shadow-medium hover:-translate-y-0.5 cursor-pointer',
        glass && 'bg-white/70 backdrop-blur-md border-white/50',
        gradient && 'bg-gradient-to-br from-white to-rose-50/30',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
)
Card.displayName = 'Card'

export function CardHeader({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-5 pt-5 pb-3', className)} {...props}>{children}</div>
}

export function CardBody({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-5 pb-5', className)} {...props}>{children}</div>
}

export function CardFooter({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('px-5 py-3 border-t border-rose-50 rounded-b-2xl bg-rose-50/30', className)} {...props}>
      {children}
    </div>
  )
}
