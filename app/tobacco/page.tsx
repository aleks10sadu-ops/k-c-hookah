'use client'

import { Layout } from '@/components/Layout'
import { TobaccoList } from '@/components/tobacco/TobaccoList'

export default function TobaccoPage() {
  return (
    <Layout>
      <h1 className="text-2xl font-bold text-telegram-text mb-6">Лист табаков</h1>
      <TobaccoList />
    </Layout>
  )
}

