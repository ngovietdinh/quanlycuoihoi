'use client'
import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

interface ModalProps {
  open: boolean; onClose: ()=>void; title?: string
  size?: 'sm'|'md'|'lg'; children: React.ReactNode; footer?: React.ReactNode
}
const SIZES = { sm:'max-w-sm', md:'max-w-md', lg:'max-w-lg' }

export function Modal({ open, onClose, title, size='md', children, footer }: ModalProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else      document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])
  useEffect(() => {
    const h = (e:KeyboardEvent) => { if (e.key==='Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [onClose])
  if (!open) return null

  return createPortal(
    <div className="modal-backdrop" onClick={e=>{ if(e.target===e.currentTarget) onClose() }}>
      <div className={cn('modal-panel animate-slideUp', SIZES[size])}>
        {/* Mobile drag handle */}
        <div className="sm:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-stone-200"/>
        </div>
        {title && (
          <div className="flex items-center justify-between px-6 pt-4 pb-3 border-b border-stone-100 flex-shrink-0">
            <h2 className="font-display text-lg font-semibold text-stone-900">{title}</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
        {footer && (
          <div className="px-6 py-4 border-t border-stone-100 flex items-center justify-end gap-2 bg-stone-50/50 rounded-b-2xl flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}

export function ConfirmModal({ open, onClose, onConfirm, title, msg, confirmLabel='Xác nhận', loading }:
  { open:boolean; onClose:()=>void; onConfirm:()=>void; title:string; msg:string; confirmLabel?:string; loading?:boolean }) {
  return (
    <Modal open={open} onClose={onClose} size="sm"
      footer={<>
        <button onClick={onClose} className="btn btn-ghost btn-sm">Hủy</button>
        <button onClick={onConfirm} disabled={loading} className="btn btn-danger btn-sm disabled:opacity-60">
          {loading ? <span className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin"/> : confirmLabel}
        </button>
      </>}>
      <div className="text-center py-2">
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-3 text-2xl">⚠️</div>
        <h3 className="font-semibold text-stone-900 mb-1">{title}</h3>
        <p className="text-sm text-stone-500">{msg}</p>
      </div>
    </Modal>
  )
}
