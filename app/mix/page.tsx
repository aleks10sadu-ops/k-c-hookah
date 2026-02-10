'use client'

import { Layout } from '@/components/Layout'
import { MixCreator } from '@/components/mix/MixCreator'

export default function MixPage() {
  return (
    <Layout>
      <h1 className="text-2xl font-bold text-telegram-text mb-6">Собрать микс</h1>
      <MixCreator />
    </Layout>
  )
}

