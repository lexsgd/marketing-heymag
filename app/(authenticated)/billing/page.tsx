'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import {
  CreditCard,
  Sparkles,
  Crown,
  Receipt,
  Plus,
  AlertCircle,
  Loader2,
  Check,
  Zap,
  Settings,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { MainNavAuth } from '@/components/main-nav-auth'
import { CreditsButton } from '@/components/billing/credits-button'
import { PortalButton } from '@/components/billing/portal-button'
import { SuccessToast } from '@/components/billing/success-toast'
import { AutoTopUpSettings } from '@/components/billing/auto-topup-settings'
import { PricingPlans } from '@/components/billing/pricing-plans'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const creditPacks = [
  { id: 'pack_4', credits: 4, price: 5, pricePerCredit: 1.25 },
  { id: 'pack_9', credits: 9, price: 10, pricePerCredit: 1.11 },
  { id: 'pack_23', credits: 23, price: 25, pricePerCredit: 1.09 },
  { id: 'pack_48', credits: 48, price: 50, pricePerCredit: 1.04 },
]

type BillingTab = 'plans' | 'credits' | 'history'

interface BusinessData {
  id: string
  business_name: string
  subscription_status: string | null
  subscription_tier: string | null
  subscription_ends_at: string | null
  trial_ends_at: string | null
  stripe_customer_id: string | null
}

interface CreditsData {
  credits_remaining: number
  credits_used: number
}

interface Transaction {
  id: string
  amount: number
  description: string
  balance_after: number
  created_at: string
}

function BillingPageContent() {
  const [activeTab, setActiveTab] = useState<BillingTab>('plans')
  const [loading, setLoading] = useState(true)
  const [business, setBusiness] = useState<BusinessData | null>(null)
  const [creditsData, setCreditsData] = useState<CreditsData | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isAnnual, setIsAnnual] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Get business data
      const { data: businessData } = await supabase
        .from('businesses')
        .select(`
          id,
          business_name,
          subscription_status,
          subscription_tier,
          subscription_ends_at,
          trial_ends_at,
          stripe_customer_id
        `)
        .eq('auth_user_id', user.id)
        .single()

      if (businessData) {
        setBusiness(businessData)

        // Get credits
        const { data: credits, error: creditsError } = await supabase
          .from('credits')
          .select('credits_remaining, credits_used')
          .eq('business_id', businessData.id)
          .single()

        console.log('[Billing] Credits query result:', { credits, creditsError, businessId: businessData.id })

        if (credits) {
          setCreditsData(credits)
        } else if (creditsError) {
          console.error('[Billing] Credits error:', creditsError)
        }

        // Get transactions
        const { data: txns } = await supabase
          .from('credit_transactions')
          .select('*')
          .eq('business_id', businessData.id)
          .order('created_at', { ascending: false })
          .limit(20)

        if (txns) {
          setTransactions(txns)
        }
      }
    } catch (error) {
      console.error('Error loading billing data:', error)
    } finally {
      setLoading(false)
    }
    }
    loadData()
  }, [router, supabase])

  const creditsRemaining = creditsData?.credits_remaining || 0
  const creditsUsed = creditsData?.credits_used || 0
  const currentPlan = business?.subscription_tier || 'trial'
  const isTrialing = business?.subscription_status === 'trial'
  const isActive = business?.subscription_status === 'active'
  const trialEndsAt = business?.trial_ends_at ? new Date(business.trial_ends_at) : null
  const daysLeftInTrial = trialEndsAt ? Math.ceil((trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0
  const subscriptionEndsAt = business?.subscription_ends_at ? new Date(business.subscription_ends_at) : null

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <MainNavAuth />
        <div className="pt-16 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <MainNavAuth />

      {/* Success Toast Handler */}
      <Suspense fallback={null}>
        <SuccessToast />
      </Suspense>

      <div className="pt-16 flex">
        {/* Left Sidebar - Matching Explore pattern */}
        <aside className="hidden lg:block w-64 border-r border-border h-[calc(100vh-64px)] sticky top-16 overflow-y-auto p-6">
          {/* Billing Section */}
          <div className="mb-8">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              BILLING
            </h3>
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('plans')}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2',
                  activeTab === 'plans'
                    ? 'bg-muted text-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                <CreditCard className="h-4 w-4" />
                <span>Plans</span>
              </button>
              <button
                onClick={() => setActiveTab('credits')}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2',
                  activeTab === 'credits'
                    ? 'bg-muted text-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                <Sparkles className="h-4 w-4" />
                <span>Credits</span>
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2',
                  activeTab === 'history'
                    ? 'bg-muted text-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                <Receipt className="h-4 w-4" />
                <span>History</span>
              </button>
            </nav>
          </div>

          {/* Current Plan Section */}
          <div className="mb-8">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              CURRENT PLAN
            </h3>
            <div className="px-3 py-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 mb-1">
                {isTrialing ? (
                  <Sparkles className="h-4 w-4 text-orange-500" />
                ) : (
                  <Crown className="h-4 w-4 text-orange-500" />
                )}
                <span className="font-medium capitalize">
                  {isTrialing ? 'Free Trial' : currentPlan}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {isTrialing
                  ? `${daysLeftInTrial} days left`
                  : subscriptionEndsAt
                  ? `Renews ${subscriptionEndsAt.toLocaleDateString()}`
                  : 'Active'}
              </p>
            </div>
          </div>

          {/* Credits Balance */}
          <div className="mb-8">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              CREDITS
            </h3>
            <div className="px-3 py-3 rounded-lg bg-muted/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-bold">{creditsRemaining}</span>
                <span className="text-xs text-muted-foreground">remaining</span>
              </div>
              <Progress
                value={creditsRemaining > 0 ? (creditsRemaining / (creditsRemaining + creditsUsed)) * 100 : 0}
                className="h-1.5"
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              ACTIONS
            </h3>
            <div className="space-y-2">
              {business?.stripe_customer_id && (
                <PortalButton variant="outline" size="sm" className="w-full justify-start" />
              )}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold">
              {activeTab === 'plans' && 'Subscription Plans'}
              {activeTab === 'credits' && 'Credits'}
              {activeTab === 'history' && 'Transaction History'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {activeTab === 'plans' && 'Choose the plan that fits your needs'}
              {activeTab === 'credits' && 'Manage your credit balance and purchase add-ons'}
              {activeTab === 'history' && 'View your recent transactions and invoices'}
            </p>
          </div>

          {/* Trial Banner */}
          {isTrialing && activeTab === 'plans' && (
            <Card className="mb-6 border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 dark:border-orange-900/50">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="font-medium">Free Trial Active</p>
                    <p className="text-sm text-muted-foreground">
                      {daysLeftInTrial > 0
                        ? `${daysLeftInTrial} days left • ${creditsRemaining} credits remaining`
                        : 'Trial expired'}
                    </p>
                  </div>
                </div>
                <Button className="bg-orange-500 hover:bg-orange-600">
                  <Crown className="mr-2 h-4 w-4" />
                  Upgrade Now
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Plans Tab */}
          {activeTab === 'plans' && (
            <div className="space-y-6">
              {/* Current Plan Card */}
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

              {/* Pricing Plans */}
              <PricingPlans currentPlan={currentPlan} />
            </div>
          )}

          {/* Credits Tab */}
          {activeTab === 'credits' && (
            <div className="space-y-6">
              {/* Credit Balance Card */}
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

              {/* Auto Top-Up */}
              <AutoTopUpSettings />

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
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Transactions</CardTitle>
                  <CardDescription>
                    Your credit usage and purchases
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

              {/* Invoices */}
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
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default function BillingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <BillingPageContent />
    </Suspense>
  )
}
