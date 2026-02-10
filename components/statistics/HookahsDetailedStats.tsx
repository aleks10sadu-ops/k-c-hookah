'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { formatMoscowTime } from '@/lib/format-time'

interface MixItem {
  tobacco_name: string
  tobacco_id: string
  grams: number
  percentage: number
}

interface UserMix {
  id: string
  name: string
  total_grams: number
  created_at: string
  items: MixItem[]
}

interface UserStat {
  userId: string
  telegramId: number
  name: string
  total_mixes: number
  total_grams_used: number
  mixes: UserMix[]
}

export function HookahsDetailedStats() {
  const [stats, setStats] = useState<UserStat[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'all'>('all')
  const [expandedUser, setExpandedUser] = useState<string | null>(null)
  const [expandedMix, setExpandedMix] = useState<string | null>(null)

  useEffect(() => {
    loadStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period])

  const loadStats = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({ period })
      const response = await fetch(`/api/statistics/hookahs-detailed?${params}`)
      const { data, error } = await response.json()
      if (error) throw new Error(error)
      setStats(data || [])
    } catch (error: any) {
      console.error('Error loading stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Use formatMoscowTime utility for consistent time formatting

  if (isLoading) {
    return <div className="text-center py-8 text-telegram-hint">Загрузка...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(['today', 'week', 'month', 'all'] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              period === p
                ? 'bg-telegram-button text-telegram-button-text'
                : 'bg-telegram-secondary-bg text-telegram-text'
            }`}
          >
            {p === 'today' ? 'Сегодня' : p === 'week' ? 'Неделя' : p === 'month' ? 'Месяц' : 'Всё время'}
          </button>
        ))}
      </div>

      {stats.length === 0 ? (
        <div className="text-center py-12 text-telegram-hint">
          <p className="text-lg mb-2">Нет данных</p>
          <p className="text-sm">Создайте миксы для отображения статистики</p>
        </div>
      ) : (
        <div className="space-y-4">
          {stats.map((user) => (
            <div
              key={user.userId}
              className="bg-telegram-secondary-bg rounded-lg p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-telegram-text text-lg">{user.name}</h3>
                  <div className="flex items-center gap-4 mt-1 text-sm text-telegram-hint">
                    <span>Миксов: {user.total_mixes}</span>
                    <span>•</span>
                    <span>Использовано: {user.total_grams_used} г</span>
                  </div>
                </div>
                <button
                  onClick={() => setExpandedUser(expandedUser === user.userId ? null : user.userId)}
                  className="text-telegram-button hover:opacity-80 transition-opacity"
                >
                  <svg
                    className={`w-5 h-5 transition-transform ${expandedUser === user.userId ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {expandedUser === user.userId && (
                <div className="mt-3 space-y-2">
                  {user.mixes.map((mix) => {
                    const mixDate = new Date(mix.created_at)
                    const formattedTime = formatMoscowTime(mix.created_at)
                    const mixKey = `${user.userId}-${mix.id}`
                    return (
                      <div
                        key={mix.id}
                        className="bg-telegram-bg rounded-lg p-3 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-telegram-text">{mix.name}</p>
                            <p className="text-xs text-telegram-hint">
                              {format(mixDate, 'dd.MM.yyyy', { locale: ru })} {formattedTime}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-telegram-hint">Вес</p>
                            <p className="text-telegram-button font-semibold">{mix.total_grams} г</p>
                          </div>
                        </div>

                        <button
                          onClick={() => setExpandedMix(expandedMix === mixKey ? null : mixKey)}
                          className="w-full text-left text-xs font-medium text-telegram-button hover:opacity-80 transition-opacity flex items-center justify-between"
                        >
                          <span>Состав ({mix.items.length} табаков)</span>
                          <svg
                            className={`w-3 h-3 transition-transform ${expandedMix === mixKey ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        {expandedMix === mixKey && (
                          <div className="mt-2 space-y-1.5">
                            {mix.items.map((item, idx) => (
                              <div
                                key={idx}
                                className="bg-telegram-secondary-bg rounded p-2 flex items-center justify-between text-xs"
                              >
                                <div className="flex-1">
                                  <p className="text-telegram-text">{item.tobacco_name}</p>
                                  <p className="text-telegram-hint">{item.percentage.toFixed(1)}%</p>
                                </div>
                                <p className="text-telegram-button font-medium">{item.grams} г</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

