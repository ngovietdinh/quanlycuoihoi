import type { Metadata } from 'next'
import './globals.css'
export const metadata: Metadata = {
  title: { default:'Lễ Ăn Hỏi', template:'%s | Lễ Ăn Hỏi' },
  description:'Hệ thống quản lý lễ ăn hỏi toàn diện',
}
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi"><body>{children}</body></html>
  )
}
