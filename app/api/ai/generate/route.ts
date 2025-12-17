import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import Replicate from 'replicate'

// Use Node.js runtime
export const runtime = 'nodejs'

// Extend timeout to 120 seconds for Gemini + Upscaling
export const maxDuration = 120

// ═══════════════════════════════════════════════════════════════════════════
// REPLICATE REAL-ESRGAN UPSCALING
// Upscales 1024x1024 -> 2048x2048 for foodshot.ai quality match
// Cost: ~$0.002 per image
// ═══════════════════════════════════════════════════════════════════════════

let replicateClient: Replicate | null = null

function getReplicate(): Replicate {
  if (!replicateClient) {
    const apiToken = process.env.REPLICATE_API_TOKEN
    if (!apiToken) {
      throw new Error('Replicate API token is not configured')
    }
    replicateClient = new Replicate({ auth: apiToken })
  }
  return replicateClient
}

async function upscaleImage(base64Image: string, mimeType: string): Promise<string> {
  console.log('[Upscale] Starting Real-ESRGAN 2x upscale...')
  const startTime = Date.now()

  // Convert base64 to data URL for Replicate
  const dataUrl = `data:${mimeType};base64,${base64Image}`

  try {
    const replicate = getReplicate()

    // Run Real-ESRGAN model
    // nightmareai/real-esrgan - fastest and most reliable upscaler
    const output = await replicate.run(
      'nightmareai/real-esrgan:f121d640bd286e1fdc67f9799164c1d5be36ff74576ee11c803ae5b665dd46aa',
      {
        input: {
          image: dataUrl,
          scale: 2, // 2x upscale: 1024 -> 2048
          face_enhance: false, // Not needed for food photos
        }
      }
    )

    const duration = ((Date.now() - startTime) / 1000).toFixed(1)
    console.log(`[Upscale] Real-ESRGAN completed in ${duration}s`)
    console.log('[Upscale] Output type:', typeof output, Array.isArray(output) ? 'array' : '')

    // Extract URL from various Replicate output formats
    let outputUrl: string | null = null

    if (typeof output === 'string') {
      // Direct string URL
      outputUrl = output
    } else if (Array.isArray(output) && output.length > 0) {
      // Array of URLs - take the first one
      const firstItem = output[0]
      if (typeof firstItem === 'string') {
        outputUrl = firstItem
      } else if (firstItem && typeof firstItem === 'object' && 'url' in firstItem) {
        outputUrl = (firstItem as { url: string }).url
      }
    } else if (output && typeof output === 'object') {
      // FileOutput object with url property
      if ('url' in output) {
        outputUrl = (output as { url: string }).url
      }
    }

    if (outputUrl) {
      console.log('[Upscale] Fetching upscaled image from:', outputUrl.substring(0, 80) + '...')

      // Fetch the upscaled image and convert to base64
      const response = await fetch(outputUrl)
      const arrayBuffer = await response.arrayBuffer()
      const upscaledBase64 = Buffer.from(arrayBuffer).toString('base64')

      console.log('[Upscale] Upscaled image size:', upscaledBase64.length, 'chars')
      return upscaledBase64
    }

    console.error('[Upscale] Could not extract URL from output:', JSON.stringify(output).substring(0, 200))
    throw new Error('Unexpected Replicate output format')
  } catch (error) {
    console.error('[Upscale] Error:', error)
    throw error
  }
}

// Lazy initialization of Google AI client
let genAI: GoogleGenerativeAI | null = null

function getGoogleAI(): GoogleGenerativeAI {
  if (!genAI) {
    const apiKey = process.env.GOOGLE_AI_API_KEY
    if (!apiKey) {
      throw new Error('Google AI API key is not configured')
    }
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
  maxRetries: 3,
  baseDelayMs: 2000,
  maxDelayMs: 5000,
  backoffMultiplier: 2,
}

const GEMINI_REQUEST_TIMEOUT_MS = 25000 // 25 seconds per attempt

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

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
  if (errorMessage.includes('503') || errorMessage.includes('service unavailable')) return true
  if (errorMessage.includes('429') || errorMessage.includes('too many requests')) return true
  if (errorMessage.includes('timeout')) return true
  if (errorMessage.includes('etimedout') || errorMessage.includes('econnreset')) return true
  if (errorMessage.includes('overloaded') || errorMessage.includes('temporarily unavailable')) return true
  if (errorMessage.includes('fetch failed') || errorMessage.includes('network')) return true
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
      console.log(`[Generate] ${operationName}: Attempt ${attempt}/${config.maxRetries}`)
      const startTime = Date.now()
      const result = await operation()
      const duration = ((Date.now() - startTime) / 1000).toFixed(1)
      console.log(`[Generate] ${operationName}: SUCCESS after ${duration}s on attempt ${attempt}`)
      return result
    } catch (error) {
      lastError = error
      const errorMessage = String(error)
      console.error(`[Generate] ${operationName}: Attempt ${attempt} FAILED - ${errorMessage.substring(0, 200)}`)

      if (!isRetryableError(error)) {
        console.error(`[Generate] ${operationName}: Non-retryable error, failing immediately`)
        throw error
      }

      if (attempt < config.maxRetries) {
        console.log(`[Generate] ${operationName}: Waiting ${(delayMs / 1000).toFixed(1)}s before retry...`)
        await sleep(delayMs)
        delayMs = Math.min(delayMs * config.backoffMultiplier, config.maxDelayMs)
      }
    }
  }

  console.error(`[Generate] ${operationName}: All ${config.maxRetries} attempts failed`)
  throw lastError
}

// ═══════════════════════════════════════════════════════════════════════════
// PROFESSIONAL FOOD PHOTOGRAPHY PROMPTS
// Optimized for Gemini 3 Pro Image (Nano Banana Pro) premium quality
// Benchmark: foodshot.ai quality (2048x2048, 1.3-1.4MB, natural lighting)
// ═══════════════════════════════════════════════════════════════════════════

const categoryPrompts: Record<string, string> = {
  'delivery': `Generate a premium food delivery photograph.

CRITICAL REQUIREMENTS:
- Output resolution: 2048x2048 pixels SQUARE format
- NO humans, hands, or people in the frame
- Single food subject as hero

SCENE:
- Flat-lay overhead composition (90 degrees straight down)
- Clean white or light marble surface
- Minimal props: kraft paper, wooden utensils, small sauce container
- Negative space around the food (not cluttered)

FOOD SUBJECT:
- Fresh poke bowl OR grain bowl with:
  - Vibrant salmon or tuna slices
  - Bright green avocado
  - Colorful vegetables (edamame, cucumber, carrot)
  - Sesame seeds, microgreens garnish
- Food looks fresh and appetizing
- Natural, not overly styled

LIGHTING:
- Soft natural window light from one side
- Gentle diagonal shadows across surface
- No harsh studio lighting
- Slight backlight for freshness glow

COLOR & MOOD:
- Natural, slightly muted tones (not oversaturated)
- Clean, minimalist, Instagram-ready aesthetic
- Bright but not blown out

TECHNICAL:
- Razor sharp focus on food
- Professional food photography quality
- Square 1:1 aspect ratio
- Maximum resolution output`,

  'restaurant': `Generate a premium restaurant menu photograph.

CRITICAL REQUIREMENTS:
- Output resolution: 2048x2048 pixels SQUARE format
- NO humans, hands, or people anywhere in frame
- NO blurry people in background
- Single plated dish as the only subject

SCENE:
- 45-degree hero angle
- Premium surface: warm walnut wood table OR white marble
- Clean background - solid color or very subtle texture
- Elegant cutlery beside plate (gold or matte black)
- Single plate composition, not cluttered

FOOD SUBJECT:
- Beautifully plated main course:
  - Pan-seared salmon with crispy golden skin, OR
  - Avocado toast with poached egg and microgreens
- Accompanied by: herb garnish, sauce drizzle
- Professional restaurant plating
- Food looks fresh and appetizing

LIGHTING:
- Natural window light from left side
- Beautiful diagonal shadows on table surface
- Soft, diffused - not harsh studio light
- Warm golden hour quality
- Subtle rim light on plate edge

COLOR & MOOD:
- Warm but natural tones
- Muted, sophisticated palette
- NOT oversaturated
- Elegant fine dining aesthetic

TECHNICAL:
- Shallow depth of field (f/2.8 bokeh effect)
- Creamy smooth background blur
- Razor sharp focus on food
- Square 1:1 aspect ratio
- Maximum resolution output`,

  'fine-dining': `Generate a premium fine dining photograph.

CRITICAL REQUIREMENTS:
- Output resolution: 2048x2048 pixels SQUARE format
- NO humans, hands, or people in frame
- Single artistic plate as subject

SCENE:
- Slight overhead angle (60-70 degrees)
- Dark slate OR black matte surface
- Minimalist - just plate on surface
- Generous negative space
- No props except maybe single herb sprig

FOOD SUBJECT:
- Artistic tasting portion:
  - Seared duck breast OR beef tenderlion (pink inside)
  - Multiple sauce dots and artistic swooshes
  - Edible flowers (viola, nasturtium)
  - Microgreens, herb oil droplets
  - Precisely placed components
- Tweezers-perfect Michelin plating
- Small, elegant portion

LIGHTING:
- Dramatic side lighting from left
- Deep natural shadows
- Single light source effect
- Rim light on plate edge
- Moody but clear visibility

COLOR & MOOD:
- Rich blacks, controlled highlights
- Sophisticated, editorial quality
- Dramatic contrast
- Vogue or Bon Appétit cover style

TECHNICAL:
- Extremely sharp focus
- Deep blacks, bright highlights
- Square 1:1 aspect ratio
- Maximum resolution output`,

  'cafe': `Generate a premium cafe photograph.

CRITICAL REQUIREMENTS:
- Output resolution: 2048x2048 pixels SQUARE format
- NO humans, hands, or people in frame
- Single pastry or coffee as hero subject

SCENE:
- 45-degree angle
- Premium surface: terrazzo OR light wood OR white marble
- Minimalist composition - one main subject
- Optional: soft linen napkin, elegant cutlery
- Clean, uncluttered frame

FOOD SUBJECT - choose ONE:
- Elegant éclair with glaze and dried flower petals, OR
- Golden croissant with visible flaky layers, OR
- Artisan latte with perfect rosetta art
- Single beautiful pastry, not multiple items
- Professional patisserie quality

LIGHTING:
- Soft natural window light
- Beautiful diagonal shadows across surface
- Diffused, dreamy quality
- Slight backlight glow
- Morning light feeling

COLOR & MOOD:
- Soft, muted, natural tones
- NOT oversaturated
- Bright, airy, fresh feeling
- Instagram minimalist aesthetic
- Kinfolk magazine style

TECHNICAL:
- Shallow depth of field
- Soft creamy bokeh on edges
- Sharp focus on subject
- Square 1:1 aspect ratio
- Maximum resolution output`,

  'street-food': `Generate a premium street food photograph.

CRITICAL REQUIREMENTS:
- Output resolution: 2048x2048 pixels SQUARE format
- NO humans, hands, or people in frame
- Single dish as hero subject

SCENE:
- Close-up hero shot, slight angle (30-45 degrees)
- Rustic surface: worn wood OR metal tray OR banana leaf
- Authentic hawker-style presentation
- Minimal background - blurred or dark
- Not cluttered with props

FOOD SUBJECT:
- Popular Asian street food:
  - Loaded satay skewers with peanut sauce, OR
  - Crispy fried chicken with golden coating, OR
  - Steaming noodle dish with visible wok hei char
- Glistening with sauce/oil
- Generous, appetizing portion
- Authentic not over-styled

LIGHTING:
- Warm tungsten/golden light
- Dramatic side lighting
- Steam or heat haze visible
- Slightly moody atmosphere
- Night market warmth

COLOR & MOOD:
- Warm golden tones
- Rich but natural colors
- Appetizing, crave-worthy
- Authentic street food energy

TECHNICAL:
- Sharp focus on main dish
- Background naturally blurred
- Square 1:1 aspect ratio
- Maximum resolution output`
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'AI Image Generation API (Gemini 3 Pro Image)',
    model: 'gemini-3-pro-image-preview',
    categories: Object.keys(categoryPrompts)
  })
}

export async function POST(request: NextRequest) {
  console.log('[Generate] API called - Using Gemini 3 Pro Image (Nano Banana Pro)')

  try {
    const body = await request.json()
    const { category = 'restaurant', customPrompt } = body

    console.log('[Generate] Category:', category)

    // Get the category-specific prompt
    const basePrompt = categoryPrompts[category] || categoryPrompts['restaurant']

    // Combine with any custom additions
    const fullPrompt = customPrompt
      ? `${basePrompt}\n\nADDITIONAL REQUIREMENTS:\n${customPrompt}`
      : basePrompt

    console.log('[Generate] Prompt length:', fullPrompt.length, 'chars')

    // Use Gemini 3 Pro Image Preview (Nano Banana Pro)
    // State-of-the-art image generation and editing model
    // Pricing: Image Output $0.134 per image
    const model = getGoogleAI().getGenerativeModel({
      model: 'gemini-3-pro-image-preview',
      generationConfig: {
        responseModalities: ['Text', 'Image'] as const,
        temperature: 1.0,
      }
    })

    console.log('[Generate] Calling Gemini 3 Pro Image (Nano Banana Pro)...')

    const masterPrompt = `You are an elite food photographer. Generate a single stunning photograph.

${fullPrompt}

ABSOLUTE REQUIREMENTS - DO NOT IGNORE:
1. IMAGE SIZE: Generate at 2048x2048 pixels - SQUARE format only (1:1 aspect ratio)
2. NO HUMANS: Zero people, hands, faces, or human figures anywhere in the image - not even blurred in background
3. SINGLE SUBJECT: One hero food item only - minimalist composition
4. NATURAL LIGHT: Soft window light with diagonal shadows - NOT harsh studio lighting
5. MUTED COLORS: Natural, slightly desaturated tones - NOT oversaturated or artificial
6. SHARP FOCUS: Razor sharp on food subject with creamy bokeh background
7. CLEAN FRAME: Uncluttered, elegant, Instagram-minimalist aesthetic
8. PREMIUM SURFACES: Terrazzo, marble, walnut wood, or slate - real texture visible

OUTPUT: Maximum resolution square image (2048x2048). This must look like a real photograph from a professional food magazine, not AI-generated.`

    const result = await retryWithBackoff(
      async () => {
        return await withTimeout(
          model.generateContent([{ text: masterPrompt }]),
          GEMINI_REQUEST_TIMEOUT_MS,
          `Gemini 3 Pro Image request exceeded ${GEMINI_REQUEST_TIMEOUT_MS / 1000}s`
        )
      },
      'Gemini 3 Pro Image Generation',
      GEMINI_RETRY_CONFIG
    )

    const response = await result.response
    let generatedImageBase64: string | null = null
    let generatedImageMimeType: string | null = null
    let textResponse: string | null = null

    for (const candidate of response.candidates || []) {
      for (const part of candidate.content?.parts || []) {
        if (part.text) {
          textResponse = part.text
          console.log('[Generate] Text response:', part.text.substring(0, 200))
        }
        if (part.inlineData?.data) {
          generatedImageBase64 = part.inlineData.data
          generatedImageMimeType = part.inlineData.mimeType || 'image/png'
          console.log('[Generate] Image generated! Mime:', generatedImageMimeType)
          console.log('[Generate] Base64 length:', generatedImageBase64.length)
        }
      }
    }

    if (generatedImageBase64) {
      let finalImageBase64 = generatedImageBase64
      let finalMimeType = generatedImageMimeType || 'image/png'
      let wasUpscaled = false
      let upscaleError: string | null = null

      // Attempt to upscale the image to 2048x2048
      if (process.env.REPLICATE_API_TOKEN) {
        try {
          console.log('[Generate] Upscaling to 2048x2048...')
          finalImageBase64 = await upscaleImage(generatedImageBase64, finalMimeType)
          wasUpscaled = true
          console.log('[Generate] Upscaling complete!')
        } catch (error) {
          // If upscaling fails, return the original image
          console.error('[Generate] Upscaling failed, returning original:', error)
          upscaleError = (error as Error).message
        }
      } else {
        console.log('[Generate] Skipping upscale - REPLICATE_API_TOKEN not configured')
      }

      const imageDataUrl = `data:${finalMimeType};base64,${finalImageBase64}`

      return NextResponse.json({
        success: true,
        category,
        imageDataUrl,
        textResponse,
        model: 'gemini-3-pro-image-preview',
        upscaled: wasUpscaled,
        resolution: wasUpscaled ? '2048x2048' : '1024x1024',
        upscaleError,
        message: `AI-generated ${category} food photo${wasUpscaled ? ' (2048x2048)' : ''}`
      })
    }

    return NextResponse.json({
      success: false,
      error: 'No image was generated',
      textResponse,
      message: 'The AI model did not return an image. This may be due to model limitations or content policies.'
    })

  } catch (error: unknown) {
    console.error('[Generate] Error:', error)
    const errorMessage = (error as Error).message || 'Unknown error'

    return NextResponse.json({
      success: false,
      error: errorMessage,
      message: 'Failed to generate image'
    }, { status: 500 })
  }
}
