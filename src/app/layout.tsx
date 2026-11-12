import type { Metadata, Viewport } from 'next'
import { AUTHOR } from '@/lib/brand'
import { Be_Vietnam_Pro, JetBrains_Mono } from 'next/font/google'
import './globals.css'

// Một họ chữ duy nhất cho toàn ứng dụng: Be Vietnam Pro — thiết kế riêng cho dấu tiếng Việt, tự host qua next/font
const sans = Be_Vietnam_Pro({ subsets: ['vietnamese', 'latin'], weight: ['300', '400', '500', '600', '700', '800'], variable: '--font-sans', display: 'swap' })
const mono = JetBrains_Mono({ subsets: ['vietnamese', 'latin'], weight: ['400', '500'], variable: '--font-mono', display: 'swap' })
export const metadata: Metadata = {
  title: { default:'FamilyPlan — Thiệp cưới online, quản lý lễ cưới & tài chính gia đình', template:'%s | FamilyPlan' },
  description:'Từ ngày cưới tới cả tổ ấm: thiệp cưới online, kế hoạch lễ cưới, thu chi gia đình, thai sản, con cái và tiết kiệm.', applicationName: 'FamilyPlan',
  authors: [{ name: AUTHOR }], creator: AUTHOR, publisher: AUTHOR,
}
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#f6f5f9' }
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${sans.variable} ${mono.variable}`}><body>{children}</body></html>
  )
}
