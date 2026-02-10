export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          telegram_id: number
          telegram_username: string | null
          first_name: string | null
          last_name: string | null
          created_at: string
        }
        Insert: {
          id?: string
          telegram_id: number
          telegram_username?: string | null
          first_name?: string | null
          last_name?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          telegram_id?: number
          telegram_username?: string | null
          first_name?: string | null
          last_name?: string | null
          created_at?: string
        }
      }
      tobacco_items: {
        Row: {
          id: string
          name: string
          image_url: string | null
          available_grams: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          image_url?: string | null
          available_grams?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          image_url?: string | null
          available_grams?: number
          created_at?: string
          updated_at?: string
        }
      }
      mixes: {
        Row: {
          id: string
          name: string
          creator_id: string
          total_grams: number
          created_at: string
          issavedtemplate: boolean
        }
        Insert: {
          id?: string
          name: string
          creator_id: string
          total_grams: number
          created_at?: string
          issavedtemplate?: boolean
        }
        Update: {
          id?: string
          name?: string
          creator_id?: string
          total_grams?: number
          created_at?: string
          issavedtemplate?: boolean
        }
      }
      mix_items: {
        Row: {
          id: string
          mix_id: string
          tobaccoid: string
          grams: number
          percentage: number
        }
        Insert: {
          id?: string
          mix_id: string
          tobaccoid: string
          grams: number
          percentage: number
        }
        Update: {
          id?: string
          mix_id?: string
          tobaccoid?: string
          grams?: number
          percentage?: number
        }
      }
      hookah_sessions: {
        Row: {
          id: string
          mix_id: string
          creator_id: string
          created_at: string
        }
        Insert: {
          id?: string
          mix_id: string
          creator_id: string
          created_at?: string
        }
        Update: {
          id?: string
          mix_id?: string
          creator_id?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

