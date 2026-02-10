'use client'

import { Input } from '@/components/ui/Input'
import type { MixFormItem } from '@/types/mix.types'

interface MixItemProps {
  item: MixFormItem
  totalGrams: number
  mode: 'grams' | 'percentage'
  showQuickPercentages: boolean
  onUpdate: (updates: Partial<MixFormItem>) => void
  onRemove: () => void
}

export function MixItem({ item, totalGrams, mode, showQuickPercentages, onUpdate, onRemove }: MixItemProps) {
  const handleGramsChange = (value: string) => {
    const grams = parseFloat(value) || 0
    const percentage = totalGrams > 0 ? (grams / totalGrams) * 100 : 0
    // We don't round percentage here because grams drive the value, but display will truncate
    onUpdate({ grams, percentage })
  }

  const handlePercentageChange = (value: string) => {
    // Integer only for percentage input
    const percentage = Math.max(0, Math.min(100, parseInt(value) || 0))
    // Calculate grams based on current total
    const grams = totalGrams > 0 ? (totalGrams * percentage) / 100 : 0
    onUpdate({ percentage, grams })
  }

  const remaining = item.availableGrams - item.grams

  return (
    <div className="bg-telegram-secondary-bg rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-semibold text-telegram-text">{item.tobaccoName}</h4>
          <p className="text-sm text-telegram-hint">
            Доступно: {item.availableGrams} г
          </p>
        </div>
        <button
          onClick={onRemove}
          className="text-red-500 hover:text-red-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="space-y-3">
        {mode === 'grams' ? (
          <div>
            <Input
              label="Граммы"
              type="number"
              value={item.grams || ''}
              onChange={(e) => handleGramsChange(e.target.value)}
              min="0"
              max={item.availableGrams}
              step="0.1"
            />
            <p className="text-xs text-telegram-hint mt-1">
              Процент: {Math.round(item.percentage)}%
            </p>
          </div>
        ) : (
          <div>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Input
                  label="Проценты"
                  type="number"
                  value={Math.round(item.percentage).toString()}
                  onChange={(e) => handlePercentageChange(e.target.value)}
                  min="0"
                  max="100"
                  step="1"
                />
              </div>
              {showQuickPercentages && (
                <div className="flex gap-1 pb-1">
                  {[25, 50, 75].map((pct) => (
                    <button
                      key={pct}
                      onClick={() => handlePercentageChange(pct.toString())}
                      className="px-2 py-2 text-xs bg-telegram-bg hover:bg-telegram-button hover:text-telegram-button-text text-telegram-text rounded border border-telegram-secondary-bg transition-colors"
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-telegram-hint mt-1">
              Граммы: {item.grams.toFixed(1)} г
            </p>
          </div>
        )}

        <div className="text-sm">
          <p className={remaining < 0 ? 'text-red-500' : 'text-telegram-hint'}>
            Остаток: {remaining.toFixed(1)} г
          </p>
        </div>
      </div>
    </div>
  )
}

