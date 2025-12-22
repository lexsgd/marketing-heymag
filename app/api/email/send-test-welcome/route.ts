import { NextRequest, NextResponse } from 'next/server'
import { sendWelcomeEmail } from '@/lib/email'

export async function GET(request: NextRequest) {
  const result = await sendWelcomeEmail({
    businessName: 'Test Restaurant',
    email: 'lexsgd@gmail.com',
    freeCredits: 5,
  })

  if (result.success) {
    return NextResponse.json({
      success: true,
      message: 'Welcome email sent',
      messageId: result.messageId,
      note: 'Using original 1200x700 logo displayed at 200px width for maximum sharpness'
    })
  } else {
    return NextResponse.json({ success: false, error: result.error }, { status: 500 })
  }
}
