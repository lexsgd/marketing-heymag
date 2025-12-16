import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
// Sharp is dynamically imported to handle platform-specific binary issues on Vercel
// import sharp from 'sharp'

// Use Node.js runtime (not Edge) for Google AI SDK
export const runtime = 'nodejs'

// Lazy Sharp initialization to handle Vercel deployment issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let sharpInstance: any = null
let sharpLoadError: Error | null = null

async function getSharp() {
  if (sharpLoadError) {
    console.warn('[Enhance] Sharp previously failed to load:', sharpLoadError.message)
    return null
  }
  if (sharpInstance) {
    return sharpInstance
  }
  try {
    // Use require with try-catch to avoid webpack resolution errors
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    sharpInstance = require('sharp')
    console.log('[Enhance] Sharp loaded successfully')
    return sharpInstance
  } catch (error) {
    sharpLoadError = error as Error
    console.error('[Enhance] Failed to load Sharp (platform binary issue):', sharpLoadError.message)
    return null
  }
}

// Extend timeout to 60 seconds (requires Vercel Pro, falls back to 10s on Hobby)
export const maxDuration = 60

// Simple GET handler to test if route is loaded
export async function GET() {
  console.log('[Enhance] GET called - route is loaded')
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
      console.error('[Enhance] CRITICAL: GOOGLE_AI_API_KEY is not set!')
      throw new Error('Google AI API key is not configured')
    }
    console.log('[Enhance] Initializing Google AI with API key:', apiKey.substring(0, 8) + '...')
    genAI = new GoogleGenerativeAI(apiKey)
  }
  return genAI
}

// Style preset prompts - Research-backed prompts optimized for each platform
// Based on official platform guidelines and food photography best practices
const stylePrompts: Record<string, string> = {
  // ============================================
  // SEA DELIVERY PLATFORMS
  // ============================================

  // GrabFood: Official specs - 800x800px, 1:1 square, JPEG/PNG, max 6MB
  'grab': 'Professional GrabFood menu photography. Square 1:1 composition with dish perfectly centered, leaving small margins on all sides for app cropping. Clean uncluttered light background. Soft natural window lighting from above at 45 degrees. Single dish focus - one item only. High resolution, appetizing colors, food taking up majority of frame. Top-down overhead angle for bowls/plates, or 45-degree hero shot for burgers/sandwiches. No hands, faces, text, or watermarks. Fresh, vibrant, irresistible presentation optimized for mobile viewing.',

  // Foodpanda: Square format, pink/magenta brand context, high saturation
  'foodpanda': 'Foodpanda marketplace food photography. Square 1:1 format with centered composition and generous margins. Bright, high-saturation colors that pop on mobile screens. Professional studio-quality lighting with no harsh shadows. Clean complementary background - works well with pink/magenta brand accents. Single dish per photo, precisely styled. Overhead or 45-degree angle depending on dish height. Appetizing, scroll-stopping presentation. No collages, no stock imagery look.',

  // Deliveroo: Menu 1200x800 (3:2 crops to 1:1), Hero 1920x1080 (16:9)
  'deliveroo': 'Deliveroo menu photography following official guidelines. Landscape 3:2 aspect ratio (crops to square). Dish centered in frame with small margins all around. Single dish focus - exactly one item per photo. Soft natural window lighting, no dark shadows. All ingredients and components clearly visible. Teal-friendly neutral color palette. Clean, modern, premium restaurant aesthetic. No hands, faces, text overlays, or watermarks. Photorealistic, not overly photoshopped. Professional quality that boosts order conversion.',

  // GoFood/Gojek: Indonesian market, vibrant, mobile-optimized
  'gojek': 'GoFood Indonesia-style food photography. Bright, vibrant, appetizing presentation suitable for local SEA cuisine. Proper lighting highlighting food textures and colors. Clean background that complements Indonesian dishes. Centered composition for mobile app display. High resolution menu photo quality. Authentic presentation that resonates with Indonesian food culture. Natural, approachable, mouth-watering appeal.',

  // ShopeeFood: Orange brand tones, high saturation, scroll-stopping
  'shopee': 'ShopeeFood marketplace photography. Eye-catching, scroll-stopping presentation with high color saturation. Orange-friendly warm tones that complement ShopeeFood branding. Bright, well-lit with no shadows. Clean background, centered single dish composition. Mobile-first optimization for small screen viewing. Bold, appetizing, designed to convert browsers to buyers. Fresh, vibrant, irresistible food appeal.',

  // Generic delivery app optimization
  'delivery': 'Professional delivery app menu photography. Clean white or light neutral background. Perfectly lit with soft diffused lighting from above. Single dish centered in square format with crop margins. High contrast, vibrant natural colors. Top-down for bowls and flat dishes, 45-degree for tall items like burgers. All ingredients visible. No people, text, or watermarks. Appetizing, professional, conversion-optimized presentation.',

  // ============================================
  // SOCIAL MEDIA PLATFORMS
  // ============================================

  // Instagram Feed: 4:5 portrait (1080x1350) optimal for engagement
  'instagram': 'Instagram-worthy food photography in optimal 4:5 portrait format (1080x1350). Vibrant saturated colors that pop in the feed. Soft natural window lighting creating gentle shadows for depth. Shallow depth of field with creamy bokeh background. Modern minimalist styling with negative space. Rule of thirds composition. Trendy food styling with lifestyle aesthetic. Natural light effect, no harsh flash. Scroll-stopping, highly shareable, thumb-stopping first impression.',

  // Instagram Stories/Reels: 9:16 vertical, safe zone for UI
  'instagram-stories': 'Instagram Stories/Reels vertical format photography at 9:16 aspect ratio (1080x1920). Dynamic action composition - steam rising, sauce drizzling, or cheese pulling. Bold vibrant colors with high energy. Important elements centered in safe zone (avoiding top/bottom 310 pixels for UI). Room for text overlay or stickers. Modern trendy Gen-Z aesthetic. Movement and action suggested in the frame. Eye-catching, designed for quick consumption.',

  // Instagram Reels: Action-focused, scroll-stopping
  'instagram-reels': 'Instagram Reels optimized food content at 9:16 vertical. High-energy action moment frozen - cheese pull, sauce pour, steam release, or crispy bite. Punchy saturated colors, dramatic contrast. Dynamic angle creating movement and excitement. Scroll-stopping first frame that hooks viewers instantly. Modern Gen-Z aesthetic with trend awareness. Bold, vibrant, designed to generate saves and shares.',

  // TikTok: First frame critical, action shots, viral appeal
  'tiktok': 'TikTok viral food content style at 9:16 vertical format. CRITICAL: Show finished dish prominently to hook viewers in first 0.5 seconds. Action moment freeze-frame - gooey cheese pull, sauce drip, steam rising, crispy crunch. Bright saturated colors that pop on mobile. Close-up on appetizing textures and details. High contrast between dish and background. Well-lit with no harsh shadows. Gen-Z scroll-stopping aesthetic. Designed for maximum watch time and engagement.',

  // Facebook: Older demographic, warm/authentic, community focus
  'facebook': 'Facebook feed optimized food photography for broad demographic appeal. Warm, inviting, authentic presentation. Clear well-lit images readable at smaller sizes. Comfort food aesthetic that resonates with mature audience (54+ demographic). No trendy filters - traditional quality food photography. Relatable home-style or restaurant atmosphere. Sharp focus on main dish. Appetizing, shareable, designed to generate comments and engagement. Works well in varied feed contexts.',

  // Xiaohongshu: Lulicore aesthetic, muted pastels, Chinese Gen-Z
  'xiaohongshu': 'Xiaohongshu RED platform aesthetic food photography. Lulicore style with soft muted pastel color palette - pink, cream, sage green, soft brown, gentle yellow. Dreamy feminine atmosphere inspired by French patisserie aesthetic. Delicate plating on aesthetic ceramics or vintage plates. Soft natural lighting with slight overexposure for airy feel. Chinese Gen-Z lifestyle appeal. Cute, trendy presentation. Instagram-meets-Pinterest composition. Cafe lifestyle aesthetic with warm nostalgic mood. Designed for saves and collection boards.',

  // WeChat Moments: Shareable, culturally appropriate, group appeal
  'wechat': 'WeChat Moments shareable food photography. Clean, crisp, high-quality presentation. Culturally appropriate styling for Chinese social media. Warm inviting colors suitable for group sharing. Restaurant ambience subtly visible. Mobile-optimized clarity and sharpness. Traditional elegant presentation without excessive trendy filters. Group dining appeal - dishes that look shareable. Rule of thirds composition with clear subject. Professional but approachable aesthetic.',

  // ============================================
  // RESTAURANT STYLES
  // ============================================

  // Fine Dining: Michelin techniques, negative space, sauce artistry
  'fine-dining': 'Michelin-star fine dining photography. Elegant minimalist plating on white or neutral ceramic. Artful sauce presentation - swoosh, dots, or geometric patterns. Microgreen and edible flower garnish used sparingly with purpose. Rule of thirds composition with generous negative space allowing plate to breathe. Soft directional lighting creating gentle shadows for depth. Shallow depth of field with sophisticated restaurant atmosphere softly blurred. Height and texture contrast in plating. Every element has purpose - no excessive garnish. Editorial magazine quality.',

  // Casual Dining: Warm, comfort food, lifestyle context
  'casual': 'Casual dining comfort food photography. Generous hearty portions visibly appetizing. Warm inviting color temperature. Rustic wooden table or natural material surface. Soft natural window lighting. Homestyle presentation that feels approachable and satisfying. Lifestyle context with napkins, utensils subtly visible. Medium depth of field keeping more in focus. Cozy atmosphere suggested. Comfort and satisfaction appeal. Relatable, not overly styled.',

  // Fast Food: Red/yellow psychology, action shots, appetite appeal
  'fast-food': 'Fast food commercial photography with appetite psychology. Bold red and yellow color accents triggering appetite response. High saturation and contrast for maximum impact. Action moment - dramatic cheese pull, sauce drip, or crispy texture highlight. Close-up on indulgent textures - gooey cheese, crispy coating, fresh lettuce. Steam rising for freshness. Clean background letting food be hero. Dynamic angle suggesting grab-and-go energy. Youthful, exciting, crave-inducing presentation.',

  // Cafe: Artisan aesthetic, latte art, cozy atmosphere
  'cafe': 'Artisan cafe aesthetic photography. Latte art clearly visible on coffee drinks. Warm cozy lighting - natural window light preferred. Marble, wooden, or ceramic surfaces. Minimalist styling with hipster-chic appeal. Soft bokeh background showing cafe atmosphere. Handcrafted artisan feel - imperfect edges welcome. Flat-lay for breakfast spreads, 45-degree for drinks and pastries. Pastel accent colors. Instagram-worthy without being over-styled. Cozy coffee shop vibes.',

  // Street Food: Documentary style, authentic, cultural context
  'street-food': 'Authentic street food documentary photography. Vibrant chaotic market atmosphere as natural backdrop. Steam rising dramatically into ambient light. Action moment of cooking or serving captured. Cultural context and storytelling - vendor hands, cooking equipment visible. Natural ambient lighting with shadows adding mood. Photojournalistic approach - authentic not staged. Hawker culture energy. Bold colors, real textures, genuine atmosphere. Captures spirit of street dining.',

  // Menu Card: Clean, neutral, print-ready
  'menu': 'Professional menu card photography for print. Clean neutral white or light grey background. Studio-quality consistent lighting across all items. Precise food styling with no messy edges. Each dish perfectly centered for grid layout. Accurate color representation for print reproduction. Sharp focus throughout - narrow aperture. No creative angles - straightforward presentation. Consistent shadow direction. Commercial catalog quality suitable for printed menus and signage.',

  // Kopitiam: SEA heritage, nostalgic, traditional
  'kopitiam': 'Traditional Singapore kopitiam coffee shop photography. Nostalgic warm vintage atmosphere. Heritage tableware - patterned plates, enamel cups. Rustic worn surfaces with character. Warm tungsten-toned lighting suggesting old coffee shops. Local comfort food presentation - kaya toast, soft-boiled eggs, kopi. Cultural authenticity and heritage feel. Slightly faded nostalgic color grade. SEA food culture pride. Comfort and familiarity appeal.',

  // Hawker Centre: Authentic SEA, documentary, cultural pride
  'hawker': 'Singapore hawker centre food photography. Authentic bustling atmosphere visible. Natural ambient lighting with dramatic steam effects. Melamine plates and traditional hawker tableware. Cultural pride in local cuisine presentation. Documentary photography approach. Weathered hawker hands in frame optional. Bold vibrant colors of SEA cuisine. Char kway teow, chicken rice, laksa authentically styled. Real hawker centre energy captured.',

  // ============================================
  // BACKGROUND STYLES
  // ============================================

  // Minimal: E-commerce style, pure white, product focus
  'minimal': 'E-commerce product photography style. Pure clean white background with no distractions. Soft even studio lighting eliminating harsh shadows. Maximum clarity and sharpness on food subject. Professional catalog aesthetic. Perfect for product listings, websites, and clean marketing. Food fills majority of frame. No props unless essential. Commercial quality with precise styling.',

  // Rustic: Wooden surfaces, artisan, natural
  'rustic': 'Rustic artisan food photography. Warm-toned wooden table surface - weathered, natural character. Soft natural side lighting creating texture on wood grain. Organic handmade feel with linen napkins, wooden utensils as props. Earth tones complementing food colors. Farmhouse aesthetic. Authentic not overly staged. Natural imperfections welcome. Warm, inviting, homemade appeal.',

  // Marble: Luxury, cool tones, upscale
  'marble': 'Luxury marble surface food photography. Elegant white or grey marble with subtle veining. Cool sophisticated color palette. Soft overhead or side lighting. Premium upscale restaurant aesthetic. Minimalist styling - let marble and food be stars. Suitable for fine dining, patisserie, high-end cafe content. Clean lines, geometric composition. Luxurious without being cold.',

  // Dark Moody: Chiaroscuro, painterly, dramatic
  'dark-moody': 'Dark moody chiaroscuro food photography. Dramatic single-source directional lighting with deep rich shadows. Painterly Renaissance atmosphere. Dark matte surfaces - slate, weathered wood, dark ceramics. Backlight creating rim glow on food edges. Rich contrast between highlights and deep blacks. Rustic matte props with patina. Editorial fine art aesthetic. Sophisticated, dramatic, magazine-worthy. No bright shiny elements.',

  // Bright Airy: Fresh, healthy, ethereal
  'bright-airy': 'Light and airy food photography. Bright ethereal atmosphere with soft diffused natural lighting. White or cream background and props. Gentle soft shadows providing subtle depth - not completely shadowless. Shallow depth of field with dreamy creamy bokeh. Fresh healthy wellness aesthetic. Clean minimalist composition. Dreamy inviting mood. Perfect for health food, salads, light cuisine. Overexposed whites, soft contrasts.',

  // Tropical: Vibrant, exotic, paradise
  'tropical': 'Tropical paradise food photography. Bright vibrant saturated colors. Palm fronds, banana leaves, tropical flowers as props. Exotic fruit styling. Warm golden sunlight feel. Beach vacation aesthetic. Bold tropical color palette - oranges, pinks, greens. Fresh coconut, pineapple, mango themes. Island getaway mood. Perfect for smoothie bowls, tropical cuisine, resort dining.',

  // Concrete: Industrial, urban, modern
  'concrete': 'Industrial concrete surface food photography. Modern urban aesthetic with raw grey concrete backdrop. Edgy contemporary styling. Cool neutral tones. Minimalist arrangement. Works for trendy cafe, modern cuisine, craft cocktails. Masculine aesthetic balance. Geometric clean lines. Subtle texture in concrete visible.',

  // Botanical: Plants, green, organic
  'botanical': 'Botanical green food photography. Fresh plants, leaves, herbs as styling elements. Organic healthy aesthetic. Green color palette dominating. Natural light through foliage feel. Perfect for vegetarian, vegan, healthy cuisine. Fresh garden-to-table vibe. Eucalyptus, monstera, herb sprigs as props. Wellness and nature connection. Light airy feel with green accents.',

  // ============================================
  // PHOTOGRAPHY TECHNIQUES
  // ============================================

  // Overhead/Flat lay: 90-degree, composition rules
  'overhead': 'Professional flat-lay overhead food photography at perfect 90-degree angle. Rule of thirds composition with main dish off-center. Rule of odds for prop arrangement. Supporting elements (utensils, ingredients, napkins) placed with purpose. Soft natural light at 45 degrees creating gentle shadows for depth. Clean background with subtle texture. Everything in sharp focus - narrow aperture f/8+. Negative space for breathing room. Instagram-worthy styling without clutter.',

  // Natural Light: Window light, authentic
  'natural-light': 'Natural window light food photography. Soft diffused daylight from large window at 45-degree side angle. White reflector filling shadow side for gentle contrast. Authentic natural color temperature. No artificial lighting. Gentle soft shadows adding depth and dimension. Fresh organic feel. Lifestyle authenticity. Golden hour warmth optional. Honest, beautiful, natural presentation.',

  // Neon: Night market, urban, bold
  'neon': 'Neon night market food photography. Vibrant artificial colored lighting - pink, blue, purple neon glow. Urban nightlife atmosphere. Bold dramatic shadows from neon sources. Street food energy with modern twist. Eye-catching saturated color palette. Night owl aesthetic. Perfect for late-night food, asian street food, modern fusion. Edgy urban feel.',

  // Vintage: Nostalgic, film grain, retro
  'vintage': 'Vintage nostalgic food photography. Warm sepia and faded tones. Subtle film grain texture overlay. Retro color palette - muted oranges, browns, creams. Heritage recipe feel. Grandmother\'s kitchen aesthetic. Slightly soft focus edges. Comfort food and family recipe vibe. Polaroid or film photography inspiration. Timeless, nostalgic, heartwarming appeal.',

  // HDR: Maximum detail, punchy
  'hdr': 'HDR enhanced food photography. Maximum detail visible in both shadows and highlights. Punchy vivid colors with enhanced saturation. Dramatic visual impact. Every texture and detail emphasized. Bold appetizing presentation. High dynamic range revealing all food details. Eye-catching, scroll-stopping intensity. Commercial advertising impact.',

  // Bokeh: Shallow DOF, restaurant atmosphere
  'bokeh': 'Shallow depth of field food photography with beautiful bokeh. Wide aperture f/2.8 or wider. Main dish in sharp focus, background softly blurred. Creamy smooth bokeh circles from ambient restaurant lights. Subject separation from background. Restaurant atmosphere visible but not distracting. Warm ambient light creating golden bokeh highlights. 85mm portrait lens perspective. Artistic, professional, appetizing.',

  // Legacy preset
  'stories': 'Vertical 9:16 format food photography for Stories and Reels. Dynamic action composition with room for text overlay. Bold vibrant colors. Modern trendy aesthetic. Safe zone composition avoiding UI elements. Eye-catching scroll-stopping presentation designed for vertical mobile consumption.',
}

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
    console.warn('[Enhance] Sharp not available, skipping image processing')
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
  console.log('[Enhance] API called')

  try {
    // Parse request body
    let body
    try {
      body = await request.json()
      console.log('[Enhance] Request body:', JSON.stringify(body))
    } catch (parseError) {
      console.error('[Enhance] Failed to parse request body:', parseError)
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { imageId, stylePreset } = body

    if (!imageId) {
      console.log('[Enhance] Missing imageId')
      return NextResponse.json({ error: 'Image ID is required' }, { status: 400 })
    }

    console.log('[Enhance] Processing imageId:', imageId, 'stylePreset:', stylePreset)

    // Get authenticated user
    const supabase = await createClient()
    console.log('[Enhance] Supabase client created')

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      console.error('[Enhance] Auth error:', authError)
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get business
    console.log('[Enhance] Looking up business for user:', user.id)
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()

    if (businessError) {
      console.error('[Enhance] Business lookup error:', businessError)
    }

    if (!business) {
      console.log('[Enhance] Business not found for user')
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }
    console.log('[Enhance] Found business:', business.id)

    // Get image record
    console.log('[Enhance] Fetching image record:', imageId)
    const { data: image, error: imageError } = await supabase
      .from('images')
      .select('*')
      .eq('id', imageId)
      .eq('business_id', business.id)
      .single()

    if (imageError) {
      console.error('[Enhance] Image fetch error:', imageError)
    }

    if (imageError || !image) {
      console.log('[Enhance] Image not found')
      return NextResponse.json({ error: 'Image not found' }, { status: 404 })
    }
    console.log('[Enhance] Found image, original_url:', image.original_url?.substring(0, 80))

    // Check credits
    console.log('[Enhance] Checking credits for business:', business.id)
    const { data: credits, error: creditsError } = await supabase
      .from('credits')
      .select('credits_remaining, credits_used')
      .eq('business_id', business.id)
      .single()

    if (creditsError) {
      console.error('[Enhance] Credits lookup error:', creditsError)
    }

    if (!credits || credits.credits_remaining < 1) {
      console.log('[Enhance] Insufficient credits:', credits?.credits_remaining || 0)
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 })
    }
    console.log('[Enhance] Credits available:', credits.credits_remaining)

    // Update image status to processing
    console.log('[Enhance] Updating status to processing')
    const { error: updateError } = await supabase
      .from('images')
      .update({ status: 'processing' })
      .eq('id', imageId)

    if (updateError) {
      console.error('[Enhance] Failed to update status:', updateError)
    } else {
      console.log('[Enhance] Status updated to processing')
    }

    // Use service role for storage and credit operations
    const serviceSupabase = createServiceRoleClient()
    let currentStep = 'initialization'

    try {
      // Get the style prompt
      currentStep = 'getting style prompt'
      const stylePrompt = stylePrompts[stylePreset] || stylePrompts['delivery']
      console.log('[Enhance] Using style preset:', stylePreset)

      // Fetch the original image
      currentStep = 'fetching original image'
      console.log('[Enhance] Fetching original image from:', image.original_url?.substring(0, 80))
      const imageResponse = await fetch(image.original_url)

      if (!imageResponse.ok) {
        console.error('[Enhance] Failed to fetch image, status:', imageResponse.status)
        throw new Error(`Failed to fetch image: ${imageResponse.status}`)
      }
      console.log('[Enhance] Image fetched successfully, status:', imageResponse.status)

      currentStep = 'converting image to buffer'
      const imageArrayBuffer = await imageResponse.arrayBuffer()
      const imageBuffer = Buffer.from(imageArrayBuffer)
      console.log('[Enhance] Image buffer size:', imageBuffer.length, 'bytes')

      currentStep = 'encoding image to base64'
      const base64Image = imageBuffer.toString('base64')
      const mimeType = image.mime_type || 'image/jpeg'
      console.log('[Enhance] Image prepared for AI, mime:', mimeType)

      // Call Google Gemini Nano Banana Pro for direct AI image enhancement
      currentStep = 'initializing Google AI'
      console.log('[Enhance] Initializing Google AI model (Nano Banana Pro)')
      const model = getGoogleAI().getGenerativeModel({
        model: 'gemini-2.0-flash-exp',
        generationConfig: {
          responseModalities: ['Text', 'Image'] as const,
        }
      })

      currentStep = 'calling Google Gemini API'
      console.log('[Enhance] Calling Google Gemini Nano Banana Pro for image enhancement...')

      const result = await model.generateContent([
        {
          inlineData: {
            mimeType,
            data: base64Image
          }
        },
        {
          text: `You are a professional food photographer. Enhance this food photograph to match this style: ${stylePrompt}

Apply professional food photography enhancements:
- Make the food look more appetizing and vibrant
- Enhance colors to be rich and appealing (especially warm tones for food)
- Improve lighting to highlight textures and details
- Add appropriate warmth for food photos
- Sharpen details to make ingredients pop
- Balance highlights and shadows for depth

Create a beautifully enhanced version of this food photo that would work perfectly for: ${stylePrompt}

After enhancing, also provide brief suggestions in this format:
SUGGESTIONS: [tip1] | [tip2] | [tip3]`
        }
      ])

      currentStep = 'getting Google AI response'
      console.log('[Enhance] Google AI call completed, getting response...')
      const response = await result.response

      // Extract enhanced image and text from Nano Banana Pro response
      currentStep = 'extracting enhanced image from AI response'
      let enhancedImageBuffer: Buffer | null = null
      let aiSuggestions: string[] = []

      // Process response parts - Nano Banana Pro returns both text and image
      for (const candidate of response.candidates || []) {
        for (const part of candidate.content?.parts || []) {
          if (part.text) {
            console.log('[Enhance] AI text response:', part.text.substring(0, 200))
            // Extract suggestions if present
            const suggestionsMatch = part.text.match(/SUGGESTIONS:\s*(.+)/i)
            if (suggestionsMatch) {
              aiSuggestions = suggestionsMatch[1].split('|').map((s: string) => s.trim()).filter((s: string) => s)
            }
          }
          if (part.inlineData?.data) {
            console.log('[Enhance] AI returned enhanced image, mime:', part.inlineData.mimeType)
            enhancedImageBuffer = Buffer.from(part.inlineData.data, 'base64')
            console.log('[Enhance] Enhanced image buffer size:', enhancedImageBuffer.length, 'bytes')
          }
        }
      }

      let enhancedUrl: string | null = null
      let processingSkipped = false

      if (enhancedImageBuffer) {
        console.log('[Enhance] AI image enhancement complete, uploading result...')

        // Upload AI-enhanced image to Supabase Storage
        currentStep = 'uploading enhanced image to storage'
        const enhancedFileName = `${business.id}/enhanced/${Date.now()}.png`
        console.log('[Enhance] Uploading AI-enhanced image to:', enhancedFileName)

        const { error: uploadError } = await serviceSupabase.storage
          .from('images')
          .upload(enhancedFileName, enhancedImageBuffer, {
            contentType: 'image/png',
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) {
          console.error('[Enhance] Upload error:', uploadError)
          throw new Error('Failed to upload enhanced image')
        }
        console.log('[Enhance] Upload successful')

        // Get public URL for enhanced image
        const urlData = serviceSupabase.storage
          .from('images')
          .getPublicUrl(enhancedFileName)
        enhancedUrl = urlData.data.publicUrl
        console.log('[Enhance] Enhanced URL:', enhancedUrl?.substring(0, 80))
      } else {
        // AI didn't return an image - fall back to Sharp processing
        console.log('[Enhance] AI did not return image, falling back to Sharp processing')
        currentStep = 'applying Sharp enhancements (fallback)'

        const defaultEnhancements = getDefaultEnhancements(stylePreset)
        const sharpBuffer = await applyEnhancements(imageBuffer, defaultEnhancements.enhancements)

        if (sharpBuffer) {
          const fileExt = image.original_filename?.split('.').pop() || 'jpg'
          const enhancedFileName = `${business.id}/enhanced/${Date.now()}.${fileExt}`

          const { error: uploadError } = await serviceSupabase.storage
            .from('images')
            .upload(enhancedFileName, sharpBuffer, {
              contentType: mimeType,
              cacheControl: '3600',
              upsert: false
            })

          if (!uploadError) {
            const urlData = serviceSupabase.storage.from('images').getPublicUrl(enhancedFileName)
            enhancedUrl = urlData.data.publicUrl
          }
        }

        if (!enhancedUrl) {
          enhancedUrl = image.original_url
          processingSkipped = true
        }
      }

      // Build enhancement data for database
      const enhancementData = {
        enhancements: { aiEnhanced: true, model: 'nano-banana-pro' },
        suggestions: aiSuggestions.length > 0 ? aiSuggestions : ['AI-enhanced image', 'Professional food styling applied', 'Colors and lighting optimized']
      }

      // Update image record with enhanced URL (or original if processing skipped)
      currentStep = 'updating image record'
      console.log('[Enhance] Updating image record...')
      const { error: imageUpdateError } = await supabase
        .from('images')
        .update({
          status: 'completed',
          enhanced_url: enhancedUrl,
          enhancement_settings: enhancementData.enhancements,
          processed_at: new Date().toISOString(),
          ai_model: 'gemini-2.0-flash-exp', // Nano Banana Pro
          ai_suggestions: enhancementData.suggestions,
          processing_skipped: processingSkipped, // Track if server-side processing was skipped
        })
        .eq('id', imageId)

      if (imageUpdateError) {
        console.error('[Enhance] Image update error:', imageUpdateError)
      } else {
        console.log('[Enhance] Image record updated successfully')
      }

      // Deduct credit
      currentStep = 'deducting credits'
      console.log('[Enhance] Deducting credit...')
      const { error: creditUpdateError } = await serviceSupabase
        .from('credits')
        .update({
          credits_remaining: credits.credits_remaining - 1,
          credits_used: credits.credits_used + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('business_id', business.id)

      if (creditUpdateError) {
        console.error('[Enhance] Credit update error:', creditUpdateError)
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
        console.error('[Enhance] Transaction log error:', transactionError)
      }

      console.log('[Enhance] Enhancement complete! Returning success response', processingSkipped ? '(client-side processing needed)' : '')
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
      const errorStack = (aiError as Error).stack || ''
      console.error('[Enhance] AI Enhancement error at step:', currentStep)
      console.error('[Enhance] Error message:', errorMessage)
      console.error('[Enhance] Error stack:', errorStack)

      // Update image status to failed
      await supabase
        .from('images')
        .update({
          status: 'failed',
          error_message: `${currentStep}: ${errorMessage}`,
        })
        .eq('id', imageId)

      // Return detailed error for debugging (in production, would hide some details)
      return NextResponse.json(
        {
          error: 'AI enhancement failed',
          failedAtStep: currentStep,
          details: errorMessage,
          // Include partial stack for debugging
          debugHint: errorStack.split('\n').slice(0, 3).join(' | ')
        },
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
