'use client'
import { Shell } from '@/components/layout/Shell'
import { ToastProvider } from '@/components/ui/Toast'
import { HouseholdProvider } from '@/components/family/HouseholdProvider'

export default function FamilyLayout({ children }: { children: React.ReactNode }) {
  return <ToastProvider><Shell><HouseholdProvider>{children}</HouseholdProvider></Shell></ToastProvider>
}
