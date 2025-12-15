import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

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

    // Platform-specific guidelines
    const platformGuidelines: Record<string, string> = {
      instagram: 'Keep it concise (under 150 characters for main caption), use 3-5 relevant hashtags, emoji-friendly, casual and engaging tone.',
      facebook: 'Can be longer and more descriptive, encourage engagement with questions, include a call-to-action.',
      tiktok: 'Very short and punchy, trend-aware, youth-oriented language, 2-3 hashtags max.',
      xiaohongshu: 'Write in Chinese, use trendy Chinese internet slang, include emojis, lifestyle-focused, use relevant Chinese hashtags.',
      wechat: 'Write in Chinese, more formal and informative, suitable for sharing with friends and family.',
    }

    // Language instructions
    const languageInstructions: Record<string, string> = {
      en: 'Write in English.',
      zh: 'Write in Simplified Chinese (简体中文).',
      'zh-tw': 'Write in Traditional Chinese (繁體中文).',
    }

    // Tone guidelines
    const toneGuidelines: Record<string, string> = {
      engaging: 'Friendly, inviting, and enthusiastic. Make people want to try this food.',
      professional: 'Polished, sophisticated, suitable for fine dining or business accounts.',
      casual: 'Relaxed, conversational, like talking to a friend about great food.',
      playful: 'Fun, witty, with food puns or creative wordplay.',
      informative: 'Descriptive, highlighting ingredients, cooking methods, or food story.',
    }

    const systemPrompt = `You are an expert social media copywriter specializing in food and restaurant marketing.
Your task is to generate engaging captions for food photos.

Business: ${business.business_name}
Style preset used: ${image.style_preset || 'general'}

Guidelines:
- ${languageInstructions[language] || languageInstructions.en}
- Platform: ${platform} - ${platformGuidelines[platform] || platformGuidelines.instagram}
- Tone: ${toneGuidelines[tone] || toneGuidelines.engaging}

Generate a caption that:
1. Captures attention in the first line
2. Describes the food appealingly
3. Includes a call-to-action when appropriate
4. Uses relevant hashtags
5. Is optimized for the target platform

Respond with JSON in this format:
{
  "caption": "The main caption text",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3"],
  "alternateVersions": ["Alternative caption 1", "Alternative caption 2"]
}`

    const message = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: `Generate a ${platform} caption for this food photo. The style is "${image.style_preset || 'professional'}".`
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

    return NextResponse.json({
      success: true,
      imageId,
      ...captionData,
      language,
      platform,
    })
  } catch (error: unknown) {
    console.error('Caption API error:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Internal server error' },
      { status: 500 }
    )
  }
}
