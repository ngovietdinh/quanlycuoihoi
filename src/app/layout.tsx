import type { Metadata } from 'next'
import { Be_Vietnam_Pro, Playfair_Display } from 'next/font/google'
import './globals.css'

const beVietnam = Be_Vietnam_Pro({
  subsets: ['vietnamese', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-body',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-display',
})

export const metadata: Metadata = {
  title: 'Lễ Ăn Hỏi | Quản Lý Sự Kiện',
  description: 'Hệ thống quản lý toàn diện cho ngày lễ ăn hỏi',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi" className={`${beVietnam.variable} ${playfair.variable}`}>
      <body className="font-body antialiased">{children}</body>
    </html>
  )
}
