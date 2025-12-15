'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getAuthErrorMessage, getFieldErrorMessage } from '@/lib/auth/error-messages'
import {
  Mail,
  Lock,
  User,
  Building,
  Loader2,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Check
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { PasswordStrength } from '@/components/auth/PasswordStrength'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

type SignupStep = 'account' | 'business' | 'confirm'

export default function SignupPage() {
  const [step, setStep] = useState<SignupStep>('account')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    businessName: '',
    businessType: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const router = useRouter()
  const supabase = createClient()

  const validateStep = (currentStep: SignupStep): boolean => {
    const errors: Record<string, string> = {}

    if (currentStep === 'account') {
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
    }

    if (currentStep === 'business') {
      const fullNameError = getFieldErrorMessage('fullName', formData.fullName)
      if (fullNameError) errors.fullName = fullNameError

      const businessNameError = getFieldErrorMessage('businessName', formData.businessName)
      if (businessNameError) errors.businessName = businessNameError
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleNextStep = () => {
    if (validateStep(step)) {
      if (step === 'account') {
        setStep('business')
      } else if (step === 'business') {
        setStep('confirm')
      }
    }
  }

  const handlePreviousStep = () => {
    if (step === 'business') {
      setStep('account')
    } else if (step === 'confirm') {
      setStep('business')
    }
  }

  const handleSignup = async (e?: React.FormEvent) => {
    e?.preventDefault()

    if (!validateStep('business')) {
      setStep('business')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: formData.fullName,
            business_name: formData.businessName,
            business_type: formData.businessType || 'Restaurant',
          },
        },
      })

      if (authError) throw authError

      // The business will be created automatically by the database trigger
      router.push('/auth/verify-email')
    } catch (error: unknown) {
      const errorMessage = getAuthErrorMessage((error as Error).message)
      setError(errorMessage)

      // Navigate back to the appropriate step based on error
      if (errorMessage.includes('email') || errorMessage.includes('password')) {
        setStep('account')
      }
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

  const getStepProgress = () => {
    switch (step) {
      case 'account': return 33
      case 'business': return 66
      case 'confirm': return 100
      default: return 0
    }
  }

  return (
    <AuthLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Create your account</h1>
          <p className="text-muted-foreground">
            Start your 14-day free trial. No credit card required.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={getStepProgress()} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span className={cn(step === 'account' && "text-primary font-medium")}>
              Account
            </span>
            <span className={cn(step === 'business' && "text-primary font-medium")}>
              Business
            </span>
            <span className={cn(step === 'confirm' && "text-primary font-medium")}>
              Confirm
            </span>
          </div>
        </div>

        {/* Social Signup - Only show on first step */}
        {step === 'account' && (
          <>
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
          </>
        )}

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
            </AlertDescription>
          </Alert>
        )}

        {/* Signup Form */}
        <form onSubmit={(e) => { e.preventDefault(); handleNextStep(); }} className="space-y-4">
          {/* Step 1: Account Details */}
          {step === 'account' && (
            <>
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
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </>
          )}

          {/* Step 2: Business Details */}
          {step === 'business' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="John Doe"
                    value={formData.fullName}
                    onChange={(e) => {
                      setFormData({ ...formData, fullName: e.target.value })
                      if (fieldErrors.fullName) {
                        setFieldErrors({ ...fieldErrors, fullName: '' })
                      }
                    }}
                    className={cn("pl-10 h-11", fieldErrors.fullName && "border-red-500")}
                    required
                    autoComplete="name"
                    disabled={loading}
                  />
                </div>
                {fieldErrors.fullName && (
                  <p className="text-xs text-red-500 animate-in fade-in">{fieldErrors.fullName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessName">Restaurant/Business Name</Label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="businessName"
                    type="text"
                    placeholder="Tasty Bites Cafe"
                    value={formData.businessName}
                    onChange={(e) => {
                      setFormData({ ...formData, businessName: e.target.value })
                      if (fieldErrors.businessName) {
                        setFieldErrors({ ...fieldErrors, businessName: '' })
                      }
                    }}
                    className={cn("pl-10 h-11", fieldErrors.businessName && "border-red-500")}
                    required
                    autoComplete="organization"
                    disabled={loading}
                  />
                </div>
                {fieldErrors.businessName && (
                  <p className="text-xs text-red-500 animate-in fade-in">{fieldErrors.businessName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessType">Business Type (Optional)</Label>
                <Input
                  id="businessType"
                  type="text"
                  placeholder="e.g., Restaurant, Cafe, Bakery, Food Truck"
                  value={formData.businessType}
                  onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                  className="h-11"
                  disabled={loading}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-11"
                  onClick={handlePreviousStep}
                  disabled={loading}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-11 bg-orange-500 hover:bg-orange-600"
                  disabled={loading}
                >
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </>
          )}

          {/* Step 3: Confirmation */}
          {step === 'confirm' && (
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium">Review your information</h3>

                <div className="space-y-3 rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Email</span>
                    <span className="text-sm font-medium">{formData.email}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Full Name</span>
                    <span className="text-sm font-medium">{formData.fullName}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Business</span>
                    <span className="text-sm font-medium">{formData.businessName}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">What you'll get:</h4>
                  <div className="space-y-2">
                    <div className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      <div className="text-sm text-muted-foreground">
                        <strong>30 free image credits</strong> to enhance your food photos
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      <div className="text-sm text-muted-foreground">
                        Access to <strong>10+ style presets</strong> for different platforms
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      <div className="text-sm text-muted-foreground">
                        <strong>AI-generated captions</strong> in English and Chinese
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      <div className="text-sm text-muted-foreground">
                        <strong>Direct posting</strong> to Instagram, TikTok, Xiaohongshu & more
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-11"
                  onClick={handlePreviousStep}
                  disabled={loading}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  type="button"
                  className="flex-1 h-11 bg-orange-500 hover:bg-orange-600"
                  onClick={handleSignup}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      Complete Signup
                      <Check className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </form>

        {/* Sign In Link */}
        {step === 'account' && (
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
        )}

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
