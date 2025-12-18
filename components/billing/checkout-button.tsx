'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowRight, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CheckoutButtonProps {
  planId: string
  planName: string
  isCurrentPlan: boolean
  isPopular?: boolean
  isAnnual?: boolean
}

export function CheckoutButton({ planId, planName, isCurrentPlan, isPopular, isAnnual = false }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleCheckout = async () => {
    if (isCurrentPlan) return

    setLoading(true)
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, isAnnual }),
      })

      const data = await response.json()

      if (data.error) {
        console.error('Checkout error:', data.error)
        alert(data.error)
        return
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Failed to start checkout. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      className={cn(
        'w-full',
        isPopular ? 'bg-orange-500 hover:bg-orange-600' : ''
      )}
      variant={isPopular ? 'default' : 'outline'}
      disabled={isCurrentPlan || loading}
      onClick={handleCheckout}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isCurrentPlan ? (
        'Current Plan'
      ) : (
        <>
          Choose {planName}
          <ArrowRight className="ml-2 h-4 w-4" />
        </>
      )}
    </Button>
  )
}
