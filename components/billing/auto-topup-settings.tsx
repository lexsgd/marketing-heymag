'use client'

import { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import {
  RefreshCw,
  CreditCard,
  Zap,
  Loader2,
  Check,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface PaymentMethod {
  id: string
  brand: string
  last4: string
  expMonth: number
  expYear: number
  isDefault?: boolean
}

interface AutoTopUpSettings {
  enabled: boolean
  threshold: number
  packId: string
  paymentMethod: PaymentMethod | null
}

const creditPacks = [
  { id: 'pack_4', credits: 4, price: 5 },
  { id: 'pack_9', credits: 9, price: 10 },
  { id: 'pack_23', credits: 23, price: 25 },
  { id: 'pack_48', credits: 48, price: 50 },
]

function AddPaymentMethodForm({ onSuccess }: { onSuccess: () => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setIsLoading(true)
    setError(null)

    try {
      const { error: submitError } = await elements.submit()
      if (submitError) {
        setError(submitError.message || 'Failed to submit')
        setIsLoading(false)
        return
      }

      const { error: confirmError, setupIntent } = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/billing?setup_success=true`,
        },
        redirect: 'if_required',
      })

      if (confirmError) {
        setError(confirmError.message || 'Failed to save card')
        setIsLoading(false)
        return
      }

      if (setupIntent && setupIntent.status === 'succeeded') {
        // Save the payment method to auto top-up settings
        const paymentMethodId = setupIntent.payment_method
        if (paymentMethodId) {
          await fetch('/api/stripe/auto-topup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentMethodId }),
          })
        }

        toast.success('Payment method saved', {
          description: 'Your card has been saved for auto top-up.',
        })
        onSuccess()
      }
    } catch (err) {
      setError('An unexpected error occurred')
      console.error('[AddPaymentMethod] Error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error && (
        <div className="text-sm text-destructive flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}
      <Button type="submit" className="w-full" disabled={!stripe || isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-4 w-4" />
            Save Card
          </>
        )}
      </Button>
    </form>
  )
}

function PaymentMethodDialog({
  children,
  onSuccess,
}: {
  children: React.ReactNode
  onSuccess: () => void
}) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (open && !clientSecret) {
      fetch('/api/stripe/setup-intent', { method: 'POST' })
        .then((res) => res.json())
        .then((data) => {
          if (data.clientSecret) {
            setClientSecret(data.clientSecret)
          }
        })
        .catch(console.error)
    }
  }, [open, clientSecret])

  const handleSuccess = () => {
    setOpen(false)
    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Payment Method</DialogTitle>
          <DialogDescription>
            Save a card for automatic credit top-ups when your balance is low.
          </DialogDescription>
        </DialogHeader>
        {clientSecret ? (
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: {
                theme: 'stripe',
                variables: {
                  colorPrimary: '#f97316',
                },
              },
            }}
          >
            <AddPaymentMethodForm onSuccess={handleSuccess} />
          </Elements>
        ) : (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export function AutoTopUpSettings() {
  const [settings, setSettings] = useState<AutoTopUpSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [pendingChanges, setPendingChanges] = useState<Partial<AutoTopUpSettings>>({})

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/stripe/auto-topup')
      const data = await res.json()
      setSettings({
        enabled: data.enabled || false,
        threshold: data.threshold || 5,
        packId: data.packId || 'pack_9',
        paymentMethod: data.paymentMethod || null,
      })
    } catch (error) {
      console.error('[AutoTopUp] Failed to fetch settings:', error)
      toast.error('Failed to load auto top-up settings')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const saveSettings = async (updates: Partial<AutoTopUpSettings>) => {
    setIsSaving(true)
    try {
      const res = await fetch('/api/stripe/auto-topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save settings')
      }

      setSettings((prev) => prev ? { ...prev, ...updates } : null)
      setPendingChanges({})
      toast.success('Settings saved', {
        description: 'Your auto top-up settings have been updated.',
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggle = (enabled: boolean) => {
    if (enabled && !settings?.paymentMethod) {
      toast.error('Payment method required', {
        description: 'Please add a payment method before enabling auto top-up.',
      })
      return
    }
    saveSettings({ enabled })
  }

  const handleThresholdChange = (value: number[]) => {
    setPendingChanges((prev) => ({ ...prev, threshold: value[0] }))
  }

  const handlePackChange = (packId: string) => {
    setPendingChanges((prev) => ({ ...prev, packId }))
  }

  const applyPendingChanges = () => {
    if (Object.keys(pendingChanges).length > 0) {
      saveSettings(pendingChanges)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  const selectedPack = creditPacks.find((p) => p.id === (pendingChanges.packId || settings?.packId))
  const currentThreshold = pendingChanges.threshold ?? settings?.threshold ?? 5

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-orange-500" />
              Auto Top-Up
            </CardTitle>
            <CardDescription>
              Automatically purchase credits when your balance is low
            </CardDescription>
          </div>
          <Switch
            checked={settings?.enabled || false}
            onCheckedChange={handleToggle}
            disabled={isSaving}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Payment Method */}
        <div className="space-y-3">
          <Label>Payment Method</Label>
          {settings?.paymentMethod ? (
            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="h-8 w-12 rounded bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                  <CreditCard className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="font-medium capitalize">
                    {settings.paymentMethod.brand} •••• {settings.paymentMethod.last4}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Expires {settings.paymentMethod.expMonth}/{settings.paymentMethod.expYear}
                  </p>
                </div>
              </div>
              <PaymentMethodDialog onSuccess={fetchSettings}>
                <Button variant="ghost" size="sm">
                  Change
                </Button>
              </PaymentMethodDialog>
            </div>
          ) : (
            <PaymentMethodDialog onSuccess={fetchSettings}>
              <Button variant="outline" className="w-full">
                <CreditCard className="mr-2 h-4 w-4" />
                Add Payment Method
              </Button>
            </PaymentMethodDialog>
          )}
        </div>

        {/* Threshold */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Trigger Threshold</Label>
            <span className="text-sm font-medium">{currentThreshold} credits</span>
          </div>
          <Slider
            value={[currentThreshold]}
            onValueChange={handleThresholdChange}
            onValueCommit={applyPendingChanges}
            min={1}
            max={50}
            step={1}
            disabled={!settings?.enabled || isSaving}
          />
          <p className="text-xs text-muted-foreground">
            Auto top-up triggers when your balance falls below this amount
          </p>
        </div>

        {/* Pack Selection */}
        <div className="space-y-3">
          <Label>Credit Pack to Purchase</Label>
          <Select
            value={pendingChanges.packId || settings?.packId || 'pack_9'}
            onValueChange={handlePackChange}
            disabled={!settings?.enabled || isSaving}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {creditPacks.map((pack) => (
                <SelectItem key={pack.id} value={pack.id}>
                  {pack.credits} credits - ${pack.price}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {Object.keys(pendingChanges).length > 0 && pendingChanges.packId && (
            <Button
              size="sm"
              onClick={applyPendingChanges}
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              Save Changes
            </Button>
          )}
        </div>

        {/* Summary */}
        {settings?.enabled && selectedPack && (
          <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/50">
            <div className="flex items-start gap-3">
              <RefreshCw className="h-5 w-5 text-orange-500 mt-0.5" />
              <div>
                <p className="font-medium text-orange-900 dark:text-orange-100">
                  Auto Top-Up Active
                </p>
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  When your balance drops below {currentThreshold} credits, we&apos;ll
                  automatically charge ${selectedPack.price} to add {selectedPack.credits} credits.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
