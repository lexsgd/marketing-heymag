import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function createClient() {
  const cookieStore = await cookies()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase configuration. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  // Use Supabase defaults for cookie handling - no custom options
  // This ensures consistency with browser client and middleware
  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

// Service role client for server-side operations that bypass RLS
// Use this ONLY for trusted server-side operations (webhooks, AI processing, etc.)
export function createServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase service role configuration')
  }

  return createSupabaseClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Helper to get the user's business with subscription data
export async function getUserBusiness() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // First try with auth_user_id - including subscription and credits data
  let { data: businessData } = await supabase
    .from('businesses')
    .select(`
      *,
      subscriptions (
        id,
        status,
        current_period_end,
        trial_end,
        cancel_at_period_end
      ),
      credits (
        id,
        credits_remaining,
        credits_used
      )
    `)
    .eq('auth_user_id', user.id)
    .single()

  // If not found, try with email (fallback for existing businesses)
  if (!businessData && user.email) {
    const { data: businessByEmail } = await supabase
      .from('businesses')
      .select(`
        *,
        subscriptions (
          id,
          status,
          current_period_end,
          trial_end,
          cancel_at_period_end
        ),
        credits (
          id,
          credits_remaining,
          credits_used
        )
      `)
      .eq('email', user.email)
      .single()

    if (businessByEmail) {
      // Update the auth_user_id for future queries
      await supabase
        .from('businesses')
        .update({ auth_user_id: user.id })
        .eq('id', businessByEmail.id)

      businessData = businessByEmail
    }
  }

  if (!businessData) return null

  // Merge subscription and credits data into business object
  const subscription = businessData.subscriptions?.[0]
  const creditsData = businessData.credits?.[0]

  const business = {
    ...businessData,
    // Add business_id alias for id
    business_id: businessData.id,
    // Subscription data
    subscription_ends_at: subscription?.current_period_end || subscription?.trial_end || businessData.subscription_ends_at || null,
    subscription_status: subscription?.status || businessData.subscription_status || 'expired',
    // Credits data
    credits_remaining: creditsData?.credits_remaining || 0,
    credits_used: creditsData?.credits_used || 0,
  }

  // Remove nested arrays to keep the object clean
  delete business.subscriptions
  delete business.credits

  return business
}
