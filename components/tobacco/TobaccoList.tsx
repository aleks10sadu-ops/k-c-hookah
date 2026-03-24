'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { TobaccoCard } from './TobaccoCard'
import { TobaccoForm } from './TobaccoForm'
import { CategoryManager } from '@/components/category/CategoryManager'
import { BrandManager } from '@/components/brand/BrandManager'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Toast } from '@/components/ui/Toast'
import { RestockModal } from './RestockModal'
import type { TobaccoItem, Category, Brand } from '@/types/tobacco.types'

export function TobaccoList() {
  const [tobaccoItems, setTobaccoItems] = useState<TobaccoItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [filteredItems, setFilteredItems] = useState<TobaccoItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all')
  const [selectedBrandId, setSelectedBrandId] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false)
  const [isBrandManagerOpen, setIsBrandManagerOpen] = useState(false)
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false)
  const [editingTobacco, setEditingTobacco] = useState<TobaccoItem | null>(null)
  const [restockingTobacco, setRestockingTobacco] = useState<TobaccoItem | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  const supabase = createClient()

  useEffect(() => {
    Promise.all([loadTobaccoItems(), loadCategories(), loadBrands()]).finally(() => {
      setIsLoading(false)
    })
    setupRealtimeSubscription()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadTobaccoItems = async () => {
    try {
      const response = await fetch('/api/tobacco')
      const { data, error } = await response.json()
      if (error) throw new Error(error)
      setTobaccoItems(data || [])
    } catch (error: any) {
      setToast({ message: error.message || 'Ошибка загрузки табаков', type: 'error' })
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
      setToast({ message: 'Ошибка загрузки категорий', type: 'error' })
    }
  }

  const loadBrands = async () => {
    try {
      const response = await fetch('/api/brands')
      const { data, error } = await response.json()
      if (error) throw new Error(error)
      setBrands(data || [])
    } catch (error: any) {
      console.error('Failed to load brands:', error)
      setToast({ message: 'Ошибка загрузки брендов', type: 'error' })
    }
  }

  // Filter items based on search query and category
  useEffect(() => {
    let result = tobaccoItems

    // Filter by brand
    if (selectedBrandId !== 'all') {
      result = result.filter((item: TobaccoItem) => item.brand_id === selectedBrandId)
    }

    // Filter by category
    if (selectedCategoryId !== 'all') {
      result = result.filter((item: TobaccoItem) => item.category_id === selectedCategoryId)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter((item: TobaccoItem) =>
        item.name.toLowerCase().includes(query)
      )
    }

    setFilteredItems(result)
  }, [searchQuery, selectedCategoryId, selectedBrandId, tobaccoItems])

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('tobacco_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tobacco_items',
        },
        () => {
          loadTobaccoItems()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const handleAdd = () => {
    setEditingTobacco(null)
    setIsFormOpen(true)
  }

  const handleEdit = (tobacco: TobaccoItem) => {
    setEditingTobacco(tobacco)
    setIsFormOpen(true)
  }

  const handleSave = async (data: { name: string; available_grams: number; image_url?: string; category_id?: string; brand_id?: string }) => {
    try {
      if (editingTobacco) {
        // Update existing
        const response = await fetch('/api/tobacco', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingTobacco.id,
            ...data,
          }),
        })
        const result = await response.json()
        if (result.error) throw new Error(result.error)
      } else {
        // Create new
        const response = await fetch('/api/tobacco', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        const result = await response.json()
        if (result.error) throw new Error(result.error)
      }

      setToast({ message: 'Табак успешно сохранён', type: 'success' })
      setIsFormOpen(false)
      setEditingTobacco(null)
      // Reload to show updated data
      await loadTobaccoItems()
    } catch (error: any) {
      throw error
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот табак?')) {
      return
    }

    try {
      const response = await fetch(`/api/tobacco?id=${id}`, {
        method: 'DELETE',
      })
      const result = await response.json()
      if (result.error) throw new Error(result.error)

      setToast({ message: 'Табак успешно удалён', type: 'success' })
      loadTobaccoItems()
    } catch (error: any) {
      setToast({ message: error.message || 'Ошибка удаления', type: 'error' })
    }
  }

  const handleRestockClick = (tobacco: TobaccoItem) => {
    setRestockingTobacco(tobacco)
    setIsRestockModalOpen(true)
  }

  const handleRestock = async (id: string, amount: number) => {
    try {
      const response = await fetch('/api/tobacco/restock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, amount }),
      })
      const result = await response.json()
      if (result.error) throw new Error(result.error)

      setToast({ message: 'Табак успешно внесён', type: 'success' })
      setIsRestockModalOpen(false)
      setRestockingTobacco(null)
      await loadTobaccoItems()
    } catch (error: any) {
      throw error
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-telegram-hint">Загрузка...</p>
      </div>
    )
  }

  return (
    <>
      <div className="mb-4 space-y-3">
        <Input
          placeholder="Поиск табака по названию..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        {/* Brands Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
          <button
            onClick={() => setSelectedBrandId('all')}
            className={`whitespace-nowrap px-4 py-2 rounded-lg transition-colors text-sm font-medium ${selectedBrandId === 'all'
              ? 'bg-telegram-button text-telegram-button-text'
              : 'bg-telegram-secondary-bg text-telegram-text'
              }`}
          >
            Все бренды
          </button>
          {brands.map((brand) => (
            <button
              key={brand.id}
              onClick={() => setSelectedBrandId(brand.id)}
              className={`whitespace-nowrap px-4 py-2 rounded-lg transition-colors text-sm font-medium ${selectedBrandId === brand.id
                ? 'bg-telegram-button text-telegram-button-text'
                : 'bg-telegram-secondary-bg text-telegram-text'
                }`}
            >
              {brand.name}
            </button>
          ))}
          <button
            onClick={() => setIsBrandManagerOpen(true)}
            className="whitespace-nowrap px-3 py-2 rounded-lg bg-telegram-secondary-bg text-telegram-link text-sm font-medium border border-telegram-link border-dashed"
          >
            + Бренды
          </button>
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
            Все категории
          </button>
          {categories.map((category) => (
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
          <button
            onClick={() => setIsCategoryManagerOpen(true)}
            className="whitespace-nowrap px-3 py-2 rounded-lg bg-telegram-secondary-bg text-telegram-link text-sm font-medium border border-telegram-link border-dashed"
          >
            + Категории
          </button>
        </div>

        <Button onClick={handleAdd} className="w-full">
          + Добавить новый табак
        </Button>
      </div>

      {tobaccoItems.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-telegram-hint text-lg mb-2">Нет табаков</p>
          <p className="text-telegram-hint text-sm">Добавьте первый табак, чтобы начать</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-telegram-hint text-lg mb-2">Табаки не найдены</p>
          <p className="text-telegram-hint text-sm">Попробуйте изменить категорию или запрос поиска</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((tobacco: TobaccoItem) => (
            <TobaccoCard
              key={tobacco.id}
              tobacco={tobacco}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onRestock={() => handleRestockClick(tobacco)}
            />
          ))}
        </div>
      )}

      <Modal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false)
          setEditingTobacco(null)
        }}
        title={editingTobacco ? 'Редактировать табак' : 'Добавить табак'}
      >
        <TobaccoForm
          tobacco={editingTobacco}
          categories={categories}
          brands={brands}
          onSave={handleSave}
          onCancel={() => {
            setIsFormOpen(false)
            setEditingTobacco(null)
          }}
          onAddCategory={() => {
            setIsCategoryManagerOpen(true)
            // Keep form open
          }}
          onAddBrand={() => {
            setIsBrandManagerOpen(true)
          }}
        />
      </Modal>

      <CategoryManager
        isOpen={isCategoryManagerOpen}
        onClose={() => setIsCategoryManagerOpen(false)}
        onCategoryChange={loadCategories}
      />

      <BrandManager
        isOpen={isBrandManagerOpen}
        onClose={() => setIsBrandManagerOpen(false)}
        onBrandChange={loadBrands}
      />

      <RestockModal
        isOpen={isRestockModalOpen}
        onClose={() => {
          setIsRestockModalOpen(false)
          setRestockingTobacco(null)
        }}
        tobacco={restockingTobacco}
        onRestock={handleRestock}
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          isVisible={true}
          onClose={() => setToast(null)}
        />
      )}
    </>
  )
}

