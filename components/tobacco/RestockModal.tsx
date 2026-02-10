'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { TobaccoItem } from '@/types/tobacco.types'

interface RestockModalProps {
    isOpen: boolean
    onClose: () => void
    tobacco: TobaccoItem | null
    onRestock: (id: string, amount: number) => Promise<void>
}

export function RestockModal({ isOpen, onClose, tobacco, onRestock }: RestockModalProps) {
    const [amount, setAmount] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!tobacco) return

        const numAmount = parseInt(amount)
        if (isNaN(numAmount) || numAmount <= 0) {
            setError('Введите положительное число')
            return
        }

        setIsLoading(true)
        try {
            await onRestock(tobacco.id, numAmount)
            setAmount('')
            onClose()
        } catch (err: any) {
            setError(err.message || 'Ошибка при внесении')
        } finally {
            setIsLoading(false)
        }
    }

    const quickAmounts = [25, 50, 100, 200, 250]

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Внесение: ${tobacco?.name || ''}`}
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="bg-telegram-secondary-bg p-3 rounded-lg mb-4">
                    <p className="text-sm text-telegram-hint">Текущий остаток</p>
                    <p className="text-xl font-bold text-telegram-text">{tobacco?.available_grams} г</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-telegram-text mb-2">
                        Добавить грамм
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                        {quickAmounts.map(val => (
                            <button
                                key={val}
                                type="button"
                                onClick={() => setAmount(val.toString())}
                                className={`px-3 py-1 rounded-md text-sm transition-colors ${amount === val.toString()
                                        ? 'bg-telegram-button text-telegram-button-text'
                                        : 'bg-telegram-bg text-telegram-text border border-telegram-secondary-bg'
                                    }`}
                            >
                                +{val}
                            </button>
                        ))}
                    </div>
                    <Input
                        type="number"
                        value={amount}
                        onChange={(e) => {
                            setAmount(e.target.value)
                            setError('')
                        }}
                        placeholder="Введите количество"
                        autoFocus
                    />
                </div>

                {error && <p className="text-red-500 text-sm">{error}</p>}

                <div className="flex gap-2 pt-2">
                    <Button type="submit" isLoading={isLoading} className="flex-1">
                        Внести
                    </Button>
                    <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
                        Отмена
                    </Button>
                </div>
            </form>
        </Modal>
    )
}
