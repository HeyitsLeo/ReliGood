import './globals.css'
import type { ReactNode } from 'react'
import { TrpcProvider } from '@/lib/trpc-provider'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { BottomTabBar } from '@/components/BottomTabBar'
import { BUSINESS_NAME } from '@/lib/constants'

export const metadata = {
  title: `${BUSINESS_NAME} — Quality Products from China to Zambia`,
  description:
    'Browse and order quality electronics, beauty, clothing and home products. Order via WhatsApp, pay with Airtel or MTN Money.',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@700;800&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="flex min-h-screen flex-col bg-surface pb-14 font-body text-on-surface paper-texture md:pb-0">
        <TrpcProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <BottomTabBar />
        </TrpcProvider>
      </body>
    </html>
  )
}
