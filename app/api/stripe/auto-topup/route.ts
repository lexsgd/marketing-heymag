import { NextRequest, NextResponse } from 'next/server'
import { stripe, STRIPE_CREDIT_PACKS, CreditPackId } from '@/lib/stripe'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'

// GET: Fetch current auto top-up settings
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: business } = await supabase
      .from('businesses')
      .select(`
        auto_topup_enabled,
        auto_topup_threshold,
        auto_topup_pack,
        stripe_default_payment_method,
        stripe_customer_id
      `)
      .eq('auth_user_id', user.id)
      .single()

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    // Get payment method details if set
    let paymentMethodDetails = null
    if (business.stripe_customer_id && business.stripe_default_payment_method) {
      try {
        const pm = await stripe.paymentMethods.retrieve(business.stripe_default_payment_method)
        paymentMethodDetails = {
          id: pm.id,
          brand: pm.card?.brand,
          last4: pm.card?.last4,
          expMonth: pm.card?.exp_month,
          expYear: pm.card?.exp_year,
        }
      } catch {
        // Payment method may have been deleted
        paymentMethodDetails = null
      }
    }

    return NextResponse.json({
      enabled: business.auto_topup_enabled || false,
      threshold: business.auto_topup_threshold || 5,
      packId: business.auto_topup_pack || 'pack_9',
      paymentMethod: paymentMethodDetails,
    })
  } catch (error) {
    console.error('[Auto Top-Up GET] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

// POST: Update auto top-up settings
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { enabled, threshold, packId, paymentMethodId } = body

    // Validate packId
    if (packId && !STRIPE_CREDIT_PACKS[packId as CreditPackId]) {
      return NextResponse.json({ error: 'Invalid pack ID' }, { status: 400 })
    }

    // Validate threshold
    if (threshold !== undefined && (threshold < 1 || threshold > 100)) {
      return NextResponse.json({ error: 'Threshold must be between 1 and 100' }, { status: 400 })
    }

    const serviceClient = createServiceRoleClient()

    // Get business
    const { data: business } = await serviceClient
      .from('businesses')
      .select('id, stripe_customer_id')
      .eq('auth_user_id', user.id)
      .single()

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    // If enabling auto top-up, verify payment method exists
    if (enabled && !paymentMethodId) {
      // Check if there's already a default payment method
      const { data: currentBusiness } = await serviceClient
        .from('businesses')
        .select('stripe_default_payment_method')
        .eq('id', business.id)
        .single()

      if (!currentBusiness?.stripe_default_payment_method) {
        return NextResponse.json(
          { error: 'Please add a payment method before enabling auto top-up' },
          { status: 400 }
        )
      }
    }

    // If setting a new payment method, attach it to the customer
    if (paymentMethodId && business.stripe_customer_id) {
      try {
        // Attach payment method to customer
        await stripe.paymentMethods.attach(paymentMethodId, {
          customer: business.stripe_customer_id,
        })

        // Set as default for future payments
        await stripe.customers.update(business.stripe_customer_id, {
          invoice_settings: {
            default_payment_method: paymentMethodId,
          },
        })
      } catch (error) {
        console.error('[Auto Top-Up] Failed to attach payment method:', error)
        return NextResponse.json(
          { error: 'Failed to save payment method' },
          { status: 500 }
        )
      }
    }

    // Build update object
    const updateData: Record<string, unknown> = {}
    if (enabled !== undefined) updateData.auto_topup_enabled = enabled
    if (threshold !== undefined) updateData.auto_topup_threshold = threshold
    if (packId !== undefined) updateData.auto_topup_pack = packId
    if (paymentMethodId !== undefined) updateData.stripe_default_payment_method = paymentMethodId

    // Update business
    const { error: updateError } = await serviceClient
      .from('businesses')
      .update(updateData)
      .eq('id', business.id)

    if (updateError) {
      console.error('[Auto Top-Up] Update error:', updateError)
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Auto Top-Up POST] Error:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
