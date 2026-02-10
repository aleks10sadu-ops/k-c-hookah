import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const rateSchema = z.object({
    mix_id: z.string().uuid(),
    vote: z.number().int().refine(val => val === 1 || val === -1, {
        message: 'Vote must be 1 (like) or -1 (dislike)'
    }),
})

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const validated = rateSchema.parse(body)

        const supabase = await createClient()

        // Call RPC to increment counters directly
        const { error } = await supabase.rpc('rate_mix', {
            mix_id: validated.mix_id,
            vote: validated.vote
        })

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Rating failed' },
            { status: 500 }
        )
    }
}
