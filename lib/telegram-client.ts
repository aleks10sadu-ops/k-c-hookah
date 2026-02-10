'use client'

import { useEffect, useState } from 'react'

interface TelegramUser {
  id: number
  first_name?: string
  last_name?: string
  username?: string
}

export function useTelegram() {
  const [user, setUser] = useState<TelegramUser | null>(null)
  const [initData, setInitData] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Check if running in Telegram
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
      const tg = (window as any).Telegram.WebApp
      tg.ready()
      tg.expand()

      // Get user data
      const tgUser = tg.initDataUnsafe?.user
      if (tgUser) {
        setUser({
          id: tgUser.id,
          first_name: tgUser.first_name,
          last_name: tgUser.last_name,
          username: tgUser.username,
        })
      }

      // Get init data
      const data = tg.initData
      if (data) {
        setInitData(data)
      }

      setIsReady(true)

      // Set theme
      if (tg.colorScheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark')
      }
    } else {
      // Development mode - use mock data
      setUser({
        id: 123456789,
        first_name: 'Test',
        last_name: 'User',
        username: 'testuser',
      })
      setInitData('mock_init_data')
      setIsReady(true)
    }
  }, [])

  return { user, initData, isReady }
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void
        expand: () => void
        initData: string
        initDataUnsafe?: {
          user?: TelegramUser
        }
        colorScheme: 'light' | 'dark'
      }
    }
  }
}

// Type declaration for Telegram WebApp
declare const window: Window & typeof globalThis & {
  Telegram?: {
    WebApp: {
      ready: () => void
      expand: () => void
      initData: string
      initDataUnsafe?: {
        user?: TelegramUser
      }
      colorScheme: 'light' | 'dark'
    }
  }
}

