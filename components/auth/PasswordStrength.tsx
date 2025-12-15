'use client'

import { cn } from '@/lib/utils'

interface PasswordStrengthProps {
  password: string
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const getStrength = (password: string): { score: number; label: string; color: string } => {
    if (!password) return { score: 0, label: '', color: '' }

    let score = 0

    // Length checks
    if (password.length >= 8) score++
    if (password.length >= 12) score++

    // Character variety
    if (/[a-z]/.test(password)) score++
    if (/[A-Z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[^a-zA-Z0-9]/.test(password)) score++

    // Normalize to 0-4
    const normalizedScore = Math.min(Math.floor(score / 1.5), 4)

    const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong']
    const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-lime-500', 'bg-green-500']

    return {
      score: normalizedScore,
      label: labels[normalizedScore] || '',
      color: colors[normalizedScore] || ''
    }
  }

  const strength = getStrength(password)

  if (!password) return null

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className={cn(
              'h-1.5 flex-1 rounded-full transition-colors',
              index <= strength.score ? strength.color : 'bg-muted'
            )}
          />
        ))}
      </div>
      <p className={cn(
        'text-xs',
        strength.score < 2 ? 'text-red-500' : strength.score < 3 ? 'text-yellow-600' : 'text-green-600'
      )}>
        Password strength: {strength.label}
      </p>
    </div>
  )
}
