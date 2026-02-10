'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { formatMoscowTime } from '@/lib/format-time'

interface MixItem {
  id: string
  tobacco_name: string
  tobacco_id: string
  grams: number
  percentage: number
}

interface MixStat {
  id: string
  name: string
  total_grams: number
  created_at: string
  creator_name: string
  creator_id: string | null
  items: MixItem[]
}

export function MixesDetailedStats() {
  const [stats, setStats] = useState<MixStat[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'all'>('all')
  const [expandedMix, setExpandedMix] = useState<string | null>(null)

  useEffect(() => {
    loadStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period])

  const loadStats = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({ period })
      const response = await fetch(`/api/statistics/mixes-detailed?${params}`)
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
        <div className="space-y-3">
          {stats.map((mix) => {
            const mixDate = new Date(mix.created_at)
            const formattedTime = formatMoscowTime(mix.created_at)
            return (
              <div
                key={mix.id}
                className="bg-telegram-secondary-bg rounded-lg p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-telegram-text text-lg mb-1">
                      {mix.name}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-telegram-hint">
                      <span>{format(mixDate, 'dd.MM.yyyy', { locale: ru })} {formattedTime}</span>
                      <span>•</span>
                      <span>{mix.creator_name}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-telegram-hint">Общий вес</p>
                    <p className="text-telegram-text font-semibold text-lg">{mix.total_grams} г</p>
                  </div>
                </div>

                <button
                  onClick={() => setExpandedMix(expandedMix === mix.id ? null : mix.id)}
                  className="w-full text-left text-sm font-medium text-telegram-button hover:opacity-80 transition-opacity flex items-center justify-between"
                >
                  <span>Состав микса ({mix.items.length} табаков)</span>
                  <svg
                    className={`w-4 h-4 transition-transform ${expandedMix === mix.id ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {expandedMix === mix.id && (
                  <div className="mt-3 space-y-2">
                    {mix.items.map((item) => (
                      <div
                        key={item.id}
                        className="bg-telegram-bg rounded-lg p-3 flex items-center justify-between"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-telegram-text">{item.tobacco_name}</p>
                          <p className="text-xs text-telegram-hint">{item.percentage.toFixed(1)}%</p>
                        </div>
                        <p className="text-telegram-button font-semibold">{item.grams} г</p>
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
  )
}

