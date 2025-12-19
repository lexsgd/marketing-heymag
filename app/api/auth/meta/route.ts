import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getMetaAuthUrl } from '@/lib/social/meta'

// Use Node.js runtime for consistency with other API routes
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/meta/callback`

/**
 * GET /api/auth/meta
 * Initiates the Meta (Facebook/Instagram) OAuth flow
 */
export async function GET() {
  try {
    // Validate environment variables
    if (!FACEBOOK_APP_ID) {
      console.error('[Meta OAuth] Missing FACEBOOK_APP_ID')
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/social?error=config_error`
      )
    }

    const supabase = await createClient()

    // Verify user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/auth/login`)
    }

    // Generate state token for CSRF protection
    const state = crypto.randomUUID()

    // Store state in database for verification (expires in 10 minutes)
    const { error: stateError } = await supabase.from('oauth_states').insert({
      user_id: user.id,
      state,
      provider: 'meta',
      redirect_url: '/social',
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    })

    if (stateError) {
      console.error('[Meta OAuth] Failed to store state:', stateError)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/social?error=state_error`
      )
    }

    // Build and redirect to Meta OAuth URL
    const authUrl = getMetaAuthUrl(FACEBOOK_APP_ID, REDIRECT_URI, state)

    return NextResponse.redirect(authUrl)
  } catch (error) {
    console.error('[Meta OAuth] Error:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/social?error=oauth_error`
    )
  }
}
