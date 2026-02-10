'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Toast } from '@/components/ui/Toast'

interface MixHistoryItem {
    id: string
    name: string
    total_grams: number
    created_at: string
    rating: number | null
    issavedtemplate: boolean
    mix_items: {
        tobacco: {
            name: string
        }
        percentage: number
        grams: number
    }[]
}

export function MixHistory() {
    const [mixes, setMixes] = useState<MixHistoryItem[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false)
    const [selectedMixId, setSelectedMixId] = useState<string | null>(null)
    const [templateName, setTemplateName] = useState('')
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

    const supabase = createClient()

    useEffect(() => {
        loadHistory()
    }, [])

    const loadHistory = async () => {
        setIsLoading(true)
        try {
            const response = await fetch('/api/mixes/history')
            const { data, error } = await response.json()
            if (error) throw new Error(error)
            setMixes(data || [])
        } catch (error) {
            console.error('Error loading history:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleRate = async (id: string, rating: 1 | -1) => {
        try {
            // Optimistic update
            setMixes(mixes.map(m => m.id === id ? { ...m, rating: m.rating === rating ? null : rating } : m))

            const response = await fetch('/api/mixes/rate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, rating }),
            })

            const result = await response.json()
            if (result.error) throw new Error(result.error)
        } catch (error) {
            console.error('Error rating mix:', error)
            // Revert optimistic update
            loadHistory()
        }
    }

    const handleSaveTemplate = async () => {
        if (!selectedMixId || !templateName.trim()) return

        try {
            const response = await fetch('/api/mixes/save-as-template', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: selectedMixId, name: templateName }),
            })

            const result = await response.json()
            if (result.error) throw new Error(result.error)

            setToast({ message: 'Шаблон сохранён', type: 'success' })
            setIsTemplateModalOpen(false)
            setTemplateName('')
            loadHistory() // Refresh to show it might be marked differently or just to sync
        } catch (error: any) {
            setToast({ message: error.message || 'Ошибка сохранения', type: 'error' })
        }
    }

    return (
        <div className="space-y-4">
            {isLoading ? (
                <div className="text-center py-8 text-telegram-hint">Загрузка...</div>
            ) : mixes.length === 0 ? (
                <div className="text-center py-8 text-telegram-hint">История пуста</div>
            ) : (
                <div className="space-y-4">
                    {mixes.map((mix) => (
                        <div key={mix.id} className="bg-telegram-secondary-bg p-4 rounded-lg">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className="font-medium text-telegram-text">{mix.name}</h3>
                                    <p className="text-xs text-telegram-hint">
                                        {format(new Date(mix.created_at), 'd MMMM HH:mm', { locale: ru })} • {mix.total_grams}г
                                    </p>
                                </div>
                                {!mix.issavedtemplate && (
                                    <button
                                        onClick={() => {
                                            setSelectedMixId(mix.id)
                                            setIsTemplateModalOpen(true)
                                        }}
                                        className="text-xs bg-telegram-button text-telegram-button-text px-2 py-1 rounded"
                                    >
                                        В шаблон
                                    </button>
                                )}
                            </div>

                            <div className="space-y-1 mb-3">
                                {mix.mix_items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between text-sm">
                                        <span className="text-telegram-text">{item.tobacco?.name}</span>
                                        <span className="text-telegram-hint">
                                            {item.percentage}% ({item.grams}г)
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleRate(mix.id, 1)}
                                    className={`flex-1 py-1.5 rounded text-sm transition-colors ${mix.rating === 1
                                            ? 'bg-green-500 text-white'
                                            : 'bg-telegram-bg text-telegram-text hover:bg-green-500/20'
                                        }`}
                                >
                                    👍 Лайк
                                </button>
                                <button
                                    onClick={() => handleRate(mix.id, -1)}
                                    className={`flex-1 py-1.5 rounded text-sm transition-colors ${mix.rating === -1
                                            ? 'bg-red-500 text-white'
                                            : 'bg-telegram-bg text-telegram-text hover:bg-red-500/20'
                                        }`}
                                >
                                    👎 Дизлайк
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Modal
                isOpen={isTemplateModalOpen}
                onClose={() => setIsTemplateModalOpen(false)}
                title="Сохранить как шаблон"
            >
                <div className="space-y-4">
                    <Input
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                        placeholder="Название шаблона"
                        autoFocus
                    />
                    <Button onClick={handleSaveTemplate} className="w-full">
                        Сохранить
                    </Button>
                </div>
            </Modal>

            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    isVisible={true}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    )
}
