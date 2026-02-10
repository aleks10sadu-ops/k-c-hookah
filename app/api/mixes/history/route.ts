import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()

        // Fetch mixes created by the user or global? 
        // Usually history is personal or all shared? Assuming shared for now based on context
        const { data, error } = await supabase
            .from('mixes')
            .select(`
        *,
        mix_items (
          grams,
          percentage,
          tobacco:tobacco_items (name)
        )
      `)
            .order('created_at', { ascending: false })

        if (error) throw error

        return NextResponse.json({ data })
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Failed to fetch history' },
            { status: 500 }
        )
    }
}
