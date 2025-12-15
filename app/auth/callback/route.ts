import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Check if user has a business account
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // Check if business exists
        const { data: business } = await supabase
          .from('businesses')
          .select('id')
          .eq('auth_user_id', user.id)
          .single()

        if (!business && user.email) {
          // Try to find by email
          const { data: businessByEmail } = await supabase
            .from('businesses')
            .select('id')
            .eq('email', user.email)
            .single()

          if (businessByEmail) {
            // Link the business to this user
            await supabase
              .from('businesses')
              .update({ auth_user_id: user.id })
              .eq('id', businessByEmail.id)
          } else {
            // Create a new business for the user (for Google OAuth signups)
            const { error: createError } = await supabase
              .from('businesses')
              .insert({
                auth_user_id: user.id,
                email: user.email,
                business_name: user.user_metadata?.business_name || user.user_metadata?.full_name || 'My Business',
                name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
                subscription_status: 'trial',
                subscription_tier: 'starter',
              })

            if (!createError) {
              // Create initial credits for the business
              const { data: newBusiness } = await supabase
                .from('businesses')
                .select('id')
                .eq('auth_user_id', user.id)
                .single()

              if (newBusiness) {
                await supabase
                  .from('credits')
                  .insert({
                    business_id: newBusiness.id,
                    credits_remaining: 30, // Free trial credits
                    credits_used: 0,
                  })
              }
            }
          }
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_error`)
}
