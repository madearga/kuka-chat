import { useState, useCallback } from 'react'
import { Toast, ToastActionElement, ToastProps } from "@/components/ui/toast"
import {
  ToastProvider,
  ToastViewport,
} from "@/components/ui/toast"

export interface ToastOptions {
  title?: string
  description?: string
  action?: ToastActionElement
  variant?: 'default' | 'destructive'
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastProps[]>([])

  const toast = useCallback(({ title, description, action, variant }: ToastOptions) => {
    setToasts((currentToasts) => [
      ...currentToasts,
      { id: Math.random().toString(36).substr(2, 9), title, description, action, variant },
    ])
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== id))
  }, [])

  return { toast, dismissToast, toasts }
}

export { ToastProvider, ToastViewport }
export type { Toast, ToastActionElement, ToastProps }
