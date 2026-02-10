'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { StatCard } from './StatCard'

interface TobaccoStat {
  id: string
  name: string
  image_url: string | null
  current_grams: number
  used_grams: number
  mix_count: number
  usage_percentage: number
}

interface Summary {
  total_sessions: number
  total_used_grams: number
  avg_mix_weight: number
  most_popular_tobacco: TobaccoStat | null
}

export function TobaccoStats() {
  const [stats, setStats] = useState<TobaccoStat[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'all'>('all')
  const [sortBy, setSortBy] = useState<keyof TobaccoStat>('used_grams')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    loadStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period])

  const loadStats = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({ period })
      const response = await fetch(`/api/statistics/tobacco?${params}`)
      const { data, error, summary: summaryData } = await response.json()
      if (error) throw new Error(error)
      setStats(data || [])
      setSummary(summaryData || null)
    } catch (error: any) {
      console.error('Error loading stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSort = (column: keyof TobaccoStat) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('desc')
    }
  }

  const sortedStats = [...stats].sort((a, b) => {
    const aVal = a[sortBy]
    const bVal = b[sortBy]
    if (aVal == null || bVal == null) return 0
    if (sortOrder === 'asc') {
      return aVal > bVal ? 1 : -1
    }
    return aVal < bVal ? 1 : -1
  })

  const top5Tobacco = sortedStats.slice(0, 5).map((item) => ({
    name: item.name,
    used: item.used_grams,
  }))

  if (isLoading) {
    return <div className="text-center py-8 text-telegram-hint">Загрузка...</div>
  }

  return (
    <div className="space-y-6">
      {summary && (
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            title="Всего кальянов"
            value={summary.total_sessions}
            icon="💨"
          />
          <StatCard
            title="Использовано табака"
            value={`${summary.total_used_grams.toFixed(0)} г`}
            icon="🌿"
          />
          <StatCard
            title="Средний вес микса"
            value={`${summary.avg_mix_weight.toFixed(1)} г`}
            icon="⚖️"
          />
          {summary.most_popular_tobacco && (
            <StatCard
              title="Самый популярный"
              value={summary.most_popular_tobacco.name}
              subtitle={`${summary.most_popular_tobacco.used_grams.toFixed(0)} г`}
              icon="⭐"
            />
          )}
        </div>
      )}

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

      {top5Tobacco.length > 0 && (
        <div className="bg-telegram-secondary-bg rounded-lg p-4">
          <h3 className="text-lg font-semibold text-telegram-text mb-4">Топ-5 используемых табаков</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={top5Tobacco}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="name" stroke="#999" fontSize={12} />
              <YAxis stroke="#999" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--tg-theme-secondary-bg-color)',
                  border: '1px solid var(--tg-theme-hint-color)',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="used" fill="var(--tg-theme-button-color)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {sortedStats.length === 0 ? (
        <div className="text-center py-8 text-telegram-hint">Нет данных</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-telegram-secondary-bg">
                <th className="text-left p-2 text-sm font-semibold text-telegram-text">Табак</th>
                <th
                  className="text-right p-2 text-sm font-semibold text-telegram-text cursor-pointer hover:bg-telegram-secondary-bg"
                  onClick={() => handleSort('current_grams')}
                >
                  Остаток {sortBy === 'current_grams' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className="text-right p-2 text-sm font-semibold text-telegram-text cursor-pointer hover:bg-telegram-secondary-bg"
                  onClick={() => handleSort('used_grams')}
                >
                  Использовано {sortBy === 'used_grams' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className="text-right p-2 text-sm font-semibold text-telegram-text cursor-pointer hover:bg-telegram-secondary-bg"
                  onClick={() => handleSort('mix_count')}
                >
                  Миксов {sortBy === 'mix_count' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className="text-right p-2 text-sm font-semibold text-telegram-text cursor-pointer hover:bg-telegram-secondary-bg"
                  onClick={() => handleSort('usage_percentage')}
                >
                  % {sortBy === 'usage_percentage' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedStats.map((stat) => (
                <tr key={stat.id} className="border-b border-telegram-secondary-bg">
                  <td className="p-2">
                    <div className="flex items-center gap-2">
                      {stat.image_url ? (
                        <div className="relative w-10 h-10 rounded overflow-hidden">
                          <Image
                            src={stat.image_url}
                            alt={stat.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded bg-telegram-bg flex items-center justify-center">
                          <span>🌿</span>
                        </div>
                      )}
                      <span className="text-telegram-text">{stat.name}</span>
                    </div>
                  </td>
                  <td className="p-2 text-right text-telegram-text">{stat.current_grams} г</td>
                  <td className="p-2 text-right text-telegram-text">{stat.used_grams.toFixed(1)} г</td>
                  <td className="p-2 text-right text-telegram-text">{stat.mix_count}</td>
                  <td className="p-2 text-right text-telegram-text">{stat.usage_percentage.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

