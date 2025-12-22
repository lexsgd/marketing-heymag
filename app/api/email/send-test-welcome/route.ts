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
      note: 'Logo should now be properly sized (120x40px max)'
    })
  } else {
    return NextResponse.json({
      success: false,
      error: result.error,
    }, { status: 500 })
  }
}
