import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  exchangeCodeForToken,
  getLongLivedToken,
  getUserPages,
  getInstagramAccount,
} from '@/lib/social/meta'
import { facebookConfig, socialLogger as logger, getEnv } from '@/lib/security'

export const dynamic = 'force-dynamic'

const FACEBOOK_APP_ID = facebookConfig.appId
const FACEBOOK_APP_SECRET = facebookConfig.appSecret
const REDIRECT_URI = `${getEnv('NEXT_PUBLIC_APP_URL', '')}/api/auth/meta/callback`

/**
 * GET /api/auth/meta/callback
 * Handles the OAuth callback from Meta
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const searchParams = request.nextUrl.searchParams

  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // Handle OAuth errors (user denied, etc.)
  if (error) {
    logger.warn('OAuth error', { error, description: errorDescription })
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/social?error=oauth_denied&message=${encodeURIComponent(errorDescription || error)}`
    )
  }

  if (!code || !state) {
    logger.warn('Missing code or state in callback')
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/social?error=missing_params`
    )
  }

  try {
    // Verify state token exists and is valid
    const { data: stateRecord, error: stateError } = await supabase
      .from('oauth_states')
      .select('*')
      .eq('state', state)
      .eq('provider', 'meta')
      .gt('expires_at', new Date().toISOString())
      .single()

    if (stateError || !stateRecord) {
      logger.warn('Invalid or expired state', { error: stateError })
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/social?error=invalid_state`
      )
    }

    // Delete used state token
    await supabase.from('oauth_states').delete().eq('id', stateRecord.id)

    // Exchange code for access token
    const tokenData = await exchangeCodeForToken(
      code,
      FACEBOOK_APP_ID,
      FACEBOOK_APP_SECRET,
      REDIRECT_URI
    )

    if (tokenData.error) {
      logger.error('Token exchange error', undefined, { error: tokenData.error })
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/social?error=token_exchange_failed`
      )
    }

    const shortLivedToken = tokenData.access_token

    // Exchange for long-lived token (60 days)
    const longLivedData = await getLongLivedToken(
      shortLivedToken,
      FACEBOOK_APP_ID,
      FACEBOOK_APP_SECRET
    )

    if (longLivedData.error) {
      logger.warn('Long-lived token error, using short-lived', { error: longLivedData.error })
      // Continue with short-lived token if long-lived fails
    }

    const userAccessToken = longLivedData.access_token || shortLivedToken
    const tokenExpiresIn = longLivedData.expires_in || 3600 // Default 1 hour if short-lived

    // Get user's Facebook Pages
    const pages = await getUserPages(userAccessToken)

    if (pages.length === 0) {
      logger.warn('No Facebook pages found for user')
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/social?error=no_pages&message=${encodeURIComponent('No Facebook Pages found. Please make sure you have admin access to at least one Facebook Page.')}`
      )
    }

    // Get the authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/auth/login`)
    }

    // Get the user's business
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()

    if (businessError || !business) {
      logger.warn('Business not found', { error: businessError })
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/social?error=no_business`
      )
    }

    // Store each connected page and its Instagram account
    let connectedCount = 0
    const tokenExpiresAt = new Date(Date.now() + tokenExpiresIn * 1000).toISOString()

    for (const page of pages) {
      // Store Facebook Page
      // Note: Page access tokens from /me/accounts never expire
      const { error: fbError } = await supabase.from('social_accounts').upsert(
        {
          business_id: business.id,
          platform: 'facebook',
          platform_id: page.id,
          platform_display_name: page.name,
          platform_username: null,
          access_token: page.access_token, // Page token (never expires)
          is_connected: true,
          account_info: {
            category: page.category,
            has_instagram: !!page.instagram_business_account,
          },
          connected_at: new Date().toISOString(),
        },
        {
          onConflict: 'business_id,platform,platform_id',
          ignoreDuplicates: false,
        }
      )

      if (fbError) {
        logger.error('Failed to store Facebook page', fbError)
      } else {
        connectedCount++
      }

      // If page has connected Instagram account, store that too
      if (page.instagram_business_account) {
        const igAccount = await getInstagramAccount(
          page.instagram_business_account.id,
          page.access_token
        )

        if (igAccount) {
          const { error: igError } = await supabase.from('social_accounts').upsert(
            {
              business_id: business.id,
              platform: 'instagram',
              platform_id: igAccount.id,
              platform_display_name: igAccount.name || igAccount.username,
              platform_username: igAccount.username,
              access_token: page.access_token, // Use page token for IG too
              facebook_page_id: page.id, // Link to Facebook Page
              is_connected: true,
              account_info: {
                profile_picture: igAccount.profile_picture_url,
                linked_facebook_page: page.name,
              },
              connected_at: new Date().toISOString(),
            },
            {
              onConflict: 'business_id,platform,platform_id',
              ignoreDuplicates: false,
            }
          )

          if (igError) {
            logger.error('Failed to store Instagram account', igError)
          } else {
            connectedCount++
          }
        }
      }
    }

    logger.info('OAuth callback completed', { connectedCount, businessId: business.id })

    // Redirect back to social page with success
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/social?connected=true&count=${connectedCount}`
    )
  } catch (error) {
    logger.error('OAuth callback exception', error as Error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/social?error=callback_error`
    )
  }
}
