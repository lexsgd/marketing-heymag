/**
 * One-time test endpoint for welcome email
 * DELETE THIS FILE AFTER TESTING
 */

import { NextRequest, NextResponse } from 'next/server'
import { sendWelcomeEmail } from '@/lib/email'

export async function GET(request: NextRequest) {
  // One-time test - send to specific email
  const testEmail = 'lexsgd@gmail.com'

  const result = await sendWelcomeEmail({
    businessName: 'Test Restaurant',
    email: testEmail,
    freeCredits: 5,
  })

  if (result.success) {
    return NextResponse.json({
      success: true,
      message: `Welcome email sent to ${testEmail}`,
      messageId: result.messageId,
      note: 'Check email for updated branding with logo, social links, and zazzles.ai URLs'
    })
  } else {
    return NextResponse.json({
      success: false,
      error: result.error,
    }, { status: 500 })
  }
}
