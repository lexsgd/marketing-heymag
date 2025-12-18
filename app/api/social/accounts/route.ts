import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/social/accounts
 * Get connected social accounts for the current user's business
 *
 * With direct Meta integration, accounts are stored locally during OAuth callback.
 * This endpoint simply returns the stored accounts.
 */
export async function GET() {
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
      .select('id')
      .eq('auth_user_id', user.id)
      .single()

    if (businessError || !business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    // Get all connected accounts
    const { data: accounts, error: accountsError } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('business_id', business.id)
      .order('platform')

    if (accountsError) {
      console.error('[Social Accounts] Error fetching accounts:', accountsError)
      return NextResponse.json(
        { error: 'Failed to fetch accounts' },
        { status: 500 }
      )
    }

    // Separate connected and disconnected accounts
    const connectedAccounts = accounts?.filter((a) => a.is_connected) || []
    const disconnectedAccounts = accounts?.filter((a) => !a.is_connected) || []

    return NextResponse.json({
      success: true,
      accounts: connectedAccounts,
      disconnected: disconnectedAccounts,
      connected: connectedAccounts.map((a) => a.platform),
    })
  } catch (error) {
    console.error('[Social Accounts] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/social/accounts
 * Disconnect a social account
 *
 * Query params:
 * - platform: 'facebook' | 'instagram'
 * - platformId: The platform-specific ID
 */
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const platform = url.searchParams.get('platform')
    const platformId = url.searchParams.get('platformId')

    if (!platform) {
      return NextResponse.json(
        { error: 'Platform is required' },
        { status: 400 }
      )
    }

    // Get business
    const { data: business } = await supabase
      .from('businesses')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    // Build query
    let query = supabase
      .from('social_accounts')
      .update({ is_connected: false, access_token: null })
      .eq('business_id', business.id)
      .eq('platform', platform)

    if (platformId) {
      query = query.eq('platform_id', platformId)
    }

    const { error: updateError } = await query

    if (updateError) {
      console.error('[Social Accounts] Error disconnecting:', updateError)
      return NextResponse.json(
        { error: 'Failed to disconnect account' },
        { status: 500 }
      )
    }

    // If disconnecting Instagram, keep Facebook connected (they share tokens but are separate)
    // If disconnecting Facebook, also disconnect linked Instagram
    if (platform === 'facebook' && platformId) {
      await supabase
        .from('social_accounts')
        .update({ is_connected: false, access_token: null })
        .eq('business_id', business.id)
        .eq('platform', 'instagram')
        .eq('facebook_page_id', platformId)
    }

    return NextResponse.json({
      success: true,
      message: `${platform} account disconnected`,
    })
  } catch (error) {
    console.error('[Social Accounts] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
