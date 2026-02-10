import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getMoscowTodayStart, getMoscowDaysAgo, getMoscowMonthsAgo, isMoscowToday, isMoscowWithinDays } from '@/lib/time-utils'

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

    // Get hookah sessions with user info
    let query = supabase
      .from('hookah_sessions')
      .select(`
        id,
        created_at,
        creator_id,
        users!hookah_sessions_creator_id_fkey (
          id,
          telegram_id,
          telegram_username,
          first_name,
          last_name
        )
      `)

    if (dateFilter.gte) {
      query = query.gte('created_at', dateFilter.gte)
    }

    const { data: sessions, error } = await query

    if (error) throw error

    // Aggregate statistics by user
    const statsMap = new Map<string, {
      userId: string
      telegramId: number
      name: string
      today: number
      week: number
      month: number
      total: number
    }>()

    sessions?.forEach((session: any) => {
      const user = session.users
      if (!user) return

      const sessionDate = session.created_at
      
      if (!statsMap.has(user.id)) {
        statsMap.set(user.id, {
          userId: user.id,
          telegramId: user.telegram_id,
          name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.telegram_username || 'Неизвестно',
          today: 0,
          week: 0,
          month: 0,
          total: 0,
        })
      }

      const stats = statsMap.get(user.id)!
      stats.total++

      // Use Moscow timezone for date comparisons
      if (isMoscowToday(sessionDate)) stats.today++
      if (isMoscowWithinDays(sessionDate, 7)) stats.week++
      if (isMoscowWithinDays(sessionDate, 30)) stats.month++
    })

    const statistics = Array.from(statsMap.values())

    return NextResponse.json({ data: statistics })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch statistics' },
      { status: 500 }
    )
  }
}

