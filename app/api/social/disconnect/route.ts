import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { unlinkSocialAccount } from '@/lib/ayrshare'

export const dynamic = 'force-dynamic'

/**
 * POST /api/social/disconnect
 * Disconnect a social media account
 *
 * Body: { platform: 'instagram' | 'facebook' | 'tiktok' }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { platform } = body

    if (!platform || !['instagram', 'facebook', 'tiktok'].includes(platform)) {
      return NextResponse.json(
        { error: 'Invalid platform. Must be instagram, facebook, or tiktok' },
        { status: 400 }
      )
    }

    // Get business with Ayrshare profile key
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id, ayrshare_profile_key')
      .eq('auth_user_id', user.id)
      .single()

    if (businessError || !business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    if (!business.ayrshare_profile_key) {
      return NextResponse.json(
        { error: 'No social media profile configured' },
        { status: 400 }
      )
    }

    // Unlink from Ayrshare
    const success = await unlinkSocialAccount(business.ayrshare_profile_key, platform)

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to disconnect account from Ayrshare' },
        { status: 500 }
      )
    }

    // Update local database
    const { error: updateError } = await supabase
      .from('social_accounts')
      .update({
        is_connected: false,
        access_token: null,
        refresh_token: null,
      })
      .eq('business_id', business.id)
      .eq('platform', platform)

    if (updateError) {
      console.error('[Social Disconnect] Failed to update local record:', updateError)
      // Continue anyway - account is disconnected in Ayrshare
    }

    return NextResponse.json({
      success: true,
      message: `${platform} account disconnected successfully`,
    })
  } catch (error) {
    console.error('[Social Disconnect] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
