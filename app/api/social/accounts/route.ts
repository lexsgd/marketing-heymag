import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getConnectedAccounts, mapAyrsharePlatform } from '@/lib/ayrshare'

export const dynamic = 'force-dynamic'

/**
 * GET /api/social/accounts
 * Get and sync connected social accounts from Ayrshare
 *
 * This endpoint fetches the latest connected accounts from Ayrshare
 * and syncs them to our local database
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

    // Get business with Ayrshare profile key
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id, ayrshare_profile_key')
      .eq('auth_user_id', user.id)
      .single()

    if (businessError || !business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    // If no Ayrshare profile, return empty accounts
    if (!business.ayrshare_profile_key) {
      return NextResponse.json({
        success: true,
        accounts: [],
        message: 'No social media profile configured yet',
      })
    }

    // Fetch connected accounts from Ayrshare
    const ayrshareUser = await getConnectedAccounts(business.ayrshare_profile_key)

    if (!ayrshareUser) {
      // Return existing local accounts if Ayrshare fails
      const { data: localAccounts } = await supabase
        .from('social_accounts')
        .select('*')
        .eq('business_id', business.id)
        .eq('is_connected', true)

      return NextResponse.json({
        success: true,
        accounts: localAccounts || [],
        source: 'local',
        message: 'Could not sync with Ayrshare, showing cached accounts',
      })
    }

    const connectedPlatforms = ayrshareUser.activeSocialAccounts || []
    const displayNames = ayrshareUser.displayNames || {}
    const usernames = ayrshareUser.usernames || {}

    // Sync accounts to local database
    const syncedAccounts = []

    for (const platform of connectedPlatforms) {
      const mappedPlatform = mapAyrsharePlatform(platform)

      // Only sync platforms we support
      if (!['instagram', 'facebook', 'tiktok'].includes(mappedPlatform)) {
        continue
      }

      // Upsert account record
      const { data: account, error: upsertError } = await supabase
        .from('social_accounts')
        .upsert(
          {
            business_id: business.id,
            platform: mappedPlatform,
            platform_display_name: displayNames[platform] || platform,
            platform_username: usernames[platform] || null,
            is_connected: true,
            last_sync_at: new Date().toISOString(),
            account_info: {
              ayrshare_platform: platform,
              sync_source: 'ayrshare',
            },
          },
          {
            onConflict: 'business_id,platform',
            ignoreDuplicates: false,
          }
        )
        .select()
        .single()

      if (!upsertError && account) {
        syncedAccounts.push(account)
      }
    }

    // Mark disconnected accounts
    const connectedPlatformsList = connectedPlatforms.map(mapAyrsharePlatform)

    await supabase
      .from('social_accounts')
      .update({ is_connected: false })
      .eq('business_id', business.id)
      .not('platform', 'in', `(${connectedPlatformsList.join(',')})`)

    // Return all accounts for this business
    const { data: allAccounts } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('business_id', business.id)
      .order('platform')

    return NextResponse.json({
      success: true,
      accounts: allAccounts || [],
      connected: connectedPlatformsList,
      source: 'ayrshare',
    })
  } catch (error) {
    console.error('[Social Accounts] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
