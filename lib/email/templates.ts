/**
 * Zazzles Email Templates
 * @description Branded HTML email templates for transactional emails
 */

import type {
  WelcomeEmailData,
  PurchaseConfirmationData,
  SubscriptionActivatedData,
  SubscriptionCancelledData,
  CreditsAddedData,
  LowCreditsWarningData,
  PasswordResetData,
  ExportReadyData,
  TrialEndingData,
  TrialExpiredData,
} from './types'

// Zazzles brand colors
const BRAND = {
  primary: '#FF6B35', // Warm orange - food/appetite
  secondary: '#1A1A2E', // Dark navy
  accent: '#FFE66D', // Golden yellow
  success: '#4CAF50',
  warning: '#FF9800',
  background: '#FFFFFF',
  text: '#333333',
  textLight: '#666666',
  border: '#E0E0E0',
}

// Shared email styles
function getEmailStyles(): string {
  return `
    <style>
      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        line-height: 1.6;
        color: ${BRAND.text};
        margin: 0;
        padding: 0;
        background-color: #F5F5F5;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        background-color: ${BRAND.background};
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }
      .header {
        background: linear-gradient(135deg, ${BRAND.primary} 0%, #FF8A5B 100%);
        padding: 32px 24px;
        text-align: center;
      }
      .header img {
        height: 40px;
        margin-bottom: 8px;
      }
      .header h1 {
        color: white;
        margin: 0;
        font-size: 24px;
        font-weight: 600;
      }
      .content {
        padding: 32px 24px;
      }
      .content h2 {
        color: ${BRAND.secondary};
        font-size: 20px;
        margin-top: 0;
      }
      .button {
        display: inline-block;
        background: ${BRAND.primary};
        color: white !important;
        padding: 14px 32px;
        text-decoration: none;
        border-radius: 8px;
        font-weight: 600;
        margin: 16px 0;
        text-align: center;
      }
      .button:hover {
        background: #E55A2B;
      }
      .button-secondary {
        background: ${BRAND.secondary};
      }
      .stats-box {
        background: linear-gradient(135deg, #FFF5F0 0%, #FFF8E7 100%);
        border-radius: 12px;
        padding: 24px;
        margin: 24px 0;
        text-align: center;
      }
      .stats-number {
        font-size: 48px;
        font-weight: 700;
        color: ${BRAND.primary};
        line-height: 1;
      }
      .stats-label {
        font-size: 14px;
        color: ${BRAND.textLight};
        margin-top: 8px;
      }
      .info-box {
        background: #F8F9FA;
        border-left: 4px solid ${BRAND.primary};
        padding: 16px;
        margin: 16px 0;
        border-radius: 0 8px 8px 0;
      }
      .receipt-table {
        width: 100%;
        border-collapse: collapse;
        margin: 16px 0;
      }
      .receipt-table td {
        padding: 12px 0;
        border-bottom: 1px solid ${BRAND.border};
      }
      .receipt-table .label {
        color: ${BRAND.textLight};
      }
      .receipt-table .value {
        text-align: right;
        font-weight: 600;
      }
      .receipt-table .total {
        font-size: 18px;
        color: ${BRAND.primary};
      }
      .warning-box {
        background: #FFF3E0;
        border: 1px solid ${BRAND.warning};
        border-radius: 8px;
        padding: 16px;
        margin: 16px 0;
      }
      .footer {
        background: ${BRAND.secondary};
        color: #CCCCCC;
        padding: 24px;
        text-align: center;
        font-size: 12px;
      }
      .footer a {
        color: ${BRAND.primary};
        text-decoration: none;
      }
      .social-links {
        margin: 16px 0;
      }
      .social-links a {
        display: inline-block;
        margin: 0 8px;
      }
      .divider {
        height: 1px;
        background: ${BRAND.border};
        margin: 24px 0;
      }
      @media only screen and (max-width: 600px) {
        .container { border-radius: 0; }
        .content { padding: 24px 16px; }
        .header { padding: 24px 16px; }
      }
    </style>
  `
}

// Shared header
function getEmailHeader(title: string): string {
  return `
    <div class="header">
      <img src="https://zazzles.ai/logos/Zazzles-White.png" alt="Zazzles" width="120" height="40" style="height: 40px; width: auto; max-width: 120px; display: block; margin: 0 auto 12px auto;" />
      <h1>${title}</h1>
    </div>
  `
}

// Shared footer
function getEmailFooter(): string {
  const currentYear = new Date().getFullYear()
  return `
    <div class="footer">
      <div class="social-links">
        <a href="https://www.instagram.com/zazzles.ai/">Instagram</a> |
        <a href="https://www.facebook.com/profile.php?id=61585304495941">Facebook</a> |
        <a href="https://www.tiktok.com/@zazzles.ai">TikTok</a>
      </div>
      <p style="margin: 16px 0 8px;">
        <a href="https://zazzles.ai">Visit Zazzles</a> |
        <a href="https://zazzles.ai/help">Help Center</a> |
        <a href="https://zazzles.ai/settings">Manage Preferences</a>
      </p>
      <p style="margin: 0;">
        &copy; ${currentYear} Zazzles. All rights reserved.<br>
        AI-Powered Food Photography for F&B Businesses
      </p>
    </div>
  `
}

// Template wrapper
function wrapTemplate(content: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      ${getEmailStyles()}
    </head>
    <body>
      <div style="padding: 20px;">
        <div class="container">
          ${content}
        </div>
      </div>
    </body>
    </html>
  `
}

// ============================================================================
// EMAIL TEMPLATES
// ============================================================================

export function getWelcomeEmail(data: WelcomeEmailData): { html: string; text: string; subject: string } {
  const subject = `Welcome to Zazzles, ${data.businessName}! Your AI Food Photography Journey Begins`

  const html = wrapTemplate(`
    ${getEmailHeader('Welcome to Zazzles!')}
    <div class="content">
      <h2>Hey ${data.businessName}!</h2>
      <p>Welcome to the future of food photography. We're thrilled to have you join thousands of F&B businesses who are transforming their food photos into stunning marketing content with AI.</p>

      <div class="stats-box">
        <div class="stats-number">${data.freeCredits}</div>
        <div class="stats-label">Free Credits to Get Started</div>
      </div>

      <p>Here's what you can do with Zazzles:</p>
      <ul style="padding-left: 20px;">
        <li><strong>Transform Photos</strong> - Turn phone photos into professional shots</li>
        <li><strong>AI Styling</strong> - Apply 10+ stunning style presets</li>
        <li><strong>Background Magic</strong> - Remove or replace backgrounds instantly</li>
        <li><strong>Smart Captions</strong> - Generate multilingual captions with AI</li>
        <li><strong>Social Ready</strong> - Post directly to Instagram & Facebook</li>
      </ul>

      <div style="text-align: center;">
        <a href="https://zazzles.ai/dashboard" class="button">Start Creating</a>
      </div>

      <div class="info-box">
        <strong>Pro Tip:</strong> Upload your first food photo and try the "Luxury" style preset - it's our most popular!
      </div>

      <div class="divider"></div>

      <p style="color: ${BRAND.textLight}; font-size: 14px;">
        Need help? Check out our <a href="https://zazzles.ai/help">Help Center</a> or reply to this email - we're here for you!
      </p>
    </div>
    ${getEmailFooter()}
  `)

  const text = `
Welcome to Zazzles, ${data.businessName}!

We're thrilled to have you join us. You have ${data.freeCredits} free credits to get started.

Here's what you can do:
- Transform phone photos into professional shots
- Apply 10+ stunning style presets
- Remove or replace backgrounds instantly
- Generate multilingual captions with AI
- Post directly to Instagram & Facebook

Start creating: https://zazzles.ai/dashboard

Need help? Visit https://zazzles.ai/help

- The Zazzles Team
  `

  return { html, text, subject }
}

export function getPurchaseConfirmationEmail(data: PurchaseConfirmationData): { html: string; text: string; subject: string } {
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: data.currency,
  }).format(data.amount / 100)

  const subject = `Payment Confirmed - ${data.creditsAdded} Credits Added`

  const html = wrapTemplate(`
    ${getEmailHeader('Payment Confirmed')}
    <div class="content">
      <h2>Thank you for your purchase!</h2>
      <p>Hi ${data.businessName},</p>
      <p>Your payment has been successfully processed. Your credits are ready to use!</p>

      <div class="stats-box">
        <div class="stats-number">+${data.creditsAdded}</div>
        <div class="stats-label">Credits Added</div>
        <div style="margin-top: 12px; color: ${BRAND.textLight};">
          Total Balance: <strong style="color: ${BRAND.primary};">${data.totalCredits} credits</strong>
        </div>
      </div>

      <table class="receipt-table">
        <tr>
          <td class="label">Product</td>
          <td class="value">${data.productName}</td>
        </tr>
        <tr>
          <td class="label">Credits</td>
          <td class="value">${data.creditsAdded}</td>
        </tr>
        <tr>
          <td class="label">Amount</td>
          <td class="value total">${formattedAmount}</td>
        </tr>
      </table>

      ${data.receiptUrl ? `
      <p style="text-align: center;">
        <a href="${data.receiptUrl}" class="button button-secondary">View Receipt</a>
      </p>
      ` : ''}

      <div style="text-align: center;">
        <a href="https://zazzles.ai/dashboard" class="button">Use Your Credits</a>
      </div>
    </div>
    ${getEmailFooter()}
  `)

  const text = `
Payment Confirmed!

Hi ${data.businessName},

Your payment has been successfully processed.

Order Details:
- Product: ${data.productName}
- Credits Added: ${data.creditsAdded}
- Amount: ${formattedAmount}
- Total Balance: ${data.totalCredits} credits

${data.receiptUrl ? `View Receipt: ${data.receiptUrl}` : ''}

Start using your credits: https://zazzles.ai/dashboard

- The Zazzles Team
  `

  return { html, text, subject }
}

export function getSubscriptionActivatedEmail(data: SubscriptionActivatedData): { html: string; text: string; subject: string } {
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: data.currency,
  }).format(data.amount / 100)

  const subject = `${data.planName} Plan Activated - Welcome to Zazzles Pro!`

  const html = wrapTemplate(`
    ${getEmailHeader('Subscription Activated')}
    <div class="content">
      <h2>Your ${data.planName} Plan is Active!</h2>
      <p>Hi ${data.businessName},</p>
      <p>Awesome! Your subscription is now active. You're all set to create unlimited stunning food photography.</p>

      <div class="stats-box">
        <div class="stats-number">${data.monthlyCredits}</div>
        <div class="stats-label">Credits per Month</div>
      </div>

      <table class="receipt-table">
        <tr>
          <td class="label">Plan</td>
          <td class="value">${data.planName}</td>
        </tr>
        <tr>
          <td class="label">Monthly Credits</td>
          <td class="value">${data.monthlyCredits}</td>
        </tr>
        <tr>
          <td class="label">Next Billing</td>
          <td class="value">${data.nextBillingDate}</td>
        </tr>
        <tr>
          <td class="label">Amount</td>
          <td class="value total">${formattedAmount}/month</td>
        </tr>
      </table>

      <div class="info-box">
        <strong>What's included:</strong><br>
        All AI styles, background removal, caption generation, social posting, and priority support.
      </div>

      <div style="text-align: center;">
        <a href="https://zazzles.ai/dashboard" class="button">Start Creating</a>
      </div>
    </div>
    ${getEmailFooter()}
  `)

  const text = `
${data.planName} Plan Activated!

Hi ${data.businessName},

Your subscription is now active. You're all set!

Plan Details:
- Plan: ${data.planName}
- Monthly Credits: ${data.monthlyCredits}
- Amount: ${formattedAmount}/month
- Next Billing: ${data.nextBillingDate}

Start creating: https://zazzles.ai/dashboard

- The Zazzles Team
  `

  return { html, text, subject }
}

export function getSubscriptionCancelledEmail(data: SubscriptionCancelledData): { html: string; text: string; subject: string } {
  const subject = `Your ${data.planName} Subscription Has Been Cancelled`

  const html = wrapTemplate(`
    ${getEmailHeader('Subscription Cancelled')}
    <div class="content">
      <h2>We're sorry to see you go</h2>
      <p>Hi ${data.businessName},</p>
      <p>Your ${data.planName} subscription has been cancelled as requested. Your plan will remain active until ${data.effectiveDate}.</p>

      <div class="info-box">
        <strong>What happens next:</strong>
        <ul style="margin: 8px 0; padding-left: 20px;">
          <li>Your ${data.remainingCredits} remaining credits will still be available</li>
          <li>Full access continues until ${data.effectiveDate}</li>
          <li>After that, you can still use credits but won't receive new ones</li>
        </ul>
      </div>

      <p>Changed your mind? You can resubscribe anytime:</p>

      <div style="text-align: center;">
        <a href="https://zazzles.ai/pricing" class="button">Resubscribe</a>
      </div>

      <div class="divider"></div>

      <p style="color: ${BRAND.textLight}; font-size: 14px;">
        We'd love to know why you cancelled. <a href="https://zazzles.ai/feedback">Share your feedback</a> - it helps us improve.
      </p>
    </div>
    ${getEmailFooter()}
  `)

  const text = `
Subscription Cancelled

Hi ${data.businessName},

Your ${data.planName} subscription has been cancelled. Your plan will remain active until ${data.effectiveDate}.

- Remaining credits: ${data.remainingCredits}
- Access until: ${data.effectiveDate}

Changed your mind? Resubscribe: https://zazzles.ai/pricing

- The Zazzles Team
  `

  return { html, text, subject }
}

export function getCreditsAddedEmail(data: CreditsAddedData): { html: string; text: string; subject: string } {
  const sourceLabels: Record<string, string> = {
    purchase: 'Credit Pack Purchase',
    subscription: 'Monthly Subscription Renewal',
    bonus: 'Bonus Credits',
    referral: 'Referral Reward',
  }

  const subject = `+${data.creditsAdded} Credits Added to Your Account`

  const html = wrapTemplate(`
    ${getEmailHeader('Credits Added')}
    <div class="content">
      <h2>Your credits have been topped up!</h2>
      <p>Hi ${data.businessName},</p>
      <p>${data.creditsAdded} credits have been added to your account from: <strong>${sourceLabels[data.source]}</strong></p>

      <div class="stats-box">
        <div class="stats-number">${data.totalCredits}</div>
        <div class="stats-label">Total Credits Available</div>
        <div style="margin-top: 8px; color: ${BRAND.success};">+${data.creditsAdded} added</div>
      </div>

      <div style="text-align: center;">
        <a href="https://zazzles.ai/dashboard" class="button">Create Something Amazing</a>
      </div>
    </div>
    ${getEmailFooter()}
  `)

  const text = `
Credits Added!

Hi ${data.businessName},

${data.creditsAdded} credits have been added to your account.

Source: ${sourceLabels[data.source]}
Total Credits: ${data.totalCredits}

Start creating: https://zazzles.ai/dashboard

- The Zazzles Team
  `

  return { html, text, subject }
}

export function getLowCreditsWarningEmail(data: LowCreditsWarningData): { html: string; text: string; subject: string } {
  const subject = `Running Low on Credits (${data.remainingCredits} left)`

  const html = wrapTemplate(`
    ${getEmailHeader('Low Credits Alert')}
    <div class="content">
      <h2>Running low on credits</h2>
      <p>Hi ${data.businessName},</p>

      <div class="warning-box">
        <strong>Heads up!</strong> You only have <strong>${data.remainingCredits} credits</strong> remaining. Top up now to keep creating stunning food photos.
      </div>

      <p>Recommended for you:</p>
      <div class="info-box">
        <strong>${data.suggestedPack}</strong><br>
        Best value for your usage pattern
      </div>

      <div style="text-align: center;">
        <a href="${data.buyUrl}" class="button">Get More Credits</a>
      </div>

      <p style="color: ${BRAND.textLight}; font-size: 14px;">
        Or upgrade to a subscription plan for automatic monthly credits and savings.
        <a href="https://zazzles.ai/pricing">View Plans</a>
      </p>
    </div>
    ${getEmailFooter()}
  `)

  const text = `
Low Credits Alert

Hi ${data.businessName},

You only have ${data.remainingCredits} credits remaining.

Recommended: ${data.suggestedPack}

Get more credits: ${data.buyUrl}

Or view subscription plans: https://zazzles.ai/pricing

- The Zazzles Team
  `

  return { html, text, subject }
}

export function getPasswordResetEmail(data: PasswordResetData): { html: string; text: string; subject: string } {
  const subject = 'Reset Your Zazzles Password'

  const html = wrapTemplate(`
    ${getEmailHeader('Password Reset')}
    <div class="content">
      <h2>Reset your password</h2>
      <p>We received a request to reset your password. Click the button below to create a new password:</p>

      <div style="text-align: center;">
        <a href="${data.resetUrl}" class="button">Reset Password</a>
      </div>

      <div class="info-box">
        <strong>Security notice:</strong> This link expires in ${data.expiresIn}. If you didn't request this, you can safely ignore this email.
      </div>

      <p style="color: ${BRAND.textLight}; font-size: 14px;">
        If the button doesn't work, copy and paste this link:<br>
        <a href="${data.resetUrl}" style="word-break: break-all;">${data.resetUrl}</a>
      </p>
    </div>
    ${getEmailFooter()}
  `)

  const text = `
Reset Your Password

We received a request to reset your password.

Reset your password: ${data.resetUrl}

This link expires in ${data.expiresIn}.

If you didn't request this, you can safely ignore this email.

- The Zazzles Team
  `

  return { html, text, subject }
}

export function getExportReadyEmail(data: ExportReadyData): { html: string; text: string; subject: string } {
  const subject = `Your ${data.exportType} Export is Ready`

  const html = wrapTemplate(`
    ${getEmailHeader('Export Ready')}
    <div class="content">
      <h2>Your export is ready!</h2>
      <p>Hi ${data.businessName},</p>
      <p>Good news! Your ${data.exportType.toLowerCase()} export with ${data.imageCount} images is ready for download.</p>

      <div class="stats-box">
        <div class="stats-number">${data.imageCount}</div>
        <div class="stats-label">Images Ready</div>
      </div>

      <div style="text-align: center;">
        <a href="${data.downloadUrl}" class="button">Download Now</a>
      </div>

      <div class="warning-box">
        <strong>Important:</strong> This download link expires on ${data.expiresAt}. Make sure to download before then!
      </div>
    </div>
    ${getEmailFooter()}
  `)

  const text = `
Export Ready!

Hi ${data.businessName},

Your ${data.exportType} export with ${data.imageCount} images is ready.

Download: ${data.downloadUrl}

This link expires: ${data.expiresAt}

- The Zazzles Team
  `

  return { html, text, subject }
}

export function getTrialEndingEmail(data: TrialEndingData): { html: string; text: string; subject: string } {
  const subject = `Your Zazzles Trial Ends in ${data.daysRemaining} Day${data.daysRemaining === 1 ? '' : 's'}`

  const html = wrapTemplate(`
    ${getEmailHeader('Trial Ending Soon')}
    <div class="content">
      <h2>Don't lose your progress!</h2>
      <p>Hi ${data.businessName},</p>
      <p>Your free trial ends in <strong>${data.daysRemaining} day${data.daysRemaining === 1 ? '' : 's'}</strong>. Upgrade now to keep creating stunning food photography.</p>

      <div class="warning-box">
        <strong>What you'll lose:</strong>
        <ul style="margin: 8px 0; padding-left: 20px;">
          <li>Access to AI photo enhancement</li>
          <li>Background removal features</li>
          <li>Social media posting</li>
          <li>Your saved preferences</li>
        </ul>
      </div>

      <div style="text-align: center;">
        <a href="${data.upgradeUrl}" class="button">Upgrade Now</a>
      </div>

      <p style="color: ${BRAND.textLight}; font-size: 14px; text-align: center;">
        Plans start at just $25/month with 30 credits included.
      </p>
    </div>
    ${getEmailFooter()}
  `)

  const text = `
Trial Ending Soon!

Hi ${data.businessName},

Your free trial ends in ${data.daysRemaining} day${data.daysRemaining === 1 ? '' : 's'}.

Upgrade to keep creating: ${data.upgradeUrl}

Plans start at $25/month with 30 credits included.

- The Zazzles Team
  `

  return { html, text, subject }
}

export function getTrialExpiredEmail(data: TrialExpiredData): { html: string; text: string; subject: string } {
  const subject = 'Your Zazzles Trial Has Expired'

  const html = wrapTemplate(`
    ${getEmailHeader('Trial Expired')}
    <div class="content">
      <h2>Your trial has ended</h2>
      <p>Hi ${data.businessName},</p>
      <p>Your free trial has expired, but don't worry - your account and all your settings are still saved.</p>

      <p>To continue creating amazing food photography, choose a plan that works for you:</p>

      <div class="info-box">
        <strong>Popular Choice: Pro Plan ($80/month)</strong><br>
        100 credits/month - perfect for regular content creation
      </div>

      <div style="text-align: center;">
        <a href="${data.upgradeUrl}" class="button">View Plans</a>
      </div>

      <div class="divider"></div>

      <p style="color: ${BRAND.textLight}; font-size: 14px;">
        Not ready to commit? You can also buy credit packs with no subscription. <a href="https://zazzles.ai/pricing#credits">View Credit Packs</a>
      </p>
    </div>
    ${getEmailFooter()}
  `)

  const text = `
Trial Expired

Hi ${data.businessName},

Your free trial has expired, but your account is still saved.

View plans and continue: ${data.upgradeUrl}

Not ready? Buy credit packs instead: https://zazzles.ai/pricing#credits

- The Zazzles Team
  `

  return { html, text, subject }
}
