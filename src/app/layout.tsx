import type { Metadata, Viewport } from 'next'
import { AUTHOR } from '@/lib/brand'
import './globals.css'
export const metadata: Metadata = {
  title: { default:'Hỷ Sự — Quản lý lễ cưới & thiệp cưới online', template:'%s | Hỷ Sự' },
  description:'Lập kế hoạch lễ cưới, quản lý ngân sách và tạo thiệp cưới online đẹp, hiện đại.',
  authors: [{ name: AUTHOR }], creator: AUTHOR, publisher: AUTHOR,
}
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#fdf8f0' }
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi"><body>{children}</body></html>
  )
}
