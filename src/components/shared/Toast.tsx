'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info'

export interface ToastMessage {
  id: string
  title: string
  description?: string
  type: ToastType
}

interface ToastContextType {
  toast: (options: { title: string; description?: string; type?: ToastType }) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const toast = ({ title, description, type = 'info' }: { title: string; description?: string; type?: ToastType }) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { id, title, description, type }])
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

function ToastContainer({ toasts, onDismiss }: { toasts: ToastMessage[]; onDismiss: (id: string) => void }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onDismiss }: { toast: ToastMessage; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id)
    }, 4000)
    return () => clearTimeout(timer)
  }, [toast.id, onDismiss])

  const typeConfig = {
    success: {
      border: 'border-emerald-500/20',
      iconBg: 'bg-emerald-500/10 text-emerald-600',
      icon: <CheckCircle2 className="w-4 h-4" />,
    },
    error: {
      border: 'border-destructive/20',
      iconBg: 'bg-destructive/10 text-destructive',
      icon: <AlertCircle className="w-4 h-4" />,
    },
    info: {
      border: 'border-primary/20',
      iconBg: 'bg-primary/10 text-primary',
      icon: <Info className="w-4 h-4" />,
    },
  }

  const config = typeConfig[toast.type]

  return (
    <div className={`
      flex items-start gap-3 p-4 bg-card border ${config.border} shadow-lg rounded-xl transition-all duration-300 transform scale-100 opacity-100 translate-y-0
      animate-in fade-in slide-in-from-bottom-4 duration-300
    `}>
      <div className={`p-1 rounded-lg shrink-0 ${config.iconBg}`}>
        {config.icon}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-xs font-semibold text-card-foreground">{toast.title}</h4>
        {toast.description && (
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-normal">{toast.description}</p>
        )}
      </div>
      <button 
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 text-muted-foreground hover:text-foreground p-0.5 rounded transition-colors"
        aria-label="Dismiss notification"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
