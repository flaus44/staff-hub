import './globals.css'
import type { Metadata } from 'next'
import { DM_Sans } from 'next/font/google'
import React from 'react'

export const dynamic = 'force-dynamic'

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans' })

export const metadata: Metadata = {
  title: 'FLAUS Staff Hub',
  description: 'Internal staff and contractor portal',
}

export default function FrontendLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-AU" className="bg-surface text-[var(--cmd-text)]">
      <body className={`${dmSans.variable} font-sans min-h-screen bg-surface text-[var(--cmd-text)] antialiased`}>
        {children}
      </body>
    </html>
  )
}
