import { stripe, STRIPE_CREDIT_PACKS, CreditPackId } from '@/lib/stripe'
import { createServiceRoleClient } from '@/lib/supabase/server'

interface AutoTopUpResult {
  success: boolean
  creditsAdded?: number
  error?: string
}

/**
 * Check if auto top-up should trigger and execute it if needed
 * Call this function after any credit deduction
 */
export async function checkAndExecuteAutoTopUp(businessId: string): Promise<AutoTopUpResult> {
  const supabase = createServiceRoleClient()

  try {
    // Get business settings
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select(`
        id,
        auto_topup_enabled,
        auto_topup_threshold,
        auto_topup_pack,
        stripe_customer_id,
        stripe_default_payment_method
      `)
      .eq('id', businessId)
      .single()

    if (businessError || !business) {
      return { success: false, error: 'Business not found' }
    }

    // Check if auto top-up is enabled
    if (!business.auto_topup_enabled) {
      return { success: true } // Not an error, just not enabled
    }

    // Check if payment method is configured
    if (!business.stripe_customer_id || !business.stripe_default_payment_method) {
      console.warn(`[Auto Top-Up] Business ${businessId} has auto top-up enabled but no payment method`)
      return { success: false, error: 'No payment method configured' }
    }

    // Get current credit balance
    const { data: credits, error: creditsError } = await supabase
      .from('credits')
      .select('id, credits_remaining')
      .eq('business_id', businessId)
      .single()

    if (creditsError || !credits) {
      return { success: false, error: 'Credits not found' }
    }

    // Check if balance is below threshold
    if (credits.credits_remaining >= (business.auto_topup_threshold || 5)) {
      return { success: true } // Balance is fine, no action needed
    }

    // Get the pack to purchase
    const packId = (business.auto_topup_pack || 'pack_9') as CreditPackId
    const pack = STRIPE_CREDIT_PACKS[packId]

    if (!pack) {
      return { success: false, error: 'Invalid credit pack configured' }
    }

    console.log(`[Auto Top-Up] Triggering for business ${businessId}: balance ${credits.credits_remaining} < threshold ${business.auto_topup_threshold}`)

    // Create PaymentIntent for off-session payment
    const paymentIntent = await stripe.paymentIntents.create({
      amount: pack.price * 100, // Convert to cents
      currency: 'usd',
      customer: business.stripe_customer_id,
      payment_method: business.stripe_default_payment_method,
      off_session: true,
      confirm: true,
      metadata: {
        business_id: businessId,
        pack_id: packId,
        credits: pack.credits.toString(),
        type: 'auto_topup',
      },
    })

    if (paymentIntent.status !== 'succeeded') {
      // Log failed attempt
      await supabase.from('auto_topup_logs').insert({
        business_id: businessId,
        pack_id: packId,
        credits_added: 0,
        amount_charged: pack.price,
        stripe_payment_intent_id: paymentIntent.id,
        status: 'failed',
        error_message: `Payment status: ${paymentIntent.status}`,
        balance_before: credits.credits_remaining,
        balance_after: credits.credits_remaining,
      })

      return { success: false, error: `Payment failed: ${paymentIntent.status}` }
    }

    // Payment succeeded - add credits
    const newBalance = credits.credits_remaining + pack.credits

    await supabase
      .from('credits')
      .update({
        credits_remaining: newBalance,
        credits_purchased: supabase.rpc('increment_credits_purchased', { amount: pack.credits }),
      })
      .eq('id', credits.id)

    // Actually just do a simple update
    const { data: currentCredits } = await supabase
      .from('credits')
      .select('credits_purchased')
      .eq('id', credits.id)
      .single()

    await supabase
      .from('credits')
      .update({
        credits_remaining: newBalance,
        credits_purchased: (currentCredits?.credits_purchased || 0) + pack.credits,
      })
      .eq('id', credits.id)

    // Log the transaction
    await supabase.from('credit_transactions').insert({
      business_id: businessId,
      amount: pack.credits,
      transaction_type: 'purchase',
      description: `Auto top-up: ${pack.credits} credits`,
      stripe_payment_id: paymentIntent.id,
      balance_after: newBalance,
    })

    // Log successful auto top-up
    await supabase.from('auto_topup_logs').insert({
      business_id: businessId,
      pack_id: packId,
      credits_added: pack.credits,
      amount_charged: pack.price,
      stripe_payment_intent_id: paymentIntent.id,
      stripe_charge_id: paymentIntent.latest_charge as string,
      status: 'succeeded',
      balance_before: credits.credits_remaining,
      balance_after: newBalance,
    })

    console.log(`[Auto Top-Up] Success for business ${businessId}: added ${pack.credits} credits, new balance: ${newBalance}`)

    return { success: true, creditsAdded: pack.credits }
  } catch (error) {
    console.error('[Auto Top-Up] Error:', error)

    // Handle specific Stripe errors
    if (error instanceof stripe.errors.StripeCardError) {
      // Card was declined
      return { success: false, error: `Card declined: ${error.message}` }
    }

    return { success: false, error: 'Auto top-up failed' }
  }
}

/**
 * Deduct credits and check for auto top-up
 * Use this function for all credit deductions to ensure auto top-up triggers
 */
export async function deductCreditsWithAutoTopUp(
  businessId: string,
  amount: number,
  description: string,
  imageId?: string
): Promise<{ success: boolean; newBalance: number; error?: string }> {
  const supabase = createServiceRoleClient()

  try {
    // Get current credits
    const { data: credits, error: creditsError } = await supabase
      .from('credits')
      .select('id, credits_remaining, credits_used')
      .eq('business_id', businessId)
      .single()

    if (creditsError || !credits) {
      return { success: false, newBalance: 0, error: 'Credits not found' }
    }

    if (credits.credits_remaining < amount) {
      return { success: false, newBalance: credits.credits_remaining, error: 'Insufficient credits' }
    }

    // Deduct credits
    const newBalance = credits.credits_remaining - amount

    // First get current credits_used for proper increment
    const newCreditsUsed = (credits.credits_used || 0) + amount

    await supabase
      .from('credits')
      .update({
        credits_remaining: newBalance,
        credits_used: newCreditsUsed,
      })
      .eq('id', credits.id)

    // Log transaction
    await supabase.from('credit_transactions').insert({
      business_id: businessId,
      amount: -amount,
      transaction_type: 'usage',
      description,
      image_id: imageId,
      balance_after: newBalance,
    })

    // Check and execute auto top-up if needed
    await checkAndExecuteAutoTopUp(businessId)

    return { success: true, newBalance }
  } catch (error) {
    console.error('[Deduct Credits] Error:', error)
    return { success: false, newBalance: 0, error: 'Failed to deduct credits' }
  }
}
