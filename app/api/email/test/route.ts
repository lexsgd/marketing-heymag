/**
 * Email Test Endpoint
 * @description Send test emails to verify SendGrid configuration
 * @route POST /api/email/test
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  sendWelcomeEmail,
  sendPurchaseConfirmationEmail,
  sendSubscriptionActivatedEmail,
  sendCreditsAddedEmail,
  sendLowCreditsWarningEmail,
  sendCreditsExhaustedEmail,
  isEmailConfigured,
} from '@/lib/email'

// Admin emails allowed to send test emails
const ADMIN_EMAILS = ['lex@peacom.co', 'admin@zazzles.app']

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    if (!ADMIN_EMAILS.includes(user.email || '')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Check if SendGrid is configured
    if (!isEmailConfigured()) {
      return NextResponse.json({
        error: 'SendGrid not configured',
        message: 'Add SENDGRID_API_KEY to environment variables',
      }, { status: 500 })
    }

    // Parse request body
    const body = await request.json()
    const { template, recipientEmail } = body

    if (!template) {
      return NextResponse.json({ error: 'Template type required' }, { status: 400 })
    }

    const email = recipientEmail || user.email
    if (!email) {
      return NextResponse.json({ error: 'Recipient email required' }, { status: 400 })
    }

    // Get business name from profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('business_name')
      .eq('id', user.id)
      .single()

    const businessName = profile?.business_name || 'Test Business'

    // Send the appropriate test email
    let result

    switch (template) {
      case 'welcome':
        result = await sendWelcomeEmail({
          businessName,
          email,
          freeCredits: 3,
        })
        break

      case 'purchase_confirmation':
        result = await sendPurchaseConfirmationEmail({
          businessName,
          email,
          productName: '23 Credit Pack',
          amount: 9900, // $99.00 in cents
          currency: 'USD',
          creditsAdded: 23,
          totalCredits: 26,
          receiptUrl: 'https://dashboard.stripe.com/receipts/test',
        })
        break

      case 'subscription_activated':
        result = await sendSubscriptionActivatedEmail({
          businessName,
          email,
          planName: 'Pro',
          monthlyCredits: 100,
          nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          amount: 8000, // $80.00 in cents
          currency: 'USD',
        })
        break

      case 'credits_added':
        result = await sendCreditsAddedEmail({
          businessName,
          email,
          creditsAdded: 100,
          totalCredits: 123,
          source: 'subscription',
        })
        break

      case 'low_credits':
        result = await sendLowCreditsWarningEmail({
          businessName,
          email,
          remainingCredits: 3,
          suggestedPack: '23 Credit Pack ($99)',
          buyUrl: 'https://zazzles.ai/billing#credits',
        })
        break

      case 'credits_exhausted':
        result = await sendCreditsExhaustedEmail({
          businessName,
          email,
          upgradeUrl: 'https://zazzles.ai/billing',
          buyCreditsUrl: 'https://zazzles.ai/billing#credits',
        })
        break

      default:
        return NextResponse.json({
          error: 'Invalid template',
          validTemplates: [
            'welcome',
            'purchase_confirmation',
            'subscription_activated',
            'credits_added',
            'low_credits',
            'credits_exhausted',
          ],
        }, { status: 400 })
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Test email sent to ${email}`,
        template,
        messageId: result.messageId,
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.error,
      }, { status: 500 })
    }
  } catch (error) {
    console.error('[Email Test] Error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}

// GET endpoint to check email configuration status
export async function GET() {
  const configured = isEmailConfigured()

  return NextResponse.json({
    configured,
    fromEmail: process.env.SENDGRID_FROM_EMAIL || 'Not set',
    fromName: process.env.SENDGRID_FROM_NAME || 'Not set',
    availableTemplates: [
      'welcome',
      'purchase_confirmation',
      'subscription_activated',
      'credits_added',
      'low_credits',
      'credits_exhausted',
    ],
  })
}
