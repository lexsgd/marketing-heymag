/**
 * Helper to get business from authenticated API request
 */

import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface Business {
  id: string
  name: string
  business_name?: string
  email?: string
  credits_remaining?: number
  credits_used?: number
  subscription_status?: string
  [key: string]: unknown
}

/**
 * Get the authenticated business from the request
 * Uses the Supabase client to get the current user and their associated business
 */
export async function getBusinessFromRequest(request: NextRequest): Promise<Business | null> {
  try {
    const supabase = await createClient()

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return null
    }

    // Get the business associated with this user including credits
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select(`
        *,
        credits (
          credits_remaining,
          credits_used
        )
      `)
      .eq('auth_user_id', user.id)
      .single()

    if (businessError || !business) {
      // Fallback: try by email for legacy accounts
      const { data: businessByEmail } = await supabase
        .from('businesses')
        .select(`
          *,
          credits (
            credits_remaining,
            credits_used
          )
        `)
        .eq('email', user.email)
        .single()

      if (businessByEmail) {
        const creditsData = businessByEmail.credits?.[0]
        return {
          ...businessByEmail,
          credits_remaining: creditsData?.credits_remaining || 0,
          credits_used: creditsData?.credits_used || 0,
        }
      }
      return null
    }

    // Merge credits data
    const creditsData = business.credits?.[0]
    return {
      ...business,
      credits_remaining: creditsData?.credits_remaining || 0,
      credits_used: creditsData?.credits_used || 0,
    }
  } catch (error) {
    console.error('[Auth] Error getting business from request:', error)
    return null
  }
}

/**
 * Check if a user has sufficient credits for an operation
 */
export async function checkCredits(businessId: string, requiredCredits: number = 1): Promise<boolean> {
  try {
    const supabase = await createClient()

    const { data: credits } = await supabase
      .from('credits')
      .select('credits_remaining')
      .eq('business_id', businessId)
      .single()

    return (credits?.credits_remaining || 0) >= requiredCredits
  } catch (error) {
    console.error('[Auth] Error checking credits:', error)
    return false
  }
}

/**
 * Deduct credits from a business account
 */
export async function deductCredits(businessId: string, amount: number = 1): Promise<boolean> {
  try {
    const supabase = await createClient()

    // Get current credits
    const { data: currentCredits } = await supabase
      .from('credits')
      .select('credits_remaining, credits_used')
      .eq('business_id', businessId)
      .single()

    if (!currentCredits || currentCredits.credits_remaining < amount) {
      return false
    }

    // Update credits
    const { error } = await supabase
      .from('credits')
      .update({
        credits_remaining: currentCredits.credits_remaining - amount,
        credits_used: currentCredits.credits_used + amount,
        updated_at: new Date().toISOString(),
      })
      .eq('business_id', businessId)

    return !error
  } catch (error) {
    console.error('[Auth] Error deducting credits:', error)
    return false
  }
}
