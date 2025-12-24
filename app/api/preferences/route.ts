import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/preferences - Load user preferences
 */
export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get business
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()

    if (businessError || !business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    // Get preferences
    const { data: preferences, error: prefError } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('business_id', business.id)
      .single()

    if (prefError && prefError.code !== 'PGRST116') {
      // PGRST116 = no rows found (which is fine, return defaults)
      console.error('[Preferences] Error loading preferences:', prefError)
      return NextResponse.json({ error: 'Failed to load preferences' }, { status: 500 })
    }

    // Return preferences or defaults
    return NextResponse.json({
      success: true,
      preferences: preferences || {
        default_background_mode: 'auto',
        default_background_description: null,
        default_background_url: null,
        default_business_type: null,
        default_mood: null,
        default_format: null,
        editor_settings: {},
      },
    })
  } catch (error) {
    console.error('[Preferences] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/preferences - Save user preferences
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get business
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()

    if (businessError || !business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    // Parse request body
    const body = await request.json()
    const {
      default_background_mode,
      default_background_description,
      default_background_url,
      default_business_type,
      default_mood,
      default_format,
      editor_settings,
    } = body

    // Validate background mode
    if (default_background_mode && !['auto', 'describe', 'upload'].includes(default_background_mode)) {
      return NextResponse.json({ error: 'Invalid background mode' }, { status: 400 })
    }

    // Upsert preferences (insert or update)
    const { data: preferences, error: upsertError } = await supabase
      .from('user_preferences')
      .upsert({
        business_id: business.id,
        default_background_mode: default_background_mode || 'auto',
        default_background_description: default_background_description || null,
        default_background_url: default_background_url || null,
        default_business_type: default_business_type || null,
        default_mood: default_mood || null,
        default_format: default_format || null,
        editor_settings: editor_settings || {},
      }, {
        onConflict: 'business_id',
      })
      .select()
      .single()

    if (upsertError) {
      console.error('[Preferences] Error saving preferences:', upsertError)
      return NextResponse.json({ error: 'Failed to save preferences' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      preferences,
    })
  } catch (error) {
    console.error('[Preferences] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
