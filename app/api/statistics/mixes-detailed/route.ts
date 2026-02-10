import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getMoscowTodayStart, getMoscowDaysAgo, getMoscowMonthsAgo } from '@/lib/time-utils'

/**
 * GET /api/statistics/mixes-detailed
 * Returns detailed mix statistics - shared data accessible to all authenticated users
 * Shows all mixes with creator information (who created which mix and when)
 * Statistics are tracked per hookah maker (creator_id) but visible to everyone
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'all'

    const supabase = await createClient()

    // Calculate date range in Moscow timezone
    let dateFilter: { gte?: string } = {}
    if (period === 'today') {
      dateFilter.gte = getMoscowTodayStart()
    } else if (period === 'week') {
      dateFilter.gte = getMoscowDaysAgo(7)
    } else if (period === 'month') {
      dateFilter.gte = getMoscowMonthsAgo(1)
    }

    // Get all mixes with related data
    let mixesQuery = supabase
      .from('mixes')
      .select(`
        id,
        name,
        total_grams,
        created_at,
        creator_id,
        users!mixes_creator_id_fkey (
          id,
          first_name,
          last_name,
          telegram_username
        ),
        mix_items (
          id,
          grams,
          percentage,
          tobaccoid,
          tobacco_items!mix_items_tobaccoid_fkey (
            id,
            name,
            image_url
          )
        )
      `)
      .order('created_at', { ascending: false })

    if (dateFilter.gte) {
      mixesQuery = mixesQuery.gte('created_at', dateFilter.gte)
    }

    const { data: mixes, error: mixesError } = await mixesQuery

    if (mixesError) throw mixesError

    // Format mix statistics
    const mixStats = (mixes || []).map((mix: any) => {
      const user = mix.users
      const items = mix.mix_items || []

      return {
        id: mix.id,
        name: mix.name,
        total_grams: mix.total_grams,
        created_at: mix.created_at,
        creator_name: user 
          ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.telegram_username || 'Неизвестно'
          : 'Неизвестно',
        creator_id: user?.id || null,
        items: items.map((item: any) => ({
          id: item.id,
          tobacco_name: item.tobacco_items?.name || 'Неизвестно',
          tobacco_id: item.tobaccoid,
          grams: item.grams,
          percentage: typeof item.percentage === 'string' ? parseFloat(item.percentage) : item.percentage,
        })),
      }
    })

    return NextResponse.json({ data: mixStats })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch detailed mix statistics' },
      { status: 500 }
    )
  }
}

