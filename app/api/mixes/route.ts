import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const mixSchema = z.object({
  name: z.string().min(1, 'Название обязательно'),
  creator_id: z.string().uuid(),
  total_grams: z.number().min(0.1, 'Общий вес должен быть положительным'),
  issavedtemplate: z.boolean().default(false),
  items: z.array(z.object({
    tobaccoid: z.string().uuid(),
    grams: z.number().min(0.1), // Allow floats, min 0.1g
    percentage: z.number().min(0).max(100),
  })).min(1, 'Микс должен содержать хотя бы один табак'),
})

/**
 * GET /api/mixes
 * Returns all mixes - shared data accessible to all authenticated users
 * No user filtering - everyone sees all mixes (templates or all)
 * Mixes are tracked with creator_id to show who created them
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const templateOnly = searchParams.get('template') === 'true'

    const supabase = await createClient()
    let query = supabase
      .from('mixes')
      .select(`
        *,
        mix_items (
          *,
          tobacco_items (*)
        )
      `)
      .order('created_at', { ascending: false })

    if (templateOnly) {
      query = query.eq('issavedtemplate', true)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ data })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch mixes' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = mixSchema.parse(body)

    const supabase = await createClient()

    // Check if all tobacco items have enough grams
    for (const item of validated.items) {
      const { data: tobacco, error: tobaccoError } = await supabase
        .from('tobacco_items')
        .select('available_grams, name')
        .eq('id', item.tobaccoid)
        .single()

      if (tobaccoError) throw tobaccoError

      const tobaccoData = tobacco as any
      if (!tobaccoData || (tobaccoData.available_grams as number) < Math.round(item.grams)) {
        return NextResponse.json(
          { error: `Недостаточно табака "${tobaccoData?.name || 'неизвестный'}"` },
          { status: 400 }
        )
      }
    }

    // Create mix
    const { data: mix, error: mixError } = await supabase
      .from('mixes')
      .insert({
        name: validated.name,
        creator_id: validated.creator_id,
        total_grams: Math.round(validated.total_grams),
        issavedtemplate: validated.issavedtemplate,
      } as any)
      .select()
      .single()

    if (mixError || !mix) throw mixError || new Error('Failed to create mix')

    // Create mix items
    const mixData = mix as any
    const mixItems = validated.items.map(item => ({
      mix_id: mixData.id,
      tobaccoid: item.tobaccoid,
      grams: Math.round(item.grams),
      percentage: item.percentage,
    }))

    const { error: itemsError } = await supabase
      .from('mix_items')
      .insert(mixItems as any)

    if (itemsError) throw itemsError

    // Deduct grams from tobacco items and Log usage
    for (const item of validated.items) {
      const gramsToDeduct = Math.round(item.grams)

      const { error: updateError } = await supabase.rpc('decrement_tobacco_grams', {
        tobacco_id: item.tobaccoid,
        grams_to_deduct: gramsToDeduct,
      })

      // If RPC doesn't exist, use direct update
      if (updateError) {
        const { data: tobacco } = await supabase
          .from('tobacco_items')
          .select('available_grams')
          .eq('id', item.tobaccoid)
          .single()

        const tobaccoData = tobacco as any
        if (tobaccoData) {
          const { error: directUpdateError } = await supabase
            .from('tobacco_items')
            .update({
              available_grams: (tobaccoData.available_grams as number) - gramsToDeduct,
              updated_at: new Date().toISOString(),
            } as any)
            .eq('id', item.tobaccoid)

          if (directUpdateError) throw directUpdateError
        }
      }

      // Log the usage
      const { error: logError } = await supabase
        .from('tobacco_logs')
        .insert({
          tobacco_id: item.tobaccoid,
          amount: -gramsToDeduct, // Negative because it's usage
          action_type: 'use'
        })

      if (logError) {
        console.error('Failed to log tobacco usage:', logError)
        // We don't throw here to avoid failing the whole mix creation if just logging fails, 
        // but arguably we should. For now logging is secondary.
      }
    }

    // Create hookah session
    const { error: sessionError } = await supabase
      .from('hookah_sessions')
      .insert({
        mix_id: mixData.id,
        creator_id: validated.creator_id,
      } as any)

    if (sessionError) throw sessionError

    return NextResponse.json({ data: mix }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: error.message || 'Failed to create mix' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Check if mix exists and is a template
    const { data: mix, error: checkError } = await supabase
      .from('mixes')
      .select('id, issavedtemplate')
      .eq('id', id)
      .single()

    if (checkError || !mix) {
      return NextResponse.json(
        { error: 'Mix not found' },
        { status: 404 }
      )
    }

    // Delete mix (CASCADE will delete mix_items and hookah_sessions)
    const { error: deleteError } = await supabase
      .from('mixes')
      .delete()
      .eq('id', id)

    if (deleteError) throw deleteError

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to delete mix' },
      { status: 500 }
    )
  }
}

