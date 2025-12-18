import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { stripe, getPlanByPriceId, getPlanCredits, getCreditPackByPriceId } from '@/lib/stripe'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { stripeConfig, billingLogger as logger } from '@/lib/security'

// Disable body parsing - we need raw body for signature verification
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    logger.warn('No signature found in webhook request')
    return NextResponse.json(
      { error: 'No signature' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      stripeConfig.webhookSecret
    )
  } catch (err) {
    logger.error('Signature verification failed', err as Error)
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    )
  }

  const supabase = createServiceRoleClient()

  try {
    switch (event.type) {
      // ========================================
      // SUBSCRIPTION EVENTS
      // ========================================
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        // Handle credit pack purchase (one-time payment)
        if (session.mode === 'payment' && session.metadata?.type === 'credit_purchase') {
          await handleCreditPurchase(supabase, session)
          break
        }

        // Handle subscription checkout
        if (session.mode === 'subscription') {
          await handleSubscriptionCheckout(supabase, session)
        }
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdate(supabase, subscription)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionCanceled(supabase, subscription)
        break
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice
        await handleInvoicePaid(supabase, invoice)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await handleInvoicePaymentFailed(supabase, invoice)
        break
      }

      default:
        logger.debug('Unhandled event type', { type: event.type })
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    logger.error('Error processing webhook event', error as Error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

// ========================================
// HANDLER FUNCTIONS
// ========================================

async function handleSubscriptionCheckout(
  supabase: ReturnType<typeof createServiceRoleClient>,
  session: Stripe.Checkout.Session
) {
  const businessId = session.metadata?.business_id
  const planId = session.metadata?.plan_id

  if (!businessId || !planId) {
    logger.warn('Missing metadata in checkout session')
    return
  }

  logger.info('Subscription checkout completed', { businessId, planId })

  // Update business subscription status
  await supabase
    .from('businesses')
    .update({
      subscription_status: 'active',
      subscription_tier: planId,
    })
    .eq('id', businessId)
}

async function handleSubscriptionUpdate(
  supabase: ReturnType<typeof createServiceRoleClient>,
  subscription: Stripe.Subscription
) {
  const customerId = subscription.customer as string

  // Get business by Stripe customer ID
  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!business) {
    logger.warn('No business found for customer')
    return
  }

  // Get plan ID from price
  const priceId = subscription.items.data[0]?.price?.id
  const planResult = priceId ? getPlanByPriceId(priceId) : null
  const planId = planResult?.planId || null

  // Map Stripe status to our status
  let subscriptionStatus: string
  switch (subscription.status) {
    case 'active':
      subscriptionStatus = 'active'
      break
    case 'past_due':
      subscriptionStatus = 'past_due'
      break
    case 'canceled':
      subscriptionStatus = 'canceled'
      break
    case 'trialing':
      subscriptionStatus = 'trial'
      break
    default:
      subscriptionStatus = subscription.status
  }

  // Get period timestamps from subscription (use type assertion for API version compatibility)
  const periodEnd = (subscription as unknown as { current_period_end: number }).current_period_end
  const periodStart = (subscription as unknown as { current_period_start: number }).current_period_start

  // Update business
  await supabase
    .from('businesses')
    .update({
      subscription_status: subscriptionStatus,
      subscription_tier: planId || undefined,
      subscription_ends_at: new Date(periodEnd * 1000).toISOString(),
    })
    .eq('id', business.id)

  // Upsert subscription record
  await supabase
    .from('subscriptions')
    .upsert({
      business_id: business.id,
      stripe_subscription_id: subscription.id,
      stripe_price_id: priceId,
      status: subscription.status,
      current_period_start: new Date(periodStart * 1000).toISOString(),
      current_period_end: new Date(periodEnd * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000).toISOString()
        : null,
    }, {
      onConflict: 'stripe_subscription_id',
    })

  logger.info('Subscription updated', { businessId: business.id, status: subscriptionStatus })
}

async function handleSubscriptionCanceled(
  supabase: ReturnType<typeof createServiceRoleClient>,
  subscription: Stripe.Subscription
) {
  const customerId = subscription.customer as string

  // Get business by Stripe customer ID
  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!business) {
    logger.warn('No business found for customer')
    return
  }

  // Update business to canceled
  await supabase
    .from('businesses')
    .update({
      subscription_status: 'canceled',
    })
    .eq('id', business.id)

  // Update subscription record
  await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id)

  logger.info('Subscription canceled', { businessId: business.id })
}

async function handleInvoicePaid(
  supabase: ReturnType<typeof createServiceRoleClient>,
  invoice: Stripe.Invoice
) {
  // Only process subscription invoices (use type assertion for API version compatibility)
  const subscriptionId = (invoice as unknown as { subscription: string | null }).subscription
  if (!subscriptionId) return

  const customerId = invoice.customer as string

  // Get business by Stripe customer ID
  const { data: business } = await supabase
    .from('businesses')
    .select('id, subscription_tier')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!business) {
    logger.warn('No business found for customer')
    return
  }

  // Get credits for the plan
  const planCredits = getPlanCredits(business.subscription_tier || 'starter')

  // Reset monthly credits
  const { data: credits } = await supabase
    .from('credits')
    .select('id, credits_remaining, credits_purchased')
    .eq('business_id', business.id)
    .single()

  if (credits) {
    // Reset to plan credits + any purchased credits (which never expire)
    const newBalance = planCredits + (credits.credits_purchased || 0)

    await supabase
      .from('credits')
      .update({
        credits_remaining: newBalance,
        credits_used: 0,
        period_start: new Date().toISOString(),
        period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .eq('id', credits.id)

    // Log transaction
    await supabase
      .from('credit_transactions')
      .insert({
        business_id: business.id,
        amount: planCredits,
        transaction_type: 'subscription_credit',
        description: `Monthly credits reset (${business.subscription_tier} plan)`,
        balance_after: newBalance,
      })
  } else {
    // Create credits record
    await supabase
      .from('credits')
      .insert({
        business_id: business.id,
        credits_remaining: planCredits,
        credits_used: 0,
        period_start: new Date().toISOString(),
        period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })

    await supabase
      .from('credit_transactions')
      .insert({
        business_id: business.id,
        amount: planCredits,
        transaction_type: 'subscription_credit',
        description: `Initial credits (${business.subscription_tier} plan)`,
        balance_after: planCredits,
      })
  }

  logger.info('Invoice paid, credits reset', { businessId: business.id, credits: planCredits })
}

async function handleInvoicePaymentFailed(
  supabase: ReturnType<typeof createServiceRoleClient>,
  invoice: Stripe.Invoice
) {
  const customerId = invoice.customer as string

  // Get business by Stripe customer ID
  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!business) {
    logger.warn('No business found for customer')
    return
  }

  // Update subscription status to past_due
  await supabase
    .from('businesses')
    .update({
      subscription_status: 'past_due',
    })
    .eq('id', business.id)

  logger.warn('Invoice payment failed', { businessId: business.id })
}

async function handleCreditPurchase(
  supabase: ReturnType<typeof createServiceRoleClient>,
  session: Stripe.Checkout.Session
) {
  const businessId = session.metadata?.business_id
  const credits = parseInt(session.metadata?.credits || '0', 10)

  if (!businessId || !credits) {
    logger.warn('Missing metadata in credit purchase session')
    return
  }

  // Get current credits
  const { data: currentCredits } = await supabase
    .from('credits')
    .select('id, credits_remaining, credits_purchased')
    .eq('business_id', businessId)
    .single()

  if (currentCredits) {
    const newRemaining = (currentCredits.credits_remaining || 0) + credits
    const newPurchased = (currentCredits.credits_purchased || 0) + credits

    // Update credits
    await supabase
      .from('credits')
      .update({
        credits_remaining: newRemaining,
        credits_purchased: newPurchased,
      })
      .eq('id', currentCredits.id)

    // Log transaction
    await supabase
      .from('credit_transactions')
      .insert({
        business_id: businessId,
        amount: credits,
        transaction_type: 'purchase',
        description: `Purchased ${credits} credits`,
        stripe_payment_id: session.payment_intent as string,
        balance_after: newRemaining,
      })
  } else {
    // Create credits record
    await supabase
      .from('credits')
      .insert({
        business_id: businessId,
        credits_remaining: credits,
        credits_purchased: credits,
      })

    await supabase
      .from('credit_transactions')
      .insert({
        business_id: businessId,
        amount: credits,
        transaction_type: 'purchase',
        description: `Purchased ${credits} credits`,
        stripe_payment_id: session.payment_intent as string,
        balance_after: credits,
      })
  }

  logger.info('Credit purchase completed', { businessId, credits })
}
