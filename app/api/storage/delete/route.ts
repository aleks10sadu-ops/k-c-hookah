import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const { path } = await request.json()

    if (!path) {
      return NextResponse.json(
        { error: 'Path is required' },
        { status: 400 }
      )
    }

    // Extract path from full URL if needed
    let filePath = path
    if (path.includes('/storage/v1/object/public/tobacco-images/')) {
      filePath = path.split('/storage/v1/object/public/tobacco-images/')[1]
    } else if (path.startsWith('tobacco/')) {
      filePath = path
    }

    const supabase = createAdminClient()

    // Delete from Storage
    const { error } = await supabase.storage
      .from('tobacco-images')
      .remove([filePath])

    if (error) {
      console.error('Delete error:', error)
      // Don't fail if file doesn't exist
      if (error.message?.includes('not found')) {
        return NextResponse.json({ success: true, message: 'File not found, already deleted' })
      }
      return NextResponse.json(
        { error: error.message || 'Failed to delete image' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete image' },
      { status: 500 }
    )
  }
}

