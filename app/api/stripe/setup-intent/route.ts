import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'

// Create a SetupIntent for saving a payment method
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

    // Create SetupIntent
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
      metadata: {
        business_id: business.id,
        purpose: 'auto_topup',
      },
    })

    return NextResponse.json({
      clientSecret: setupIntent.client_secret,
      customerId,
    })
  } catch (error) {
    console.error('[Stripe SetupIntent] Error:', error)
    return NextResponse.json(
      { error: 'Failed to create setup intent' },
      { status: 500 }
    )
  }
}

// Get saved payment methods for a customer
export async function GET(request: NextRequest) {
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

    // Get business data
    const serviceClient = createServiceRoleClient()
    const { data: business } = await serviceClient
      .from('businesses')
      .select('id, stripe_customer_id, stripe_default_payment_method')
      .eq('auth_user_id', user.id)
      .single()

    if (!business || !business.stripe_customer_id) {
      return NextResponse.json({ paymentMethods: [], defaultPaymentMethod: null })
    }

    // Get payment methods from Stripe
    const paymentMethods = await stripe.paymentMethods.list({
      customer: business.stripe_customer_id,
      type: 'card',
    })

    // Format payment methods for frontend
    const formattedMethods = paymentMethods.data.map((pm) => ({
      id: pm.id,
      brand: pm.card?.brand,
      last4: pm.card?.last4,
      expMonth: pm.card?.exp_month,
      expYear: pm.card?.exp_year,
      isDefault: pm.id === business.stripe_default_payment_method,
    }))

    return NextResponse.json({
      paymentMethods: formattedMethods,
      defaultPaymentMethod: business.stripe_default_payment_method,
    })
  } catch (error) {
    console.error('[Stripe PaymentMethods] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payment methods' },
      { status: 500 }
    )
  }
}
