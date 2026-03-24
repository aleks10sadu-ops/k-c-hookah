import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
    const supabase = await createClient()

    try {
        const { data: brands, error } = await supabase
            .from('brands')
            .select('*')
            .order('name', { ascending: true })

        if (error) throw error

        return NextResponse.json({ data: brands })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    const supabase = await createClient()

    try {
        const body = await request.json()
        const { name } = body

        if (!name?.trim()) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 })
        }

        const { data: brand, error } = await supabase
            .from('brands')
            .insert({ name: name.trim() })
            .select()
            .single()

        if (error) throw error

        return NextResponse.json({ data: brand })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest) {
    const supabase = await createClient()

    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 })
        }

        const { error } = await supabase
            .from('brands')
            .delete()
            .eq('id', id)

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
