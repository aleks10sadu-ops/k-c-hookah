import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const restockSchema = z.object({
    id: z.string().uuid(),
    amount: z.number().int().positive(),
})

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const validated = restockSchema.parse(body)

        const supabase = await createClient()

        // 1. Get current amount
        const { data: tobacco, error: fetchError } = await supabase
            .from('tobacco_items')
            .select('available_grams')
            .eq('id', validated.id)
            .single()

        if (fetchError || !tobacco) {
            throw new Error('Tobacco not found')
        }

        // 2. Update amount
        const newAmount = tobacco.available_grams + validated.amount
        const { error: updateError } = await supabase
            .from('tobacco_items')
            .update({
                available_grams: newAmount,
                updated_at: new Date().toISOString()
            })
            .eq('id', validated.id)

        if (updateError) throw updateError

        // 3. Log the restock
        const { error: logError } = await supabase
            .from('tobacco_logs')
            .insert({
                tobacco_id: validated.id,
                amount: validated.amount,
                action_type: 'restock'
            })

        if (logError) throw logError

        return NextResponse.json({ success: true, new_amount: newAmount })

    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Restock failed' },
            { status: 500 }
        )
    }
}
