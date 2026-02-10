'use client'

import { useState } from 'react'
import { Layout } from '@/components/Layout'
import { HookahsDetailedStats } from '@/components/statistics/HookahsDetailedStats'
import { TobaccoDetailedStats } from '@/components/statistics/TobaccoDetailedStats'
import { MixesDetailedStats } from '@/components/statistics/MixesDetailedStats'
import { MixHistory } from '@/components/history/MixHistory'
import { TobaccoHistory } from '@/components/history/TobaccoHistory'

export default function StatisticsPage() {
  const [activeTab, setActiveTab] = useState<'tobacco' | 'mixes' | 'hookahs' | 'history_mix' | 'history_tobacco'>('history_mix')

  return (
    <Layout>
      <h1 className="text-2xl font-bold text-telegram-text mb-6">Статистика и История</h1>

      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setActiveTab('history_mix')}
          className={`flex-1 min-w-[120px] px-3 py-2 rounded-lg transition-colors text-sm ${activeTab === 'history_mix'
            ? 'bg-telegram-button text-telegram-button-text'
            : 'bg-telegram-secondary-bg text-telegram-text'
            }`}
        >
          История миксов
        </button>
        <button
          onClick={() => setActiveTab('history_tobacco')}
          className={`flex-1 min-w-[120px] px-3 py-2 rounded-lg transition-colors text-sm ${activeTab === 'history_tobacco'
            ? 'bg-telegram-button text-telegram-button-text'
            : 'bg-telegram-secondary-bg text-telegram-text'
            }`}
        >
          История табака
        </button>
        <button
          onClick={() => setActiveTab('tobacco')}
          className={`flex-1 min-w-[120px] px-3 py-2 rounded-lg transition-colors text-sm ${activeTab === 'tobacco'
            ? 'bg-telegram-button text-telegram-button-text'
            : 'bg-telegram-secondary-bg text-telegram-text'
            }`}
        >
          Стат. табаков
        </button>
        <button
          onClick={() => setActiveTab('mixes')}
          className={`flex-1 min-w-[120px] px-3 py-2 rounded-lg transition-colors text-sm ${activeTab === 'mixes'
            ? 'bg-telegram-button text-telegram-button-text'
            : 'bg-telegram-secondary-bg text-telegram-text'
            }`}
        >
          Стат. миксов
        </button>
        <button
          onClick={() => setActiveTab('hookahs')}
          className={`flex-1 min-w-[120px] px-3 py-2 rounded-lg transition-colors text-sm ${activeTab === 'hookahs'
            ? 'bg-telegram-button text-telegram-button-text'
            : 'bg-telegram-secondary-bg text-telegram-text'
            }`}
        >
          Кальянщики
        </button>
      </div>

      {activeTab === 'history_mix' && <MixHistory />}
      {activeTab === 'history_tobacco' && <TobaccoHistory />}
      {activeTab === 'tobacco' && <TobaccoDetailedStats />}
      {activeTab === 'mixes' && <MixesDetailedStats />}
      {activeTab === 'hookahs' && <HookahsDetailedStats />}
    </Layout>
  )
}

