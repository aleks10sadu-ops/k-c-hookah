'use client'

import { useState, useEffect } from 'react'
// @ts-ignore - xlsx types may not be perfect
import * as XLSX from 'xlsx'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { formatMoscowTime } from '@/lib/format-time'

interface DetailedRecord {
  id: string
  date: string
  time: string
  tobacco_name: string
  tobacco_id: string | null
  grams: number
  percentage: number
  mix_name: string
  mix_id: string | null
  mix_total_grams: number
  creator_name: string
  creator_id: string | null
}

export function DetailedStats() {
  const [records, setRecords] = useState<DetailedRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'all'>('all')
  const [sortBy, setSortBy] = useState<keyof DetailedRecord>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    loadDetailedStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period])

  const loadDetailedStats = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({ period })
      const response = await fetch(`/api/statistics/detailed?${params}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      
      if (result.error) {
        throw new Error(result.error)
      }
      
      setRecords(result.data || [])
    } catch (error: any) {
      console.error('Error loading detailed stats:', error)
      setRecords([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSort = (column: keyof DetailedRecord) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('desc')
    }
  }

  const sortedRecords = [...records].sort((a, b) => {
    const aVal = a[sortBy]
    const bVal = b[sortBy]
    if (aVal == null || bVal == null) return 0
    
    let comparison = 0
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      comparison = aVal.localeCompare(bVal, 'ru')
    } else if (typeof aVal === 'number' && typeof bVal === 'number') {
      comparison = aVal - bVal
    } else {
      comparison = String(aVal).localeCompare(String(bVal), 'ru')
    }
    
    return sortOrder === 'asc' ? comparison : -comparison
  })

  const exportToExcel = () => {
    if (sortedRecords.length === 0) {
      alert('Нет данных для экспорта')
      return
    }

    try {
      // Prepare data for export
      const exportData = sortedRecords.map((record) => {
        // Format time in Moscow timezone (24-hour format)
        const formattedTime = formatMoscowTime(record.date)
        
        return {
          'Дата': format(new Date(record.date), 'dd.MM.yyyy', { locale: ru }),
          'Время': formattedTime,
          'Табак': record.tobacco_name,
        'Грамм': record.grams,
        'Процент': Number(record.percentage).toFixed(2) + '%',
        'Название микса': record.mix_name,
        'Общий вес микса (г)': record.mix_total_grams,
        'Кальянщик': record.creator_name,
        }
      })

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(exportData)

      // Set column widths
      const colWidths = [
        { wch: 12 }, // Дата
        { wch: 8 },  // Время
        { wch: 25 }, // Табак
        { wch: 10 }, // Грамм
        { wch: 10 }, // Процент
        { wch: 25 }, // Название микса
        { wch: 18 }, // Общий вес микса
        { wch: 20 }, // Кальянщик
      ]
      ws['!cols'] = colWidths

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Использование табака')

      // Generate filename with period
      const periodNames: Record<string, string> = {
        today: 'Сегодня',
        week: 'Неделя',
        month: 'Месяц',
        all: 'Все_время',
      }
      const filename = `Статистика_табака_${periodNames[period]}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`

      // Save file
      XLSX.writeFile(wb, filename)
    } catch (error: any) {
      console.error('Export error:', error)
      alert('Ошибка при экспорте: ' + (error.message || 'Неизвестная ошибка'))
    }
  }

  if (isLoading) {
    return <div className="text-center py-8 text-telegram-hint">Загрузка...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center justify-between">
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
        <button
          onClick={exportToExcel}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Экспорт в Excel
        </button>
      </div>

      <div className="bg-telegram-secondary-bg rounded-lg p-4">
        <h3 className="text-lg font-semibold text-telegram-text mb-4">
          Детальная отчётность использования табака
        </h3>
        <p className="text-sm text-telegram-hint mb-4">
          Всего записей: {sortedRecords.length}
        </p>

        {records.length === 0 && !isLoading ? (
          <div className="text-center py-8 text-telegram-hint">
            <p>Нет данных для выбранного периода</p>
            <p className="text-xs mt-2">Попробуйте выбрать другой период или создайте микс</p>
          </div>
        ) : sortedRecords.length === 0 ? (
          <div className="text-center py-8 text-telegram-hint">Загрузка...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-telegram-bg">
                  <th
                    className="text-left p-2 font-semibold text-telegram-text cursor-pointer hover:bg-telegram-bg"
                    onClick={() => handleSort('date')}
                  >
                    Дата {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="text-left p-2 font-semibold text-telegram-text cursor-pointer hover:bg-telegram-bg"
                    onClick={() => handleSort('time')}
                  >
                    Время {sortBy === 'time' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="text-left p-2 font-semibold text-telegram-text cursor-pointer hover:bg-telegram-bg"
                    onClick={() => handleSort('tobacco_name')}
                  >
                    Табак {sortBy === 'tobacco_name' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="text-right p-2 font-semibold text-telegram-text cursor-pointer hover:bg-telegram-bg"
                    onClick={() => handleSort('grams')}
                  >
                    Грамм {sortBy === 'grams' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="text-right p-2 font-semibold text-telegram-text cursor-pointer hover:bg-telegram-bg"
                    onClick={() => handleSort('percentage')}
                  >
                    % {sortBy === 'percentage' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="text-left p-2 font-semibold text-telegram-text cursor-pointer hover:bg-telegram-bg"
                    onClick={() => handleSort('mix_name')}
                  >
                    Микс {sortBy === 'mix_name' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="text-right p-2 font-semibold text-telegram-text cursor-pointer hover:bg-telegram-bg"
                    onClick={() => handleSort('mix_total_grams')}
                  >
                    Вес микса {sortBy === 'mix_total_grams' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="text-left p-2 font-semibold text-telegram-text cursor-pointer hover:bg-telegram-bg"
                    onClick={() => handleSort('creator_name')}
                  >
                    Кальянщик {sortBy === 'creator_name' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedRecords.map((record) => {
                  // Format time in Moscow timezone (24-hour format) - always use date field, not time field
                  const formattedTime = formatMoscowTime(record.date)
                  
                  return (
                    <tr key={record.id} className="border-b border-telegram-bg hover:bg-telegram-bg">
                      <td className="p-2 text-telegram-text">
                        {format(new Date(record.date), 'dd.MM.yyyy', { locale: ru })}
                      </td>
                      <td className="p-2 text-telegram-text">{formattedTime}</td>
                    <td className="p-2 text-telegram-text font-medium">{record.tobacco_name}</td>
                    <td className="p-2 text-right text-telegram-text">{record.grams} г</td>
                    <td className="p-2 text-right text-telegram-text">{record.percentage.toFixed(2)}%</td>
                    <td className="p-2 text-telegram-text">{record.mix_name}</td>
                    <td className="p-2 text-right text-telegram-text">{record.mix_total_grams} г</td>
                    <td className="p-2 text-telegram-text">{record.creator_name}</td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

