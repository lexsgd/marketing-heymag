import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import {
  CreditCard,
  Sparkles,
  Check,
  Crown,
  Zap,
  Building2,
  Receipt,
  Plus,
  AlertCircle
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MainNav } from '@/components/main-nav'
import { CheckoutButton } from '@/components/billing/checkout-button'
import { CreditsButton } from '@/components/billing/credits-button'
import { PortalButton } from '@/components/billing/portal-button'
import { SuccessToast } from '@/components/billing/success-toast'

const plans = [
  {
    id: 'lite',
    name: 'Lite',
    price: 15,
    credits: 15,
    description: 'Try the basics',
    icon: Sparkles,
    features: [
      'AI Photo Enhancement',
      '10 Style Presets',
      'Basic Export Formats',
      'Watermarked Output',
    ],
    popular: false,
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 25,
    credits: 30,
    description: 'Perfect for small restaurants',
    icon: Zap,
    features: [
      'Everything in Lite',
      'AI Caption Generator',
      'No Watermarks',
      'Commercial License',
      '30+ Style Presets',
    ],
    popular: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 80,
    credits: 100,
    description: 'For growing businesses',
    icon: Crown,
    features: [
      'Everything in Starter',
      '20+ Style Presets',
      'Thematic Templates',
      'Batch Processing',
      'Post Scheduling',
      'Social Media Integration',
      'Priority Support',
    ],
    popular: true,
  },
  {
    id: 'business',
    name: 'Business',
    price: 180,
    credits: 300,
    description: 'For restaurant chains',
    icon: Building2,
    features: [
      'Everything in Pro',
      'API Access',
      'Team Seats (5 users)',
      'White-label Exports',
      'Custom Branding',
      'Dedicated Account Manager',
      'Priority Processing',
    ],
    popular: false,
  },
]

const creditPacks = [
  { id: 'pack_10', credits: 10, price: 5 },
  { id: 'pack_25', credits: 25, price: 10 },
  { id: 'pack_50', credits: 50, price: 18 },
  { id: 'pack_100', credits: 100, price: 30 },
]

export default async function BillingPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Get business with subscription and credits
  const { data: business } = await supabase
    .from('businesses')
    .select(`
      id,
      business_name,
      subscription_status,
      subscription_tier,
      subscription_ends_at,
      trial_ends_at,
      stripe_customer_id,
      credits (
        credits_remaining,
        credits_used
      )
    `)
    .eq('auth_user_id', user.id)
    .single()

  // Get credit transactions
  const { data: transactions } = await supabase
    .from('credit_transactions')
    .select('*')
    .eq('business_id', business?.id)
    .order('created_at', { ascending: false })
    .limit(20)

  const creditsRemaining = business?.credits?.[0]?.credits_remaining || 0
  const creditsUsed = business?.credits?.[0]?.credits_used || 0
  const currentPlan = business?.subscription_tier || 'trial'
  const isTrialing = business?.subscription_status === 'trial'
  const isActive = business?.subscription_status === 'active'
  const trialEndsAt = business?.trial_ends_at ? new Date(business.trial_ends_at) : null
  const daysLeftInTrial = trialEndsAt ? Math.ceil((trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0
  const subscriptionEndsAt = business?.subscription_ends_at ? new Date(business.subscription_ends_at) : null

  return (
    <div className="min-h-screen bg-background">
      <MainNav user={user} credits={creditsRemaining} subscriptionStatus={business?.subscription_status} />

      {/* Success Toast Handler */}
      <Suspense fallback={null}>
        <SuccessToast />
      </Suspense>

      <div className="pt-16 p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Billing</h1>
          <p className="text-muted-foreground">
            Manage your subscription and credits
          </p>
        </div>

        {/* Trial Banner */}
        {isTrialing && (
          <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 dark:border-orange-900/50">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="font-medium">Free Trial</p>
                  <p className="text-sm text-muted-foreground">
                    {daysLeftInTrial > 0
                      ? `${daysLeftInTrial} days left • ${creditsRemaining} credits remaining`
                      : 'Trial expired'}
                  </p>
                </div>
              </div>
              <Button className="bg-orange-500 hover:bg-orange-600" asChild>
                <a href="#plans">
                  <Crown className="mr-2 h-4 w-4" />
                  Upgrade Now
                </a>
              </Button>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="plans" className="space-y-6">
          <TabsList>
            <TabsTrigger value="plans">
              <CreditCard className="mr-2 h-4 w-4" />
              Plans
            </TabsTrigger>
            <TabsTrigger value="credits">
              <Sparkles className="mr-2 h-4 w-4" />
              Credits
            </TabsTrigger>
            <TabsTrigger value="history">
              <Receipt className="mr-2 h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>

          {/* Plans Tab */}
          <TabsContent value="plans" className="space-y-6" id="plans">
            {/* Current Plan */}
            {isActive && business?.subscription_tier && (
              <Card>
                <CardHeader>
                  <CardTitle>Current Plan</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                      <Crown className="h-6 w-6 text-orange-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-lg capitalize">{currentPlan}</p>
                      <p className="text-sm text-muted-foreground">
                        {subscriptionEndsAt
                          ? `Renews on ${subscriptionEndsAt.toLocaleDateString()}`
                          : 'Active subscription'}
                      </p>
                    </div>
                  </div>
                  <PortalButton />
                </CardContent>
              </Card>
            )}

            {/* Plan Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {plans.map((plan) => (
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
                    <div className={`h-12 w-12 rounded-full mx-auto flex items-center justify-center mb-3 ${
                      plan.popular
                        ? 'bg-orange-100 dark:bg-orange-900/30'
                        : 'bg-muted'
                    }`}>
                      <plan.icon className={`h-6 w-6 ${
                        plan.popular ? 'text-orange-500' : 'text-muted-foreground'
                      }`} />
                    </div>
                    <CardTitle>{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                    <div className="pt-2">
                      <span className="text-4xl font-bold">${plan.price}</span>
                      <span className="text-muted-foreground">/mo</span>
                    </div>
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
                    />
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Enterprise */}
            <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border-purple-200 dark:border-purple-900/50">
              <CardContent className="flex items-center justify-between p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-purple-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Enterprise</h3>
                    <p className="text-sm text-muted-foreground">
                      Custom solutions for large organizations with multiple locations
                    </p>
                  </div>
                </div>
                <Button variant="outline" asChild>
                  <a href="mailto:support@heymag.app?subject=Enterprise%20Inquiry">
                    Contact Sales
                  </a>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Credits Tab */}
          <TabsContent value="credits" className="space-y-6">
            {/* Credit Balance */}
            <Card>
              <CardHeader>
                <CardTitle>Credit Balance</CardTitle>
                <CardDescription>
                  Each image enhancement uses 1 credit
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-4xl font-bold">{creditsRemaining}</p>
                    <p className="text-sm text-muted-foreground">credits remaining</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-medium">{creditsUsed}</p>
                    <p className="text-sm text-muted-foreground">used this month</p>
                  </div>
                </div>
                <Progress
                  value={creditsRemaining > 0 ? (creditsRemaining / (creditsRemaining + creditsUsed)) * 100 : 0}
                  className="h-2"
                />
              </CardContent>
            </Card>

            {/* Buy Credits */}
            <Card>
              <CardHeader>
                <CardTitle>Buy Credit Packs</CardTitle>
                <CardDescription>
                  Need more credits? Purchase add-on packs (never expire!)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {creditPacks.map((pack) => (
                    <Card key={pack.id} className="text-center hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/30 mx-auto flex items-center justify-center mb-2">
                          <Sparkles className="h-5 w-5 text-orange-500" />
                        </div>
                        <p className="text-2xl font-bold">{pack.credits}</p>
                        <p className="text-sm text-muted-foreground mb-3">credits</p>
                        <CreditsButton packId={pack.id} price={pack.price} />
                        <p className="text-xs text-muted-foreground mt-2">
                          ${(pack.price / pack.credits).toFixed(2)}/credit
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Info Box */}
            <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
              <CardContent className="flex items-start gap-4 p-4">
                <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">How Credits Work</h4>
                  <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                    <li>• Each AI enhancement costs 1 credit</li>
                    <li>• Caption generation is included with enhancement</li>
                    <li>• Purchased credit packs never expire</li>
                    <li>• Monthly credits reset at billing cycle</li>
                    <li>• Re-enhancing with different style uses 1 credit</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>
                  Your recent credit usage and purchases
                </CardDescription>
              </CardHeader>
              <CardContent>
                {transactions && transactions.length > 0 ? (
                  <div className="space-y-4">
                    {transactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between py-3 border-b last:border-0"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                            transaction.amount > 0
                              ? 'bg-green-100 dark:bg-green-900/30'
                              : 'bg-orange-100 dark:bg-orange-900/30'
                          }`}>
                            {transaction.amount > 0 ? (
                              <Plus className="h-4 w-4 text-green-600" />
                            ) : (
                              <Sparkles className="h-4 w-4 text-orange-500" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{transaction.description}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(transaction.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-medium ${
                            transaction.amount > 0 ? 'text-green-600' : ''
                          }`}>
                            {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Balance: {transaction.balance_after}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="h-12 w-12 rounded-full bg-muted mx-auto flex items-center justify-center mb-3">
                      <Receipt className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      No transactions yet
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Download Invoices */}
            <Card>
              <CardHeader>
                <CardTitle>Invoices</CardTitle>
                <CardDescription>
                  Download your billing invoices
                </CardDescription>
              </CardHeader>
              <CardContent>
                {business?.stripe_customer_id ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground mb-4">
                      Access your invoices and payment history in the Stripe portal.
                    </p>
                    <PortalButton />
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="h-12 w-12 rounded-full bg-muted mx-auto flex items-center justify-center mb-3">
                      <Receipt className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      No invoices yet. Invoices will appear here after your first payment.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
