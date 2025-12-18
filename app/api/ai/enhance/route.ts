import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { stylePrompts as sharedStylePrompts, defaultPrompt, getStylePrompt, getPlatformConfig, type PlatformImageConfig } from '@/lib/style-prompts'
import { getMultiStylePrompt, parseStyleIds } from '@/lib/multi-style-prompt-builder'
import { checkAndExecuteAutoTopUp } from '@/lib/auto-topup'
import {
  checkRateLimit,
  rateLimitedResponse,
  getRateLimitHeaders,
  aiLogger as logger,
  enhanceRequestSchema,
  validateInput,
  validationErrorResponse,
} from '@/lib/security'
// Sharp is dynamically imported to handle platform-specific binary issues on Vercel
// import sharp from 'sharp'

// Use Node.js runtime (not Edge) for Google AI SDK
export const runtime = 'nodejs'

// Hybrid Enhancement Architecture:
// Step 1: Sharp applies deterministic color/lighting adjustments (100% preservation)
// Step 2: Gemini 3 Pro Image adds AI-powered professional polish (with strict preservation prompts)
// This ensures original food content is ALWAYS preserved while adding professional quality

// Lazy Sharp initialization to handle Vercel deployment issues
// Sharp type - using dynamic import type
type SharpModule = typeof import('sharp')
let sharpInstance: SharpModule | null = null
let sharpLoadError: Error | null = null

async function getSharp(): Promise<SharpModule | null> {
  if (sharpLoadError) {
    logger.debug('Sharp previously failed to load', { error: sharpLoadError.message })
    return null
  }
  if (sharpInstance) {
    return sharpInstance
  }
  try {
    // Use require with try-catch to avoid webpack resolution errors
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    sharpInstance = require('sharp') as SharpModule
    logger.info('Sharp loaded successfully')
    return sharpInstance
  } catch (error) {
    sharpLoadError = error as Error
    logger.warn('Failed to load Sharp (platform binary issue)', { error: sharpLoadError.message })
    return null
  }
}

// Extend timeout to 60 seconds (requires Vercel Pro, falls back to 10s on Hobby)
export const maxDuration = 60

// Simple GET handler to test if route is loaded
export async function GET() {
  logger.debug('GET health check called')
  return NextResponse.json({
    status: 'ok',
    message: 'Enhance API route is loaded',
    runtime: 'nodejs',
    timestamp: new Date().toISOString()
  })
}

// Lazy initialization of Google AI client
let genAI: GoogleGenerativeAI | null = null

function getGoogleAI(): GoogleGenerativeAI {
  if (!genAI) {
    const apiKey = process.env.GOOGLE_AI_API_KEY
    if (!apiKey) {
      logger.error('CRITICAL: GOOGLE_AI_API_KEY is not set!')
      throw new Error('Google AI API key is not configured')
    }
    logger.info('Initializing Google AI client')
    genAI = new GoogleGenerativeAI(apiKey)
  }
  return genAI
}

// ═══════════════════════════════════════════════════════════════════════════
// RETRY LOGIC FOR GEMINI 3 PRO IMAGE
// Handles 503 "model overloaded" errors with exponential backoff
// ═══════════════════════════════════════════════════════════════════════════

interface RetryConfig {
  maxRetries: number
  baseDelayMs: number
  maxDelayMs: number
  backoffMultiplier: number
}

const GEMINI_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,           // 3 attempts total (fits in 60s Vercel limit)
  baseDelayMs: 2000,       // Start with 2 second delay (fast retries)
  maxDelayMs: 5000,        // Cap at 5 seconds
  backoffMultiplier: 2,    // Exponential backoff: 2s -> 4s
}

// Per-request timeout for Gemini API calls
// This prevents hanging on slow/overloaded model responses
const GEMINI_REQUEST_TIMEOUT_MS = 18000 // 18 seconds per attempt

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Timeout wrapper using Promise.race
// This ensures each API call fails fast instead of hanging
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`TIMEOUT: ${errorMessage}`)), timeoutMs)
    )
  ])
}

function isRetryableError(error: unknown): boolean {
  const errorMessage = String(error).toLowerCase()

  // 503 Service Unavailable - model overloaded
  if (errorMessage.includes('503') || errorMessage.includes('service unavailable')) {
    return true
  }
  // 429 Too Many Requests - rate limited
  if (errorMessage.includes('429') || errorMessage.includes('too many requests')) {
    return true
  }
  // Our custom timeout wrapper
  if (errorMessage.includes('timeout')) {
    return true
  }
  // Connection issues
  if (errorMessage.includes('etimedout') || errorMessage.includes('econnreset')) {
    return true
  }
  // Model temporarily unavailable
  if (errorMessage.includes('overloaded') || errorMessage.includes('temporarily unavailable')) {
    return true
  }
  // Network errors
  if (errorMessage.includes('fetch failed') || errorMessage.includes('network')) {
    return true
  }

  return false
}

async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  operationName: string,
  config: RetryConfig = GEMINI_RETRY_CONFIG
): Promise<T> {
  let lastError: unknown
  let delayMs = config.baseDelayMs

  for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
    try {
      logger.debug(`${operationName}: Attempt ${attempt}/${config.maxRetries}`)
      const startTime = Date.now()
      const result = await operation()
      const duration = ((Date.now() - startTime) / 1000).toFixed(1)
      logger.info(`${operationName}: SUCCESS`, { duration: `${duration}s`, attempt })
      return result
    } catch (error) {
      lastError = error
      logger.warn(`${operationName}: Attempt ${attempt} FAILED`, { attempt })

      // Only retry on specific error types
      if (!isRetryableError(error)) {
        logger.error(`${operationName}: Non-retryable error, failing immediately`, error as Error)
        throw error
      }

      if (attempt < config.maxRetries) {
        logger.debug(`${operationName}: Waiting before retry`, { delay: `${(delayMs / 1000).toFixed(1)}s` })
        await sleep(delayMs)
        // Calculate next delay with exponential backoff
        delayMs = Math.min(delayMs * config.backoffMultiplier, config.maxDelayMs)
      }
    }
  }

  logger.error(`${operationName}: All ${config.maxRetries} attempts failed`, lastError as Error)
  throw lastError
}

// Style prompts are now imported from '@/lib/style-prompts' for shared access with client components
// The getStylePrompt function handles custom prompt overrides

// Apply image enhancements using Sharp (with fallback if Sharp unavailable)
async function applyEnhancements(
  imageBuffer: Buffer,
  enhancements: {
    brightness?: number
    contrast?: number
    saturation?: number
    warmth?: number
    sharpness?: number
    highlights?: number
    shadows?: number
  }
): Promise<Buffer | null> {
  const sharp = await getSharp()
  if (!sharp) {
    logger.warn('Sharp not available, skipping image processing')
    return null // Return null to indicate processing was skipped
  }

  let image = sharp(imageBuffer)

  // Get image metadata for format detection
  const metadata = await image.metadata()
  const format = metadata.format || 'jpeg'

  // Apply brightness and contrast using linear transformation
  // brightness: -100 to 100 maps to multiplier 0.5 to 1.5
  // contrast: -100 to 100 maps to multiplier 0.5 to 1.5
  const brightness = enhancements.brightness || 0
  const contrast = enhancements.contrast || 0

  const brightnessMultiplier = 1 + (brightness / 200) // -100 -> 0.5, 0 -> 1, 100 -> 1.5
  const contrastMultiplier = 1 + (contrast / 200)

  // Apply linear transformation for brightness/contrast
  image = image.linear(
    contrastMultiplier * brightnessMultiplier, // a coefficient
    (1 - contrastMultiplier) * 128 // b offset for contrast centering
  )

  // Apply saturation
  // saturation: -100 to 100 maps to 0 to 2
  const saturation = enhancements.saturation || 0
  const saturationValue = 1 + (saturation / 100) // -100 -> 0, 0 -> 1, 100 -> 2
  image = image.modulate({
    saturation: Math.max(0, saturationValue)
  })

  // Apply warmth (color temperature)
  // Positive warmth adds yellow/orange, negative adds blue
  const warmth = enhancements.warmth || 0
  if (warmth !== 0) {
    // Create a subtle tint effect
    const tintR = warmth > 0 ? Math.min(255, 128 + warmth) : 128
    const tintB = warmth < 0 ? Math.min(255, 128 - warmth) : 128
    image = image.tint({ r: tintR, g: 128, b: tintB })
  }

  // Apply sharpness
  // sharpness: 0 to 100 maps to sigma 0 to 2
  const sharpness = enhancements.sharpness || 0
  if (sharpness > 0) {
    const sigma = (sharpness / 100) * 1.5 + 0.5 // 0 -> 0.5, 100 -> 2
    image = image.sharpen({ sigma })
  }

  // Apply gamma for highlights/shadows adjustment
  const highlights = enhancements.highlights || 0
  const shadows = enhancements.shadows || 0

  if (highlights !== 0 || shadows !== 0) {
    // Gamma < 1 brightens shadows, > 1 darkens them
    // We use a subtle adjustment range
    const gamma = 1 - (shadows / 500) + (highlights / 500) // subtle range 0.8 to 1.2
    image = image.gamma(Math.max(0.5, Math.min(2.5, gamma)))
  }

  // Output in the same format, with high quality
  if (format === 'png') {
    return image.png({ quality: 90 }).toBuffer()
  } else if (format === 'webp') {
    return image.webp({ quality: 90 }).toBuffer()
  } else {
    return image.jpeg({ quality: 90, mozjpeg: true }).toBuffer()
  }
}

export async function POST(request: NextRequest) {
  logger.info('API called')

  try {
    // Rate limiting check
    const identifier = request.headers.get('x-forwarded-for') || 'anonymous'
    const rateLimitResult = await checkRateLimit(identifier, 'ai-enhance')
    if (!rateLimitResult.success) {
      logger.warn('Rate limit exceeded', { identifier })
      return rateLimitedResponse(rateLimitResult)
    }

    // Parse and validate request body
    let body
    try {
      body = await request.json()
      logger.debug('Request body received', { hasImageId: !!body?.imageId, hasStylePreset: !!body?.stylePreset })
    } catch (parseError) {
      logger.warn('Failed to parse request body')
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    // Validate input with Zod schema
    const validation = validateInput(enhanceRequestSchema, body)
    if (!validation.success) {
      logger.warn('Input validation failed', { errors: validation.error?.details })
      return validationErrorResponse(validation.error!)
    }

    const { imageId, stylePreset, styleIds, customPrompt } = validation.data!

    // imageId is required by schema, but double-check for safety
    if (!imageId) {
      logger.warn('Missing imageId after validation')
      return NextResponse.json({ error: 'Image ID is required' }, { status: 400 })
    }

    // Log style selection details
    const styleIdsArray = styleIds || (stylePreset ? stylePreset.split(',') : [])
    logger.info('Processing image', {
      imageId,
      stylePreset,
      styleCount: styleIdsArray.length,
      hasCustomPrompt: !!customPrompt
    })

    // Get authenticated user
    const supabase = await createClient()
    logger.debug('Supabase client created')

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      logger.error('Auth error', authError)
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get business
    logger.debug('Looking up business')
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()

    if (businessError) {
      logger.error('Business lookup error', businessError)
    }

    if (!business) {
      logger.warn('Business not found')
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }
    logger.debug('Found business')

    // Get image record
    logger.debug('Fetching image record')
    const { data: image, error: imageError } = await supabase
      .from('images')
      .select('*')
      .eq('id', imageId)
      .eq('business_id', business.id)
      .single()

    if (imageError) {
      logger.error('Image fetch error', imageError)
    }

    if (imageError || !image) {
      logger.warn('Image not found')
      return NextResponse.json({ error: 'Image not found' }, { status: 404 })
    }
    logger.debug('Found image')

    // Check credits
    logger.debug('Checking credits')
    const { data: credits, error: creditsError } = await supabase
      .from('credits')
      .select('credits_remaining, credits_used')
      .eq('business_id', business.id)
      .single()

    if (creditsError) {
      logger.error('Credits lookup error', creditsError)
    }

    if (!credits || credits.credits_remaining < 1) {
      logger.warn('Insufficient credits', { remaining: credits?.credits_remaining || 0 })
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 })
    }
    logger.debug('Credits available', { remaining: credits.credits_remaining })

    // Update image status to processing
    logger.debug('Updating status to processing')
    const { error: updateError } = await supabase
      .from('images')
      .update({ status: 'processing' })
      .eq('id', imageId)

    if (updateError) {
      logger.error('Failed to update status', updateError)
    } else {
      logger.debug('Status updated to processing')
    }

    // Use service role for storage and credit operations
    const serviceSupabase = createServiceRoleClient()
    let currentStep = 'initialization'

    try {
      // Get the style prompt using multi-style builder (custom prompt takes priority if provided)
      currentStep = 'getting style prompt'
      let stylePrompt: string
      if (customPrompt) {
        // Custom prompt overrides everything
        stylePrompt = customPrompt
        logger.debug('Using custom prompt (user override)')
      } else if (styleIds && Array.isArray(styleIds) && styleIds.length > 0) {
        // Use multi-style prompt builder for array of style IDs
        stylePrompt = getMultiStylePrompt(stylePreset || 'delivery', JSON.stringify(styleIds))
        logger.debug('Using multi-style prompt', { count: styleIds.length })
      } else if (stylePreset && stylePreset.includes(',')) {
        // Fallback: Parse comma-separated stylePreset
        stylePrompt = getMultiStylePrompt(stylePreset)
        logger.debug('Using comma-separated multi-style prompt', { count: stylePreset.split(',').length })
      } else {
        // Single style or template - use legacy method
        stylePrompt = getStylePrompt(stylePreset || 'delivery', undefined)
        logger.debug('Using single style prompt', { style: stylePreset || 'delivery' })
      }

      // Fetch the original image
      currentStep = 'fetching original image'
      logger.debug('Fetching original image')
      const imageResponse = await fetch(image.original_url)

      if (!imageResponse.ok) {
        logger.error('Failed to fetch image', undefined, { status: imageResponse.status })
        throw new Error(`Failed to fetch image: ${imageResponse.status}`)
      }
      logger.debug('Image fetched successfully')

      currentStep = 'converting image to buffer'
      const imageArrayBuffer = await imageResponse.arrayBuffer()
      const imageBuffer = Buffer.from(imageArrayBuffer)
      logger.debug('Image buffer ready', { size: imageBuffer.length })

      currentStep = 'encoding image to base64'
      const base64Image = imageBuffer.toString('base64')
      const mimeType = image.mime_type || 'image/jpeg'
      logger.debug('Image prepared for AI', { mimeType })

      // HYBRID ENHANCEMENT PIPELINE
      // Step 1: Sharp base enhancement (100% content preservation guaranteed)
      // Step 2: Gemini 3 Pro Image AI polish (professional style enhancement)

      let enhancedUrl: string | null = null
      let processingSkipped = false
      let aiSuggestions: string[] = []
      let enhancementMethod = 'unknown'
      const defaultEnhancements = getDefaultEnhancements(stylePreset || 'delivery')

      // ═══════════════════════════════════════════════════════════════════════════
      // STEP 1: Sharp Base Enhancement (Guaranteed Content Preservation)
      // ═══════════════════════════════════════════════════════════════════════════
      currentStep = 'applying Sharp base enhancement'
      logger.info('STEP 1: Applying Sharp base enhancement')

      let sharpEnhancedBuffer: Buffer | null = null
      let sharpEnhancedBase64: string | null = null

      sharpEnhancedBuffer = await applyEnhancements(imageBuffer, defaultEnhancements.enhancements)

      if (sharpEnhancedBuffer) {
        sharpEnhancedBase64 = sharpEnhancedBuffer.toString('base64')
        logger.debug('Sharp enhancement complete', { size: sharpEnhancedBuffer.length })
        enhancementMethod = 'sharp'
      } else {
        // If Sharp fails, use original image for next step
        sharpEnhancedBase64 = base64Image
        logger.debug('Sharp unavailable, using original for AI step')
      }

      // ═══════════════════════════════════════════════════════════════════════════
      // STEP 2: Gemini 3 Pro Image AI Polish (Professional Enhancement)
      // ═══════════════════════════════════════════════════════════════════════════
      currentStep = 'initializing Gemini 3 Pro Image'
      logger.info('STEP 2: Applying Gemini 3 Pro Image AI polish')

      // Get platform-specific image configuration
      // For multi-style, use delivery platform if set, otherwise first social platform, otherwise first style
      let primaryStyleForConfig = stylePreset
      if (styleIds && Array.isArray(styleIds) && styleIds.length > 0) {
        // Parse to find delivery or social platform for config
        const selection = parseStyleIds(styleIds.join(','))
        primaryStyleForConfig = selection.delivery || selection.social?.[0] || styleIds[0]
      }
      const platformConfig = getPlatformConfig(primaryStyleForConfig || 'delivery')
      logger.debug('Platform config', { from: primaryStyleForConfig, aspectRatio: platformConfig.aspectRatio })

      try {
        // Use Gemini 3 Pro Image (Nano Banana Pro) - premium image generation
        // Features: Superior quality, professional food photography enhancement
        // Note: Has 503 "model overloaded" issues, using retry logic with exponential backoff
        // Required config per docs: temperature=1.0, responseModalities=['Text', 'Image']
        const model = getGoogleAI().getGenerativeModel({
          model: 'gemini-3-pro-image-preview', // Nano Banana Pro - premium quality
          // Gemini 3 Pro Image requires responseModalities - cast to bypass SDK types
          generationConfig: {
            responseModalities: ['Text', 'Image'],
            temperature: 1.0, // Required for Gemini 3 Pro Image generation
          } as unknown as import('@google/generative-ai').GenerationConfig
        })

        currentStep = 'calling Gemini API with preservation prompt'
        logger.debug('Calling Gemini with strict preservation prompt', { aspectRatio: platformConfig.aspectRatio })

        // CRITICAL: Research-backed prompt for maximum content preservation
        // Based on Google's official documentation and best practices for Nano Banana Pro
        // Reference: https://ai.google.dev/gemini-api/docs/gemini-3
        const preservationPrompt = `You are a professional food photo RETOUCHER. This image has already been color-corrected.

ABSOLUTE PRESERVATION RULES (VIOLATION = FAILURE):
1. Keep the EXACT SAME food items visible in the image
2. Keep the EXACT SAME plates, bowls, containers
3. Keep the EXACT SAME composition and arrangement
4. Keep the EXACT SAME camera angle and perspective
5. Do NOT replace any food with different food
6. Do NOT change what is being photographed

OUTPUT SPECIFICATIONS:
- Aspect Ratio: ${platformConfig.aspectRatio} (${platformConfig.description})
- Resolution: ${platformConfig.imageSize} quality
- Platform: ${platformConfig.platformRequirements || 'General food photography'}

YOUR TASK - Apply ONLY these professional adjustments:
- Professional ${stylePreset} style lighting simulation
- Enhance food texture micro-details (steam, glossiness, crispy elements)
- Apply ${stylePreset}-specific color grading while preserving natural food colors
- Sharpen texture details for appetizing appearance
- Improve overall professional quality suitable for ${platformConfig.description}

STYLE REFERENCE: ${stylePrompt}

PHOTOGRAPHY TECHNIQUE:
- Use soft diffused lighting for appetizing highlights
- Enhance natural food colors without oversaturation
- Add subtle depth through shadow/highlight balance
- Maintain authentic, real appearance (not artificial)

VERIFICATION CHECKLIST (satisfy ALL before outputting):
✓ Same food items as input
✓ Same dishes/plates as input
✓ Same arrangement as input
✓ Same camera angle as input
✓ Only lighting/color/texture enhanced
✓ Output matches ${platformConfig.aspectRatio} aspect ratio

OUTPUT: Return the enhanced version of THIS EXACT photo. Preserve subject fidelity.

After enhancement, provide 3 tips in format:
SUGGESTIONS: [tip1] | [tip2] | [tip3]`

        // Wrap Gemini API call with retry logic AND per-request timeout
        // - Timeout: 18s per attempt (prevents hanging on overloaded model)
        // - Retries: 3 attempts with 2s -> 4s delays
        // - Total max time: ~18*3 + 6 = ~60s (fits Vercel limit)
        const result = await retryWithBackoff(
          async () => {
            // Add timeout to prevent hanging on slow model responses
            return await withTimeout(
              model.generateContent([
                {
                  inlineData: {
                    mimeType,
                    data: sharpEnhancedBase64 // Use Sharp-enhanced image as input
                  }
                },
                { text: preservationPrompt }
              ]),
              GEMINI_REQUEST_TIMEOUT_MS,
              `Gemini 3 Pro Image request exceeded ${GEMINI_REQUEST_TIMEOUT_MS / 1000}s`
            )
          },
          'Gemini 3 Pro Image',
          GEMINI_RETRY_CONFIG
        )

        currentStep = 'processing Gemini response'
        const response = await result.response

        // Extract enhanced image and suggestions
        let aiEnhancedBuffer: Buffer | null = null

        for (const candidate of response.candidates || []) {
          for (const part of candidate.content?.parts || []) {
            if (part.text) {
              logger.debug('AI text response received')
              const suggestionsMatch = part.text.match(/SUGGESTIONS:\s*(.+)/i)
              if (suggestionsMatch) {
                aiSuggestions = suggestionsMatch[1].split('|').map((s: string) => s.trim()).filter((s: string) => s)
              }
            }
            if (part.inlineData?.data) {
              logger.debug('AI returned image', { mime: part.inlineData.mimeType })
              aiEnhancedBuffer = Buffer.from(part.inlineData.data, 'base64')
              logger.debug('AI enhanced buffer ready', { size: aiEnhancedBuffer.length })
            }
          }
        }

        if (aiEnhancedBuffer) {
          // Upload AI-polished image
          currentStep = 'uploading AI-enhanced image'
          const enhancedFileName = `${business.id}/enhanced/${Date.now()}.png`
          logger.debug('Uploading hybrid-enhanced image')

          const { error: uploadError } = await serviceSupabase.storage
            .from('images')
            .upload(enhancedFileName, aiEnhancedBuffer, {
              contentType: 'image/png',
              cacheControl: '3600',
              upsert: false
            })

          if (!uploadError) {
            const urlData = serviceSupabase.storage.from('images').getPublicUrl(enhancedFileName)
            enhancedUrl = urlData.data.publicUrl
            enhancementMethod = 'hybrid-sharp-gemini'
            logger.info('Hybrid enhancement successful')
          } else {
            logger.error('Upload error', uploadError)
          }
        }
      } catch (aiError) {
        logger.error('Gemini API error', aiError as Error)
        logger.debug('Using Sharp-only enhancement as fallback')
      }

      // ═══════════════════════════════════════════════════════════════════════════
      // FALLBACK: Use Sharp-only result if AI didn't work
      // ═══════════════════════════════════════════════════════════════════════════
      if (!enhancedUrl && sharpEnhancedBuffer) {
        currentStep = 'uploading Sharp-only enhancement'
        logger.debug('Using Sharp-only enhancement (AI unavailable)')

        const fileExt = image.original_filename?.split('.').pop() || 'jpg'
        const enhancedFileName = `${business.id}/enhanced/${Date.now()}.${fileExt}`

        const { error: uploadError } = await serviceSupabase.storage
          .from('images')
          .upload(enhancedFileName, sharpEnhancedBuffer, {
            contentType: mimeType,
            cacheControl: '3600',
            upsert: false
          })

        if (!uploadError) {
          const urlData = serviceSupabase.storage.from('images').getPublicUrl(enhancedFileName)
          enhancedUrl = urlData.data.publicUrl
          enhancementMethod = 'sharp-only'
          logger.info('Sharp-only enhancement uploaded successfully')
        }
      }

      // Final fallback to original
      if (!enhancedUrl) {
        enhancedUrl = image.original_url
        processingSkipped = true
        enhancementMethod = 'skipped'
        logger.debug('Using original image (all processing skipped)')
      }

      // Build enhancement data for database
      const enhancementData = {
        enhancements: {
          ...defaultEnhancements.enhancements,
          method: enhancementMethod,
          stylePreset: stylePreset,
          pipeline: 'hybrid-v1' // Track pipeline version
        },
        suggestions: aiSuggestions.length > 0 ? aiSuggestions : defaultEnhancements.suggestions
      }

      // Update image record with enhanced URL (or original if processing skipped)
      currentStep = 'updating image record'
      logger.debug('Updating image record')
      const { error: imageUpdateError } = await supabase
        .from('images')
        .update({
          status: 'completed',
          enhanced_url: enhancedUrl,
          enhancement_settings: enhancementData.enhancements,
          processed_at: new Date().toISOString(),
          ai_model: enhancementMethod === 'hybrid-sharp-gemini' ? 'hybrid-sharp+gemini-3-pro-image' : (enhancementMethod === 'sharp-only' ? 'sharp-processing' : 'skipped'),
          ai_suggestions: enhancementData.suggestions,
          // Note: processing_skipped is returned in API response but not stored in DB
        })
        .eq('id', imageId)

      if (imageUpdateError) {
        logger.error('Image update error', imageUpdateError)
      } else {
        logger.debug('Image record updated successfully')
      }

      // Deduct credit
      currentStep = 'deducting credits'
      logger.debug('Deducting credit')
      const { error: creditUpdateError } = await serviceSupabase
        .from('credits')
        .update({
          credits_remaining: credits.credits_remaining - 1,
          credits_used: credits.credits_used + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('business_id', business.id)

      if (creditUpdateError) {
        logger.error('Credit update error', creditUpdateError)
      }

      // Log credit transaction
      const { error: transactionError } = await serviceSupabase
        .from('credit_transactions')
        .insert({
          business_id: business.id,
          amount: -1,
          transaction_type: 'usage',
          description: `Image enhancement - ${stylePreset} style`,
          image_id: imageId,
          balance_after: credits.credits_remaining - 1,
        })

      if (transactionError) {
        logger.error('Transaction log error', transactionError)
      }

      // Check and execute auto top-up if needed
      const newBalance = credits.credits_remaining - 1
      checkAndExecuteAutoTopUp(business.id).then(result => {
        if (result.success && result.creditsAdded) {
          logger.info('Auto top-up triggered', { creditsAdded: result.creditsAdded })
        } else if (!result.success && result.error) {
          logger.debug('Auto top-up check', { reason: result.error })
        }
      }).catch(err => {
        logger.error('Auto top-up error', err)
      })

      logger.info('Enhancement complete', { method: enhancementMethod, processingSkipped })
      return NextResponse.json({
        success: true,
        imageId,
        enhancedUrl,
        enhancements: enhancementData,
        creditsRemaining: credits.credits_remaining - 1,
        processingSkipped, // If true, client should apply enhancements using the settings
      })
    } catch (aiError: unknown) {
      const errorMessage = (aiError as Error).message || 'Unknown error'
      logger.error('AI Enhancement error', aiError as Error, { step: currentStep })

      // Update image status to failed
      await supabase
        .from('images')
        .update({
          status: 'failed',
          error_message: `${currentStep}: ${errorMessage}`,
        })
        .eq('id', imageId)

      // In production, hide technical details from response
      const isProduction = process.env.NODE_ENV === 'production'
      return NextResponse.json(
        {
          error: 'AI enhancement failed',
          ...(isProduction
            ? { message: 'Please try again or contact support if the issue persists.' }
            : { failedAtStep: currentStep, details: errorMessage })
        },
        { status: 500 }
      )
    }
  } catch (error: unknown) {
    logger.error('Enhance API error', error as Error)
    const isProduction = process.env.NODE_ENV === 'production'
    return NextResponse.json(
      {
        error: isProduction
          ? 'Internal server error'
          : (error as Error).message || 'Internal server error'
      },
      { status: 500 }
    )
  }
}

// Get style-appropriate default enhancements
function getDefaultEnhancements(stylePreset: string) {
  const defaults: Record<string, { enhancements: Record<string, number>, suggestions: string[], styleMatch: number, overallRating: number }> = {
    // SEA Delivery Platforms
    'grab': {
      enhancements: { brightness: 18, contrast: 22, saturation: 40, warmth: 8, sharpness: 55, highlights: -5, shadows: 18 },
      suggestions: ['Optimize for GrabFood green branding', 'Maximum appetizing appeal', 'Clean bright background'],
      styleMatch: 88, overallRating: 8
    },
    'foodpanda': {
      enhancements: { brightness: 20, contrast: 25, saturation: 45, warmth: 5, sharpness: 55, highlights: 0, shadows: 15 },
      suggestions: ['High saturation for Foodpanda', 'Vibrant colors pop', 'Professional studio look'],
      styleMatch: 88, overallRating: 8
    },
    'deliveroo': {
      enhancements: { brightness: 15, contrast: 20, saturation: 35, warmth: -3, sharpness: 50, highlights: -5, shadows: 12 },
      suggestions: ['Premium restaurant quality', 'Teal-friendly tones', 'Clean modern aesthetic'],
      styleMatch: 88, overallRating: 8
    },
    'gojek': {
      enhancements: { brightness: 18, contrast: 20, saturation: 38, warmth: 10, sharpness: 50, highlights: 0, shadows: 15 },
      suggestions: ['GoFood Indonesia style', 'Warm approachable feel', 'Local cuisine appeal'],
      styleMatch: 85, overallRating: 8
    },
    'shopee': {
      enhancements: { brightness: 20, contrast: 25, saturation: 50, warmth: 12, sharpness: 55, highlights: 5, shadows: 18 },
      suggestions: ['ShopeeFood orange tones', 'High impact scroll-stopper', 'Marketplace optimized'],
      styleMatch: 88, overallRating: 8
    },
    'delivery': {
      enhancements: { brightness: 15, contrast: 20, saturation: 35, warmth: 8, sharpness: 50, highlights: -5, shadows: 15 },
      suggestions: ['Universal delivery app style', 'Clean background', 'Maximum appetizing appeal'],
      styleMatch: 85, overallRating: 8
    },

    // Social Media
    'instagram': {
      enhancements: { brightness: 10, contrast: 15, saturation: 40, warmth: 10, sharpness: 45, highlights: 0, shadows: 10 },
      suggestions: ['Boost colors for feed visibility', 'Add warm tones', 'Enhance food texture'],
      styleMatch: 85, overallRating: 8
    },
    'instagram-stories': {
      enhancements: { brightness: 15, contrast: 18, saturation: 45, warmth: 8, sharpness: 50, highlights: 5, shadows: 12 },
      suggestions: ['Vertical format optimized', 'Bold colors for stories', 'Eye-catching presentation'],
      styleMatch: 85, overallRating: 8
    },
    'instagram-reels': {
      enhancements: { brightness: 18, contrast: 22, saturation: 50, warmth: 5, sharpness: 55, highlights: 5, shadows: 15 },
      suggestions: ['High energy for Reels', 'Scroll-stopping impact', 'Gen-Z aesthetic'],
      styleMatch: 88, overallRating: 8
    },
    'tiktok': {
      enhancements: { brightness: 20, contrast: 25, saturation: 55, warmth: 5, sharpness: 55, highlights: 8, shadows: 18 },
      suggestions: ['Maximum scroll-stopping impact', 'TikTok trending style', 'Vibrant attention-grabbing'],
      styleMatch: 90, overallRating: 8
    },
    'facebook': {
      enhancements: { brightness: 12, contrast: 15, saturation: 30, warmth: 12, sharpness: 40, highlights: 0, shadows: 10 },
      suggestions: ['Warm inviting tone', 'Shareable quality', 'Works in varied feeds'],
      styleMatch: 85, overallRating: 8
    },
    'xiaohongshu': {
      enhancements: { brightness: 15, contrast: 10, saturation: 30, warmth: 5, sharpness: 45, highlights: 5, shadows: 10 },
      suggestions: ['Brighten for trendy look', 'Add subtle pastel tones', 'Enhance cute factor'],
      styleMatch: 85, overallRating: 8
    },
    'wechat': {
      enhancements: { brightness: 10, contrast: 15, saturation: 25, warmth: 5, sharpness: 40, highlights: 0, shadows: 8 },
      suggestions: ['Keep clean and professional', 'Balanced enhancement', 'Shareable quality'],
      styleMatch: 85, overallRating: 8
    },

    // Restaurant Styles
    'fine-dining': {
      enhancements: { brightness: -5, contrast: 25, saturation: 15, warmth: -5, sharpness: 40, highlights: -10, shadows: -5 },
      suggestions: ['Darken background for drama', 'Enhance plate details', 'Add subtle contrast'],
      styleMatch: 80, overallRating: 8
    },
    'casual': {
      enhancements: { brightness: 12, contrast: 10, saturation: 25, warmth: 15, sharpness: 35, highlights: 0, shadows: 12 },
      suggestions: ['Add warm, inviting tones', 'Soften overall look', 'Enhance comfort food appeal'],
      styleMatch: 85, overallRating: 8
    },
    'fast-food': {
      enhancements: { brightness: 18, contrast: 25, saturation: 50, warmth: 12, sharpness: 55, highlights: 5, shadows: 15 },
      suggestions: ['Maximize color impact', 'Increase energy', 'Make food look indulgent'],
      styleMatch: 85, overallRating: 8
    },
    'cafe': {
      enhancements: { brightness: 8, contrast: 12, saturation: 20, warmth: 18, sharpness: 40, highlights: -5, shadows: 8 },
      suggestions: ['Add rustic warmth', 'Enhance artisan feel', 'Soften highlights'],
      styleMatch: 85, overallRating: 8
    },
    'street-food': {
      enhancements: { brightness: 15, contrast: 20, saturation: 40, warmth: 15, sharpness: 45, highlights: 0, shadows: 15 },
      suggestions: ['Authentic hawker vibes', 'Vibrant street atmosphere', 'Real-world feel'],
      styleMatch: 85, overallRating: 8
    },
    'menu': {
      enhancements: { brightness: 10, contrast: 18, saturation: 25, warmth: 5, sharpness: 50, highlights: -5, shadows: 8 },
      suggestions: ['Clean professional look', 'Print-ready quality', 'Neutral background'],
      styleMatch: 88, overallRating: 8
    },
    'kopitiam': {
      enhancements: { brightness: 5, contrast: 15, saturation: 20, warmth: 20, sharpness: 35, highlights: -5, shadows: 5 },
      suggestions: ['Nostalgic warmth', 'Heritage feel', 'Rustic comfort'],
      styleMatch: 85, overallRating: 8
    },
    'hawker': {
      enhancements: { brightness: 12, contrast: 18, saturation: 35, warmth: 15, sharpness: 45, highlights: 0, shadows: 12 },
      suggestions: ['SEA street food culture', 'Authentic presentation', 'Casual but appetizing'],
      styleMatch: 85, overallRating: 8
    },

    // Background Styles
    'minimal': {
      enhancements: { brightness: 20, contrast: 15, saturation: 30, warmth: 0, sharpness: 55, highlights: 10, shadows: 5 },
      suggestions: ['Pure white background', 'Product focus', 'E-commerce ready'],
      styleMatch: 90, overallRating: 8
    },
    'rustic': {
      enhancements: { brightness: 8, contrast: 15, saturation: 25, warmth: 20, sharpness: 40, highlights: -5, shadows: 10 },
      suggestions: ['Warm wood tones', 'Natural organic feel', 'Artisan aesthetic'],
      styleMatch: 85, overallRating: 8
    },
    'marble': {
      enhancements: { brightness: 12, contrast: 20, saturation: 20, warmth: -5, sharpness: 50, highlights: 0, shadows: 5 },
      suggestions: ['Cool elegant tones', 'Luxury feel', 'Upscale presentation'],
      styleMatch: 88, overallRating: 8
    },
    'dark-moody': {
      enhancements: { brightness: -10, contrast: 30, saturation: 20, warmth: -5, sharpness: 45, highlights: -15, shadows: -10 },
      suggestions: ['Dramatic shadows', 'Editorial magazine style', 'Artistic presentation'],
      styleMatch: 85, overallRating: 8
    },
    'bright-airy': {
      enhancements: { brightness: 18, contrast: 10, saturation: 25, warmth: 8, sharpness: 40, highlights: 10, shadows: 15 },
      suggestions: ['Fresh light feel', 'Lifestyle magazine style', 'Healthy aesthetic'],
      styleMatch: 88, overallRating: 8
    },
    'tropical': {
      enhancements: { brightness: 15, contrast: 20, saturation: 50, warmth: 10, sharpness: 45, highlights: 5, shadows: 12 },
      suggestions: ['Vibrant tropical colors', 'Exotic beach vibes', 'Bright and fresh'],
      styleMatch: 85, overallRating: 8
    },
    'concrete': {
      enhancements: { brightness: 5, contrast: 22, saturation: 15, warmth: -5, sharpness: 50, highlights: -5, shadows: 0 },
      suggestions: ['Urban industrial feel', 'Modern edgy aesthetic', 'Trendy cafe style'],
      styleMatch: 85, overallRating: 8
    },
    'botanical': {
      enhancements: { brightness: 12, contrast: 15, saturation: 35, warmth: 5, sharpness: 45, highlights: 0, shadows: 10 },
      suggestions: ['Fresh green accents', 'Organic healthy feel', 'Natural presentation'],
      styleMatch: 85, overallRating: 8
    },

    // Photography Techniques
    'overhead': {
      enhancements: { brightness: 15, contrast: 18, saturation: 35, warmth: 8, sharpness: 50, highlights: 0, shadows: 12 },
      suggestions: ['Perfect flat lay composition', 'Full dish visibility', 'Ideal for bowls'],
      styleMatch: 88, overallRating: 8
    },
    'natural-light': {
      enhancements: { brightness: 12, contrast: 10, saturation: 25, warmth: 10, sharpness: 35, highlights: 5, shadows: 15 },
      suggestions: ['Soft diffused lighting', 'No harsh shadows', 'Gentle organic feel'],
      styleMatch: 88, overallRating: 8
    },
    'neon': {
      enhancements: { brightness: 5, contrast: 30, saturation: 60, warmth: -10, sharpness: 50, highlights: 10, shadows: 5 },
      suggestions: ['Night market vibes', 'Vibrant artificial lighting', 'Urban nightlife'],
      styleMatch: 85, overallRating: 8
    },
    'vintage': {
      enhancements: { brightness: 5, contrast: 12, saturation: 15, warmth: 25, sharpness: 30, highlights: -5, shadows: 5 },
      suggestions: ['Nostalgic sepia tones', 'Film grain effect', 'Retro heritage feel'],
      styleMatch: 85, overallRating: 8
    },
    'hdr': {
      enhancements: { brightness: 10, contrast: 35, saturation: 45, warmth: 5, sharpness: 60, highlights: -10, shadows: 20 },
      suggestions: ['Maximum detail range', 'Punchy dramatic colors', 'High impact visual'],
      styleMatch: 88, overallRating: 8
    },
    'bokeh': {
      enhancements: { brightness: 8, contrast: 18, saturation: 30, warmth: 10, sharpness: 55, highlights: 5, shadows: 8 },
      suggestions: ['Blurred background effect', 'Focus on food subject', 'Artistic restaurant feel'],
      styleMatch: 85, overallRating: 8
    },

    // Legacy
    'stories': {
      enhancements: { brightness: 15, contrast: 18, saturation: 45, warmth: 8, sharpness: 50, highlights: 5, shadows: 12 },
      suggestions: ['Vertical format optimized', 'Bold colors for stories', 'Eye-catching presentation'],
      styleMatch: 85, overallRating: 8
    },
  }

  return defaults[stylePreset] || defaults['delivery']
}
