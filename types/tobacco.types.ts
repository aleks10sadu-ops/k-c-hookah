import type { Database } from './database.types'

export type TobaccoItem = Database['public']['Tables']['tobacco_items']['Row'] & {
  category_id?: string | null
  brand_id?: string | null
  categories?: { id: string; name: string } | null
  brands?: { id: string; name: string } | null
}
export type TobaccoInsert = Database['public']['Tables']['tobacco_items']['Insert'] & {
  category_id?: string | null
  brand_id?: string | null
}
export type TobaccoUpdate = Database['public']['Tables']['tobacco_items']['Update'] & {
  category_id?: string | null
  brand_id?: string | null
}

export type Category = {
  id: string
  name: string
  created_at: string
}

export type Brand = {
  id: string
  name: string
  created_at: string
}

