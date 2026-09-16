import { useEffect } from 'react'
import { X } from './Icons'

export default function ModalDrawer({ open, onClose, title, children, side = 'left' }) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [open, onClose])

  if (!open) return null

  const slideClass = side === 'left' ? 'animate-slide-right' : 'animate-slide-left'

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/50 animate-fade-in"
        onClick={onClose}
      />
      <div
        className={`absolute top-0 bottom-0 ${side === 'left' ? 'left-0' : 'right-0'} w-full max-w-sm bg-night-900 shadow-2xl ${slideClass} flex flex-col`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-night-700">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors active:bg-white/15"
            aria-label="Close drawer"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  )
}
