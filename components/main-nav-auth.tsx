'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MainNav } from './main-nav'

interface UserData {
  email?: string
}

/**
 * MainNavAuth - Client-side wrapper for MainNav that fetches user data
 * Use this in client components where user data isn't available from server
 */
export function MainNavAuth() {
  const [user, setUser] = useState<UserData | null>(null)
  const [credits, setCredits] = useState<number>(0)
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUserData = async () => {
      const supabase = createClient()

      try {
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
          setUser({ email: user.email })

          // Get business and credits
          const { data: business } = await supabase
            .from('businesses')
            .select('id, subscription_status')
            .eq('auth_user_id', user.id)
            .single()

          if (business) {
            setSubscriptionStatus(business.subscription_status)

            const { data: creditsData } = await supabase
              .from('credits')
              .select('credits_remaining')
              .eq('business_id', business.id)
              .single()

            setCredits(creditsData?.credits_remaining || 0)
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [])

  // Show nav immediately, pass loading state to prevent auth UI flash
  return (
    <MainNav
      user={user}
      credits={credits}
      subscriptionStatus={subscriptionStatus}
      loading={loading}
    />
  )
}
