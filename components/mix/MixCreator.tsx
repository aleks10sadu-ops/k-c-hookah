'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { TobaccoSelector } from './TobaccoSelector'
import { MixItem } from './MixItem'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Toast } from '@/components/ui/Toast'
import type { TobaccoItem } from '@/types/tobacco.types'
import type { MixFormItem } from '@/types/mix.types'

export function MixCreator() {
  const [tobaccoItems, setTobaccoItems] = useState<TobaccoItem[]>([])
  const [mixItems, setMixItems] = useState<MixFormItem[]>([])
  const [mixName, setMixName] = useState('')
  const [saveAsTemplate, setSaveAsTemplate] = useState(false)
  const [parentTemplateId, setParentTemplateId] = useState<string | null>(null)
  const [mode, setMode] = useState<'grams' | 'percentage'>('percentage')
  const [isSelectorOpen, setIsSelectorOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [savedTemplates, setSavedTemplates] = useState<any[]>([])

  const supabase = createClient()

  useEffect(() => {
    loadTobaccoItems()
    loadUserId()
    loadTemplates()
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

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/mixes?template=true')
      const { data, error } = await response.json()
      if (error) throw new Error(error)

      // Sort by popularity: Likes descending (ignore dislikes for ranking)
      const sorted = (data || []).sort((a: any, b: any) => {
        return (b.likes || 0) - (a.likes || 0)
      })

      setSavedTemplates(sorted)
    } catch (error: any) {
      console.error('Error loading templates:', error)
    }
  }

  const handleUseTemplate = (template: any) => {
    if (!template.mix_items || !Array.isArray(template.mix_items)) {
      setToast({ message: 'Шаблон повреждён', type: 'error' })
      return
    }

    const newItems: MixFormItem[] = template.mix_items.map((item: any) => {
      const tobacco = tobaccoItems.find(t => t.id === item.tobaccoid)
      if (!tobacco) {
        throw new Error(`Табак ${item.tobaccoid} не найден`)
      }
      return {
        tobaccoId: item.tobaccoid,
        tobaccoName: tobacco.name,
        grams: item.grams,
        percentage: item.percentage,
        availableGrams: tobacco.available_grams,
      }
    })

    setMixItems(newItems)
    setMixName(template.name)
    setSaveAsTemplate(true)

    setParentTemplateId(template.id) // Track parent template
    setToast({ message: 'Шаблон загружен', type: 'success' })
  }

  const handleDeleteTemplate = async (templateId: string, templateName: string) => {
    if (!confirm(`Вы уверены, что хотите удалить шаблон "${templateName}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/mixes?id=${templateId}`, {
        method: 'DELETE',
      })

      const result = await response.json()
      if (result.error) throw new Error(result.error)

      setToast({ message: 'Шаблон успешно удалён', type: 'success' })
      loadTemplates()
    } catch (error: any) {
      setToast({ message: error.message || 'Ошибка удаления шаблона', type: 'error' })
    }
  }

  const loadUserId = async () => {
    // Get user ID from localStorage (set by Providers after auth)
    try {
      // Get current Telegram user
      let currentTelegramId: string | null = null
      if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
        const tg = (window as any).Telegram.WebApp
        const tgUser = tg.initDataUnsafe?.user
        if (tgUser?.id) {
          currentTelegramId = tgUser.id.toString()
        }
      }

      const storedUserId = localStorage.getItem('userId')
      const storedTelegramId = localStorage.getItem('telegramId')

      // Verify that stored userId matches current Telegram user
      if (storedUserId && currentTelegramId && storedTelegramId === currentTelegramId) {
        setUserId(storedUserId)
        return
      }

      // If mismatch or no stored data, clear and try to authenticate
      if (storedUserId && currentTelegramId && storedTelegramId !== currentTelegramId) {
        console.log('MixCreator: Telegram ID mismatch, clearing storage', {
          stored: storedTelegramId,
          current: currentTelegramId
        })
        localStorage.removeItem('userId')
        localStorage.removeItem('telegramId')
      }

      // If no userId in localStorage or mismatch, try to authenticate
      if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
        const tg = (window as any).Telegram.WebApp
        const initData = tg.initData

        if (initData) {
          const response = await fetch('/api/auth/telegram', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ initData }),
          })

          const result = await response.json()
          if (result.userId && !result.error && result.user) {
            setUserId(result.userId)
            localStorage.setItem('userId', result.userId)
            localStorage.setItem('telegramId', result.user.id.toString())
            return
          }
        }
      }

      // If no valid user found
      console.warn('MixCreator: No valid user ID found')

      // Development mode: Auto-login as developer
      if (process.env.NODE_ENV === 'development') {
        try {
          const response = await fetch('/api/auth/dev', { method: 'POST' })
          const result = await response.json()

          if (result.user) {
            console.log('MixCreator: Auto-logged in as Developer')
            setUserId(result.user.id)
            localStorage.setItem('userId', result.user.id)
            localStorage.setItem('telegramId', result.user.telegram_id.toString())

            // Show toast only once
            if (!storedUserId) {
              setToast({ message: 'Режим разработчика: Вход выполнен', type: 'info' })
            }
            return
          }
        } catch (devError) {
          console.error('MixCreator: Failed to auto-login as developer', devError)
        }
      }

      setUserId(null)
    } catch (error) {
      console.error('Error loading user ID:', error)
      setUserId(null)
    }
  }

  const totalGrams = mixItems.reduce((sum, item) => sum + item.grams, 0)
  const totalPercentage = mixItems.reduce((sum, item) => sum + item.percentage, 0)

  const handleAddTobacco = (tobacco: TobaccoItem) => {
    if (mixItems.some((item) => item.tobaccoId === tobacco.id)) {
      setToast({ message: 'Этот табак уже добавлен', type: 'error' })
      return
    }

    const newItem: MixFormItem = {
      tobaccoId: tobacco.id,
      tobaccoName: tobacco.name,
      grams: mixItems.length === 0 ? 25 : 0, // Default 100% (25g) if first item
      percentage: mixItems.length === 0 ? 100 : 0, // Default 100% if first item
      availableGrams: tobacco.available_grams,
    }

    let updatedMixItems = [...mixItems, newItem]

    // Rule: Reset first item to 0% if adding ONLY the second item 
    // (so user must choose both).
    // If adding 3rd+, keep existing unchanged.
    if (mixItems.length === 1) {
      updatedMixItems[0] = {
        ...updatedMixItems[0],
        percentage: 0,
        grams: 0
      }
    }

    setMixItems(updatedMixItems)
    setIsSelectorOpen(false)
  }

  const handleUpdateItem = (index: number, updates: Partial<MixFormItem>) => {
    const updated = [...mixItems]
    updated[index] = { ...updated[index], ...updates }

    if (mode === 'percentage' && updates.percentage !== undefined) {
      // Logic handled in component mostly, but here we might optionally auto-balance
      // For now, just update the state
      const newPercentage = Math.round(updates.percentage) // Ensure storage as integer
      updated[index].percentage = newPercentage

      // Update grams based on new percentage and FIXED target weight
      const targetWeight = 25
      updated[index].grams = (targetWeight * newPercentage) / 100

      // We do NOT auto-scale others here to keep it simple as requested: "write only integers"
      // User manually adjusts others.
    } else if (mode === 'grams' && updates.grams !== undefined) {
      // Update grams and recalculate percentages
      updated[index].grams = Math.max(0, updates.grams)
      const newTotalGrams = updated.reduce((sum, item) => sum + item.grams, 0)
      // If we want integers displayed, we store exact float but display rounded?
      // Or we calculate exact percentages.
      updated.forEach((item) => {
        item.percentage = newTotalGrams > 0 ? (item.grams / newTotalGrams) * 100 : 0
      })
    }

    setMixItems(updated)
  }

  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [step, setStep] = useState<'confirm' | 'name' | 'duplicate_found'>('confirm')
  const [matchedTemplate, setMatchedTemplate] = useState<any | null>(null)

  const handleRemoveItem = (index: number) => {
    const newItems = mixItems.filter((_, i) => i !== index)
    if (newItems.length === 1) {
      newItems[0].percentage = 100
      newItems[0].grams = 25
    }
    setMixItems(newItems)
  }

  const findMatchingTemplate = () => {
    const currentSignature = [...mixItems]
      .sort((a, b) => a.tobaccoId.localeCompare(b.tobaccoId))
      .map(item => `${item.tobaccoId}:${Math.round(item.percentage)}`)
      .join('|')

    return savedTemplates.find(template => {
      if (!template.mix_items || template.mix_items.length !== mixItems.length) return false

      const templateSignature = [...template.mix_items]
        .sort((a: any, b: any) => a.tobaccoid.localeCompare(b.tobaccoid))
        .map((item: any) => `${item.tobaccoid}:${Math.round(item.percentage)}`)
        .join('|')

      return currentSignature === templateSignature
    })
  }

  const handleInitiateCreate = () => {
    if (!userId) {
      setToast({ message: 'Пользователь не найден', type: 'error' })
      return
    }

    if (mixItems.length === 0) {
      setToast({ message: 'Добавьте хотя бы один табак', type: 'error' })
      return
    }

    // Validate percentages
    if (mode === 'percentage' && Math.abs(totalPercentage - 100) > 1) {
      setToast({ message: 'Сумма процентов должна быть 100%', type: 'error' })
      return
    }

    // Validate available grams
    for (const item of mixItems) {
      // ... existing validation ...
      if (item.grams > item.availableGrams) {
        setToast({ message: `Недостаточно табака "${item.tobaccoName}"`, type: 'error' })
        return
      }
      if (item.grams <= 0) {
        setToast({ message: 'Все значения должны быть больше 0', type: 'error' })
        return
      }
    }

    // Check for duplicate template
    const duplicate = findMatchingTemplate()
    if (duplicate) {
      setMatchedTemplate(duplicate)
      setStep('duplicate_found')
      setShowTemplateModal(true)
      return
    }

    // Instead of creating immediately, open the modal
    setStep('confirm')
    setMixName('') // Reset name when opening fresh
    setShowTemplateModal(true)
  }

  const handleFinalizeCreate = async (asTemplate: boolean, customName?: string) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/mixes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: customName || (asTemplate ? mixName.trim() : `Микс ${new Date().toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
            timeZone: 'Europe/Moscow'
          }).replace(/,/g, '')}`),
          creator_id: userId,
          total_grams: totalGrams,
          issavedtemplate: asTemplate,
          items: mixItems.map((item) => ({
            tobaccoid: item.tobaccoId,
            grams: item.grams,
            percentage: item.percentage,
          })),
          parent_template_id: parentTemplateId,
        }),
      })

      const result = await response.json()
      if (result.error) throw new Error(result.error)

      setToast({ message: 'Микс успешно создан!', type: 'success' })

      // Reset form and modal
      setMixItems([])
      setMixName('')
      setSaveAsTemplate(false)
      setShowTemplateModal(false)

      // Reload tobacco items to update available grams
      loadTobaccoItems()
      // Reload templates if saved as template
      if (asTemplate) {
        loadTemplates()
      }
    } catch (error: any) {
      setToast({ message: error.message || 'Ошибка создания микса', type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }

  const [showAllTemplates, setShowAllTemplates] = useState(false)

  const handleRateTemplate = async (mixId: string, vote: 1 | -1, e: React.MouseEvent) => {
    e.stopPropagation()
    // No auth check required for unlimited "arcade" voting as per request

    // 1. Optimistic UI update immediately
    setSavedTemplates(prev => prev.map(t => {
      if (t.id === mixId) {
        return {
          ...t,
          likes: t.likes + (vote === 1 ? 1 : 0),
          dislikes: t.dislikes + (vote === -1 ? 1 : 0)
        }
      }
      return t
    }))

    // 2. Fire and forget API call
    try {
      await fetch('/api/mixes/rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mix_id: mixId,
          vote: vote
        }),
      })
      // No reload needed, we trust our optimistic update for this session
    } catch (error) {
      console.error('Rating failed', error)
      // Optionally revert on error, but for "clicker" it's often skipped for speed
    }
  }

  const renderTemplateCard = (template: any) => {
    const composition = template.mix_items
      ?.map((item: any) => {
        const tobacco = tobaccoItems.find(t => t.id === item.tobaccoid)
        return `${tobacco?.name || 'Unknown'} ${Math.round(item.percentage)}%`
      })
      .join(', ') || ''

    return (
      <div
        key={template.id}
        className="flex flex-col gap-2 p-3 bg-telegram-bg rounded-lg hover:bg-opacity-80 transition-colors border border-telegram-secondary-bg"
      >
        <div className="flex justify-between items-start">
          <button
            onClick={() => {
              handleUseTemplate(template)
              setShowAllTemplates(false)
            }}
            className="flex-1 text-left"
          >
            <div className="font-medium text-telegram-text">{template.name}</div>
            <div className="text-xs text-telegram-hint mt-1 line-clamp-2">{composition}</div>
          </button>

          <div className="flex items-center gap-1 ml-2 shrink-0">
            {/* Delete button (only for creator? For now allowed for all as per previous logic, or maybe restrict?) */}
            {/* Previous logic allowed anyone to delete? Let's keep it but maybe move it away from likes */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleDeleteTemplate(template.id, template.name)
              }}
              className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Удалить"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-telegram-hint border-t border-telegram-secondary-bg pt-2 mt-1">
          <button
            onClick={(e) => handleRateTemplate(template.id, 1, e)}
            className="flex items-center gap-1 hover:text-green-500 transition-colors"
          >
            <span>👍</span>
            <span>{template.likes || 0}</span>
          </button>
          <button
            onClick={(e) => handleRateTemplate(template.id, -1, e)}
            className="flex items-center gap-1 hover:text-red-500 transition-colors"
          >
            <span>👎</span>
            <span>{template.dislikes || 0}</span>
          </button>
          <span className="ml-auto">{template.total_grams}г</span>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {savedTemplates.length > 0 && (
          <div className="bg-telegram-secondary-bg rounded-lg p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold text-telegram-text">Лучшие миксы</h3>
              <button
                onClick={() => setShowAllTemplates(true)}
                className="text-xs text-telegram-link hover:underline"
              >
                Показать все ({savedTemplates.length})
              </button>
            </div>

            <div className="space-y-3">
              {savedTemplates.slice(0, 3).map(renderTemplateCard)}
            </div>
          </div>
        )}

        {/* ... Rest of the component ... */}
        <div className="flex gap-2">
          {/* ... */}

          <button
            onClick={() => setMode('percentage')}
            className={`flex-1 px-4 py-2 rounded-lg transition-colors ${mode === 'percentage'
              ? 'bg-telegram-button text-telegram-button-text'
              : 'bg-telegram-secondary-bg text-telegram-text'
              }`}
          >
            Проценты
          </button>
          <button
            onClick={() => setMode('grams')}
            className={`flex-1 px-4 py-2 rounded-lg transition-colors ${mode === 'grams'
              ? 'bg-telegram-button text-telegram-button-text'
              : 'bg-telegram-secondary-bg text-telegram-text'
              }`}
          >
            Граммы
          </button>
        </div>

        <div className="bg-telegram-secondary-bg rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-telegram-hint">Общий вес:</span>
            <span className="font-semibold text-telegram-text">{totalGrams.toFixed(1)} г</span>
          </div>
          {mode === 'percentage' && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-telegram-hint">Сумма процентов:</span>
              <span className={`font-semibold ${Math.abs(totalPercentage - 100) < 1.0 ? 'text-green-500' : 'text-red-500'}`}>
                {Math.round(totalPercentage)}%
              </span>
            </div>
          )}
        </div>

        {mixItems.length === 0 ? (
          <div className="text-center py-8 bg-telegram-secondary-bg rounded-lg">
            <p className="text-telegram-hint mb-4">Нет табаков в миксе</p>
            <Button onClick={() => setIsSelectorOpen(true)}>
              Добавить табак
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {mixItems.map((item, index) => (
              <MixItem
                key={item.tobaccoId}
                item={item}
                totalGrams={totalGrams}
                mode={mode}
                showQuickPercentages={mixItems.length > 1}
                onUpdate={(updates) => handleUpdateItem(index, updates)}
                onRemove={() => handleRemoveItem(index)}
              />
            ))}
            <Button
              onClick={() => setIsSelectorOpen(true)}
              variant="secondary"
              className="w-full"
            >
              + Добавить табак
            </Button>
          </div>
        )}

        <Button
          onClick={isLoading ? undefined : handleInitiateCreate}
          isLoading={isLoading}
          disabled={
            mixItems.length === 0 ||
            (mode === 'percentage' && Math.abs(totalPercentage - 100) > 1) ||
            mixItems.some(item => item.grams <= 0)
          }
          className="w-full"
        >
          Создать микс
        </Button>
      </div>

      <Modal
        isOpen={isSelectorOpen}
        onClose={() => setIsSelectorOpen(false)}
        title="Выберите табак"
      >
        <TobaccoSelector
          tobaccoItems={tobaccoItems}
          onSelect={handleAddTobacco}
        />
      </Modal>

      {/* All Templates Modal */}
      <Modal
        isOpen={showAllTemplates}
        onClose={() => setShowAllTemplates(false)}
        title="Все шаблоны"
        size="lg"
      >
        <div className="space-y-3">
          {savedTemplates.map(renderTemplateCard)}
        </div>
      </Modal>

      {/* Template Confirmation Modal */}
      <Modal
        isOpen={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        title={
          step === 'duplicate_found'
            ? 'Найден шаблон'
            : step === 'confirm'
              ? 'Сохранить как шаблон?'
              : 'Название шаблона'
        }
      >
        {step === 'duplicate_found' && matchedTemplate ? (
          <div className="space-y-4">
            <p className="text-telegram-text text-center">
              Этот состав совпадает с шаблоном <span className="font-bold">"{matchedTemplate.name}"</span>.
              <br />
              Хотите создать этот микс?
            </p>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => setShowTemplateModal(false)}
                className="flex-1"
              >
                Нет
              </Button>
              <Button
                onClick={() => handleFinalizeCreate(false, matchedTemplate.name)}
                isLoading={isLoading}
                className="flex-1"
              >
                Да
              </Button>
            </div>
          </div>
        ) : step === 'confirm' ? (
          <div className="space-y-4">
            <p className="text-telegram-text text-center">
              Хотите сохранить этот микс как шаблон для будущего использования?
            </p>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => handleFinalizeCreate(false)}
                className="flex-1"
              >
                Нет
              </Button>
              <Button
                onClick={() => setStep('name')}
                className="flex-1"
              >
                Да
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Input
              label="Название шаблона"
              value={mixName}
              onChange={(e) => setMixName(e.target.value)}
              placeholder="Введите название"
              autoFocus
            />
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => setStep('confirm')}
                className="flex-1"
              >
                Назад
              </Button>
              <Button
                onClick={() => handleFinalizeCreate(true)}
                isLoading={isLoading}
                disabled={!mixName.trim()}
                className="flex-1"
              >
                Сохранить
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {
        toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            isVisible={true}
            onClose={() => setToast(null)}
          />
        )
      }
    </>
  )
}

