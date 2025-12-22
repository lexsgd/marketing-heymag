/**
 * Email Service Types for Zazzles
 * @description Type definitions for transactional email system
 */

export type EmailTemplate =
  | 'welcome'
  | 'purchase_confirmation'
  | 'subscription_activated'
  | 'subscription_cancelled'
  | 'credits_added'
  | 'low_credits_warning'
  | 'password_reset'
  | 'export_ready'
  | 'trial_ending'
  | 'trial_expired'

export interface EmailParams {
  to: string
  subject: string
  html: string
  text?: string
  from?: string
  replyTo?: string
}

export interface SendEmailResult {
  success: boolean
  messageId?: string
  error?: string
}

export interface WelcomeEmailData {
  businessName: string
  email: string
  freeCredits: number
}

export interface PurchaseConfirmationData {
  businessName: string
  email: string
  productName: string
  amount: number
  currency: string
  creditsAdded: number
  totalCredits: number
  receiptUrl?: string
}

export interface SubscriptionActivatedData {
  businessName: string
  email: string
  planName: string
  monthlyCredits: number
  nextBillingDate: string
  amount: number
  currency: string
}

export interface SubscriptionCancelledData {
  businessName: string
  email: string
  planName: string
  effectiveDate: string
  remainingCredits: number
}

export interface CreditsAddedData {
  businessName: string
  email: string
  creditsAdded: number
  totalCredits: number
  source: 'purchase' | 'subscription' | 'bonus' | 'referral'
}

export interface LowCreditsWarningData {
  businessName: string
  email: string
  remainingCredits: number
  suggestedPack: string
  buyUrl: string
}

export interface PasswordResetData {
  email: string
  resetUrl: string
  expiresIn: string
}

export interface ExportReadyData {
  businessName: string
  email: string
  exportType: string
  downloadUrl: string
  expiresAt: string
  imageCount: number
}

export interface TrialEndingData {
  businessName: string
  email: string
  daysRemaining: number
  upgradeUrl: string
}

export interface TrialExpiredData {
  businessName: string
  email: string
  upgradeUrl: string
}
