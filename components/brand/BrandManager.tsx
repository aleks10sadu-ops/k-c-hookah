'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import type { Brand } from '@/types/tobacco.types'

interface BrandManagerProps {
    isOpen: boolean
    onClose: () => void
    onBrandChange: () => void
}

export function BrandManager({ isOpen, onClose, onBrandChange }: BrandManagerProps) {
    const [brands, setBrands] = useState<Brand[]>([])
    const [newBrandName, setNewBrandName] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        if (isOpen) {
            loadBrands()
        }
    }, [isOpen])

    const loadBrands = async () => {
        try {
            const response = await fetch('/api/brands')
            const { data, error } = await response.json()
            if (error) throw new Error(error)
            setBrands(data || [])
        } catch (err: any) {
            console.error('Failed to load brands:', err)
            setError('Не удалось загрузить бренды')
        }
    }

    const handleAddBrand = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newBrandName.trim()) return

        setIsLoading(true)
        setError('')

        try {
            const response = await fetch('/api/brands', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newBrandName.trim() }),
            })

            const { data, error } = await response.json()
            if (error) throw new Error(error)

            setBrands([...brands, data])
            setNewBrandName('')
            onBrandChange()
        } catch (err: any) {
            setError(err.message || 'Ошибка при создании бренда')
        } finally {
            setIsLoading(false)
        }
    }

    const handleDeleteBrand = async (id: string) => {
        if (!confirm('Вы уверены? Табаки этого бренда останутся без бренда.')) return

        try {
            const response = await fetch(`/api/brands?id=${id}`, {
                method: 'DELETE',
            })
            const { error } = await response.json()
            if (error) throw new Error(error)

            setBrands(brands.filter((b: Brand) => b.id !== id))
            onBrandChange()
        } catch (err: any) {
            setError(err.message || 'Ошибка при удалении')
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Управление брендами">
            <div className="space-y-6">
                <form onSubmit={handleAddBrand} className="flex gap-2">
                    <div className="flex-1">
                        <Input
                            placeholder="Название бренда"
                            value={newBrandName}
                            onChange={(e) => setNewBrandName(e.target.value)}
                        />
                    </div>
                    <Button type="submit" isLoading={isLoading} disabled={!newBrandName.trim()}>
                        Добавить
                    </Button>
                </form>
1: 
                {error && <p className="text-red-500 text-sm">{error}</p>}

                <div className="space-y-2 max-h-60 overflow-y-auto">
                    {brands.length === 0 ? (
                        <p className="text-telegram-hint text-center py-4">Нет брендов</p>
                    ) : (
                        brands.map((brand) => (
                            <div
                                key={brand.id}
                                className="flex items-center justify-between p-3 bg-telegram-secondary-bg rounded-lg"
                            >
                                <span className="text-telegram-text">{brand.name}</span>
                                <button
                                    onClick={() => handleDeleteBrand(brand.id)}
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
