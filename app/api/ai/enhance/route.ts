import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { stylePrompts as sharedStylePrompts, defaultPrompt, getStylePrompt, getPlatformConfig, type PlatformImageConfig } from '@/lib/style-prompts'
import { getMultiStylePrompt, parseStyleIds } from '@/lib/multi-style-prompt-builder'
import { checkAndExecuteAutoTopUp } from '@/lib/auto-topup'
import { getAngleAwareVenuePrompt, hasAngleAwareStyling, getAllAnglePrompts } from '@/lib/ai/angle-aware-styles'
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

// Sharp is disabled - not installed on Vercel
// Using 'any' because Sharp types aren't installed and this code path is never executed
type SharpInstance = any

// Sharp is not available - always returns null
async function getSharp(): Promise<SharpInstance | null> {
  // Sharp is intentionally disabled - enhancement uses Gemini AI only
  return null
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

      // SINGLE-CALL ENHANCEMENT PIPELINE
      // Gemini 3 Pro Image handles BOTH angle detection AND enhancement in one call
      // This reduces latency and cost (was: Flash + Pro, now: Pro only)

      let enhancedUrl: string | null = null
      let processingSkipped = false
      let aiSuggestions: string[] = []
      let enhancementMethod = 'unknown'
      let detectedAngle = 'hero' // Default, will be overwritten by AI self-detection
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
        // Note: imageConfig for 2K/4K resolution not supported in getGenerativeModel pattern
        // TODO: Upgrade to newer SDK pattern to enable 2K output

        const model = getGoogleAI().getGenerativeModel({
          model: 'gemini-3-pro-image-preview', // Nano Banana Pro - premium quality
          // Gemini 3 Pro Image requires responseModalities - cast to bypass SDK types
          generationConfig: {
            responseModalities: ['Text', 'Image'],
            temperature: 1.0, // Required for Gemini 3 Pro Image generation
          } as unknown as import('@google/generative-ai').GenerationConfig
        })

        currentStep = 'calling Gemini API with self-detecting angle-aware prompt'
        logger.debug('Calling Gemini with self-detecting angle-aware prompt', {
          style: stylePreset,
          aspectRatio: platformConfig.aspectRatio,
          platform: primaryStyleForConfig
        })

        // Build angle-aware venue styling section (all angles provided for self-selection)
        let venueStyleSection = ''
        if (stylePreset && hasAngleAwareStyling(stylePreset)) {
          venueStyleSection = getAllAnglePrompts(stylePreset)
          logger.debug('Using angle-aware venue prompts (all angles)', { venue: stylePreset })
        } else {
          // Fallback to standard style prompt
          venueStyleSection = `
STYLE ENHANCEMENT: ${stylePreset?.toUpperCase() || 'PROFESSIONAL'}
${stylePrompt}
`
        }

        // AI IMAGE ENHANCEMENT PROMPT - SELF-DETECTING ANGLE
        // Model analyzes the camera angle AND applies appropriate enhancements in ONE call
        // This eliminates the separate Flash API call, reducing latency and cost
        const generationPrompt = `You are a world-class professional food photography retoucher. Your task is to ENHANCE this existing food photograph while respecting PHYSICAL REALITY.

═══════════════════════════════════════════════════════════════════════════════
STEP 1: ANALYZE CAMERA ANGLE (Do this first!)
═══════════════════════════════════════════════════════════════════════════════

Look at the photograph and determine the camera angle:

OVERHEAD (90°) - Looking straight down:
- Camera directly above, pointing down at food
- Only TABLE SURFACE visible - no vertical backgrounds
- Plates appear as CIRCLES (not ellipses)
- NO walls, stalls, shelves, or standing elements visible
- Common for: flat lays, pizzas, spreads, bowls from above

HERO ANGLE (45°) - The classic food photography angle:
- Camera at roughly 45 degrees
- Shows food HEIGHT and DEPTH
- Table surface visible + SOFT BLURRED background
- Plates appear as ELLIPSES
- Most common food photography angle

EYE LEVEL (0°) - Camera at food level:
- Camera pointing horizontally at food
- FULL VERTICAL BACKGROUND visible
- Shows the "face" of items (burgers, cakes, stacks)
- Environment/venue details clearly visible
- Table edge may not be visible

═══════════════════════════════════════════════════════════════════════════════
PHYSICS CONSTRAINTS BY ANGLE
═══════════════════════════════════════════════════════════════════════════════

▼ IF YOU DETECT OVERHEAD:
  ✓ CAN add/enhance: Table texture, props on surface, garnishes, sauces, napkins
  ✗ CANNOT add: Vertical backgrounds, walls, stalls, standing elements, people

▼ IF YOU DETECT HERO ANGLE:
  ✓ CAN add/enhance: Table surface, soft bokeh background, food depth, gentle shadows
  ✗ CANNOT add: Sharp detailed backgrounds, readable signage, clear environment

▼ IF YOU DETECT EYE LEVEL:
  ✓ CAN add/enhance: Full background environment, venue atmosphere, vertical elements
  ✗ CANNOT add: Elements that contradict existing background

═══════════════════════════════════════════════════════════════════════════════
CRITICAL: PRESERVE THE ORIGINAL COMPOSITION
═══════════════════════════════════════════════════════════════════════════════
You MUST keep these elements EXACTLY as they are:
✗ DO NOT change the food items - enhance what's there
✗ DO NOT change the camera angle or perspective
✗ DO NOT change the plating arrangement
✗ DO NOT reposition any elements
✗ DO NOT add elements that violate the physics of the detected angle

This is a PHOTO ENHANCEMENT task, NOT a scene generation task.
The output must be clearly recognizable as the SAME photograph, just enhanced.

═══════════════════════════════════════════════════════════════════════════════
STEP 2: APPLY ANGLE-APPROPRIATE VENUE STYLING
═══════════════════════════════════════════════════════════════════════════════
${venueStyleSection}

═══════════════════════════════════════════════════════════════════════════════
STEP 3: UNIVERSAL ENHANCEMENTS (Apply to all angles)
═══════════════════════════════════════════════════════════════════════════════
✓ LIGHTING - Improve quality while keeping direction natural
✓ COLOR GRADING - Apply style-appropriate color palette
✓ SHARPNESS - Enhance food detail and texture clarity
✓ WHITE BALANCE - Correct for appetizing color temperature
✓ CONTRAST - Optimize dynamic range for visual impact
✓ FOOD APPEAL - Make food look fresher, more vibrant

SUBTLE ADDITIONS (if appropriate for the angle):
- Light steam for hot food
- Enhanced texture definition
- Gentle shadows for dimension
- Surface reflections and highlights

═══════════════════════════════════════════════════════════════════════════════
OUTPUT SPECIFICATIONS
═══════════════════════════════════════════════════════════════════════════════
- Aspect Ratio: ${platformConfig.aspectRatio} (${platformConfig.description})
- Resolution: ${platformConfig.imageSize} quality - ultra high detail
- Platform: ${platformConfig.platformRequirements || 'Professional food photography'}

═══════════════════════════════════════════════════════════════════════════════
QUALITY STANDARDS
═══════════════════════════════════════════════════════════════════════════════
1. PHYSICALLY REALISTIC - Enhancements must make spatial sense for the DETECTED angle
2. APPETIZING - Food must look irresistibly delicious
3. AUTHENTIC - Must be clearly the SAME photo, enhanced
4. NATURAL - No obvious AI artifacts or physics-breaking elements
5. PLATFORM-READY - Suitable for ${platformConfig.description}

═══════════════════════════════════════════════════════════════════════════════
ENHANCE THE IMAGE NOW
═══════════════════════════════════════════════════════════════════════════════
1. First, analyze and identify the camera angle (overhead/hero/eye-level)
2. Apply ONLY enhancements appropriate for that angle
3. NEVER add vertical backgrounds to overhead shots
4. NEVER add sharp detailed scenes to hero angle shots
5. Enhance to professional quality while preserving authenticity

The result should look like the original photo was professionally retouched, NOT like a completely different image or a physics-breaking composite.

After enhancing, respond with:
ANGLE: [detected angle] | SUGGESTIONS: [tip1] | [tip2] | [tip3]`

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
                { text: generationPrompt }
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

        // Extract enhanced image, detected angle, and suggestions
        let aiEnhancedBuffer: Buffer | null = null

        for (const candidate of response.candidates || []) {
          for (const part of candidate.content?.parts || []) {
            if (part.text) {
              logger.debug('AI text response received')
              // Parse format: ANGLE: [angle] | SUGGESTIONS: [tip1] | [tip2] | [tip3]
              const angleMatch = part.text.match(/ANGLE:\s*(\w+[-\w]*)/i)
              if (angleMatch) {
                detectedAngle = angleMatch[1].toLowerCase()
                logger.info('AI self-detected camera angle', { angle: detectedAngle })
              }
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
            logger.info('AI image enhancement successful', { style: stylePreset })
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
          detectedAngle: detectedAngle, // AI self-detected camera angle
          pipeline: 'single-call-v1' // Single Gemini call (angle detection + enhancement)
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
          ai_model: enhancementMethod === 'hybrid-sharp-gemini' ? 'gemini-3-pro-image-enhancement' : (enhancementMethod === 'sharp-only' ? 'sharp-processing' : 'skipped'),
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
// NOTE: All adjustments disabled - AI generates the final image directly
// User can manually adjust later if needed
function getDefaultEnhancements(stylePreset: string) {
  // All enhancements set to 0 (neutral/no adjustment)
  // The AI-generated image is used as-is without additional processing
  const neutralEnhancements = {
    brightness: 0,
    contrast: 0,
    saturation: 0,
    warmth: 0,
    sharpness: 0,
    highlights: 0,
    shadows: 0
  }

  // Default suggestions for all styles
  const defaultSuggestions = ['AI-generated image ready', 'Adjust manually if needed', 'Professional quality output']

  return {
    enhancements: neutralEnhancements,
    suggestions: defaultSuggestions,
    styleMatch: 90,
    overallRating: 8
  }
}
