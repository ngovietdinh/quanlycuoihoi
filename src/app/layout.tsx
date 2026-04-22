import type { Metadata, Viewport } from 'next'
import './globals.css'
import { ToastProvider } from '@/components/ui/Toast'
import { Sidebar, MobileBottomNav } from '@/components/layout/Sidebar'

export const metadata: Metadata = {
  title: { default: 'Lễ Ăn Hỏi — Wedding Planner', template: '%s | Lễ Ăn Hỏi' },
  description: 'Hệ thống quản lý lễ ăn hỏi toàn diện — lên kế hoạch, theo dõi ngân sách, quản lý đầu mục.',
  themeColor: '#f43f5e',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className="font-body antialiased bg-stone-50 text-stone-900">
        <ToastProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-0">
              {children}
            </div>
          </div>
          <MobileBottomNav />
        </ToastProvider>
      </body>
    </html>
  )
}
