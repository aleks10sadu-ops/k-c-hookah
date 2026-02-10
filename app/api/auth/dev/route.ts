import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
    if (process.env.NODE_ENV !== 'development') {
        return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
    }

    const supabase = await createClient()

    try {
        // Check if dev user exists
        const { data: existingUser } = await supabase
            .from('users')
            .select('*')
            .eq('telegram_id', 123456789) // Fixed dummy ID for dev user
            .single()

        if (existingUser) {
            return NextResponse.json({ user: existingUser })
        }

        // Create dev user if not exists
        const { data: newUser, error } = await supabase
            .from('users')
            .insert({
                telegram_id: 123456789,
                telegram_username: 'dev_user',
                first_name: 'Разработчик',
            })
            .select()
            .single()

        if (error) throw error

        return NextResponse.json({ user: newUser })
    } catch (error: any) {
        console.error('Error in dev auth:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
