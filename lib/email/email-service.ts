/**
 * Zazzles Email Service
 * @description SendGrid-powered transactional email service
 */

import sgMail from '@sendgrid/mail'
import type {
  EmailParams,
  SendEmailResult,
  WelcomeEmailData,
  PurchaseConfirmationData,
  SubscriptionActivatedData,
  SubscriptionCancelledData,
  CreditsAddedData,
  LowCreditsWarningData,
  PasswordResetData,
  ExportReadyData,
  CreditsExhaustedData,
} from './types'
import {
  getWelcomeEmail,
  getPurchaseConfirmationEmail,
  getSubscriptionActivatedEmail,
  getSubscriptionCancelledEmail,
  getCreditsAddedEmail,
  getLowCreditsWarningEmail,
  getPasswordResetEmail,
  getExportReadyEmail,
  getCreditsExhaustedEmail,
} from './templates'

// Initialize SendGrid with API key
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY
const DEFAULT_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'hello@zazzles.app'
const DEFAULT_FROM_NAME = process.env.SENDGRID_FROM_NAME || 'Zazzles'

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY)
}

/**
 * Check if SendGrid is configured
 */
export function isEmailConfigured(): boolean {
  return !!SENDGRID_API_KEY
}

/**
 * Core email sending function
 */
export async function sendEmail(params: EmailParams): Promise<SendEmailResult> {
  const { to, subject, html, text, from, replyTo } = params

  // Check if SendGrid is configured
  if (!SENDGRID_API_KEY) {
    console.warn('[Email] SendGrid not configured - email not sent')
    if (process.env.NODE_ENV === 'development') {
      console.log('[Email] DEV MODE - Would have sent:', { to, subject })
      return { success: true, messageId: 'dev-mode-simulated' }
    }
    return { success: false, error: 'SendGrid not configured' }
  }

  try {
    const msg = {
      to,
      from: {
        email: from || DEFAULT_FROM_EMAIL,
        name: DEFAULT_FROM_NAME,
      },
      replyTo: replyTo || DEFAULT_FROM_EMAIL,
      subject,
      text: text || stripHtml(html),
      html,
    }

    console.log('[Email] Sending email to:', to, 'Subject:', subject)
    const [response] = await sgMail.send(msg)

    console.log('[Email] Sent successfully, status:', response.statusCode)
    return {
      success: true,
      messageId: response.headers['x-message-id'] as string,
    }
  } catch (error: unknown) {
    const err = error as { response?: { body?: { errors?: Array<{ message: string }> }; statusCode?: number }; message?: string }
    console.error('[Email] Failed to send:', err.response?.body || err.message)

    // Handle specific SendGrid errors
    let errorMessage = 'Failed to send email'

    if (err.response?.statusCode === 401) {
      errorMessage = 'Invalid SendGrid API key'
    } else if (err.response?.statusCode === 403) {
      errorMessage = 'Sender email not verified in SendGrid'
    } else if (err.response?.statusCode === 400) {
      const errors = err.response?.body?.errors
      if (errors && errors.length > 0) {
        errorMessage = errors[0].message
      }
    } else if (err.response?.statusCode === 429) {
      errorMessage = 'Rate limit exceeded'
    }

    return { success: false, error: errorMessage }
  }
}

/**
 * Strip HTML tags for plain text version
 */
function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// ============================================================================
// CONVENIENCE METHODS FOR SPECIFIC EMAIL TYPES
// ============================================================================

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<SendEmailResult> {
  const { html, text, subject } = getWelcomeEmail(data)
  return sendEmail({ to: data.email, subject, html, text })
}

/**
 * Send purchase confirmation email
 */
export async function sendPurchaseConfirmationEmail(data: PurchaseConfirmationData): Promise<SendEmailResult> {
  const { html, text, subject } = getPurchaseConfirmationEmail(data)
  return sendEmail({ to: data.email, subject, html, text })
}

/**
 * Send subscription activated email
 */
export async function sendSubscriptionActivatedEmail(data: SubscriptionActivatedData): Promise<SendEmailResult> {
  const { html, text, subject } = getSubscriptionActivatedEmail(data)
  return sendEmail({ to: data.email, subject, html, text })
}

/**
 * Send subscription cancelled email
 */
export async function sendSubscriptionCancelledEmail(data: SubscriptionCancelledData): Promise<SendEmailResult> {
  const { html, text, subject } = getSubscriptionCancelledEmail(data)
  return sendEmail({ to: data.email, subject, html, text })
}

/**
 * Send credits added notification
 */
export async function sendCreditsAddedEmail(data: CreditsAddedData): Promise<SendEmailResult> {
  const { html, text, subject } = getCreditsAddedEmail(data)
  return sendEmail({ to: data.email, subject, html, text })
}

/**
 * Send low credits warning
 */
export async function sendLowCreditsWarningEmail(data: LowCreditsWarningData): Promise<SendEmailResult> {
  const { html, text, subject } = getLowCreditsWarningEmail(data)
  return sendEmail({ to: data.email, subject, html, text })
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(data: PasswordResetData): Promise<SendEmailResult> {
  const { html, text, subject } = getPasswordResetEmail(data)
  return sendEmail({ to: data.email, subject, html, text })
}

/**
 * Send export ready notification
 */
export async function sendExportReadyEmail(data: ExportReadyData): Promise<SendEmailResult> {
  const { html, text, subject } = getExportReadyEmail(data)
  return sendEmail({ to: data.email, subject, html, text })
}

/**
 * Send credits exhausted notification
 * Sent when a user runs out of credits (replaces trial expired)
 */
export async function sendCreditsExhaustedEmail(data: CreditsExhaustedData): Promise<SendEmailResult> {
  const { html, text, subject } = getCreditsExhaustedEmail(data)
  return sendEmail({ to: data.email, subject, html, text })
}

// ============================================================================
// UTILITY EXPORTS
// ============================================================================

export {
  DEFAULT_FROM_EMAIL,
  DEFAULT_FROM_NAME,
}
