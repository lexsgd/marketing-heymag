import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import {
  checkRateLimit,
  rateLimitedResponse,
  aiLogger as logger,
} from '@/lib/security'

// Use Node.js runtime for Google AI SDK
export const runtime = 'nodejs'
export const maxDuration = 60

// Resolution configurations
const RESOLUTION_CONFIG = {
  '2K': {
    size: 2048,
    description: '2048x2048 pixels',
    creditCost: 0, // Already enhanced, no extra cost
  },
  '4K': {
    size: 4096,
    description: '4096x4096 pixels',
    creditCost: 1, // Extra credit for 4K
  },
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

// Retry logic for Gemini API
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
  return (
    errorMessage.includes('503') ||
    errorMessage.includes('service unavailable') ||
    errorMessage.includes('429') ||
    errorMessage.includes('too many requests') ||
    errorMessage.includes('timeout') ||
    errorMessage.includes('overloaded') ||
    errorMessage.includes('fetch failed')
  )
}

async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  operationName: string,
  maxRetries = 3
): Promise<T> {
  let lastError: unknown
  let delayMs = 2000

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.debug(`${operationName}: Attempt ${attempt}/${maxRetries}`)
      return await operation()
    } catch (error) {
      lastError = error
      if (!isRetryableError(error) || attempt === maxRetries) {
        throw error
      }
      logger.debug(`${operationName}: Waiting ${delayMs}ms before retry`)
      await sleep(delayMs)
      delayMs = Math.min(delayMs * 2, 5000)
    }
  }
  throw lastError
}

export async function POST(request: NextRequest) {
  logger.info('Upscale API called')

  try {
    // Rate limiting
    const identifier = request.headers.get('x-forwarded-for') || 'anonymous'
    const rateLimitResult = await checkRateLimit(identifier, 'ai-enhance')
    if (!rateLimitResult.success) {
      return rateLimitedResponse(rateLimitResult)
    }

    // Parse request
    const body = await request.json()
    const { imageId, resolution } = body as { imageId: string; resolution: '2K' | '4K' }

    if (!imageId) {
      return NextResponse.json({ error: 'Image ID is required' }, { status: 400 })
    }

    if (!resolution || !['2K', '4K'].includes(resolution)) {
      return NextResponse.json({ error: 'Resolution must be 2K or 4K' }, { status: 400 })
    }

    const resolutionConfig = RESOLUTION_CONFIG[resolution]
    logger.info('Upscaling image', { imageId, resolution, targetSize: resolutionConfig.size })

    // Get authenticated user
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get business
    const { data: business } = await supabase
      .from('businesses')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    // Get image record
    const { data: image, error: imageError } = await supabase
      .from('images')
      .select('*')
      .eq('id', imageId)
      .eq('business_id', business.id)
      .single()

    if (imageError || !image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 })
    }

    // Check if image is enhanced
    if (!image.enhanced_url) {
      return NextResponse.json({ error: 'Image must be enhanced first' }, { status: 400 })
    }

    // Check credits for 4K
    const serviceSupabase = createServiceRoleClient()

    if (resolutionConfig.creditCost > 0) {
      const { data: credits } = await supabase
        .from('credits')
        .select('credits_remaining, credits_used')
        .eq('business_id', business.id)
        .single()

      if (!credits || credits.credits_remaining < resolutionConfig.creditCost) {
        return NextResponse.json({
          error: 'Insufficient credits',
          creditsRequired: resolutionConfig.creditCost,
          creditsRemaining: credits?.credits_remaining || 0
        }, { status: 402 })
      }
    }

    // Fetch the enhanced image
    logger.debug('Fetching enhanced image')
    const imageResponse = await fetch(image.enhanced_url)
    if (!imageResponse.ok) {
      throw new Error('Failed to fetch enhanced image')
    }

    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer())
    const base64Image = imageBuffer.toString('base64')
    const mimeType = 'image/png'

    // Use Gemini 3 Pro Image for upscaling
    const model = getGoogleAI().getGenerativeModel({
      model: 'gemini-3-pro-image-preview',
      generationConfig: {
        responseModalities: ['Text', 'Image'],
        temperature: 1.0,
      } as unknown as import('@google/generative-ai').GenerationConfig
    })

    const upscalePrompt = `You are a professional image upscaler. Your task is to UPSCALE this food photograph to ${resolution} resolution (${resolutionConfig.size}x${resolutionConfig.size} pixels).

CRITICAL RULES:
1. PRESERVE the image EXACTLY as it is - same composition, same content, same colors
2. DO NOT change, modify, or enhance anything about the image
3. ONLY increase the resolution and add detail where needed
4. Maintain the exact same aspect ratio and framing
5. The output must look IDENTICAL to the input, just at higher resolution

OUTPUT: ${resolution} resolution (${resolutionConfig.size}x${resolutionConfig.size}) - maximum quality and detail`

    // Call Gemini with retry
    const result = await retryWithBackoff(
      async () => {
        return await withTimeout(
          model.generateContent([
            {
              inlineData: {
                mimeType,
                data: base64Image
              }
            },
            { text: upscalePrompt }
          ]),
          20000,
          'Gemini upscale request timeout'
        )
      },
      `Gemini ${resolution} Upscale`,
      3
    )

    const response = await result.response
    let upscaledBuffer: Buffer | null = null

    for (const candidate of response.candidates || []) {
      for (const part of candidate.content?.parts || []) {
        if (part.inlineData?.data) {
          upscaledBuffer = Buffer.from(part.inlineData.data, 'base64')
          logger.debug('Received upscaled image', { size: upscaledBuffer.length })
        }
      }
    }

    if (!upscaledBuffer) {
      throw new Error('Failed to generate upscaled image')
    }

    // Upload upscaled image
    const upscaledFileName = `${business.id}/upscaled/${imageId}-${resolution}-${Date.now()}.png`

    const { error: uploadError } = await serviceSupabase.storage
      .from('images')
      .upload(upscaledFileName, upscaledBuffer, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      throw new Error('Failed to upload upscaled image')
    }

    const { data: { publicUrl } } = serviceSupabase.storage
      .from('images')
      .getPublicUrl(upscaledFileName)

    // Deduct credit for 4K
    if (resolutionConfig.creditCost > 0) {
      const { data: credits } = await supabase
        .from('credits')
        .select('credits_remaining, credits_used')
        .eq('business_id', business.id)
        .single()

      if (credits) {
        await serviceSupabase
          .from('credits')
          .update({
            credits_remaining: credits.credits_remaining - resolutionConfig.creditCost,
            credits_used: credits.credits_used + resolutionConfig.creditCost,
            updated_at: new Date().toISOString(),
          })
          .eq('business_id', business.id)

        // Log transaction
        await serviceSupabase
          .from('credit_transactions')
          .insert({
            business_id: business.id,
            amount: -resolutionConfig.creditCost,
            transaction_type: 'usage',
            description: `4K upscale - ${image.original_filename || 'image'}`,
            image_id: imageId,
            balance_after: credits.credits_remaining - resolutionConfig.creditCost,
          })
      }
    }

    // Update image record with upscaled URL
    const upscaleField = resolution === '4K' ? 'upscaled_4k_url' : 'upscaled_2k_url'
    await supabase
      .from('images')
      .update({
        [upscaleField]: publicUrl,
        [`${upscaleField}_created_at`]: new Date().toISOString(),
      })
      .eq('id', imageId)

    logger.info('Upscale complete', { imageId, resolution, url: publicUrl })

    return NextResponse.json({
      success: true,
      imageId,
      resolution,
      upscaledUrl: publicUrl,
      creditsCost: resolutionConfig.creditCost,
    })

  } catch (error: unknown) {
    logger.error('Upscale API error', error as Error)
    return NextResponse.json(
      { error: (error as Error).message || 'Upscale failed' },
      { status: 500 }
    )
  }
}
