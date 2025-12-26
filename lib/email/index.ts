/**
 * Zazzles Email Service
 * @description Main export file for email functionality
 */

// Core service
export {
  sendEmail,
  sendWelcomeEmail,
  sendPurchaseConfirmationEmail,
  sendSubscriptionActivatedEmail,
  sendSubscriptionCancelledEmail,
  sendCreditsAddedEmail,
  sendLowCreditsWarningEmail,
  sendPasswordResetEmail,
  sendExportReadyEmail,
  sendCreditsExhaustedEmail,
  isEmailConfigured,
  DEFAULT_FROM_EMAIL,
  DEFAULT_FROM_NAME,
} from './email-service'

// Templates (for preview/testing)
export {
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

// Types
export type {
  EmailTemplate,
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
