'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getAuthErrorMessage, getFieldErrorMessage } from '@/lib/auth/error-messages'
import {
  Mail,
  Lock,
  Loader2,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { PasswordStrength } from '@/components/auth/PasswordStrength'
import { cn } from '@/lib/utils'

export default function SignupPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rawError, setRawError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const router = useRouter()
  const supabase = createClient()

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    const emailError = getFieldErrorMessage('email', formData.email)
    if (emailError) errors.email = emailError

    const passwordError = getFieldErrorMessage('password', formData.password)
    if (passwordError) errors.password = passwordError

    const confirmPasswordError = getFieldErrorMessage('confirmPassword', formData.confirmPassword)
    if (confirmPasswordError) {
      errors.confirmPassword = confirmPasswordError
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match. Please ensure both are identical.'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Sign up the user - business details will be added in settings
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: '',
            business_name: 'My Business',
            business_type: 'Restaurant',
          },
        },
      })

      if (authError) throw authError

      // The business will be created automatically by the database trigger
      // Use window.location for full page reload
      window.location.href = '/auth/verify-email'
    } catch (error: unknown) {
      // Log the raw error for debugging
      const rawErrorMsg = (error as Error).message || JSON.stringify(error)
      console.error('[Signup Error]', {
        message: rawErrorMsg,
        name: (error as Error).name,
        stack: (error as Error).stack,
        raw: error,
      })

      // Store raw error for debugging display
      setRawError(rawErrorMsg)

      const errorMessage = getAuthErrorMessage(rawErrorMsg)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    setGoogleLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      })

      if (error) throw error
    } catch (error: unknown) {
      const errorMessage = getAuthErrorMessage((error as Error).message)
      setError(errorMessage)
      setGoogleLoading(false)
    }
  }

  return (
    <AuthLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Create your account</h1>
          <p className="text-muted-foreground">
            Get 2 free credits to start. No credit card required.
          </p>
        </div>

        {/* Social Signup */}
        <div className="space-y-4">
          <Button
            type="button"
            variant="outline"
            className="w-full h-11"
            onClick={handleGoogleSignup}
            disabled={googleLoading || loading}
          >
            {googleLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or sign up with email
              </span>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-1">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
              {error.includes('already exists') && (
                <Link
                  href="/auth/login"
                  className="block mt-2 text-sm underline hover:no-underline"
                >
                  Sign in instead
                </Link>
              )}
              {/* Debug: Show raw error */}
              {rawError && (
                <details className="mt-2 text-xs">
                  <summary className="cursor-pointer opacity-70">Debug info</summary>
                  <pre className="mt-1 p-2 bg-black/10 rounded text-[10px] overflow-auto max-h-24">
                    {rawError}
                  </pre>
                </details>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Signup Form */}
        <form onSubmit={handleSignup} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value })
                  if (fieldErrors.email) {
                    setFieldErrors({ ...fieldErrors, email: '' })
                  }
                }}
                className={cn("pl-10 h-11", fieldErrors.email && "border-red-500")}
                required
                autoComplete="email"
                disabled={loading}
              />
            </div>
            {fieldErrors.email && (
              <p className="text-xs text-red-500 animate-in fade-in">{fieldErrors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a strong password"
                value={formData.password}
                onChange={(e) => {
                  setFormData({ ...formData, password: e.target.value })
                  if (fieldErrors.password) {
                    setFieldErrors({ ...fieldErrors, password: '' })
                  }
                }}
                className={cn("pl-10 pr-10 h-11", fieldErrors.password && "border-red-500")}
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="text-xs text-red-500 animate-in fade-in">{fieldErrors.password}</p>
            )}
            <PasswordStrength password={formData.password} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) => {
                  setFormData({ ...formData, confirmPassword: e.target.value })
                  if (fieldErrors.confirmPassword) {
                    setFieldErrors({ ...fieldErrors, confirmPassword: '' })
                  }
                }}
                className={cn("pl-10 pr-10 h-11", fieldErrors.confirmPassword && "border-red-500")}
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {fieldErrors.confirmPassword && (
              <p className="text-xs text-red-500 animate-in fade-in">{fieldErrors.confirmPassword}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full h-11 bg-orange-500 hover:bg-orange-600"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Create Account
              </>
            )}
          </Button>
        </form>

        {/* What You'll Get - Compact */}
        <div className="rounded-lg border bg-muted/30 p-4">
          <p className="text-xs font-medium text-muted-foreground mb-2">What you'll get:</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
              <span>2 free credits</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
              <span>30+ style presets</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
              <span>AI captions (EN/CN)</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
              <span>Social posting</span>
            </div>
          </div>
        </div>

        {/* Sign In Link */}
        <div className="text-center text-sm">
          <span className="text-muted-foreground">
            Already have an account?{' '}
          </span>
          <Link
            href="/auth/login"
            className="font-medium text-primary hover:underline"
          >
            Sign in
          </Link>
        </div>

        {/* Terms */}
        <p className="text-center text-xs text-muted-foreground">
          By creating an account, you agree to our{' '}
          <Link href="/terms" className="underline hover:text-foreground">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="underline hover:text-foreground">
            Privacy Policy
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
