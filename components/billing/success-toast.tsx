'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'

export function SuccessToast() {
  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      toast.success('Subscription activated!', {
        description: 'Your subscription is now active. Enjoy your credits!',
      })
      // Clean URL
      window.history.replaceState({}, '', '/billing')
    }

    if (searchParams.get('credits_success') === 'true') {
      toast.success('Credits purchased!', {
        description: 'Your credits have been added to your account.',
      })
      // Clean URL
      window.history.replaceState({}, '', '/billing')
    }

    if (searchParams.get('canceled') === 'true') {
      toast.info('Checkout canceled', {
        description: 'You can try again anytime.',
      })
      // Clean URL
      window.history.replaceState({}, '', '/billing')
    }
  }, [searchParams])

  return null
}
