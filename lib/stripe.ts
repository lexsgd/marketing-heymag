import Stripe from 'stripe'

// Initialize Stripe with secret key
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
  typescript: true,
})

// Pricing configuration - must match Stripe Dashboard products
export const STRIPE_PLANS = {
  lite: {
    name: 'Lite',
    priceId: process.env.STRIPE_LITE_PRICE_ID || '',
    price: 15,
    credits: 15,
  },
  starter: {
    name: 'Starter',
    priceId: process.env.STRIPE_STARTER_PRICE_ID || '',
    price: 25,
    credits: 30,
  },
  pro: {
    name: 'Pro',
    priceId: process.env.STRIPE_PRO_PRICE_ID || '',
    price: 80,
    credits: 100,
  },
  business: {
    name: 'Business',
    priceId: process.env.STRIPE_BUSINESS_PRICE_ID || '',
    price: 180,
    credits: 300,
  },
} as const

// Credit pack pricing - one-time purchases
export const STRIPE_CREDIT_PACKS = {
  pack_10: {
    priceId: process.env.STRIPE_CREDITS_10_PRICE_ID || '',
    credits: 10,
    price: 5,
  },
  pack_25: {
    priceId: process.env.STRIPE_CREDITS_25_PRICE_ID || '',
    credits: 25,
    price: 10,
  },
  pack_50: {
    priceId: process.env.STRIPE_CREDITS_50_PRICE_ID || '',
    credits: 50,
    price: 18,
  },
  pack_100: {
    priceId: process.env.STRIPE_CREDITS_100_PRICE_ID || '',
    credits: 100,
    price: 30,
  },
} as const

export type PlanId = keyof typeof STRIPE_PLANS
export type CreditPackId = keyof typeof STRIPE_CREDIT_PACKS

// Map plan ID to credits
export function getPlanCredits(planId: string): number {
  const plan = STRIPE_PLANS[planId as PlanId]
  return plan?.credits || 0
}

// Map price ID to plan ID
export function getPlanByPriceId(priceId: string): PlanId | null {
  for (const [key, plan] of Object.entries(STRIPE_PLANS)) {
    if (plan.priceId === priceId) {
      return key as PlanId
    }
  }
  return null
}

// Map price ID to credit pack
export function getCreditPackByPriceId(priceId: string): { id: CreditPackId; credits: number } | null {
  for (const [key, pack] of Object.entries(STRIPE_CREDIT_PACKS)) {
    if (pack.priceId === priceId) {
      return { id: key as CreditPackId, credits: pack.credits }
    }
  }
  return null
}
