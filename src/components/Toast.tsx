import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { CheckCircle, XCircle, Info, X } from 'lucide-react'
import { cn, formatApiError } from '../lib/utils'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: number
  type: ToastType
  message: string
}

interface ToastCtx {
  toast: (type: ToastType, message: string) => void
}

const ToastContext = createContext<ToastCtx>({ toast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

let _id = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((type: ToastType, message: string) => {
    const id = ++_id
    const safeMessage =
      typeof message === 'string'
        ? message
        : formatApiError({ response: { data: { detail: message } } }, 'Error')
    setToasts(prev => [...prev, { id, type, message: safeMessage }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }, [])

  const remove = (id: number) => setToasts(prev => prev.filter(t => t.id !== id))

  const icons = {
    success: <CheckCircle size={16} className="text-emerald-400" />,
    error: <XCircle size={16} className="text-red-400" />,
    info: <Info size={16} className="text-blue-400" />,
  }

  const borders = {
    success: 'border-emerald-500/30',
    error: 'border-red-500/30',
    info: 'border-blue-500/30',
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        {toasts.map(t => (
          <div
            key={t.id}
            className={cn(
              'flex items-start gap-3 rounded-xl border bg-zinc-900 px-4 py-3 shadow-xl animate-in min-w-[280px] max-w-sm',
              borders[t.type],
            )}
          >
            <span className="mt-0.5 shrink-0">{icons[t.type]}</span>
            <p className="flex-1 text-sm text-zinc-200">{t.message}</p>
            <button
              onClick={() => remove(t.id)}
              className="shrink-0 text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
