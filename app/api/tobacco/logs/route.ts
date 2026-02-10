import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const type = searchParams.get('type') // 'add', 'restock', 'use'

        const supabase = await createClient()

        let query = supabase
            .from('tobacco_logs')
            .select('*, tobacco:tobacco_items(name)')
            .order('created_at', { ascending: false })

        if (type) {
            if (type === 'add') {
                // 'add' meant creation of new tobacco, which strictly speaking is action_type='add'
                query = query.eq('action_type', 'add')
            } else if (type === 'restock') {
                // 'restock' meant adding grams to existing, action_type='restock'
                query = query.eq('action_type', 'restock')
            } else if (type === 'use') {
                query = query.eq('action_type', 'use')
            }
        }

        const { data, error } = await query

        if (error) throw error

        return NextResponse.json({ data })
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Failed to fetch logs' },
            { status: 500 }
        )
    }
}
