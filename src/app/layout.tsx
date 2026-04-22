import type { Metadata } from 'next'
import './globals.css'
export const metadata: Metadata = {
  title: { default:'Quán lý sự kiện', template:'%s | Quán lý sự kiện' },
  description:'Hệ thống Quán lý sự kiện toàn diện',
}
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi"><body>{children}</body></html>
  )
}
