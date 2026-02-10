'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { TobaccoIcon } from './icons/TobaccoIcon'
import { HookahIcon } from './icons/HookahIcon'
import { StatsIcon } from './icons/StatsIcon'

export function Navigation() {
  const pathname = usePathname()

  const navItems = [
    { href: '/tobacco', label: 'Табаки', icon: TobaccoIcon },
    { href: '/mix', label: 'Микс', icon: HookahIcon },
    { href: '/statistics', label: 'Статистика', icon: StatsIcon },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-telegram-bg border-t border-telegram-secondary-bg safe-area-inset-bottom">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const IconComponent = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex flex-col items-center justify-center
                flex-1 h-full
                transition-colors
                ${isActive ? 'text-telegram-button' : 'text-telegram-hint'}
              `}
            >
              <IconComponent className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

