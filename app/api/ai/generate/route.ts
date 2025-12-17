import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Use Node.js runtime
export const runtime = 'nodejs'

// Extend timeout to 60 seconds for Gemini 3 Pro Image
export const maxDuration = 60

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
// ═══════════════════════════════════════════════════════════════════════════

const categoryPrompts: Record<string, string> = {
  'delivery': `GENERATE A STUNNING FOOD DELIVERY PHOTOGRAPH

SCENE SETUP:
- A beautifully arranged takeout meal in premium eco-friendly packaging
- Clean, bright white seamless background (infinity curve studio setup)
- Overhead flat-lay composition at exactly 90 degrees
- Include: kraft paper bag, branded box, wooden chopsticks, small sauce containers

FOOD STYLING:
- Feature a colorful Asian poke bowl or grain bowl with:
  - Fresh salmon sashimi or grilled chicken
  - Perfectly sliced avocado
  - Edamame, cucumber, pickled ginger
  - Sesame seeds, microgreens garnish
  - Vibrant colors: orange, green, white, pink
- Food should look fresh, glistening, appetizing
- Steam or freshness indicators visible

LIGHTING:
- Soft, diffused studio lighting from above
- No harsh shadows
- Even, bright illumination
- Highlight food textures and colors
- Professional commercial photography lighting

QUALITY:
- Ultra high resolution, 8K quality
- Razor sharp focus on food
- Rich, saturated colors
- Clean, professional aesthetic
- Magazine advertisement quality`,

  'restaurant': `GENERATE A STUNNING RESTAURANT FOOD PHOTOGRAPH

SCENE SETUP:
- Elegant main course on a premium ceramic plate
- Warm wooden table surface with natural grain visible
- 45-degree angle shot (hero angle)
- Shallow depth of field with soft bokeh background
- Ambient restaurant atmosphere suggested

FOOD STYLING:
- Feature a perfectly cooked protein:
  - Pan-seared salmon with crispy skin, OR
  - Grilled ribeye steak medium-rare, OR
  - Roasted chicken breast with herbs
- Accompanied by:
  - Colorful vegetable medley (roasted carrots, broccolini)
  - Creamy mashed potato or risotto
  - Artistic sauce drizzle (reduction or herb oil)
  - Fresh herb garnish (rosemary, thyme, microgreens)

LIGHTING:
- Warm golden hour window light from the left side
- Soft shadows creating depth and dimension
- Highlights on glossy sauce and food surfaces
- Cozy, inviting restaurant ambiance
- Natural light simulation

QUALITY:
- Professional DSLR quality, 8K resolution
- Shallow depth of field (f/2.8 effect)
- Rich warm color tones
- Appetizing food styling
- Michelin guide photography standard`,

  'fine-dining': `GENERATE A STUNNING FINE DINING PHOTOGRAPH

SCENE SETUP:
- Minimalist tasting course on pristine white porcelain
- Dark slate or black background for dramatic contrast
- Slight overhead angle (60-70 degrees)
- Negative space emphasizing artistic plating
- Single spotlight effect

FOOD STYLING:
- Feature an artistic tasting portion:
  - Seared duck breast or beef tenderloin, perfectly pink inside
  - Multiple sauce dots and swooshes in contrasting colors
  - Edible flowers (viola, nasturtium)
  - Microgreens and herb oil droplets
  - Foam or gel element
  - Precisely placed vegetable components
- Every element intentionally positioned
- Tweezers-perfect plating

LIGHTING:
- Dramatic directional lighting from one side
- Deep shadows creating mood and mystery
- Rim light on plate edge
- Spotlight effect on main protein
- Moody, editorial magazine style

QUALITY:
- Ultra high resolution, 8K cinematic quality
- Extremely sharp focus
- Rich blacks, bright highlights
- Michelin 3-star presentation
- Vogue or Bon Appétit cover quality`,

  'cafe': `GENERATE A STUNNING CAFE PHOTOGRAPH

SCENE SETUP:
- Cozy morning coffee scene on rustic wooden surface
- Soft morning window light streaming in from the right
- 45-degree lifestyle angle
- Warm, inviting atmosphere
- Include lifestyle elements: newspaper edge, fresh flowers

FOOD STYLING:
- Feature artisan coffee and pastries:
  - Perfect latte with intricate rosetta or tulip art
  - Golden flaky croissant (layers visible)
  - Fresh fruit danish or pain au chocolat
  - Cinnamon roll with glaze dripping
- Steam rising from the coffee cup
- Butter visible, suggesting warmth
- Powdered sugar dusting on pastries

PROPS:
- White ceramic cup and saucer
- Small vase with fresh flowers (lavender or wildflowers)
- Linen napkin
- Scattered coffee beans
- Vintage spoon

LIGHTING:
- Soft diffused window light
- Warm golden tones
- Gentle shadows
- Backlight creating steam glow
- Dreamy, lifestyle aesthetic

QUALITY:
- Professional lifestyle photography, 8K
- Warm color grading
- Soft focus on background
- Instagram-perfect aesthetic
- Kinfolk or Cereal magazine style`,

  'street-food': `GENERATE A STUNNING STREET FOOD PHOTOGRAPH

SCENE SETUP:
- Authentic hawker-style presentation
- Night market atmosphere with warm artificial lighting
- Close-up hero shot, slight angle
- Busy, vibrant background (blurred)
- Street food stall context

FOOD STYLING:
- Feature popular Asian street food:
  - Char kway teow or pad thai with wok hei (smoky char)
  - OR crispy fried chicken with golden coating
  - OR loaded satay skewers with peanut sauce
- Glistening with oil and sauce
- Steam rising dramatically
- Generous portions, abundance
- Messy-delicious aesthetic

LIGHTING:
- Warm tungsten/sodium vapor light simulation
- Dramatic side lighting
- Steam highlighted by backlight
- Night market ambiance
- Slightly moody but appetizing

QUALITY:
- High resolution, documentary style
- Rich saturated colors
- Sharp focus on main dish
- Authentic street food energy
- Anthony Bourdain show aesthetic`
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

    // Use Gemini 2.0 Flash Experimental for image generation
    // This model supports text-to-image with responseModalities config
    // Reference: https://ai.google.dev/gemini-api/docs/image-generation
    const model = getGoogleAI().getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        responseModalities: ['Text', 'Image'] as const,
        temperature: 1.0,
      }
    })

    console.log('[Generate] Calling Gemini 3 Pro Image with retry logic...')

    const masterPrompt = `You are a world-class commercial food photographer creating images for premium food brands.

${fullPrompt}

CRITICAL TECHNICAL REQUIREMENTS:
1. RESOLUTION: Generate the highest possible resolution image (aim for 4K/8K quality)
2. SHARPNESS: Razor-sharp focus on the food subject, no blur or pixelation
3. COLORS: Rich, vibrant, appetizing colors - properly saturated but natural
4. LIGHTING: Professional studio or natural lighting as specified - no flat or dull lighting
5. COMPOSITION: Perfect framing following rule of thirds, proper negative space
6. STYLING: Food must look fresh, appetizing, and professionally styled
7. BACKGROUND: Clean, appropriate background as specified - no distracting elements
8. MOOD: Create the specific atmosphere requested for this category

This image will be used for commercial food marketing. It must be indistinguishable from a photo taken by a professional food photographer with high-end equipment.

Generate the image now with maximum quality and attention to detail.`

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
      const imageDataUrl = `data:${generatedImageMimeType};base64,${generatedImageBase64}`

      return NextResponse.json({
        success: true,
        category,
        imageDataUrl,
        textResponse,
        model: 'gemini-3-pro-image-preview',
        message: `AI-generated ${category} food photo (Gemini 3 Pro)`
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
