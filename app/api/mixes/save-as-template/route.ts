import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const saveSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(1),
})

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const validated = saveSchema.parse(body)

        const supabase = await createClient()

        // We simply update the existing mix to be a template and give it a name
        // BUT user might want to keep the history item as is and create a NEW template copy?
        // The requirement says: "присвоить название Табаку без названия и сохранить его как Шаблон"
        // It implies converting the existing one OR creating a copy.
        // If we convert, it disappears from "History" if we filter templates out?
        // Let's create a COPY to be safe and clear. History remains history, Template is new.

        // 1. Fetch original mix
        const { data: originalMix, error: fetchError } = await supabase
            .from('mixes')
            .select('*, mix_items(*)')
            .eq('id', validated.id)
            .single()

        if (fetchError || !originalMix) throw new Error('Mix not found')

        // 2. Create new mix as template
        const { data: newTemplate, error: createError } = await supabase
            .from('mixes')
            .insert({
                name: validated.name,
                creator_id: originalMix.creator_id,
                total_grams: originalMix.total_grams,
                issavedtemplate: true,
                parent_template_id: originalMix.id // Optional: link back to history item
            })
            .select()
            .single()

        if (createError) throw createError

        // 3. Copy items
        if (originalMix.mix_items && originalMix.mix_items.length > 0) {
            const itemsToInsert = originalMix.mix_items.map((item: any) => ({
                mix_id: newTemplate.id,
                tobaccoid: item.tobaccoid,
                grams: item.grams,
                percentage: item.percentage
            }))

            const { error: itemsError } = await supabase
                .from('mix_items')
                .insert(itemsToInsert)

            if (itemsError) throw itemsError
        }

        return NextResponse.json({ success: true, id: newTemplate.id })
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Save failed' },
            { status: 500 }
        )
    }
}
