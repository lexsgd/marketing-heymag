import Stripe from 'stripe'
import { stripeConfig } from '@/lib/security'

// Initialize Stripe with secret key (validated via env-validator)
export const stripe = new Stripe(stripeConfig.secretKey, {
  apiVersion: '2025-08-27.basil',
  typescript: true,
})

// Pricing configuration - must match Stripe Dashboard products
export const STRIPE_PLANS = {
  lite: {
    name: 'Lite',
    priceId: process.env.STRIPE_LITE_PRICE_ID || '',
    annualPriceId: process.env.STRIPE_LITE_ANNUAL_PRICE_ID || '',
    price: 15,
    annualPrice: 150,
    credits: 15,
  },
  starter: {
    name: 'Starter',
    priceId: process.env.STRIPE_STARTER_PRICE_ID || '',
    annualPriceId: process.env.STRIPE_STARTER_ANNUAL_PRICE_ID || '',
    price: 25,
    annualPrice: 250,
    credits: 30,
  },
  pro: {
    name: 'Pro',
    priceId: process.env.STRIPE_PRO_PRICE_ID || '',
    annualPriceId: process.env.STRIPE_PRO_ANNUAL_PRICE_ID || '',
    price: 80,
    annualPrice: 800,
    credits: 100,
  },
} as const

// Credit pack pricing - one-time purchases (premium pricing above subscription rates)
export const STRIPE_CREDIT_PACKS = {
  pack_4: {
    priceId: process.env.STRIPE_CREDITS_4_PRICE_ID || '',
    credits: 4,
    price: 5,
    pricePerCredit: 1.25,
  },
  pack_9: {
    priceId: process.env.STRIPE_CREDITS_9_PRICE_ID || '',
    credits: 9,
    price: 10,
    pricePerCredit: 1.11,
  },
  pack_23: {
    priceId: process.env.STRIPE_CREDITS_23_PRICE_ID || '',
    credits: 23,
    price: 25,
    pricePerCredit: 1.09,
  },
  pack_48: {
    priceId: process.env.STRIPE_CREDITS_48_PRICE_ID || '',
    credits: 48,
    price: 50,
    pricePerCredit: 1.04,
  },
} as const

export type PlanId = keyof typeof STRIPE_PLANS
export type CreditPackId = keyof typeof STRIPE_CREDIT_PACKS

// Map plan ID to credits
export function getPlanCredits(planId: string): number {
  const plan = STRIPE_PLANS[planId as PlanId]
  return plan?.credits || 0
}

// Map price ID to plan ID (checks both monthly and annual price IDs)
export function getPlanByPriceId(priceId: string): { planId: PlanId; isAnnual: boolean } | null {
  for (const [key, plan] of Object.entries(STRIPE_PLANS)) {
    if (plan.priceId === priceId) {
      return { planId: key as PlanId, isAnnual: false }
    }
    if (plan.annualPriceId === priceId) {
      return { planId: key as PlanId, isAnnual: true }
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
