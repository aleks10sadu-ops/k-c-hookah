'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

interface TobaccoLog {
    id: string
    tobacco_id: string
    amount: number
    created_at: string
    action_type: 'add' | 'restock' | 'use'
    tobacco: {
        name: string
    }
}

export function TobaccoHistory() {
    const [logs, setLogs] = useState<TobaccoLog[]>([])
    const [activeTab, setActiveTab] = useState<'use' | 'add' | 'restock'>('use')
    const [isLoading, setIsLoading] = useState(true)

    const supabase = createClient()

    useEffect(() => {
        loadLogs()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab])

    const loadLogs = async () => {
        setIsLoading(true)
        try {
            const response = await fetch(`/api/tobacco/logs?type=${activeTab}`)
            const { data, error } = await response.json()
            if (error) throw new Error(error)
            setLogs(data || [])
        } catch (error) {
            console.error('Error loading logs:', error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex bg-telegram-secondary-bg p-1 rounded-lg">
                <button
                    onClick={() => setActiveTab('use')}
                    className={`flex-1 py-1.5 text-sm rounded-md transition-all ${activeTab === 'use'
                            ? 'bg-telegram-bg text-telegram-text shadow-sm'
                            : 'text-telegram-hint hover:text-telegram-text'
                        }`}
                >
                    Использовано
                </button>
                <button
                    onClick={() => setActiveTab('add')}
                    className={`flex-1 py-1.5 text-sm rounded-md transition-all ${activeTab === 'add'
                            ? 'bg-telegram-bg text-telegram-text shadow-sm'
                            : 'text-telegram-hint hover:text-telegram-text'
                        }`}
                >
                    Добавлено
                </button>
                <button
                    onClick={() => setActiveTab('restock')}
                    className={`flex-1 py-1.5 text-sm rounded-md transition-all ${activeTab === 'restock'
                            ? 'bg-telegram-bg text-telegram-text shadow-sm'
                            : 'text-telegram-hint hover:text-telegram-text'
                        }`}
                >
                    Внесено
                </button>
            </div>

            {isLoading ? (
                <div className="text-center py-8 text-telegram-hint">Загрузка...</div>
            ) : logs.length === 0 ? (
                <div className="text-center py-8 text-telegram-hint">История пуста</div>
            ) : (
                <div className="space-y-2">
                    {logs.map((log) => (
                        <div
                            key={log.id}
                            className="bg-telegram-secondary-bg p-3 rounded-lg flex justify-between items-center"
                        >
                            <div>
                                <p className="font-medium text-telegram-text">
                                    {log.tobacco?.name || 'Удаленный табак'}
                                </p>
                                <p className="text-xs text-telegram-hint">
                                    {format(new Date(log.created_at), 'd MMMM HH:mm', { locale: ru })}
                                </p>
                            </div>
                            <div className={`font-semibold ${log.action_type === 'use' ? 'text-red-500' : 'text-green-500'
                                }`}>
                                {log.action_type === 'use' ? '-' : '+'}{log.amount} г
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
