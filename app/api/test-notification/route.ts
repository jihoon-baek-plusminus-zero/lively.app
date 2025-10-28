import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'

// Initialize Supabase client with service role for bypassing RLS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    logger.log('[TEST-NOTIFICATION] 📨 Received notification request')

    // Parse request body
    const body = await request.json()
    const { name, nationality } = body

    // Validate required fields
    if (!name || !nationality) {
      logger.error('[TEST-NOTIFICATION] ❌ Missing required fields:', { name, nationality })
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: name and nationality are required',
        },
        { status: 400 }
      )
    }

    logger.log('[TEST-NOTIFICATION] 📝 Data received:', { name, nationality })

    // Insert into database
    const { data, error } = await supabase
      .from('test_notifications')
      .insert({
        name,
        nationality,
      })
      .select()
      .single()

    if (error) {
      logger.error('[TEST-NOTIFICATION] ❌ Database error:', error)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to save notification',
          details: error.message,
          code: error.code,
        },
        { status: 500 }
      )
    }

    logger.log('[TEST-NOTIFICATION] ✅ Notification saved:', data)

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: 'Notification received successfully',
        data: {
          id: data.id,
          name: data.name,
          nationality: data.nationality,
          created_at: data.created_at,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    logger.error('[TEST-NOTIFICATION] ❌ Unexpected error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

// GET endpoint for testing
export async function GET() {
  try {
    logger.log('[TEST-NOTIFICATION] 📊 Fetching all notifications')

    const { data, error } = await supabase
      .from('test_notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      logger.error('[TEST-NOTIFICATION] ❌ Database error:', error)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch notifications',
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        count: data.length,
        data,
      },
      { status: 200 }
    )
  } catch (error) {
    logger.error('[TEST-NOTIFICATION] ❌ Unexpected error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
