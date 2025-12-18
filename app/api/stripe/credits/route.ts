import { NextRequest, NextResponse } from 'next/server'
import { stripe, STRIPE_CREDIT_PACKS, CreditPackId } from '@/lib/stripe'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const { packId } = await request.json()

    if (!packId || !STRIPE_CREDIT_PACKS[packId as CreditPackId]) {
      return NextResponse.json(
        { error: 'Invalid credit pack ID' },
        { status: 400 }
      )
    }

    const pack = STRIPE_CREDIT_PACKS[packId as CreditPackId]

    if (!pack.priceId) {
      return NextResponse.json(
        { error: 'Stripe price ID not configured for this credit pack' },
        { status: 500 }
      )
    }

    // Get business data
    const serviceClient = createServiceRoleClient()
    const { data: business } = await serviceClient
      .from('businesses')
      .select('id, stripe_customer_id, email, business_name')
      .eq('auth_user_id', user.id)
      .single()

    if (!business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      )
    }

    // Create or get Stripe customer
    let customerId = business.stripe_customer_id

    if (!customerId) {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: business.email,
        name: business.business_name,
        metadata: {
          business_id: business.id,
          supabase_user_id: user.id,
        },
      })
      customerId = customer.id

      // Save customer ID to database
      await serviceClient
        .from('businesses')
        .update({ stripe_customer_id: customerId })
        .eq('id', business.id)
    }

    // Create checkout session for one-time payment
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'payment', // One-time payment, not subscription
      payment_method_types: ['card'],
      line_items: [
        {
          price: pack.priceId,
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/billing?credits_success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/billing?canceled=true`,
      metadata: {
        business_id: business.id,
        pack_id: packId,
        credits: pack.credits.toString(),
        type: 'credit_purchase',
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('[Stripe Credits] Error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
