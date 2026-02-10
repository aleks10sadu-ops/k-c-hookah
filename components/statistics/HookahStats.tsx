'use client'

import { useState, useEffect } from 'react'

interface HookahStat {
  userId: string
  telegramId: number
  name: string
  today: number
  week: number
  month: number
  total: number
}

export function HookahStats() {
  const [stats, setStats] = useState<HookahStat[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'all'>('all')
  const [sortBy, setSortBy] = useState<keyof HookahStat>('total')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    loadStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period])

  const loadStats = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({ period })
      const response = await fetch(`/api/statistics/hookahs?${params}`)
      const { data, error } = await response.json()
      if (error) throw new Error(error)
      setStats(data || [])
    } catch (error: any) {
      console.error('Error loading stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSort = (column: keyof HookahStat) => {
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
    if (sortOrder === 'asc') {
      return aVal > bVal ? 1 : -1
    }
    return aVal < bVal ? 1 : -1
  })

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

      {sortedStats.length === 0 ? (
        <div className="text-center py-8 text-telegram-hint">Нет данных</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-telegram-secondary-bg">
                <th
                  className="text-left p-2 text-sm font-semibold text-telegram-text cursor-pointer hover:bg-telegram-secondary-bg"
                  onClick={() => handleSort('name')}
                >
                  Имя {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className="text-right p-2 text-sm font-semibold text-telegram-text cursor-pointer hover:bg-telegram-secondary-bg"
                  onClick={() => handleSort('today')}
                >
                  Сегодня {sortBy === 'today' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className="text-right p-2 text-sm font-semibold text-telegram-text cursor-pointer hover:bg-telegram-secondary-bg"
                  onClick={() => handleSort('week')}
                >
                  Неделя {sortBy === 'week' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className="text-right p-2 text-sm font-semibold text-telegram-text cursor-pointer hover:bg-telegram-secondary-bg"
                  onClick={() => handleSort('month')}
                >
                  Месяц {sortBy === 'month' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className="text-right p-2 text-sm font-semibold text-telegram-text cursor-pointer hover:bg-telegram-secondary-bg"
                  onClick={() => handleSort('total')}
                >
                  Всего {sortBy === 'total' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedStats.map((stat) => (
                <tr key={stat.userId} className="border-b border-telegram-secondary-bg">
                  <td className="p-2 text-telegram-text">{stat.name}</td>
                  <td className="p-2 text-right text-telegram-text">{stat.today}</td>
                  <td className="p-2 text-right text-telegram-text">{stat.week}</td>
                  <td className="p-2 text-right text-telegram-text">{stat.month}</td>
                  <td className="p-2 text-right font-semibold text-telegram-text">{stat.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

