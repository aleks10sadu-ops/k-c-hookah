'use client'

import { ReactNode, useEffect, useState } from 'react'
import { useTelegram } from '@/lib/telegram-client'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  const { isReady, initData, user } = useTelegram()
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // Authenticate when ready
    if (isReady && initData && user) {
      authenticateUser()
    } else if (isReady) {
      // If no Telegram context, allow to continue (dev mode)
      setIsAuthenticated(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, initData, user])

  const authenticateUser = async () => {
    try {
      if (!initData || !user) {
        console.warn('Auth: No initData or user available')
        // Clear localStorage if no Telegram context
        localStorage.removeItem('userId')
        localStorage.removeItem('telegramId')
        setIsAuthenticated(true) // Allow to continue in dev mode
        return
      }

      // Check if we have stored credentials
      const storedUserId = localStorage.getItem('userId')
      const storedTelegramId = localStorage.getItem('telegramId')
      const currentTelegramId = user.id.toString()

      // If stored telegram_id doesn't match current user, clear and re-authenticate
      if (storedUserId && storedTelegramId !== currentTelegramId) {
        console.log('Auth: Telegram ID mismatch, clearing storage and re-authenticating', {
          stored: storedTelegramId,
          current: currentTelegramId
        })
        localStorage.removeItem('userId')
        localStorage.removeItem('telegramId')
      }

      // If we have valid stored credentials for current user, use them
      if (storedUserId && storedTelegramId === currentTelegramId) {
        console.log('Auth: Using stored userId for current user:', storedUserId)
        setIsAuthenticated(true)
        return
      }

      console.log('Auth: Authenticating with Telegram...')
      // Authenticate with Telegram
      const response = await fetch('/api/auth/telegram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ initData }),
      })

      const result = await response.json()

      if (result.error) {
        console.error('Auth error:', result.error)
        // Clear invalid credentials
        localStorage.removeItem('userId')
        localStorage.removeItem('telegramId')
        // Still allow to continue, but show warning
        setIsAuthenticated(true)
        return
      }

      if (result.userId && result.user) {
        console.log('Auth: Successfully authenticated, userId:', result.userId, 'telegramId:', result.user.id)
        localStorage.setItem('userId', result.userId)
        localStorage.setItem('telegramId', result.user.id.toString())
        setIsAuthenticated(true)
      } else {
        console.warn('Auth: No userId in response')
        localStorage.removeItem('userId')
        localStorage.removeItem('telegramId')
        setIsAuthenticated(true) // Allow to continue
      }
    } catch (error) {
      console.error('Authentication failed:', error)
      // Clear on error
      localStorage.removeItem('userId')
      localStorage.removeItem('telegramId')
      // Still allow to continue
      setIsAuthenticated(true)
    }
  }

  if (!isReady || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-telegram-hint">Инициализация...</p>
      </div>
    )
  }

  return <>{children}</>
}

