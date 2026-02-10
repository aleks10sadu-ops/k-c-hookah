'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { formatMoscowTime } from '@/lib/format-time'
import type { Category } from '@/types/tobacco.types'

interface TobaccoUsage {
  id: string
  date: string
  mix_name: string
  mix_id: string | null
  grams: number
  creator_name: string
  creator_id: string | null
}

interface TobaccoStat {
  id: string
  name: string
  image_url: string | null
  category_id: string | null
  current_grams: number
  initial_grams: number
  used_grams: number
  total_used_grams: number
  usage_history: TobaccoUsage[]
}

export function TobaccoDetailedStats() {
  const [stats, setStats] = useState<TobaccoStat[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [filteredStats, setFilteredStats] = useState<TobaccoStat[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'all'>('all')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all')
  const [selectedTobacco, setSelectedTobacco] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([loadStats(), loadCategories()]).finally(() => {
      setIsLoading(false)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period])

  useEffect(() => {
    if (selectedCategoryId === 'all') {
      setFilteredStats(stats)
    } else {
      setFilteredStats(stats.filter((item: TobaccoStat) => item.category_id === selectedCategoryId))
    }
  }, [selectedCategoryId, stats])

  const loadStats = async () => {
    try {
      const params = new URLSearchParams({ period })
      const response = await fetch(`/api/statistics/tobacco-detailed?${params}`)
      const { data, error } = await response.json()
      if (error) throw new Error(error)
      setStats(data || [])
    } catch (error: any) {
      console.error('Error loading stats:', error)
    }
  }

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      const { data, error } = await response.json()
      if (error) throw new Error(error)
      setCategories(data || [])
    } catch (error: any) {
      console.error('Failed to load categories:', error)
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
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${period === p
              ? 'bg-telegram-button text-telegram-button-text'
              : 'bg-telegram-secondary-bg text-telegram-text'
              }`}
          >
            {p === 'today' ? 'Сегодня' : p === 'week' ? 'Неделя' : p === 'month' ? 'Месяц' : 'Всё время'}
          </button>
        ))}
      </div>

      {/* Categories Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        <button
          onClick={() => setSelectedCategoryId('all')}
          className={`whitespace-nowrap px-4 py-2 rounded-lg transition-colors text-sm font-medium ${selectedCategoryId === 'all'
            ? 'bg-telegram-button text-telegram-button-text'
            : 'bg-telegram-secondary-bg text-telegram-text'
            }`}
        >
          Все
        </button>
        {categories.map((category: Category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategoryId(category.id)}
            className={`whitespace-nowrap px-4 py-2 rounded-lg transition-colors text-sm font-medium ${selectedCategoryId === category.id
              ? 'bg-telegram-button text-telegram-button-text'
              : 'bg-telegram-secondary-bg text-telegram-text'
              }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      {stats.length === 0 ? (
        <div className="text-center py-12 text-telegram-hint">
          <p className="text-lg mb-2">Нет данных</p>
          <p className="text-sm">Добавьте табаки и создайте миксы для отображения статистики</p>
        </div>
      ) : filteredStats.length === 0 ? (
        <div className="text-center py-12 text-telegram-hint">
          <p className="text-lg mb-2">В этой категории нет данных</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredStats.map((tobacco: TobaccoStat) => (
            <div
              key={tobacco.id}
              className="bg-telegram-secondary-bg rounded-lg p-4 space-y-3"
            >
              <div className="flex items-center gap-3">
                {tobacco.image_url ? (
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src={tobacco.image_url}
                      alt={tobacco.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-telegram-bg flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">🌿</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-telegram-text text-lg truncate">
                    {tobacco.name}
                  </h3>
                  <div className="grid grid-cols-2 gap-3 mt-2 text-sm">
                    <div className="bg-telegram-bg rounded-lg p-2">
                      <p className="text-telegram-hint text-xs mb-1">Всего было</p>
                      <p className="text-telegram-text font-semibold text-base">{tobacco.initial_grams} г</p>
                    </div>
                    <div className="bg-telegram-bg rounded-lg p-2">
                      <p className="text-telegram-hint text-xs mb-1">Остаток</p>
                      <p className="text-telegram-text font-semibold text-base">{tobacco.current_grams} г</p>
                    </div>
                    <div className="bg-telegram-bg rounded-lg p-2">
                      <p className="text-telegram-hint text-xs mb-1">Использовано (период)</p>
                      <p className="text-telegram-text font-semibold text-base">{tobacco.used_grams} г</p>
                    </div>
                    <div className="bg-telegram-bg rounded-lg p-2">
                      <p className="text-telegram-hint text-xs mb-1">Использовано (всего)</p>
                      <p className="text-telegram-text font-semibold text-base">{tobacco.total_used_grams} г</p>
                    </div>
                  </div>
                </div>
              </div>

              {tobacco.usage_history.length > 0 && (
                <div className="mt-4">
                  <button
                    onClick={() => setSelectedTobacco(selectedTobacco === tobacco.id ? null : tobacco.id)}
                    className="w-full text-left text-sm font-medium text-telegram-button hover:opacity-80 transition-opacity flex items-center justify-between"
                  >
                    <span>История использования ({tobacco.usage_history.length})</span>
                    <svg
                      className={`w-4 h-4 transition-transform ${selectedTobacco === tobacco.id ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {selectedTobacco === tobacco.id && (
                    <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
                      {tobacco.usage_history.map((usage: TobaccoUsage) => {
                        const usageDate = new Date(usage.date)
                        const formattedTime = formatMoscowTime(usage.date)
                        return (
                          <div
                            key={usage.id}
                            className="bg-telegram-bg rounded-lg p-3 text-sm"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-telegram-text">{usage.mix_name}</span>
                              <span className="text-telegram-button font-semibold">{usage.grams} г</span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-telegram-hint">
                              <span>{format(usageDate, 'dd.MM.yyyy', { locale: ru })} {formattedTime}</span>
                              <span>{usage.creator_name}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

