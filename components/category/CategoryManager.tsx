'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import type { Category } from '@/types/tobacco.types'

interface CategoryManagerProps {
    isOpen: boolean
    onClose: () => void
    onCategoryChange: () => void
}

export function CategoryManager({ isOpen, onClose, onCategoryChange }: CategoryManagerProps) {
    const [categories, setCategories] = useState<Category[]>([])
    const [newCategoryName, setNewCategoryName] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        if (isOpen) {
            loadCategories()
        }
    }, [isOpen])

    const loadCategories = async () => {
        try {
            const response = await fetch('/api/categories')
            const { data, error } = await response.json()
            if (error) throw new Error(error)
            setCategories(data || [])
        } catch (err: any) {
            console.error('Failed to load categories:', err)
            setError('Не удалось загрузить категории')
        }
    }

    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newCategoryName.trim()) return

        setIsLoading(true)
        setError('')

        try {
            const response = await fetch('/api/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newCategoryName.trim() }),
            })

            const { data, error } = await response.json()
            if (error) throw new Error(error)

            setCategories([...categories, data])
            setNewCategoryName('')
            onCategoryChange()
        } catch (err: any) {
            setError(err.message || 'Ошибка при создании категории')
        } finally {
            setIsLoading(false)
        }
    }

    const handleDeleteCategory = async (id: string) => {
        if (!confirm('Вы уверены? Табаки в этой категории останутся без категории.')) return

        try {
            const response = await fetch(`/api/categories?id=${id}`, {
                method: 'DELETE',
            })
            const { error } = await response.json()
            if (error) throw new Error(error)

            setCategories(categories.filter((c: Category) => c.id !== id))
            onCategoryChange()
        } catch (err: any) {
            setError(err.message || 'Ошибка при удалении')
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Управление категориями">
            <div className="space-y-6">
                <form onSubmit={handleAddCategory} className="flex gap-2">
                    <div className="flex-1">
                        <Input
                            placeholder="Название категории"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                        />
                    </div>
                    <Button type="submit" isLoading={isLoading} disabled={!newCategoryName.trim()}>
                        Добавить
                    </Button>
                </form>

                {error && <p className="text-red-500 text-sm">{error}</p>}

                <div className="space-y-2 max-h-60 overflow-y-auto">
                    {categories.length === 0 ? (
                        <p className="text-telegram-hint text-center py-4">Нет категорий</p>
                    ) : (
                        categories.map((category) => (
                            <div
                                key={category.id}
                                className="flex items-center justify-between p-3 bg-telegram-secondary-bg rounded-lg"
                            >
                                <span className="text-telegram-text">{category.name}</span>
                                <button
                                    onClick={() => handleDeleteCategory(category.id)}
                                    className="text-red-500 hover:text-red-600 p-1"
                                    title="Удалить"
                                >
                                    <svg
                                        className="w-5 h-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                        />
                                    </svg>
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </Modal>
    )
}
