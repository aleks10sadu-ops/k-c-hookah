'use client'

import Image from 'next/image'
import type { TobaccoItem } from '@/types/tobacco.types'

interface TobaccoCardProps {
  tobacco: TobaccoItem
  onEdit: (tobacco: TobaccoItem) => void
  onDelete: (id: string) => void
  onRestock: () => void
}

export function TobaccoCard({ tobacco, onEdit, onDelete, onRestock }: TobaccoCardProps) {
  return (
    <div className="bg-telegram-secondary-bg rounded-lg p-4 shadow-sm">
      <div className="flex items-start gap-4">
        {tobacco.image_url ? (
          <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden">
            <Image
              src={tobacco.image_url}
              alt={tobacco.name}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="w-24 h-24 flex-shrink-0 rounded-lg bg-telegram-bg flex items-center justify-center">
            <span className="text-3xl">🌿</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-telegram-text truncate text-lg">{tobacco.name}</h3>
          <p className="text-sm text-telegram-hint mt-1">
            Доступно: <span className="font-medium text-telegram-text">{tobacco.available_grams} г</span>
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            <button
              onClick={onRestock}
              className="px-3 py-1.5 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              Внести
            </button>
            <button
              onClick={() => onEdit(tobacco)}
              className="px-3 py-1.5 text-sm bg-telegram-button text-telegram-button-text rounded-lg hover:opacity-90 transition-opacity"
            >
              Изм.
            </button>
            <button
              onClick={() => onDelete(tobacco.id)}
              className="px-3 py-1.5 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Удал.
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

