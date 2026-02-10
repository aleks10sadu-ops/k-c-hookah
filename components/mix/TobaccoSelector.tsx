'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Input } from '@/components/ui/Input'
import type { TobaccoItem } from '@/types/tobacco.types'

interface TobaccoSelectorProps {
  tobaccoItems: TobaccoItem[]
  onSelect: (tobacco: TobaccoItem) => void
}

export function TobaccoSelector({ tobaccoItems, onSelect }: TobaccoSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Filter and sort items by relevance
  const getFilteredItems = () => {
    if (!searchQuery.trim()) {
      return tobaccoItems.slice(0, 10) // Show first 10 when no query
    }

    const query = searchQuery.toLowerCase()
    const filtered = tobaccoItems
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
        // Sort by: starts with query first, then by match position, then alphabetically
        if (a.startsWith && !b.startsWith) return -1
        if (!a.startsWith && b.startsWith) return 1
        if (a.matchIndex !== b.matchIndex) return a.matchIndex - b.matchIndex
        return a.name.localeCompare(b.name, 'ru')
      })
      .slice(0, 8) // Limit to 8 suggestions

    return filtered
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
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 text-telegram-text">
          {part}
        </mark>
      ) : (
        part
      )
    )
  }

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showSuggestions || filteredItems.length === 0) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex((prev) =>
            prev < filteredItems.length - 1 ? prev + 1 : prev
          )
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
          break
        case 'Enter':
          e.preventDefault()
          if (selectedIndex >= 0 && selectedIndex < filteredItems.length) {
            handleSelect(filteredItems[selectedIndex])
          } else if (filteredItems.length === 1) {
            handleSelect(filteredItems[0])
          }
          break
        case 'Escape':
          setShowSuggestions(false)
          setSelectedIndex(-1)
          break
      }
    }

    if (showSuggestions) {
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [showSuggestions, selectedIndex, filteredItems, handleSelect])

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && suggestionsRef.current) {
      const selectedElement = suggestionsRef.current.children[selectedIndex] as HTMLElement
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }
    }
  }, [selectedIndex])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setShowSuggestions(true)
    setSelectedIndex(-1)
  }

  const handleInputFocus = () => {
    setShowSuggestions(true)
  }

  const handleInputBlur = (e: React.FocusEvent) => {
    // Delay to allow click on suggestion
    // Don't close if focus moves to another element within the modal
    setTimeout(() => {
      const activeElement = document.activeElement
      if (
        !suggestionsRef.current?.contains(activeElement) &&
        !inputRef.current?.contains(activeElement) &&
        activeElement !== inputRef.current
      ) {
        setShowSuggestions(false)
        setSelectedIndex(-1)
      }
    }, 200)
  }

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <Input
        ref={inputRef}
        placeholder="Начните вводить название табака..."
        value={searchQuery}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        onClick={(e) => e.stopPropagation()}
        className="mb-3"
        autoComplete="off"
      />

      {showSuggestions && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full bg-telegram-secondary-bg border border-telegram-bg rounded-lg shadow-lg max-h-64 overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {filteredItems.length === 0 ? (
            <div className="p-4 text-center text-telegram-hint">
              <p>Табаки не найдены</p>
              <p className="text-xs mt-1">Попробуйте другой запрос</p>
            </div>
          ) : (
            <div className="py-2">
              {filteredItems.map((tobacco, index) => (
                <button
                  key={tobacco.id}
                  onClick={() => handleSelect(tobacco)}
                  className={`w-full text-left px-4 py-3 transition-colors ${
                    index === selectedIndex
                      ? 'bg-telegram-button text-telegram-button-text'
                      : 'bg-transparent hover:bg-telegram-bg text-telegram-text'
                  }`}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      {highlightMatch(tobacco.name, searchQuery)}
                    </span>
                    <span
                      className={`text-sm ${
                        index === selectedIndex
                          ? 'text-telegram-button-text opacity-90'
                          : 'text-telegram-hint'
                      }`}
                    >
                      {tobacco.available_grams} г
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {!showSuggestions && (
        <div className="max-h-60 overflow-y-auto space-y-2">
          {tobaccoItems.length === 0 ? (
            <p className="text-center text-telegram-hint py-4">Нет доступных табаков</p>
          ) : (
            tobaccoItems.slice(0, 20).map((tobacco) => (
              <button
                key={tobacco.id}
                onClick={() => handleSelect(tobacco)}
                className="w-full text-left p-3 bg-telegram-secondary-bg rounded-lg hover:bg-opacity-80 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-telegram-text">{tobacco.name}</span>
                  <span className="text-sm text-telegram-hint">
                    {tobacco.available_grams} г
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

