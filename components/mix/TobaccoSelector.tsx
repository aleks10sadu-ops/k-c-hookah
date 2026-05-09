'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Input } from '@/components/ui/Input'
import type { TobaccoItem } from '@/types/tobacco.types'

// Hook for mouse-drag scrolling
function useDraggableScroll() {
  const ref = useRef<HTMLDivElement>(null)
  const [isDown, setIsDown] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  const onMouseDown = (e: React.MouseEvent) => {
    if (!ref.current) return
    setIsDown(true)
    setIsDragging(false)
    setStartX(e.pageX - ref.current.offsetLeft)
    setScrollLeft(ref.current.scrollLeft)
  }

  const onMouseLeave = () => {
    setIsDown(false)
  }

  const onMouseUp = () => {
    setIsDown(false)
    // Small timeout to allow the 'onClickCapture' or 'onClick' to see the isDragging state
    // before it gets reset. However, we'll use a better approach with capture.
  }

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDown || !ref.current) return
    
    const x = e.pageX - ref.current.offsetLeft
    const distance = Math.abs(x - startX)
    
    // If moved more than 5 pixels, consider it a drag
    if (distance > 5) {
      setIsDragging(true)
    }

    if (isDragging) {
      e.preventDefault()
      const walk = (x - startX) * 2 // Scroll speed
      ref.current.scrollLeft = scrollLeft - walk
    }
  }

  // Prevent clicks if we were dragging
  const handleItemClick = (e: React.MouseEvent) => {
    if (isDragging) {
      e.preventDefault()
      e.stopPropagation()
    }
  }

  return {
    ref,
    isDragging,
    handleItemClick,
    props: {
      onMouseDown,
      onMouseLeave,
      onMouseUp,
      onMouseMove,
    }
  }
}

interface TobaccoSelectorProps {
  tobaccoItems: TobaccoItem[]
  categories: any[]
  brands: any[]
  onSelect: (tobacco: TobaccoItem) => void
}

export function TobaccoSelector({ tobaccoItems, categories, brands, onSelect }: TobaccoSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all')
  const [selectedBrandId, setSelectedBrandId] = useState<string>('all')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)

  const brandsDrag = useDraggableScroll()
  const categoriesDrag = useDraggableScroll()

  // Filter and sort items by relevance
  const getFilteredItems = () => {
    let filtered = tobaccoItems

    // Filter by brand
    if (selectedBrandId !== 'all') {
      filtered = filtered.filter((item) => item.brand_id === selectedBrandId)
    }

    // Filter by category
    if (selectedCategoryId !== 'all') {
      filtered = filtered.filter((item) => item.category_id === selectedCategoryId)
    }

    if (!searchQuery.trim()) {
      return filtered
    }

    const query = searchQuery.toLowerCase()
    return filtered
      .filter((item) => item.name.toLowerCase().includes(query))
      .map((item) => {
        const nameLower = item.name.toLowerCase()
        const index = nameLower.indexOf(query)
        return {
          ...item,
          matchIndex: index,
          startsWith: index === 0,
        }
      })
      .sort((a, b) => {
        if (a.startsWith && !b.startsWith) return -1
        if (!a.startsWith && b.startsWith) return 1
        if (a.matchIndex !== b.matchIndex) return a.matchIndex - b.matchIndex
        return a.name.localeCompare(b.name, 'ru')
      })
  }

  const filteredItems = getFilteredItems()

  const handleSelect = useCallback((tobacco: TobaccoItem) => {
    onSelect(tobacco)
    setSearchQuery('')
    setShowSuggestions(false)
    setSelectedIndex(-1)
  }, [onSelect])

  // Highlight matching text
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text

    const parts = text.split(new RegExp(`(${query})`, 'gi'))
    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 text-telegram-text rounded-sm">
          {part}
        </mark>
      ) : (
        part
      )
    )
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    if (!showSuggestions) setShowSuggestions(true)
    setSelectedIndex(-1)
  }

  return (
    <div className="relative min-h-[500px] max-h-[70vh] flex flex-col -mx-1" onClick={(e) => e.stopPropagation()}>
      <div className="sticky top-0 bg-telegram-bg z-10 pb-4 px-1">
        <Input
          ref={inputRef}
          placeholder="Поиск табака по названию..."
          value={searchQuery}
          onChange={handleInputChange}
          onClick={(e) => e.stopPropagation()}
          className="mb-4"
          autoComplete="off"
        />

        {/* Brands Tabs (Mirrors TobaccoList) */}
        <div 
          ref={brandsDrag.ref}
          {...brandsDrag.props}
          className="flex items-center gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide mb-2 cursor-grab active:cursor-grabbing select-none touch-pan-x"
        >
          <button
            type="button"
            onClickCapture={brandsDrag.handleItemClick}
            onClick={() => setSelectedBrandId('all')}
            className={`whitespace-nowrap px-4 py-2 rounded-lg transition-colors text-sm font-medium shrink-0 ${selectedBrandId === 'all'
              ? 'bg-telegram-button text-telegram-button-text'
              : 'bg-telegram-secondary-bg text-telegram-text'
              }`}
          >
            Все бренды
          </button>
          {brands.map((brand) => (
            <button
              type="button"
              key={brand.id}
              onClickCapture={brandsDrag.handleItemClick}
              onClick={() => setSelectedBrandId(brand.id)}
              className={`whitespace-nowrap px-4 py-2 rounded-lg transition-colors text-sm font-medium shrink-0 ${selectedBrandId === brand.id
                ? 'bg-telegram-button text-telegram-button-text'
                : 'bg-telegram-secondary-bg text-telegram-text'
                }`}
            >
              {brand.name}
            </button>
          ))}
        </div>

        {/* Categories Tabs (Mirrors TobaccoList) */}
        <div 
          ref={categoriesDrag.ref}
          {...categoriesDrag.props}
          className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide touch-pan-x cursor-grab active:cursor-grabbing select-none"
        >
          <button
            type="button"
            onClickCapture={categoriesDrag.handleItemClick}
            onClick={() => setSelectedCategoryId('all')}
            className={`whitespace-nowrap px-4 py-2 rounded-lg transition-colors text-sm font-medium shrink-0 ${selectedCategoryId === 'all'
              ? 'bg-telegram-button text-telegram-button-text'
              : 'bg-telegram-secondary-bg text-telegram-text'
              }`}
          >
            Все категории
          </button>
          {categories.map((category) => (
            <button
              type="button"
              key={category.id}
              onClickCapture={categoriesDrag.handleItemClick}
              onClick={() => setSelectedCategoryId(category.id)}
              className={`whitespace-nowrap px-4 py-2 rounded-lg transition-colors text-sm font-medium shrink-0 ${selectedCategoryId === category.id
                ? 'bg-telegram-button text-telegram-button-text'
                : 'bg-telegram-secondary-bg text-telegram-text'
                }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto mt-2 px-1 pr-1 custom-scrollbar">
        {filteredItems.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-telegram-hint">Табаки не найдены</p>
          </div>
        ) : (
          <div className="space-y-3 pb-4">
            {filteredItems.map((tobacco) => (
              <button
                key={tobacco.id}
                onClick={() => handleSelect(tobacco)}
                className="w-full text-left bg-telegram-secondary-bg rounded-lg p-3 shadow-sm hover:opacity-90 transition-opacity border border-transparent active:border-telegram-button"
              >
                <div className="flex items-start gap-3">
                  {tobacco.image_url ? (
                    <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border border-telegram-bg/10">
                      <Image
                        src={tobacco.image_url}
                        alt={tobacco.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 flex-shrink-0 rounded-lg bg-telegram-bg flex items-center justify-center border border-telegram-bg/10">
                      <span className="text-xl">🌿</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-telegram-text truncate text-base leading-tight">
                      {highlightMatch(tobacco.name, searchQuery)}
                    </h3>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {tobacco.brands?.name && (
                        <span className="text-telegram-text text-xs font-semibold">
                          {tobacco.brands.name}
                        </span>
                      )}
                      {tobacco.categories?.name && (
                        <span className="px-1.5 py-0.5 bg-telegram-bg/30 text-telegram-hint text-[10px] font-medium rounded border border-telegram-bg/20">
                          {tobacco.categories.name}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-telegram-hint mt-1.5 uppercase tracking-wide">
                      Остаток: <span className="font-bold text-telegram-text">{tobacco.available_grams} г</span>
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

