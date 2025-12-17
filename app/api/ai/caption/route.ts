import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

// Use Node.js runtime (not Edge) for Anthropic SDK
export const runtime = 'nodejs'

// Maximum captions per enhanced image
const MAX_CAPTIONS_PER_IMAGE = 10

// Lazy initialization of Anthropic client
let anthropicClient: Anthropic | null = null

function getAnthropic(): Anthropic {
  if (!anthropicClient) {
    anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })
  }
  return anthropicClient
}

// Service client for bypassing RLS when updating caption count
function getServiceSupabase() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  try {
    const { imageId, language = 'en', platform = 'instagram', tone = 'engaging' } = await request.json()

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
      .select('id, business_name')
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

    // Check if image has been enhanced (credit was spent)
    if (!image.enhanced_url) {
      return NextResponse.json(
        {
          error: 'Image must be enhanced first',
          message: 'Please enhance this image before generating captions. Enhancement uses 1 credit and unlocks 10 free caption generations.'
        },
        { status: 402 }
      )
    }

    // Check caption count limit
    const currentCaptionCount = image.caption_count || 0
    if (currentCaptionCount >= MAX_CAPTIONS_PER_IMAGE) {
      return NextResponse.json(
        {
          error: 'Caption limit reached',
          message: `You have reached the maximum of ${MAX_CAPTIONS_PER_IMAGE} caption generations for this image. Upload and enhance a new image to generate more captions.`,
          captionCount: currentCaptionCount,
          maxCaptions: MAX_CAPTIONS_PER_IMAGE
        },
        { status: 429 }
      )
    }

    // Platform-specific guidelines (research-backed)
    const platformGuidelines: Record<string, string> = {
      instagram: `Instagram optimization:
- CRITICAL: First 125 characters must hook - this is all that shows before "more"
- Reels captions: Short, punchy, let video speak
- Feed posts: Can be longer with storytelling
- Use 5-10 targeted hashtags (mix broad + niche)
- Emoji placement: Beginning or end as visual breaks
- Questions drive 2x more comments
- Posts with location tags get 79% more engagement`,

      facebook: `Facebook optimization:
- Posts under 80 characters get 66% higher engagement
- Questions spark conversation and boost algorithm
- Focus on community and shareability
- Include clear call-to-action
- Longer storytelling acceptable for emotional content
- Tag location for local reach`,

      tiktok: `TikTok optimization:
- ~100 characters max - video carries the message
- Trend-aware language and references
- Use popular sounds/challenges when relevant
- 3-5 hashtags max (trending + niche)
- Youth-oriented, authentic voice
- Hook formats: "POV:", "Wait for it", "This is your sign to..."`,

      xiaohongshu: `小红书 (Xiaohongshu/RED) optimization:
- Write in Simplified Chinese with trendy internet slang
- Lifestyle-focused narrative - how food fits daily life
- Use emojis liberally throughout
- Include price and location details
- 8+ hashtags common: #美食分享 #必吃推荐 #探店 etc.
- Cultural context increases engagement 217%
- Tutorial/step-by-step style performs best`,

      wechat: `WeChat Moments optimization:
- Write in Simplified Chinese
- More formal, informative tone
- Suitable for sharing with friends and family
- Include location and practical details
- Focus on quality and authenticity`,
    }

    // Language instructions
    const languageInstructions: Record<string, string> = {
      en: 'Write in English.',
      zh: 'Write in Simplified Chinese (简体中文). Use trendy Chinese internet slang where appropriate.',
      'zh-tw': 'Write in Traditional Chinese (繁體中文).',
    }

    // Tone guidelines (research-backed with specific techniques)
    const toneGuidelines: Record<string, string> = {
      engaging: `Friendly and enthusiastic tone:
- Use sensory trigger words: crispy, sizzling, melt-in-your-mouth, juicy, tender
- Create FOMO: "You need to try this", "Don't miss out"
- Ask opinion questions: "Would you try this?", "Rate this 1-10"`,

      professional: `Polished, sophisticated tone:
- Emphasize craftsmanship and quality
- Use refined vocabulary: artisanal, curated, exceptional, elevated
- Highlight provenance and technique
- Suitable for fine dining and premium brands`,

      casual: `Relaxed, conversational tone:
- Write like texting a friend about amazing food
- Use contractions and informal language
- React naturally: "OMG this was SO good", "Obsessed with this"
- Keep it real and relatable`,

      playful: `Fun, witty tone with wordplay:
- Use food puns: "You've stolen a pizza my heart", "Donut worry be happy"
- Pop culture references
- Playful challenges: "Tag someone who needs this"
- High shareability factor`,

      informative: `Educational, descriptive tone:
- Highlight ingredients, origins, cooking methods
- Share behind-the-scenes details
- Include tips or interesting facts
- Position as food expertise`,
    }

    // Sensory language bank for food descriptions
    const sensoryLanguage = `
SENSORY LANGUAGE TO USE (increases cravings and engagement):
- Texture: crispy, crunchy, tender, silky, velvety, flaky, creamy, smooth, gooey, melt-in-your-mouth
- Temperature: sizzling, steaming, piping hot, chilled, warm
- Taste: tangy, savory, zesty, rich, bold, sweet, umami, decadent
- Aroma: fragrant, smoky, fresh-baked, aromatic
- Visual: golden, caramelized, glazed, vibrant, colorful`

    // Hook formulas that work
    const hookFormulas = `
HIGH-PERFORMING HOOK FORMULAS (use one of these patterns for opening line):
1. Curiosity: "Why doesn't anyone talk about [this dish]?"
2. Challenge: "Bet you can't eat just one"
3. Revelation: "The secret to [result]..."
4. FOMO: "This sells out every weekend"
5. Question: "Have you tried [this] yet?"
6. Bold claim: "The best [dish] in [city]"
7. Sensory hook: Start with a texture/taste word
8. Story hook: "The moment I took my first bite..."`

    // CTA formulas
    const ctaFormulas = `
CALL-TO-ACTION OPTIONS (include one appropriate CTA):
- Booking: "Reserve your table - link in bio"
- Ordering: "Order now, taste heaven in 30 minutes"
- Engagement: "Tag someone who needs this in their life"
- Opinion: "What would you pair this with?"
- UGC: "Show us your plate! Tag us for a feature"
- Save: "Save this for your next food adventure"
- Share: "Send this to your foodie bestie"`

    const systemPrompt = `You are an elite social media copywriter who creates viral food content. Your captions consistently achieve high engagement because you understand the psychology of food marketing.

BUSINESS: ${business.business_name}
STYLE: ${image.style_preset || 'general'}

${sensoryLanguage}

${hookFormulas}

${ctaFormulas}

PLATFORM REQUIREMENTS:
${platformGuidelines[platform] || platformGuidelines.instagram}

LANGUAGE: ${languageInstructions[language] || languageInstructions.en}

TONE STYLE:
${toneGuidelines[tone] || toneGuidelines.engaging}

YOUR TASK:
1. ANALYZE the image carefully - identify specific food items, colors, textures, presentation style, setting
2. CRAFT a caption that:
   - Opens with an irresistible hook (first 125 chars are critical)
   - Uses sensory language that triggers cravings
   - Describes what makes THIS specific dish special (not generic food praise)
   - Includes emotional connection or storytelling element
   - Ends with appropriate call-to-action
3. SELECT hashtags strategically:
   - Mix of broad reach (#foodporn, #foodie) and niche (#[specific cuisine], #[dish name])
   - Include trending food hashtags when relevant
   - Platform-appropriate quantity
4. PROVIDE 2 alternative versions with different angles:
   - One more casual/playful
   - One more descriptive/storytelling

IMPORTANT RULES:
- NEVER use generic phrases like "culinary masterpiece" or "feast for the eyes"
- ALWAYS describe the ACTUAL food you see in the image
- Make it specific: "golden crispy fried chicken" not "delicious food"
- Keep authenticity - overly polished content underperforms
- Match the energy to the food (street food = casual, fine dining = elevated)

Respond with JSON:
{
  "caption": "The main caption with hook + body + CTA + emojis",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5"],
  "alternateVersions": ["Casual/playful version", "Storytelling/descriptive version"]
}`

    // Get the image URL to send to Claude for vision analysis
    const imageUrl = image.enhanced_url || image.original_url

    if (!imageUrl) {
      return NextResponse.json({ error: 'No image URL found' }, { status: 400 })
    }

    // Use Claude's vision capability to analyze the actual image
    const message = await getAnthropic().messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 800,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'url',
                url: imageUrl,
              },
            },
            {
              type: 'text',
              text: `Generate a high-engagement ${platform} caption for this food photo.

First, analyze what you ACTUALLY see:
- What specific food items are in the image?
- What colors, textures, and presentation style?
- What's the setting/backdrop?
- What makes this visually appealing?

Then create captions that describe THIS specific food, not generic food content. The photo was styled for "${image.style_preset || 'delivery'}" aesthetic.`
            }
          ],
        }
      ],
      system: systemPrompt,
    })

    // Extract the response
    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''

    // Parse JSON from response
    let captionData
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        captionData = JSON.parse(jsonMatch[0])
      } else {
        captionData = {
          caption: responseText,
          hashtags: [],
          alternateVersions: []
        }
      }
    } catch {
      captionData = {
        caption: responseText,
        hashtags: [],
        alternateVersions: []
      }
    }

    // Increment caption count after successful generation
    const newCaptionCount = currentCaptionCount + 1
    const serviceSupabase = getServiceSupabase()
    const { error: updateError } = await serviceSupabase
      .from('images')
      .update({
        caption_count: newCaptionCount,
        updated_at: new Date().toISOString()
      })
      .eq('id', imageId)

    if (updateError) {
      console.error('Failed to update caption count:', updateError)
      // Don't fail the request, just log the error
    }

    return NextResponse.json({
      success: true,
      imageId,
      ...captionData,
      language,
      platform,
      captionCount: newCaptionCount,
      captionsRemaining: MAX_CAPTIONS_PER_IMAGE - newCaptionCount
    })
  } catch (error: unknown) {
    console.error('Caption API error:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Internal server error' },
      { status: 500 }
    )
  }
}
