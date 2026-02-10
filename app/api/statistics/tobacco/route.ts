import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getMoscowTodayStart, getMoscowDaysAgo, getMoscowMonthsAgo } from '@/lib/time-utils'

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

    // Get all tobacco items
    const { data: tobaccoItems, error: tobaccoError } = await supabase
      .from('tobacco_items')
      .select('*')

    if (tobaccoError) throw tobaccoError

    // Get mix items within date range
    let mixQuery = supabase
      .from('mix_items')
      .select(`
        grams,
        tobaccoid,
        mixes!inner (
          created_at
        )
      `)

    if (dateFilter.gte) {
      mixQuery = mixQuery.gte('mixes.created_at', dateFilter.gte)
    }

    const { data: mixItems, error: mixError } = await mixQuery

    if (mixError) throw mixError

    // Calculate statistics for each tobacco
    const stats = tobaccoItems?.map((tobacco: any) => {
      const usedItems = mixItems?.filter((item: any) => item.tobaccoid === tobacco.id) || []
      const usedGrams = usedItems.reduce((sum: number, item: any) => sum + (item.grams as number), 0)
      const mixCount = new Set(usedItems.map((item: any) => item.mixes?.id)).size

      // Calculate total used grams across all tobacco
      const totalUsed = mixItems?.reduce((sum: number, item: any) => sum + (item.grams as number), 0) || 0
      const percentage = totalUsed > 0 ? (usedGrams / totalUsed) * 100 : 0

      return {
        id: tobacco.id,
        name: tobacco.name,
        image_url: tobacco.image_url,
        current_grams: tobacco.available_grams,
        used_grams: usedGrams,
        mix_count: mixCount,
        usage_percentage: percentage,
      }
    }) || []

    // Get total statistics
    const totalSessions = mixItems ? new Set(mixItems.map((item: any) => item.mixes?.id)).size : 0
    const totalUsedGrams = mixItems?.reduce((sum: number, item: any) => sum + item.grams, 0) || 0
    const avgMixWeight = totalSessions > 0 ? totalUsedGrams / totalSessions : 0

    // Get most popular tobacco
    const sortedByUsage = [...stats].sort((a, b) => b.used_grams - a.used_grams)
    const mostPopular = sortedByUsage[0] || null

    return NextResponse.json({
      data: stats,
      summary: {
        total_sessions: totalSessions,
        total_used_grams: totalUsedGrams,
        avg_mix_weight: avgMixWeight,
        most_popular_tobacco: mostPopular,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch statistics' },
      { status: 500 }
    )
  }
}

