/**
 * Security Utilities Index
 *
 * Central export for all security-related utilities.
 */

// Rate limiting
export {
  checkRateLimit,
  getRateLimitHeaders,
  rateLimitedResponse,
  RATE_LIMITS,
  type RateLimitKey,
} from './rate-limit'

// Safe logging
export {
  createLogger,
  safeLog,
  safeError,
  aiLogger,
  authLogger,
  billingLogger,
  uploadLogger,
  socialLogger,
  apiLogger,
} from './safe-logger'

// Environment validation
export {
  requireEnv,
  getEnv,
  optionalEnv,
  requireEnvs,
  hasEnv,
  getBoolEnv,
  getNumEnv,
  validateCriticalEnvs,
  supabaseConfig,
  stripeConfig,
  aiConfig,
  facebookConfig,
} from './env-validator'

// Input validation schemas
export {
  // Schemas
  uuidSchema,
  emailSchema,
  urlSchema,
  enhanceRequestSchema,
  captionRequestSchema,
  generateRequestSchema,
  uploadMetadataSchema,
  socialPostRequestSchema,
  checkoutRequestSchema,
  creditsRequestSchema,
  businessSettingsSchema,
  autoTopUpSettingsSchema,
  // Types
  type EnhanceRequest,
  type CaptionRequest,
  type GenerateRequest,
  type UploadMetadata,
  type SocialPostRequest,
  type CheckoutRequest,
  type CreditsRequest,
  type BusinessSettings,
  type AutoTopUpSettings,
  // Helpers
  validateInput,
  validationErrorResponse,
  type ValidationResult,
} from './input-schemas'
