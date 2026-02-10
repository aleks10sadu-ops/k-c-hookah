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

    // Get detailed mix items with all related data
    // First, get mixes with date filter
    let mixQuery = supabase
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
        )
      `)
      .order('created_at', { ascending: false })

    if (dateFilter.gte) {
      mixQuery = mixQuery.gte('created_at', dateFilter.gte)
    }

    const { data: mixes, error: mixesError } = await mixQuery

    if (mixesError) throw mixesError

    if (!mixes || mixes.length === 0) {
      return NextResponse.json({ data: [] })
    }

    const mixIds = mixes.map((m: any) => m.id)

    // Get mix items for these mixes
    const { data: mixItems, error: mixItemsError } = await supabase
      .from('mix_items')
      .select(`
        id,
        mix_id,
        grams,
        percentage,
        tobaccoid,
        tobacco_items!mix_items_tobaccoid_fkey (
          id,
          name,
          image_url
        )
      `)
      .in('mix_id', mixIds)

    if (mixItemsError) throw mixItemsError

    // Create a map of mixes for quick lookup
    const mixesMap = new Map(mixes.map((m: any) => [m.id, m]))

    // Format detailed records
    const detailedRecords = (mixItems || []).map((item: any) => {
      const tobacco = item.tobacco_items
      const mix = mixesMap.get(item.mix_id)
      const user = mix?.users

      const mixDate = mix?.created_at ? new Date(mix.created_at) : new Date()
      // Format time in Moscow timezone (24-hour format)
      const timeFormatter = new Intl.DateTimeFormat('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'Europe/Moscow'
      })
      
      return {
        id: item.id,
        date: mix?.created_at || new Date().toISOString(),
        time: timeFormatter.format(mixDate),
        tobacco_name: tobacco?.name || 'Неизвестно',
        tobacco_id: tobacco?.id || null,
        grams: item.grams,
        percentage: typeof item.percentage === 'string' ? parseFloat(item.percentage) : item.percentage,
        mix_name: mix?.name || 'Без названия',
        mix_id: mix?.id || null,
        mix_total_grams: mix?.total_grams || 0,
        creator_name: user 
          ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.telegram_username || 'Неизвестно'
          : 'Неизвестно',
        creator_id: user?.id || null,
      }
    })

    // Sort by date descending
    detailedRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return NextResponse.json({ data: detailedRecords })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch detailed statistics' },
      { status: 500 }
    )
  }
}

