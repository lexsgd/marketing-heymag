/**
 * Input Validation Schemas
 *
 * Zod schemas for validating API request bodies.
 * Use these to validate input before processing.
 */

import { z } from 'zod'

// =============================================================================
// Common Schemas
// =============================================================================

export const uuidSchema = z.string().uuid('Invalid UUID format')

export const emailSchema = z.string().email('Invalid email format')

export const urlSchema = z.string().url('Invalid URL format')

// =============================================================================
// AI Enhancement Schemas
// =============================================================================

export const enhanceRequestSchema = z.object({
  imageId: uuidSchema,
  stylePreset: z.string().max(100).optional(),
  styleIds: z.array(z.string().max(50)).max(10).optional(),
  customPrompt: z.string().max(2000).optional(),
  templateId: z.string().max(100).optional(),
  templateUrl: urlSchema.optional(),
})

export type EnhanceRequest = z.infer<typeof enhanceRequestSchema>

// =============================================================================
// AI Caption Schemas
// =============================================================================

export const captionRequestSchema = z.object({
  imageId: uuidSchema,
  language: z.enum(['en', 'zh', 'ms', 'th', 'vi', 'id']).default('en'),
  tone: z.enum(['professional', 'casual', 'fun', 'luxury']).default('professional'),
  platform: z.enum(['instagram', 'facebook', 'tiktok', 'xiaohongshu', 'wechat', 'general']).default('general'),
  includeHashtags: z.boolean().default(true),
  maxLength: z.number().int().min(50).max(2000).default(300),
})

export type CaptionRequest = z.infer<typeof captionRequestSchema>

// =============================================================================
// AI Generate Schemas
// =============================================================================

export const generateRequestSchema = z.object({
  prompt: z.string().min(10).max(2000),
  style: z.string().max(100).optional(),
  aspectRatio: z.enum(['1:1', '16:9', '9:16', '4:3', '3:4']).default('1:1'),
  variations: z.number().int().min(1).max(4).default(1),
})

export type GenerateRequest = z.infer<typeof generateRequestSchema>

// =============================================================================
// Image Upload Schemas
// =============================================================================

export const uploadMetadataSchema = z.object({
  stylePreset: z.string().max(100).optional(),
  styleIds: z.array(z.string()).max(10).optional(),
  templateId: z.string().max(100).optional(),
  templateUrl: urlSchema.optional(),
})

export type UploadMetadata = z.infer<typeof uploadMetadataSchema>

// =============================================================================
// Social Posting Schemas
// =============================================================================

export const socialPostRequestSchema = z.object({
  imageId: uuidSchema,
  caption: z.string().max(5000),
  platforms: z.array(z.enum(['instagram', 'facebook', 'tiktok', 'xiaohongshu', 'wechat'])).min(1).max(5),
  scheduledAt: z.string().datetime().optional(),
})

export type SocialPostRequest = z.infer<typeof socialPostRequestSchema>

// =============================================================================
// Stripe/Billing Schemas
// =============================================================================

export const checkoutRequestSchema = z.object({
  priceId: z.string().min(1),
  successUrl: urlSchema.optional(),
  cancelUrl: urlSchema.optional(),
})

export type CheckoutRequest = z.infer<typeof checkoutRequestSchema>

export const creditsRequestSchema = z.object({
  packId: z.string().regex(/^pack_\d+$/),
})

export type CreditsRequest = z.infer<typeof creditsRequestSchema>

// =============================================================================
// Settings Schemas
// =============================================================================

export const businessSettingsSchema = z.object({
  business_name: z.string().min(1).max(100).optional(),
  email: emailSchema.optional(),
  phone: z.string().max(20).optional(),
  address: z.string().max(500).optional(),
  timezone: z.string().max(50).optional(),
})

export type BusinessSettings = z.infer<typeof businessSettingsSchema>

export const autoTopUpSettingsSchema = z.object({
  enabled: z.boolean(),
  threshold: z.number().int().min(1).max(100).optional(),
  packId: z.string().regex(/^pack_\d+$/).optional(),
})

export type AutoTopUpSettings = z.infer<typeof autoTopUpSettingsSchema>

// =============================================================================
// Validation Helper
// =============================================================================

export interface ValidationResult<T> {
  success: boolean
  data?: T
  error?: {
    message: string
    details: z.ZodIssue[]
  }
}

/**
 * Validate input against a schema
 * Returns a standardized result object
 */
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  input: unknown
): ValidationResult<T> {
  const result = schema.safeParse(input)

  if (result.success) {
    return { success: true, data: result.data }
  }

  return {
    success: false,
    error: {
      message: 'Validation failed',
      details: result.error.errors,
    },
  }
}

/**
 * Create a validation error response
 */
export function validationErrorResponse(error: { message: string; details: z.ZodIssue[] }) {
  return new Response(
    JSON.stringify({
      error: error.message,
      details: error.details.map(issue => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    }),
    {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    }
  )
}
