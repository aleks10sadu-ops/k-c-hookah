'use client'

import { useState, FormEvent } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { ImageUpload } from '@/components/ui/ImageUpload'
import type { TobaccoItem, Category, Brand } from '@/types/tobacco.types'

interface TobaccoFormProps {
  tobacco?: TobaccoItem | null
  categories: Category[]
  brands: Brand[]
  onSave: (data: { name: string; available_grams: number; image_url?: string; category_id?: string; brand_id?: string }) => Promise<void>
  onCancel: () => void
  onAddCategory: () => void
  onAddBrand: () => void
}

export function TobaccoForm({ tobacco, categories, brands, onSave, onCancel, onAddCategory, onAddBrand }: TobaccoFormProps) {
  const [name, setName] = useState(tobacco?.name || '')
  const [grams, setGrams] = useState(tobacco?.available_grams || 0)
  const [customGrams, setCustomGrams] = useState('')
  const [imageUrl, setImageUrl] = useState(tobacco?.image_url || '')
  const [categoryId, setCategoryId] = useState(tobacco?.category_id || '')
  const [brandId, setBrandId] = useState(tobacco?.brand_id || '')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const quickGrams = [125, 256]

  const handleQuickGrams = (value: number) => {
    setGrams(value)
    setCustomGrams('')
  }

  const handleCustomGrams = (value: string) => {
    setCustomGrams(value)
    const num = parseInt(value)
    if (!isNaN(num) && num > 0) {
      setGrams(num)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Название обязательно')
      return
    }

    if (grams <= 0) {
      setError('Количество должно быть положительным')
      return
    }

    setIsLoading(true)
    try {
      await onSave({
        name: name.trim(),
        available_grams: grams,
        image_url: imageUrl && imageUrl.trim() ? imageUrl.trim() : undefined,
        category_id: categoryId || undefined,
        brand_id: brandId || undefined,
      })
    } catch (err: any) {
      setError(err.message || 'Ошибка при сохранении')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <Input
        label="Название табака"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Введите название"
        required
      />

      <div>
        <label className="block text-sm font-medium text-telegram-text mb-2">
          Бренд
        </label>
        <div className="flex gap-2">
          <select
            value={brandId}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setBrandId(e.target.value)}
            className="flex-1 px-4 py-2 bg-telegram-bg text-telegram-text border border-telegram-secondary-bg rounded-lg focus:outline-none focus:ring-2 focus:ring-telegram-button appearance-none text-base"
          >
            <option value="">Без бренда</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
          <Button type="button" variant="secondary" onClick={onAddBrand} className="px-3">
            +
          </Button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-telegram-text mb-2">
          Категория
        </label>
        <div className="flex gap-2">
          <select
            value={categoryId}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCategoryId(e.target.value)}
            className="flex-1 px-4 py-2 bg-telegram-bg text-telegram-text border border-telegram-secondary-bg rounded-lg focus:outline-none focus:ring-2 focus:ring-telegram-button appearance-none text-base"
          >
            <option value="">Без категории</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          <Button type="button" variant="secondary" onClick={onAddCategory} className="px-3">
            +
          </Button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-telegram-text mb-2">
          Количество грамм
        </label>
        <div className="flex gap-2 mb-2">
          {quickGrams.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => handleQuickGrams(value)}
              className={`px-4 py-2 rounded-lg transition-colors ${grams === value && customGrams === ''
                ? 'bg-telegram-button text-telegram-button-text'
                : 'bg-telegram-secondary-bg text-telegram-text hover:bg-opacity-80'
                }`}
            >
              {value} г
            </button>
          ))}
        </div>
        <Input
          type="number"
          value={customGrams}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleCustomGrams(e.target.value)}
          placeholder="Свое значение"
          min="1"
        />
        {grams > 0 && (
          <p className="mt-2 text-sm text-telegram-hint">
            Выбрано: <span className="font-medium text-telegram-text">{grams} г</span>
          </p>
        )}
      </div>

      <ImageUpload
        currentImageUrl={imageUrl}
        onImageUploaded={(url) => setImageUrl(url)}
        onImageRemoved={() => setImageUrl('')}
      />

      <div className="flex gap-2 pt-2">
        <Button type="submit" isLoading={isLoading} className="flex-1">
          {tobacco ? 'Сохранить' : 'Добавить'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
          Отменить
        </Button>
      </div>
    </form>
  )
}

