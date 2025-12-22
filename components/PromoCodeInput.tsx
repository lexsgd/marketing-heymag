'use client'

import { useState } from 'react'
import { Gift, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

interface PromoCodeInputProps {
  onSuccess?: (creditsAwarded: number, newBalance: number) => void
  className?: string
}

export function PromoCodeInput({ onSuccess, className }: PromoCodeInputProps) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{
    message: string
    credits: number
  } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!code.trim()) {
      setError('Please enter a promo code')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/promo/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: code.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to redeem promo code')
        return
      }

      setSuccess({
        message: data.message,
        credits: data.credits_awarded,
      })
      setCode('')

      if (onSuccess) {
        onSuccess(data.credits_awarded, data.new_balance)
      }

      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setSuccess(null)
      }, 5000)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn('space-y-3', className)}>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Gift className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Enter promo code"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase())
              setError(null)
            }}
            className="pl-10 uppercase"
            disabled={loading}
            maxLength={20}
          />
        </div>
        <Button
          type="submit"
          disabled={loading || !code.trim()}
          className="bg-orange-500 hover:bg-orange-600"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Redeem'
          )}
        </Button>
      </form>

      {error && (
        <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-1">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30 animate-in fade-in slide-in-from-top-1">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            {success.message}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
