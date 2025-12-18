import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAyrshareProfile, generateSocialLinkingUrl } from '@/lib/ayrshare'

export const dynamic = 'force-dynamic'

/**
 * POST /api/social/connect
 * Generate a JWT URL for social account linking via Ayrshare
 *
 * Returns a URL that opens Ayrshare's social linking page
 * where users can connect their Instagram, Facebook, and TikTok accounts
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

    // Get business
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id, business_name, ayrshare_profile_key')
      .eq('auth_user_id', user.id)
      .single()

    if (businessError || !business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    let profileKey = business.ayrshare_profile_key

    // Create Ayrshare profile if not exists
    if (!profileKey) {
      console.log('[Social Connect] Creating Ayrshare profile for business:', business.id)

      const profile = await createAyrshareProfile(
        business.business_name || `Business ${business.id}`,
        business.id
      )

      if (!profile) {
        return NextResponse.json(
          { error: 'Failed to create social media profile' },
          { status: 500 }
        )
      }

      profileKey = profile.profileKey

      // Save profile key to database
      const { error: updateError } = await supabase
        .from('businesses')
        .update({ ayrshare_profile_key: profileKey })
        .eq('id', business.id)

      if (updateError) {
        console.error('[Social Connect] Failed to save profile key:', updateError)
        // Continue anyway - profile is created in Ayrshare
      }
    }

    // Get request body for optional redirect URL
    let redirectUrl: string | undefined
    try {
      const body = await request.json()
      redirectUrl = body.redirectUrl
    } catch {
      // No body provided, use default
    }

    // Generate JWT URL for social linking
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://marketing.heymag.app'
    const defaultRedirect = `${appUrl}/social?connected=true`

    const result = await generateSocialLinkingUrl(profileKey, redirectUrl || defaultRedirect)

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to generate social linking URL' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      url: result.url,
      message: 'Open this URL to connect your social media accounts',
    })
  } catch (error) {
    console.error('[Social Connect] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
