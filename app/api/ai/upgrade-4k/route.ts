import { NextRequest, NextResponse } from 'next/server'
import Replicate from 'replicate'
import { getBusinessFromRequest } from '@/lib/auth/get-business'
import { deductCreditsWithAutoTopUp } from '@/lib/auto-topup'
import { createClient } from '@supabase/supabase-js'

// Use Node.js runtime for Replicate
export const runtime = 'nodejs'

// Extend timeout to 120 seconds for 4K upscaling + storage
export const maxDuration = 120

// ═══════════════════════════════════════════════════════════════════════════
// 4K UPGRADE API
// Upscales existing 2K (2048x2048) images to 4K (4096x4096)
// Cost: 1 credit per upgrade
// Uses Replicate Real-ESRGAN for high-quality upscaling
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

async function upscaleTo4K(imageUrl: string): Promise<string> {
  console.log('[4K Upgrade] Starting Real-ESRGAN 2x upscale (2K -> 4K)...')
  const startTime = Date.now()

  try {
    const replicate = getReplicate()

    // Run Real-ESRGAN model with 2x scale
    // 2048 x 2 = 4096 (4K resolution)
    const output = await replicate.run(
      'nightmareai/real-esrgan:f121d640bd286e1fdc67f9799164c1d5be36ff74576ee11c803ae5b665dd46aa',
      {
        input: {
          image: imageUrl,
          scale: 2, // 2x upscale: 2048 -> 4096
          face_enhance: false, // Not needed for food photos
        }
      }
    )

    const duration = ((Date.now() - startTime) / 1000).toFixed(1)
    console.log(`[4K Upgrade] Real-ESRGAN completed in ${duration}s`)

    // Extract URL from Replicate output
    let outputUrl: string | null = null

    try {
      const outputStr = String(output)
      if (outputStr.startsWith('http')) {
        outputUrl = outputStr
      } else if (Array.isArray(output) && output.length > 0) {
        const first = String(output[0])
        if (first.startsWith('http')) {
          outputUrl = first
        }
      }
    } catch {
      console.log('[4K Upgrade] Could not convert output to string')
    }

    // Fallback: try JSON parsing for object responses
    if (!outputUrl) {
      try {
        const jsonStr = JSON.stringify(output)
        const urlMatch = jsonStr.match(/"(https?:\/\/[^"]+)"/)?.[1]
        if (urlMatch) {
          outputUrl = urlMatch
        }
      } catch {
        console.log('[4K Upgrade] Could not parse output as JSON')
      }
    }

    if (!outputUrl) {
      throw new Error('Could not extract upscaled image URL from Replicate output')
    }

    console.log('[4K Upgrade] Got upscaled image URL:', outputUrl.substring(0, 80) + '...')
    return outputUrl
  } catch (error) {
    console.error('[4K Upgrade] Error:', error)
    throw error
  }
}

async function storeUpscaledImage(
  imageUrl: string,
  originalImageId: string
): Promise<{ url: string; size: number }> {
  console.log('[4K Upgrade] Storing 4K image to Supabase...')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase configuration for storage')
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  // Fetch the upscaled image from Replicate URL
  const response = await fetch(imageUrl)
  if (!response.ok) {
    throw new Error(`Failed to fetch upscaled image: ${response.status}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  const imageBuffer = Buffer.from(arrayBuffer)
  const imageSize = imageBuffer.length

  console.log('[4K Upgrade] Fetched 4K image:', imageSize, 'bytes')

  // Store in the same folder as original with -4k suffix
  const bucketName = 'generated-images'
  const fileName = `${originalImageId}/4k-upscaled.png`

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from(bucketName)
    .upload(fileName, imageBuffer, {
      contentType: 'image/png',
      cacheControl: '31536000', // 1 year cache
      upsert: true
    })

  if (uploadError) {
    console.error('[4K Upgrade] Upload error:', uploadError)
    throw uploadError
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from(bucketName)
    .getPublicUrl(fileName)

  console.log('[4K Upgrade] Stored 4K image:', publicUrl)

  return { url: publicUrl, size: imageSize }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: '4K Upgrade API',
    description: 'Upscales 2K images to 4K (4096x4096)',
    cost: '1 credit per upgrade',
    method: 'POST',
    body: {
      imageUrl: 'URL of the 2K image to upscale',
      imageId: 'Image ID from the original generation'
    }
  })
}

export async function POST(request: NextRequest) {
  console.log('[4K Upgrade] API called')

  try {
    // 1. Authenticate user
    const business = await getBusinessFromRequest(request)
    if (!business) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please log in.' },
        { status: 401 }
      )
    }

    console.log('[4K Upgrade] Business:', business.id, 'Credits:', business.credits_remaining)

    // 2. Check credits
    if ((business.credits_remaining || 0) < 1) {
      return NextResponse.json(
        {
          success: false,
          error: 'Insufficient credits',
          credits_remaining: business.credits_remaining || 0,
          message: 'You need at least 1 credit to upgrade to 4K. Please purchase more credits.'
        },
        { status: 402 }
      )
    }

    // 3. Parse request body
    const body = await request.json()
    const { imageUrl, imageId } = body

    if (!imageUrl) {
      return NextResponse.json(
        { success: false, error: 'Missing imageUrl parameter' },
        { status: 400 }
      )
    }

    if (!imageId) {
      return NextResponse.json(
        { success: false, error: 'Missing imageId parameter' },
        { status: 400 }
      )
    }

    console.log('[4K Upgrade] Processing image:', imageId)
    console.log('[4K Upgrade] Source URL:', imageUrl.substring(0, 80) + '...')

    // 4. Upscale to 4K using Replicate
    const upscaledUrl = await upscaleTo4K(imageUrl)

    // 5. Store the 4K image in Supabase
    const stored = await storeUpscaledImage(upscaledUrl, imageId)

    // 6. Deduct 1 credit (with auto top-up check)
    const creditResult = await deductCreditsWithAutoTopUp(
      business.id,
      1,
      `4K upgrade for image: ${imageId}`,
      imageId
    )

    if (!creditResult.success) {
      // Credit deduction failed - but image was already generated
      // Log this but still return the image
      console.error('[4K Upgrade] Credit deduction failed:', creditResult.error)
    }

    console.log('[4K Upgrade] Success! New balance:', creditResult.newBalance)

    // 7. Return success with 4K image URL
    return NextResponse.json({
      success: true,
      imageId,
      resolution: '4K',
      dimensions: {
        width: 4096,
        height: 4096
      },
      url: stored.url,
      size: stored.size,
      sizeFormatted: `${(stored.size / 1024 / 1024).toFixed(2)} MB`,
      creditsDeducted: 1,
      creditsRemaining: creditResult.newBalance,
      message: '4K upgrade complete! Click to download your high-resolution image.'
    })

  } catch (error: unknown) {
    console.error('[4K Upgrade] Error:', error)
    const errorMessage = (error as Error).message || 'Unknown error'

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        message: 'Failed to upgrade image to 4K'
      },
      { status: 500 }
    )
  }
}
