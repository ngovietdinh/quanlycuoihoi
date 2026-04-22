'use client'
import { useEffect, useRef, Fragment } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import { Button } from './Button'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  children: React.ReactNode
  footer?: React.ReactNode
}

const sizes = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-2xl' }

export function Modal({ open, onClose, title, description, size = 'md', children, footer }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  if (!open) return null

  const content = (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={e => { if (e.target === overlayRef.current) onClose() }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" style={{ animation: 'fadeIn 0.15s ease' }} />

      {/* Panel */}
      <div
        className={cn(
          'relative w-full bg-white shadow-2xl flex flex-col',
          'rounded-t-3xl sm:rounded-2xl',
          'max-h-[92dvh] sm:max-h-[85vh]',
          sizes[size]
        )}
        style={{ animation: 'slideUp 0.2s cubic-bezier(0.32,0.72,0,1)' }}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {/* Drag handle (mobile) */}
        <div className="sm:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-stone-200" />
        </div>

        {/* Header */}
        {(title || description) && (
          <div className="px-6 pt-4 pb-3 flex-shrink-0 border-b border-stone-100">
            <div className="flex items-start justify-between gap-3">
              <div>
                {title && <h2 className="font-display text-lg font-semibold text-stone-900">{title}</h2>}
                {description && <p className="text-sm text-stone-500 mt-0.5">{description}</p>}
              </div>
              <button
                onClick={onClose}
                className="flex-shrink-0 p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors"
                aria-label="Đóng"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-stone-100 flex-shrink-0 flex items-center justify-end gap-2 bg-stone-50/50 rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  )

  return createPortal(content, document.body)
}

export function ConfirmModal({
  open, onClose, onConfirm, title, message, confirmLabel = 'Xác nhận', variant = 'danger', loading,
}: {
  open: boolean; onClose: () => void; onConfirm: () => void
  title: string; message: string; confirmLabel?: string
  variant?: 'danger' | 'primary'; loading?: boolean
}) {
  return (
    <Modal open={open} onClose={onClose} size="sm"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>Hủy</Button>
          <Button variant={variant} size="sm" loading={loading} onClick={onConfirm}>{confirmLabel}</Button>
        </>
      }
    >
      <div className="text-center py-2">
        <div className={cn('w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3',
          variant === 'danger' ? 'bg-red-50' : 'bg-rose-50')}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={variant==='danger'?'#ef4444':'#f43f5e'} strokeWidth="2" strokeLinecap="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <h3 className="font-semibold text-stone-900 mb-1">{title}</h3>
        <p className="text-sm text-stone-500">{message}</p>
      </div>
    </Modal>
  )
}
