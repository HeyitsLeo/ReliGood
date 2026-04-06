import './globals.css'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { TrpcProvider } from '@/lib/trpc-provider'

export const metadata = {
  title: 'ZamGo Admin',
  description: 'ZamGo MVP admin panel',
}

const nav = [
  { href: '/', label: 'Dashboard' },
  { href: '/inbox', label: 'Inbox' },
  { href: '/requests', label: 'Requests' },
  { href: '/orders', label: 'Orders' },
  { href: '/settings', label: 'Settings' },
]

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900">
        <TrpcProvider>
          <header className="border-b border-slate-200 bg-white">
            <div className="mx-auto flex max-w-6xl items-center gap-6 px-6 py-3">
              <span className="font-bold text-lg">ZamGo</span>
              <nav className="flex gap-4 text-sm">
                {nav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-slate-600 hover:text-slate-900"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
              <span className="ml-auto text-xs text-slate-400">mock mode · local</span>
            </div>
          </header>
          <main className="mx-auto max-w-6xl px-6 py-6">{children}</main>
        </TrpcProvider>
      </body>
    </html>
  )
}
