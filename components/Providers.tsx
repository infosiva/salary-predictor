'use client'
import { ToastProvider } from '@/lib/shared/useToast'
import Toast from '@/lib/shared/Toast'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      {children}
      <Toast />
    </ToastProvider>
  )
}
