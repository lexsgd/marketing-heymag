'use client'

import { useState } from 'react'
import { Button, type ButtonProps } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface PortalButtonProps extends Omit<ButtonProps, 'onClick' | 'disabled'> {}

export function PortalButton({ variant = 'outline', ...props }: PortalButtonProps) {
  const [loading, setLoading] = useState(false)

  const handlePortal = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await response.json()

      if (data.error) {
        console.error('Portal error:', data.error)
        alert(data.error)
        return
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Portal error:', error)
      alert('Failed to open billing portal. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant={variant}
      disabled={loading}
      onClick={handlePortal}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        'Manage Subscription'
      )}
    </Button>
  )
}
