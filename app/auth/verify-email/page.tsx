'use client'

import Link from 'next/link'
import { Mail, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AuthLayout } from '@/components/auth/AuthLayout'

export default function VerifyEmailPage() {
  return (
    <AuthLayout showBackButton={false}>
      <div className="space-y-6 text-center">
        {/* Icon */}
        <div className="mx-auto w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
          <Mail className="h-8 w-8 text-orange-500" />
        </div>

        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Check your email</h1>
          <p className="text-muted-foreground">
            We've sent you a verification link. Click the link in your email to verify your account and get started.
          </p>
        </div>

        {/* Tips */}
        <div className="rounded-lg border p-4 text-left space-y-3">
          <p className="font-medium text-sm">Didn't receive the email?</p>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li className="flex gap-2">
              <span>•</span>
              <span>Check your spam or junk folder</span>
            </li>
            <li className="flex gap-2">
              <span>•</span>
              <span>Make sure you entered the correct email address</span>
            </li>
            <li className="flex gap-2">
              <span>•</span>
              <span>Wait a few minutes and check again</span>
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full h-11"
            asChild
          >
            <Link href="/auth/login">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to login
            </Link>
          </Button>

          <p className="text-sm text-muted-foreground">
            Need help?{' '}
            <a
              href="mailto:support@marketing.heymag.app"
              className="text-primary hover:underline"
            >
              Contact support
            </a>
          </p>
        </div>
      </div>
    </AuthLayout>
  )
}
