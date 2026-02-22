import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { AppProvider } from '@/lib/app-context'
import AuthSessionProvider from '@/components/session-provider'

import './globals.css'

const _geist = Geist({ subsets: ['latin'] })
const _geistMono = Geist_Mono({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Auroric - Luxury Inspiration Platform',
  description: 'Discover, create, and share inspiration on Auroric. A premium Pinterest-inspired platform for curating and exploring beautiful ideas.',
  generator: 'v0.app',
  keywords: 'inspiration, boards, pins, design, luxury, auroric',
  openGraph: {
    title: 'Auroric - Luxury Inspiration Platform',
    description: 'Discover, create, and share inspiration on Auroric',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <AuthSessionProvider>
          <AppProvider>{children}</AppProvider>
        </AuthSessionProvider>
      </body>
    </html>
  )
}
