import type { Metadata, Viewport } from 'next'
import { AUTHOR } from '@/lib/brand'
import { Be_Vietnam_Pro, Lora, JetBrains_Mono } from 'next/font/google'
import './globals.css'

// Cả ba font đều có bộ dấu tiếng Việt đầy đủ (subset 'vietnamese'), tự host qua next/font
const sans = Be_Vietnam_Pro({ subsets: ['vietnamese', 'latin'], weight: ['300', '400', '500', '600', '700'], variable: '--font-sans', display: 'swap' })
const serif = Lora({ subsets: ['vietnamese', 'latin'], weight: ['400', '500', '600', '700'], style: ['normal', 'italic'], variable: '--font-display', display: 'swap' })
const mono = JetBrains_Mono({ subsets: ['vietnamese', 'latin'], weight: ['400', '500'], variable: '--font-mono', display: 'swap' })
export const metadata: Metadata = {
  title: { default:'FamilyPlan — Thiệp cưới online, quản lý lễ cưới & tài chính gia đình', template:'%s | FamilyPlan' },
  description:'Từ ngày cưới tới cả tổ ấm: thiệp cưới online, kế hoạch lễ cưới, thu chi gia đình, thai sản, con cái và tiết kiệm.', applicationName: 'FamilyPlan',
  authors: [{ name: AUTHOR }], creator: AUTHOR, publisher: AUTHOR,
}
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#fdf8f0' }
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${sans.variable} ${serif.variable} ${mono.variable}`}><body>{children}</body></html>
  )
}
