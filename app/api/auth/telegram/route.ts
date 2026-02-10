import { NextRequest, NextResponse } from 'next/server'
import { validateTelegramInitData, parseInitData } from '@/lib/telegram'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { initData } = await request.json()

    if (!initData) {
      console.error('Auth: initData is missing')
      return NextResponse.json(
        { error: 'initData is required' },
        { status: 400 }
      )
    }

    // Validate Telegram init data
    const isValid = validateTelegramInitData(initData)
    if (!isValid) {
      console.error('Auth: Invalid init data signature')
      return NextResponse.json(
        { error: 'Invalid init data' },
        { status: 401 }
      )
    }

    // Parse user data from initData
    const userData = parseInitData(initData)
    console.log('Auth: Parsed user data:', { id: userData.id, username: userData.username })

    // Create or update user in database
    const supabase = await createClient()
    
    // First, check if user exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('telegram_id', userData.id)
      .maybeSingle()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Auth: Error checking user:', checkError)
      throw checkError
    }

    let userId: string

    if (existingUser) {
      console.log('Auth: User exists, updating:', existingUser.id)
      // Update existing user
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
          telegram_username: userData.username || null,
          first_name: userData.first_name || null,
          last_name: userData.last_name || null,
        })
        .eq('telegram_id', userData.id)
        .select('id')
        .single()

      if (updateError) {
        console.error('Auth: Error updating user:', updateError)
        throw updateError
      }

      userId = updatedUser?.id || existingUser.id
    } else {
      console.log('Auth: Creating new user')
      // Create new user
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          telegram_id: userData.id,
          telegram_username: userData.username || null,
          first_name: userData.first_name || null,
          last_name: userData.last_name || null,
        } as any)
        .select('id')
        .single()

      if (insertError) {
        console.error('Auth: Error creating user:', insertError)
        console.error('Auth: Insert data:', {
          telegram_id: userData.id,
          telegram_username: userData.username,
          first_name: userData.first_name,
          last_name: userData.last_name,
        })
        throw insertError
      }

      if (!newUser || !newUser.id) {
        throw new Error('Failed to create user: no ID returned')
      }

      userId = newUser.id
      console.log('Auth: User created successfully:', userId)
    }

    return NextResponse.json({
      success: true,
      userId,
      user: {
        id: userData.id,
        username: userData.username,
        first_name: userData.first_name,
        last_name: userData.last_name,
      },
    })
  } catch (error: any) {
    console.error('Auth error:', error)
    return NextResponse.json(
      { error: error.message || 'Authentication failed' },
      { status: 500 }
    )
  }
}

