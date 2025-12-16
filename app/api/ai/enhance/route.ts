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

// Style preset prompts - 30+ presets with SEA market focus
const stylePrompts: Record<string, string> = {
  // SEA Delivery Platforms
  'grab': 'Professional food photography optimized for GrabFood listing. Clean bright background, perfectly lit from above, appetizing presentation, high contrast, vibrant colors that make food look fresh and irresistible. Square format, hero shot angle.',
  'foodpanda': 'High-impact food photo for Foodpanda marketplace. Bright, clean presentation, vibrant saturated colors, professional studio lighting. Square format optimized for pink/magenta brand context.',
  'deliveroo': 'Premium food photography for Deliveroo SEA. Clean modern aesthetic, professional lighting, appetizing styling. Teal-friendly color palette, high quality restaurant feel.',
  'gojek': 'GoFood Indonesia-style food photography. Bright, appetizing, approachable presentation. Clean background, vibrant colors, suitable for local SEA cuisine.',
  'shopee': 'ShopeeFood marketplace optimized photo. Bright, eye-catching, high saturation. Orange-friendly tones, clean background, scroll-stopping appeal.',
  'delivery': 'Professional food photography for delivery app listing. Clean white or light background, perfectly lit from above, appetizing presentation, high contrast, vibrant colors that make food look fresh and delicious.',

  // Social Media Platforms
  'instagram': 'Instagram-worthy food photo. Vibrant colors, perfect lighting, lifestyle aesthetic, appetizing and shareable. Square format composition, trendy food styling, natural light effect.',
  'instagram-stories': 'Vertical 9:16 format food photo for Instagram Stories. Dynamic composition, bold colors, eye-catching presentation, modern and trendy aesthetic with room for text overlay.',
  'instagram-reels': 'High-energy vertical food content for Instagram Reels. Punchy colors, dynamic angles, scroll-stopping visual impact. Modern Gen-Z aesthetic.',
  'tiktok': 'TikTok-optimized food visual. Eye-catching, scroll-stopping, vibrant colors. Dynamic composition, trendy aesthetic, designed to grab attention in first 0.5 seconds.',
  'facebook': 'Facebook feed optimized food photo. Warm, inviting, shareable aesthetic. Balanced colors, approachable presentation, works well in varied feed contexts.',
  'xiaohongshu': 'Xiaohongshu (RED) style food photo. Trendy, lifestyle-focused, pastel or vibrant colors. Cute presentation, social media perfect, Chinese youth aesthetic.',
  'wechat': 'WeChat Moments shareable format. Clean, professional, culturally appropriate for Chinese social media. Elegant but not overly stylized.',

  // Restaurant Styles
  'fine-dining': 'Fine dining restaurant photography. Dark, moody background with dramatic lighting. Elegant plating, sophisticated atmosphere, Michelin-star quality presentation.',
  'casual': 'Warm, inviting casual dining photo. Natural wood tones, cozy atmosphere, comfort food aesthetic. Friendly and approachable presentation.',
  'fast-food': 'High-energy fast food marketing photo. Bold colors, high saturation, appetizing and indulgent. Dynamic angles, youthful and exciting presentation.',
  'cafe': 'Artisan cafe aesthetic. Rustic wood surfaces, natural light, handcrafted feel. Cozy coffee shop atmosphere, Instagram-worthy plating.',
  'street-food': 'Authentic street food photography. Vibrant, energetic, real-world atmosphere. Captures the essence of hawker culture and street dining.',
  'menu': 'Professional menu card photography. Clean, elegant presentation on neutral background. Professional studio lighting, precise food styling, suitable for printed menus.',
  'kopitiam': 'Traditional kopitiam coffee shop aesthetic. Nostalgic, warm, local SEA heritage feel. Rustic surfaces, vintage atmosphere, comfort food presentation.',
  'hawker': 'Hawker centre style food photography. Authentic, vibrant, captures the spirit of SEA street food culture. Casual but appetizing presentation.',

  // Background Styles
  'minimal': 'Minimalist food photography on pure white background. Clean, product-focused, professional e-commerce style. Maximum clarity and food focus.',
  'rustic': 'Rustic wooden table surface backdrop. Natural, organic feel, artisan aesthetic. Warm wood tones complement food colors.',
  'marble': 'Elegant marble surface backdrop. Luxury, sophisticated, upscale restaurant feel. Cool tones, premium aesthetic.',
  'dark-moody': 'Dark moody food photography. Dramatic shadows, rich contrast, artistic presentation. Sophisticated, editorial magazine style.',
  'bright-airy': 'Bright and airy natural light aesthetic. Fresh, healthy, appetizing. Soft shadows, clean whites, lifestyle magazine feel.',
  'tropical': 'Tropical paradise aesthetic. Bright vibrant colors, palm leaves, exotic fruits. Perfect for tropical cuisine and beach vibes.',
  'concrete': 'Industrial concrete surface backdrop. Modern, urban, edgy aesthetic. Works great for trendy cafe and modern cuisine.',
  'botanical': 'Botanical green backdrop with plants and leaves. Fresh, healthy, organic aesthetic. Perfect for salads, healthy bowls, vegetarian cuisine.',

  // Photography Techniques
  'overhead': 'Flat lay top-down food photography. Perfect symmetry, full dish visibility, ideal for complex platings and bowls.',
  'natural-light': 'Window-lit natural light photography. Soft, diffused lighting, organic feel. No harsh shadows, gentle gradients.',
  'neon': 'Neon-lit night market style. Vibrant artificial lighting, urban nightlife aesthetic. Bold colors, modern edge.',
  'vintage': 'Vintage nostalgic aesthetic. Warm sepia tones, film grain, retro feel. Comfort food, heritage recipes.',
  'hdr': 'HDR enhanced high dynamic range. Maximum detail in shadows and highlights, punchy colors, dramatic impact.',
  'bokeh': 'Shallow depth of field with bokeh background. Blurred background lights, focus on food subject, artistic restaurant atmosphere.',

  // Legacy presets (for backward compatibility)
  'stories': 'Vertical 9:16 format food photo for Instagram Stories and Reels. Dynamic composition, bold colors, eye-catching presentation, modern and trendy aesthetic.',
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
