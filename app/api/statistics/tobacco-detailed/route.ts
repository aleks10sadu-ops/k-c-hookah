import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getMoscowTodayStart, getMoscowDaysAgo, getMoscowMonthsAgo } from '@/lib/time-utils'

/**
 * GET /api/statistics/tobacco-detailed
 * Returns detailed tobacco statistics - shared data accessible to all authenticated users
 * Shows usage history with creator information (who used which tobacco and when)
 * Statistics are tracked per hookah maker (creator_id) but visible to everyone
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'all'
    const tobaccoId = searchParams.get('tobaccoId')

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

    // Get all tobacco items
    let tobaccoQuery = supabase
      .from('tobacco_items')
      .select('*, categories(id, name)')
      .order('name', { ascending: true })

    if (tobaccoId) {
      tobaccoQuery = tobaccoQuery.eq('id', tobaccoId)
    }

    const { data: tobaccoItems, error: tobaccoError } = await tobaccoQuery

    if (tobaccoError) throw tobaccoError

    // Get ALL mix items for calculating total usage (regardless of period)
    let allMixItemsQuery = supabase
      .from('mix_items')
      .select(`
        id,
        grams,
        tobaccoid,
        mix_id,
        mixes!inner (
          id,
          name,
          created_at,
          total_grams,
          creator_id,
          users!mixes_creator_id_fkey (
            id,
            first_name,
            last_name,
            telegram_username
          )
        )
      `)

    if (tobaccoId) {
      allMixItemsQuery = allMixItemsQuery.eq('tobaccoid', tobaccoId)
    }

    const { data: allMixItems, error: allMixItemsError } = await allMixItemsQuery

    if (allMixItemsError) throw allMixItemsError

    // Get mix items filtered by period for usage history
    let periodMixItemsQuery = supabase
      .from('mix_items')
      .select(`
        id,
        grams,
        tobaccoid,
        mix_id,
        mixes!inner (
          id,
          name,
          created_at,
          total_grams,
          creator_id,
          users!mixes_creator_id_fkey (
            id,
            first_name,
            last_name,
            telegram_username
          )
        )
      `)

    if (dateFilter.gte) {
      periodMixItemsQuery = periodMixItemsQuery.gte('mixes.created_at', dateFilter.gte)
    }

    if (tobaccoId) {
      periodMixItemsQuery = periodMixItemsQuery.eq('tobaccoid', tobaccoId)
    }

    const { data: periodMixItems, error: periodMixItemsError } = await periodMixItemsQuery

    if (periodMixItemsError) throw periodMixItemsError

    // Calculate statistics for each tobacco
    const stats = tobaccoItems?.map((tobacco: any) => {
      // Calculate total usage (all time) for initial_grams calculation
      const allUsedItems = allMixItems?.filter((item: any) => item.tobaccoid === tobacco.id) || []
      const totalUsedGrams = allUsedItems.reduce((sum: number, item: any) => sum + (item.grams as number), 0)

      // Calculate initial amount (current + total used)
      const initialGrams = tobacco.available_grams + totalUsedGrams

      // Get usage history for the selected period
      const periodUsedItems = periodMixItems?.filter((item: any) => item.tobaccoid === tobacco.id) || []
      const periodUsedGrams = periodUsedItems.reduce((sum: number, item: any) => sum + (item.grams as number), 0)

      // Get usage history with all details
      const usageHistory = periodUsedItems.map((item: any) => {
        const mix = item.mixes
        const user = mix?.users
        return {
          id: item.id,
          date: mix?.created_at || '',
          mix_name: mix?.name || 'Без названия',
          mix_id: mix?.id || null,
          grams: item.grams,
          creator_name: user
            ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.telegram_username || 'Неизвестно'
            : 'Неизвестно',
          creator_id: user?.id || null,
        }
      })

      return {
        id: tobacco.id,
        name: tobacco.name,
        image_url: tobacco.image_url,
        category_id: tobacco.category_id,
        current_grams: tobacco.available_grams,
        initial_grams: initialGrams,
        used_grams: periodUsedGrams, // Used grams for the selected period
        total_used_grams: totalUsedGrams, // Total used grams all time
        usage_history: usageHistory.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      }
    }) || []

    return NextResponse.json({ data: stats })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch detailed tobacco statistics' },
      { status: 500 }
    )
  }
}

