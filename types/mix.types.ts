import type { Database } from './database.types'

export type Mix = Database['public']['Tables']['mixes']['Row']
export type MixInsert = Database['public']['Tables']['mixes']['Insert']
export type MixItem = Database['public']['Tables']['mix_items']['Row']
export type MixItemInsert = Database['public']['Tables']['mix_items']['Insert']

export interface MixWithItems extends Mix {
  mix_items: (MixItem & {
    tobacco_items: Database['public']['Tables']['tobacco_items']['Row']
  })[]
}

export interface MixFormItem {
  tobaccoId: string
  tobaccoName: string
  grams: number
  percentage: number
  availableGrams: number
}

