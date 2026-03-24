import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const tobaccoSchema = z.object({
  name: z.string().min(1, 'Название обязательно'),
  image_url: z.string().url().optional().nullable().or(z.literal('')),
  available_grams: z.number().int().min(0, 'Количество должно быть положительным'),
  category_id: z.string().uuid().optional().nullable(),
  brand_id: z.string().uuid().optional().nullable(),
})

/**
 * GET /api/tobacco
 * Returns all tobacco items - shared data accessible to all authenticated users
 * No user filtering - everyone sees the same tobacco inventory
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('tobacco_items')
      .select('*, categories(id, name), brands(id, name)')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ data })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch tobacco items' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = tobaccoSchema.parse(body)

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('tobacco_items')
      .insert({
        name: validated.name,
        image_url: validated.image_url || null,
        available_grams: validated.available_grams,
        category_id: validated.category_id || null,
        brand_id: validated.brand_id || null,
      } as any)
      .select('*, categories(id, name), brands(id, name)')
      .single()

    // Log the creation
    await supabase.from('tobacco_logs').insert({
      tobacco_id: data.id,
      amount: data.available_grams,
      action_type: 'add',
    })

    if (error) throw error

    return NextResponse.json({ data }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: error.message || 'Failed to create tobacco item' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get existing item to check for old image
    const { data: existingItem } = await supabase
      .from('tobacco_items')
      .select('image_url, available_grams')
      .eq('id', id)
      .single()

    const existingData = existingItem as any

    // If updating grams, check if we should add to existing or set new value
    let addedAmount = 0
    if (updates.available_grams !== undefined) {
      if (existingData && updates.add_grams) {
        addedAmount = updates.available_grams // This is the amount being added
        updates.available_grams = (existingData.available_grams as number) + updates.available_grams
      } else {
        // Direct update, calculate difference? Or just log "add" if increased?
        // For simple edit, we might skipped detailed logging or log deviation
        // But if it's a "restock" action via UI, it usually sends add_grams=true
      }
    }

    // Log restock if add_grams was true
    if (updates.add_grams && addedAmount > 0) {
      await supabase.from('tobacco_logs').insert({
        tobacco_id: id,
        amount: addedAmount,
        action_type: 'restock',
      })
    }

    delete updates.add_grams

    // Check if image is being changed or removed
    const oldImageUrl = existingData?.image_url
    const newImageUrl = updates.image_url === '' ? null : (updates.image_url || null)

    // Delete old image from Storage if it's being changed or removed
    if (oldImageUrl && oldImageUrl !== newImageUrl) {
      try {
        // Extract path from URL
        let filePath = oldImageUrl
        if (oldImageUrl.includes('/storage/v1/object/public/tobacco-images/')) {
          filePath = oldImageUrl.split('/storage/v1/object/public/tobacco-images/')[1]
        } else if (oldImageUrl.startsWith('tobacco/')) {
          filePath = oldImageUrl
        }

        const adminSupabase = createAdminClient()
        const { error: deleteError } = await adminSupabase.storage
          .from('tobacco-images')
          .remove([filePath])

        if (deleteError && !deleteError.message?.includes('not found')) {
          console.error('Failed to delete old image:', deleteError)
          // Continue anyway - don't fail the update
        }
      } catch (deleteErr) {
        console.error('Error deleting old image:', deleteErr)
        // Continue anyway
      }
    }

    const { data, error } = await supabase
      .from('tobacco_items')
      .update({
        ...updates,
        image_url: newImageUrl,
        updated_at: new Date().toISOString(),
      } as any)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ data })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update tobacco item' },
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

    // Get item to delete associated image
    const { data: item } = await supabase
      .from('tobacco_items')
      .select('image_url')
      .eq('id', id)
      .single()

    const itemData = item as any

    // Delete image from Storage if exists
    if (itemData?.image_url) {
      try {
        let filePath = itemData.image_url
        if (itemData.image_url.includes('/storage/v1/object/public/tobacco-images/')) {
          filePath = itemData.image_url.split('/storage/v1/object/public/tobacco-images/')[1]
        } else if (itemData.image_url.startsWith('tobacco/')) {
          filePath = itemData.image_url
        }

        const adminSupabase = createAdminClient()
        await adminSupabase.storage
          .from('tobacco-images')
          .remove([filePath])
      } catch (deleteErr) {
        console.error('Error deleting image:', deleteErr)
        // Continue anyway
      }
    }

    // Delete item from database
    const { error } = await supabase
      .from('tobacco_items')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to delete tobacco item' },
      { status: 500 }
    )
  }
}

