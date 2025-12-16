import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import sharp from 'sharp'

// Use Node.js runtime (not Edge) for Sharp and Google AI SDK
export const runtime = 'nodejs'

// Lazy initialization of Google AI client
let genAI: GoogleGenerativeAI | null = null

function getGoogleAI(): GoogleGenerativeAI {
  if (!genAI) {
    genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '')
  }
  return genAI
}

// Style preset prompts
const stylePrompts: Record<string, string> = {
  'delivery': 'Professional food photography for delivery app listing. Clean white or light background, perfectly lit from above, appetizing presentation, high contrast, vibrant colors that make food look fresh and delicious. Optimized for DoorDash, Uber Eats, and GrabFood.',
  'instagram': 'Instagram-worthy food photo. Vibrant colors, perfect lighting, lifestyle aesthetic, appetizing and shareable. Square format composition, trendy food styling, natural light effect.',
  'stories': 'Vertical 9:16 format food photo for Instagram Stories and Reels. Dynamic composition, bold colors, eye-catching presentation, modern and trendy aesthetic.',
  'menu': 'Professional menu card photography. Clean, elegant presentation on neutral background. Professional studio lighting, precise food styling, suitable for printed menus.',
  'fine-dining': 'Fine dining restaurant photography. Dark, moody background with dramatic lighting. Elegant plating, sophisticated atmosphere, Michelin-star quality presentation.',
  'casual': 'Warm, inviting casual dining photo. Natural wood tones, cozy atmosphere, comfort food aesthetic. Friendly and approachable presentation.',
  'fast-food': 'High-energy fast food marketing photo. Bold colors, high saturation, appetizing and indulgent. Dynamic angles, youthful and exciting presentation.',
  'cafe': 'Artisan cafe aesthetic. Rustic wood surfaces, natural light, handcrafted feel. Cozy coffee shop atmosphere, Instagram-worthy plating.',
  'xiaohongshu': 'Xiaohongshu (RED) style food photo. Trendy, lifestyle-focused, pastel or vibrant colors. Cute presentation, social media perfect, Chinese youth aesthetic.',
  'wechat': 'WeChat Moments shareable format. Clean, professional, culturally appropriate for Chinese social media. Elegant but not overly stylized.',
}

// Apply image enhancements using Sharp
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
): Promise<Buffer> {
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
  try {
    const { imageId, stylePreset } = await request.json()

    if (!imageId) {
      return NextResponse.json({ error: 'Image ID is required' }, { status: 400 })
    }

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

    // Check credits
    const { data: credits } = await supabase
      .from('credits')
      .select('credits_remaining, credits_used')
      .eq('business_id', business.id)
      .single()

    if (!credits || credits.credits_remaining < 1) {
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 })
    }

    // Update image status to processing
    await supabase
      .from('images')
      .update({ status: 'processing' })
      .eq('id', imageId)

    // Use service role for storage and credit operations
    const serviceSupabase = createServiceRoleClient()

    try {
      // Get the style prompt
      const stylePrompt = stylePrompts[stylePreset] || stylePrompts['delivery']

      // Fetch the original image
      const imageResponse = await fetch(image.original_url)
      const imageArrayBuffer = await imageResponse.arrayBuffer()
      const imageBuffer = Buffer.from(imageArrayBuffer)
      const base64Image = imageBuffer.toString('base64')
      const mimeType = image.mime_type || 'image/jpeg'

      // Call Google Gemini for image analysis and enhancement recommendations
      const model = getGoogleAI().getGenerativeModel({ model: 'gemini-1.5-flash' })

      const result = await model.generateContent([
        {
          inlineData: {
            mimeType,
            data: base64Image
          }
        },
        {
          text: `You are a professional food photographer. Analyze this food photograph and provide specific enhancement values to make it look like: ${stylePrompt}

          Analyze the current image and provide SPECIFIC numerical adjustments.
          Be bold with your adjustments - food photos often need significant enhancement to look appetizing.

          Return ONLY valid JSON with these exact fields (all values are integers):
          {
            "enhancements": {
              "brightness": <-50 to 50, positive makes brighter>,
              "contrast": <-50 to 50, positive increases contrast>,
              "saturation": <-50 to 80, positive makes colors more vivid - food usually needs +20 to +50>,
              "warmth": <-30 to 30, positive adds warm yellow/orange tones - food usually benefits from +5 to +15>,
              "sharpness": <0 to 80, higher makes edges crisper - food photos benefit from 30-60>,
              "highlights": <-30 to 30, negative recovers blown highlights>,
              "shadows": <-30 to 30, positive lifts shadows to show detail>
            },
            "suggestions": ["<specific improvement tip 1>", "<tip 2>", "<tip 3>"],
            "styleMatch": <0-100 how well the enhanced image will match the target style>,
            "overallRating": <1-10 quality rating>
          }`
        }
      ])

      const response = await result.response
      const text = response.text()

      console.log('[Enhance] AI response:', text.substring(0, 500))

      // Parse the enhancement suggestions
      let enhancementData
      try {
        // Extract JSON from the response
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          enhancementData = JSON.parse(jsonMatch[0])
        } else {
          throw new Error('No JSON found in response')
        }
      } catch (parseError) {
        console.log('[Enhance] Using default enhancements, parse error:', parseError)
        // Use style-appropriate defaults
        enhancementData = getDefaultEnhancements(stylePreset)
      }

      console.log('[Enhance] Applying enhancements:', enhancementData.enhancements)

      // Apply the enhancements using Sharp
      const enhancedBuffer = await applyEnhancements(imageBuffer, enhancementData.enhancements)

      // Upload enhanced image to Supabase Storage
      const fileExt = image.original_filename?.split('.').pop() || 'jpg'
      const enhancedFileName = `${business.id}/enhanced/${Date.now()}.${fileExt}`

      const { error: uploadError } = await serviceSupabase.storage
        .from('images')
        .upload(enhancedFileName, enhancedBuffer, {
          contentType: mimeType,
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('[Enhance] Upload error:', uploadError)
        throw new Error('Failed to upload enhanced image')
      }

      // Get public URL for enhanced image
      const { data: { publicUrl: enhancedUrl } } = serviceSupabase.storage
        .from('images')
        .getPublicUrl(enhancedFileName)

      // Update image record with enhanced URL
      await supabase
        .from('images')
        .update({
          status: 'completed',
          enhanced_url: enhancedUrl,
          enhancement_settings: enhancementData.enhancements,
          processed_at: new Date().toISOString(),
          ai_model: 'gemini-1.5-flash',
          ai_suggestions: enhancementData.suggestions,
        })
        .eq('id', imageId)

      // Deduct credit
      await serviceSupabase
        .from('credits')
        .update({
          credits_remaining: credits.credits_remaining - 1,
          credits_used: credits.credits_used + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('business_id', business.id)

      // Log credit transaction
      await serviceSupabase
        .from('credit_transactions')
        .insert({
          business_id: business.id,
          amount: -1,
          transaction_type: 'usage',
          description: `Image enhancement - ${stylePreset} style`,
          image_id: imageId,
          balance_after: credits.credits_remaining - 1,
        })

      return NextResponse.json({
        success: true,
        imageId,
        enhancedUrl,
        enhancements: enhancementData,
        creditsRemaining: credits.credits_remaining - 1,
      })
    } catch (aiError: unknown) {
      console.error('AI Enhancement error:', aiError)

      // Update image status to failed
      await supabase
        .from('images')
        .update({
          status: 'failed',
          error_message: (aiError as Error).message || 'Enhancement failed',
        })
        .eq('id', imageId)

      return NextResponse.json(
        { error: 'AI enhancement failed. Please try again.' },
        { status: 500 }
      )
    }
  } catch (error: unknown) {
    console.error('Enhance API error:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get style-appropriate default enhancements
function getDefaultEnhancements(stylePreset: string) {
  const defaults: Record<string, { enhancements: Record<string, number>, suggestions: string[], styleMatch: number, overallRating: number }> = {
    'delivery': {
      enhancements: { brightness: 15, contrast: 20, saturation: 35, warmth: 8, sharpness: 50, highlights: -5, shadows: 15 },
      suggestions: ['Increase vibrancy for app listings', 'Ensure clean background', 'Maximize appetizing appeal'],
      styleMatch: 85, overallRating: 8
    },
    'instagram': {
      enhancements: { brightness: 10, contrast: 15, saturation: 40, warmth: 10, sharpness: 45, highlights: 0, shadows: 10 },
      suggestions: ['Boost colors for feed visibility', 'Add warm tones', 'Enhance food texture'],
      styleMatch: 85, overallRating: 8
    },
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
  }

  return defaults[stylePreset] || defaults['delivery']
}
