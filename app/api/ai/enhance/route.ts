import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { stylePrompts as sharedStylePrompts, defaultPrompt, getStylePrompt, getPlatformConfig, type PlatformImageConfig } from '@/lib/style-prompts'
import { getMultiStylePrompt, parseStyleIds, buildSimplifiedPrompt } from '@/lib/multi-style-prompt-builder'
import type { SimpleSelection, BackgroundConfig } from '@/lib/simplified-styles'
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

    // Extract simpleSelection from body (not in Zod schema for backward compatibility)
    const simpleSelection = body.simpleSelection as SimpleSelection | undefined
    const aspectRatio = body.aspectRatio as string | undefined
    // Flag indicating user will apply custom background after enhancement
    const hasCustomBackground = body.hasCustomBackground as boolean | undefined
    // Background configuration for describe/upload modes
    const backgroundConfig = body.backgroundConfig as BackgroundConfig | undefined
    // Edit mode - for making modifications to already-enhanced images
    const editMode = body.editMode as boolean | undefined
    // Preserve mode - only add elements, keep everything else identical (stricter than editMode)
    const preserveMode = body.preserveMode as boolean | undefined

    // imageId is required by schema, but double-check for safety
    if (!imageId) {
      logger.warn('Missing imageId after validation')
      return NextResponse.json({ error: 'Image ID is required' }, { status: 400 })
    }

    // Log style selection details
    const hasSimpleSelection = simpleSelection && simpleSelection.businessType !== null
    const styleIdsArray = styleIds || (stylePreset ? stylePreset.split(',') : [])
    logger.info('Processing image', {
      imageId,
      stylePreset,
      styleCount: styleIdsArray.length,
      hasCustomPrompt: !!customPrompt,
      hasSimpleSelection,
      simpleSelection: hasSimpleSelection ? JSON.stringify(simpleSelection) : undefined,
      editMode: !!editMode,
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
      let simplifiedResult: ReturnType<typeof buildSimplifiedPrompt> | null = null

      // EDIT MODE: Use a special prompt for making modifications to already-enhanced images
      if (editMode && customPrompt) {
        if (preserveMode) {
          // PRESERVE MODE: Uses "Anchor & Add" prompting strategy
          // Research shows SIMPLER prompts work better - one clear sentence pattern
          // Pattern: "Edit this image to [ADD]. Keep [ANCHOR] exactly the same. Match [STYLE]."

          // Build the prompt following the Golden Template exactly
          stylePrompt = `Edit this image to add ONLY: ${customPrompt.trim()}

STRICT ANCHOR - DO NOT CHANGE THESE (must remain 100% pixel-perfect identical):
- The food dish and everything on the plate
- The plate itself
- The entire background (walls, table surface color, texture, lighting)
- Every single existing element in the image
- The overall scene composition

WHAT TO ADD (ONLY these items, nothing else):
- ${customPrompt.trim()}
- Place on the table surface beside the plate

CRITICAL RULES:
- Add ONLY the items listed above - NO extra items
- Do NOT add lime, lemon, herbs, spoons, or any garnish unless explicitly requested
- Do NOT change the background color, texture, or any surface
- Do NOT add any decorative elements
- The new props should match the existing lighting and cast appropriate shadows
- Use seamless blend so edges look natural

OUTPUT: The exact same image with ONLY "${customPrompt.trim()}" added. Nothing else changed.`
          logger.info('Using PRESERVE mode prompt (strict pixel-perfect)', {
            editRequest: customPrompt.substring(0, 100),
          })
        } else {
          // STANDARD EDIT MODE: Allow more flexibility in modifications
          stylePrompt = `You are an expert food photography editor. Your task is to make MODIFICATIONS to this food photograph.

═══════════════════════════════════════════════════════════════════════════════
EDIT REQUEST FROM USER
═══════════════════════════════════════════════════════════════════════════════
"${customPrompt.trim()}"

═══════════════════════════════════════════════════════════════════════════════
FLEXIBLE EDITING MODE
═══════════════════════════════════════════════════════════════════════════════

You have creative freedom to:
- Modify the background, lighting, or styling to match the requested changes
- Adjust colors, contrast, or mood to improve the overall result
- Reposition elements if needed to accommodate new additions
- Apply a fresh enhancement while incorporating the requested changes

QUALITY STANDARDS:
1. The final result should look like a professional food photograph
2. All elements (new and existing) should look cohesive together
3. Lighting and shadows should be consistent throughout
4. The food should remain appetizing and visually appealing

Generate an enhanced version of the image with the requested modifications.`
          logger.info('Using standard edit mode prompt (flexible)', {
            editRequest: customPrompt.substring(0, 100),
          })
        }
      } else if (hasSimpleSelection && simpleSelection) {
        // NEW: Use simplified prompt builder for new 3-category system
        simplifiedResult = buildSimplifiedPrompt(simpleSelection, undefined)
        stylePrompt = simplifiedResult.prompt

        // Enhanced logging for style debugging (Issue #9 investigation)
        logger.info('Using simplified prompt builder', {
          selection: JSON.stringify(simpleSelection),
          isValid: simplifiedResult.isValid,
          warnings: simplifiedResult.warnings.length,
          format: simplifiedResult.formatConfig.aspectRatio,
          // Log key style elements being applied
          styleDetails: {
            businessType: simpleSelection.businessType,
            mood: simpleSelection.mood || 'auto (AI-selected)',
            seasonal: simpleSelection.seasonal || 'none',
            format: simpleSelection.format || 'square (default)',
          },
        })

        // Log prompt preview for debugging (first 500 chars)
        logger.debug('Style prompt preview', {
          promptLength: stylePrompt.length,
          preview: stylePrompt.substring(0, 500).replace(/\n/g, ' '),
        })
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

      // If user will apply custom background, modify prompt to use simple background
      if (hasCustomBackground) {
        stylePrompt += `

═══════════════════════════════════════════════════════════════════════════════
CUSTOM BACKGROUND MODE - IMPORTANT
═══════════════════════════════════════════════════════════════════════════════
The user will apply their own branded background after enhancement.

BACKGROUND REQUIREMENTS:
- Use a CLEAN, SIMPLE, SOLID background (white, light gray, or neutral)
- DO NOT add complex backgrounds, textures, or patterns
- DO NOT add props, surfaces, or environmental elements
- Keep the background PLAIN and EASY TO REMOVE
- Focus ALL styling on the FOOD SUBJECT ONLY

CRITICAL: The background will be completely replaced, so:
- Ensure high contrast between food and background for clean edges
- Keep food composition tight and centered
- Apply all lighting, color grading, and enhancement to the FOOD ONLY
- Make the food "pop" against the simple background
`
        logger.debug('Added custom background instructions to prompt')
      }

      // Handle "describe" background mode - AI interprets user's description
      if (backgroundConfig?.mode === 'describe' && backgroundConfig.description) {
        stylePrompt += `

═══════════════════════════════════════════════════════════════════════════════
CUSTOM BACKGROUND DESCRIPTION - USER REQUEST
═══════════════════════════════════════════════════════════════════════════════
The user wants a specific background style for their food photo.

USER'S BACKGROUND DESCRIPTION: "${backgroundConfig.description}"

CRITICAL RESTRICTION:
- DO NOT add any text, words, or brand names, logos or symbols unless explicitly described.

INSTRUCTIONS:
- Interpret this description creatively and apply an appropriate background
- The background should complement the food, not distract from it
- Maintain the food as the clear focal point
- Apply appropriate lighting that matches the background environment
- Ensure the background feels natural and physically realistic for the camera angle
- The background should enhance the overall appetizing quality of the image
- "Branded" or "professional" means styled appearance, NOT adding text/logos

EXAMPLES OF INTERPRETATION:
- "white marble" → Clean white marble surface/backdrop with subtle veining
- "rustic wood" → Warm wooden table/background with natural grain texture
- "dark moody" → Deep, elegant dark background with dramatic lighting
- "bright kitchen" → Light, airy kitchen environment with soft natural light
- "outdoor cafe" → Blurred cafe/patio setting with bokeh effect
- "Christmas theme" → Festive elements, warm tones, holiday atmosphere

Create a professional, appetizing result that incorporates the user's requested background style.
`
        logger.debug('Added describe background instructions to prompt', {
          description: backgroundConfig.description.substring(0, 50),
        })
      }

      // Append user's custom prompt for additional elements/styling
      // Skip this in edit mode since customPrompt is already fully included in the edit mode prompt
      if (customPrompt && customPrompt.trim() && !editMode) {
        stylePrompt += `

═══════════════════════════════════════════════════════════════════════════════
ADDITIONAL USER REQUEST - IMPORTANT
═══════════════════════════════════════════════════════════════════════════════
The user has provided additional instructions for the image:

"${customPrompt.trim()}"

INSTRUCTIONS:
- Incorporate the user's request into the final image
- This may include adding props, elements, or styling that the user described
- The user's request should complement the existing style, not override it
- Ensure all added elements look natural and professional
- Maintain the food as the primary focal point
- Added props/elements should be food-photography appropriate

IMPORTANT: The user specifically requested these additions, so make sure to include them
in the generated image while maintaining professional food photography quality.
`
        logger.debug('Added custom prompt to stylePrompt', {
          customPrompt: customPrompt.substring(0, 100),
        })
      }

      // Determine which image URL to use
      // In edit mode, use the enhanced image; otherwise use original
      let sourceImageUrl: string
      if (editMode) {
        if (!image.enhanced_url) {
          throw new Error('Cannot edit: Image has not been enhanced yet. Please enhance the image first.')
        }
        sourceImageUrl = image.enhanced_url
        logger.info('Edit mode: Using enhanced image as source')
      } else {
        sourceImageUrl = image.original_url
      }

      // Fetch the source image
      currentStep = editMode ? 'fetching enhanced image for editing' : 'fetching original image'
      logger.debug('Fetching source image', { editMode, urlPreview: sourceImageUrl.substring(0, 50) })
      const imageResponse = await fetch(sourceImageUrl)

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
      let platformConfig: ReturnType<typeof getPlatformConfig>

      if (simplifiedResult) {
        // Use format config from simplified selection
        // Map simplified aspect ratio to PlatformImageConfig format
        const aspectRatioMap: Record<string, PlatformImageConfig['aspectRatio']> = {
          '1:1': '1:1',
          '4:5': '4:5',
          '9:16': '9:16',
          '16:9': '16:9',
          '4:3': '4:3',
          '3:4': '3:4',
          '2:3': '2:3',
          '3:2': '3:2',
        }
        const mappedRatio = aspectRatioMap[simplifiedResult.formatConfig.aspectRatio] || '1:1'

        platformConfig = {
          aspectRatio: mappedRatio,
          imageSize: '2K', // Default to 2K for quality
          description: `Simplified format: ${simpleSelection?.format || 'square'}`,
          platformRequirements: 'Professional food photography',
        }
        logger.debug('Platform config from simplified selection', {
          format: simpleSelection?.format,
          aspectRatio: platformConfig.aspectRatio,
        })
      } else {
        // For multi-style, use delivery platform if set, otherwise first social platform, otherwise first style
        let primaryStyleForConfig = stylePreset
        if (styleIds && Array.isArray(styleIds) && styleIds.length > 0) {
          // Parse to find delivery or social platform for config
          const selection = parseStyleIds(styleIds.join(','))
          primaryStyleForConfig = selection.delivery || selection.social?.[0] || styleIds[0]
        }
        platformConfig = getPlatformConfig(primaryStyleForConfig || 'delivery')
        logger.debug('Platform config from legacy selection', { from: primaryStyleForConfig, aspectRatio: platformConfig.aspectRatio })
      }

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
          style: hasSimpleSelection ? simpleSelection?.businessType : stylePreset,
          aspectRatio: platformConfig.aspectRatio,
          useSimplified: hasSimpleSelection,
        })

        // Build angle-aware venue styling section (all angles provided for self-selection)
        let venueStyleSection = ''
        if (hasSimpleSelection) {
          // Use simplified style prompt directly (already contains all professional elements)
          venueStyleSection = `
STYLE ENHANCEMENT (Simplified Professional System)
${stylePrompt}
`
          logger.debug('Using simplified style prompt', { businessType: simpleSelection?.businessType })
        } else if (stylePreset && hasAngleAwareStyling(stylePreset)) {
          venueStyleSection = getAllAnglePrompts(stylePreset)
          logger.debug('Using angle-aware venue prompts (all angles)', { venue: stylePreset })
        } else {
          // Fallback to standard style prompt
          venueStyleSection = `
STYLE ENHANCEMENT: ${stylePreset?.toUpperCase() || 'PROFESSIONAL'}
${stylePrompt}
`
        }

        // ═══════════════════════════════════════════════════════════════════════════
        // PROMPT STRATEGY: Different prompts for EDIT MODE vs ENHANCEMENT MODE
        // ═══════════════════════════════════════════════════════════════════════════
        let generationPrompt: string

        if (editMode) {
          // 🔴 EDIT MODE: SURGICAL INPAINTING PROMPT
          // BYPASS the enhancement wrapper entirely - send raw editing instruction
          // This forces the model into "Object Addition" mode, NOT "Retouching" mode

          generationPrompt = `TASK: Add objects to this image using INPAINTING.

ADD THESE ITEMS ONLY:
${customPrompt?.trim()}

PLACEMENT:
Place these items on the available table surface beside the main dish.

STRICT RULES:
- Keep the ENTIRE existing image PIXEL-PERFECT IDENTICAL
- Do NOT change the food, plate, background, lighting, or any existing element
- Do NOT add any items not explicitly listed above (no garnishes, herbs, utensils unless requested)
- The new items should cast natural shadows matching the existing light direction
- Use seamless blending so new items look naturally part of the scene

OUTPUT: The exact same photograph with ONLY the requested items added.`

          logger.info('Using SURGICAL EDIT prompt (bypassed enhancement wrapper)', {
            editRequest: customPrompt?.substring(0, 100),
            preserveMode,
          })

        } else {
          // 🟢 STANDARD ENHANCEMENT MODE - Original logic with full wrapper
          // Model analyzes camera angle AND applies enhancements in ONE call
          generationPrompt = `ROLE: World-class food photography retoucher
TASK: ENHANCE this photo while respecting PHYSICAL REALITY

═══════════════════════════════════════════════════════════════════════════════
STEP 1: DETECT CAMERA ANGLE
═══════════════════════════════════════════════════════════════════════════════
OVERHEAD (90°): Looking down | Plates = circles | Only table surface | No vertical BG
HERO (45°): Classic angle | Plates = ellipses | Table + soft bokeh BG | Shows depth
EYE LEVEL (0°): Horizontal | Full vertical BG | Shows "face" of items

PHYSICS CONSTRAINTS:
• OVERHEAD → CAN: table texture, props, garnishes | CANNOT: vertical backgrounds, walls
• HERO → CAN: soft bokeh, gentle shadows | CANNOT: sharp detailed backgrounds
• EYE LEVEL → CAN: full environment | CANNOT: contradict existing background

═══════════════════════════════════════════════════════════════════════════════
PRESERVATION RULES [CRITICAL]
═══════════════════════════════════════════════════════════════════════════════
✗ DO NOT change food items, angle, plating, or arrangement
✗ DO NOT add physics-breaking elements
This is ENHANCEMENT, not generation - output must be recognizably the SAME photo

═══════════════════════════════════════════════════════════════════════════════
STEP 2: APPLY VENUE STYLING
═══════════════════════════════════════════════════════════════════════════════
${venueStyleSection}

═══════════════════════════════════════════════════════════════════════════════
STEP 3: UNIVERSAL ENHANCEMENTS
═══════════════════════════════════════════════════════════════════════════════
✓ Lighting (natural direction) | Color grading | Sharpness | White balance | Contrast
✓ Food appeal: fresher, more vibrant | Optional: steam, texture, gentle shadows

═══════════════════════════════════════════════════════════════════════════════
OUTPUT: ${platformConfig.aspectRatio} | ${platformConfig.imageSize} quality | ${platformConfig.platformRequirements || 'Professional'}
═══════════════════════════════════════════════════════════════════════════════

QUALITY: Physically realistic | Appetizing | Authentic | No AI artifacts | Platform-ready

Respond: ANGLE: [detected] | SUGGESTIONS: [tip1] | [tip2] | [tip3]`
        }

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
          stylePreset: hasSimpleSelection ? simpleSelection?.businessType : stylePreset,
          detectedAngle: detectedAngle, // AI self-detected camera angle
          pipeline: hasSimpleSelection ? 'simplified-v2' : 'single-call-v1',
          // Include simplified selection data if used
          ...(hasSimpleSelection && simpleSelection ? {
            simplifiedSelection: {
              businessType: simpleSelection.businessType,
              format: simpleSelection.format,
              mood: simpleSelection.mood,
              seasonal: simpleSelection.seasonal,
            },
            formatConfig: simplifiedResult?.formatConfig,
          } : {}),
          // Store background config for debugging (v0.54.0)
          ...(backgroundConfig ? {
            backgroundConfig: {
              mode: backgroundConfig.mode,
              description: backgroundConfig.description || null,
              // Don't store uploadedUrl to save space - it's in the image record if needed
            },
          } : {}),
        },
        suggestions: aiSuggestions.length > 0 ? aiSuggestions : defaultEnhancements.suggestions
      }

      // Handle image record update differently for edit mode vs normal mode
      currentStep = 'updating image record'
      let finalImageId = imageId // Track the final image ID (may change in edit mode)

      if (editMode) {
        // EDIT MODE: Create a NEW image record instead of overwriting
        // This preserves the original enhanced image and creates version history
        logger.debug('Edit mode: Creating new image record')

        const { data: newImage, error: insertError } = await supabase
          .from('images')
          .insert({
            business_id: business.id,
            // The "original" for this new record is the previous enhanced image
            original_url: sourceImageUrl, // This is the previous enhanced_url
            enhanced_url: enhancedUrl,
            thumbnail_url: image.thumbnail_url, // Reuse existing thumbnail for now
            original_filename: image.original_filename ? `${image.original_filename.replace(/\.[^/.]+$/, '')}_edited${image.original_filename.match(/\.[^/.]+$/)?.[0] || '.jpg'}` : 'edited_image.jpg',
            style_preset: image.style_preset,
            status: 'completed',
            enhancement_settings: enhancementData.enhancements,
            processed_at: new Date().toISOString(),
            ai_model: enhancementMethod === 'hybrid-sharp-gemini' ? 'gemini-3-pro-image-enhancement' : (enhancementMethod === 'sharp-only' ? 'sharp-processing' : 'skipped'),
            ai_suggestions: enhancementData.suggestions,
            metadata: {
              ...(image.metadata || {}),
              editedFrom: imageId, // Reference to the original image
              editPrompt: customPrompt?.substring(0, 500), // Store the edit request
              preserveMode: preserveMode,
            },
          })
          .select('id')
          .single()

        if (insertError) {
          logger.error('Failed to create new image record', insertError)
          // Fall back to updating existing record
          const { error: fallbackError } = await supabase
            .from('images')
            .update({
              status: 'completed',
              enhanced_url: enhancedUrl,
              enhancement_settings: enhancementData.enhancements,
              processed_at: new Date().toISOString(),
              ai_model: enhancementMethod === 'hybrid-sharp-gemini' ? 'gemini-3-pro-image-enhancement' : 'skipped',
              ai_suggestions: enhancementData.suggestions,
            })
            .eq('id', imageId)

          if (fallbackError) {
            logger.error('Fallback update also failed', fallbackError)
          }
        } else {
          finalImageId = newImage.id
          logger.info('Created new edited image record', {
            originalId: imageId,
            newId: newImage.id,
            preserveMode
          })
        }
      } else {
        // NORMAL MODE: Update existing image record
        logger.debug('Updating existing image record')
        const { error: imageUpdateError } = await supabase
          .from('images')
          .update({
            status: 'completed',
            enhanced_url: enhancedUrl,
            enhancement_settings: enhancementData.enhancements,
            processed_at: new Date().toISOString(),
            ai_model: enhancementMethod === 'hybrid-sharp-gemini' ? 'gemini-3-pro-image-enhancement' : (enhancementMethod === 'sharp-only' ? 'sharp-processing' : 'skipped'),
            ai_suggestions: enhancementData.suggestions,
          })
          .eq('id', imageId)

        if (imageUpdateError) {
          logger.error('Image update error', imageUpdateError)
        } else {
          logger.debug('Image record updated successfully')
        }
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
          description: editMode ? `AI Edit - ${customPrompt?.substring(0, 50)}...` : `Image enhancement - ${stylePreset} style`,
          image_id: finalImageId, // Use final image ID (may be new in edit mode)
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
        imageId: finalImageId, // Return the actual image ID (may be new in edit mode)
        originalImageId: editMode ? imageId : undefined, // Reference to original if edited
        enhancedUrl,
        enhancements: enhancementData,
        creditsRemaining: credits.credits_remaining - 1,
        processingSkipped, // If true, client should apply enhancements using the settings
        isNewImage: editMode && finalImageId !== imageId, // Flag to indicate a new image was created
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
