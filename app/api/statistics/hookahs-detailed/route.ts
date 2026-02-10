import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getMoscowTodayStart, getMoscowDaysAgo, getMoscowMonthsAgo } from '@/lib/time-utils'

/**
 * GET /api/statistics/hookahs-detailed
 * Returns detailed hookah maker statistics - shared data accessible to all authenticated users
 * Shows statistics for all hookah makers (or specific one if userId provided)
 * Each user can see statistics of all hookah makers, but data is tracked per creator_id
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'all'
    const userId = searchParams.get('userId') // Optional: filter by specific user

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
          telegram_id,
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

    if (userId) {
      mixesQuery = mixesQuery.eq('creator_id', userId)
    }

    const { data: mixes, error: mixesError } = await mixesQuery

    if (mixesError) throw mixesError

    // Group by user
    const userStatsMap = new Map<string, {
      userId: string
      telegramId: number
      name: string
      total_mixes: number
      total_grams_used: number
      mixes: Array<{
        id: string
        name: string
        total_grams: number
        created_at: string
        items: Array<{
          tobacco_name: string
          tobacco_id: string
          grams: number
          percentage: number
        }>
      }>
    }>()

    mixes?.forEach((mix: any) => {
      const user = mix.users
      if (!user) return

      if (!userStatsMap.has(user.id)) {
        userStatsMap.set(user.id, {
          userId: user.id,
          telegramId: user.telegram_id,
          name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.telegram_username || 'Неизвестно',
          total_mixes: 0,
          total_grams_used: 0,
          mixes: [],
        })
      }

      const stats = userStatsMap.get(user.id)!
      stats.total_mixes++
      stats.total_grams_used += mix.total_grams

      const items = (mix.mix_items || []).map((item: any) => ({
        tobacco_name: item.tobacco_items?.name || 'Неизвестно',
        tobacco_id: item.tobaccoid,
        grams: item.grams,
        percentage: typeof item.percentage === 'string' ? parseFloat(item.percentage) : item.percentage,
      }))

      stats.mixes.push({
        id: mix.id,
        name: mix.name,
        total_grams: mix.total_grams,
        created_at: mix.created_at,
        items,
      })
    })

    const userStats = Array.from(userStatsMap.values())
      .map(stats => ({
        ...stats,
        mixes: stats.mixes.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
      }))
      .sort((a, b) => b.total_mixes - a.total_mixes)

    return NextResponse.json({ data: userStats })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch detailed hookah statistics' },
      { status: 500 }
    )
  }
}

