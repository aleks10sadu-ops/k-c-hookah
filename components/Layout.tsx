'use client'

import { ReactNode } from 'react'
import { Navigation } from './Navigation'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen pb-16 bg-telegram-bg">
      <main className="container mx-auto px-4 py-4">
        {children}
      </main>
      <Navigation />
    </div>
  )
}

