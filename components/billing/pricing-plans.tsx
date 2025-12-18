'use client'

import { useState } from 'react'
import { Check, Crown, Sparkles, Zap } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { CheckoutButton } from './checkout-button'

const plans = [
  {
    id: 'lite',
    name: 'Lite',
    price: 15,
    annualPrice: 150,
    credits: 15,
    description: 'Perfect for getting started',
    icon: Sparkles,
    features: [
      'AI Photo Enhancement',
      'AI Caption Generator',
      '30+ Style Presets',
      'Batch Processing',
      'Social Media Integration',
      'AI Support',
    ],
    popular: false,
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 25,
    annualPrice: 250,
    credits: 30,
    description: 'Great for small restaurants',
    icon: Zap,
    features: [
      'AI Photo Enhancement',
      'AI Caption Generator',
      '30+ Style Presets',
      'Batch Processing',
      'Social Media Integration',
      'AI Support',
    ],
    popular: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 80,
    annualPrice: 800,
    credits: 100,
    description: 'For growing businesses',
    icon: Crown,
    features: [
      'AI Photo Enhancement',
      'AI Caption Generator',
      '30+ Style Presets',
      'Batch Processing',
      'Social Media Integration',
      'Priority Support',
    ],
    popular: true,
  },
]

interface PricingPlansProps {
  currentPlan: string
}

export function PricingPlans({ currentPlan }: PricingPlansProps) {
  const [isAnnual, setIsAnnual] = useState(false)

  return (
    <div className="space-y-6">
      {/* Billing Toggle */}
      <div className="flex items-center justify-center gap-4">
        <Label
          htmlFor="billing-toggle"
          className={!isAnnual ? 'font-semibold' : 'text-muted-foreground'}
        >
          Monthly
        </Label>
        <Switch
          id="billing-toggle"
          checked={isAnnual}
          onCheckedChange={setIsAnnual}
        />
        <Label
          htmlFor="billing-toggle"
          className={isAnnual ? 'font-semibold' : 'text-muted-foreground'}
        >
          Annual
        </Label>
        {isAnnual && (
          <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            2 months free
          </Badge>
        )}
      </div>

      {/* Plan Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => {
          const displayPrice = isAnnual ? plan.annualPrice : plan.price
          const monthlyEquivalent = isAnnual ? Math.round(plan.annualPrice / 12) : plan.price
          const savings = isAnnual ? plan.price * 12 - plan.annualPrice : 0

          return (
            <Card
              key={plan.id}
              className={`relative ${
                plan.popular ? 'border-orange-500 shadow-lg' : ''
              }`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500">
                  Most Popular
                </Badge>
              )}
              <CardHeader className="text-center pb-4">
                <div
                  className={`h-12 w-12 rounded-full mx-auto flex items-center justify-center mb-3 ${
                    plan.popular
                      ? 'bg-orange-100 dark:bg-orange-900/30'
                      : 'bg-muted'
                  }`}
                >
                  <plan.icon
                    className={`h-6 w-6 ${
                      plan.popular ? 'text-orange-500' : 'text-muted-foreground'
                    }`}
                  />
                </div>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="pt-2">
                  <span className="text-4xl font-bold">${displayPrice}</span>
                  <span className="text-muted-foreground">
                    {isAnnual ? '/year' : '/mo'}
                  </span>
                </div>
                {isAnnual && (
                  <p className="text-sm text-green-600 dark:text-green-400">
                    ${monthlyEquivalent}/mo · Save ${savings}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  {plan.credits} credits/month
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <CheckoutButton
                  planId={plan.id}
                  planName={plan.name}
                  isCurrentPlan={currentPlan === plan.id}
                  isPopular={plan.popular}
                  isAnnual={isAnnual}
                />
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
