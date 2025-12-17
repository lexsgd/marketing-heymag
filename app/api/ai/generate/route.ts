import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Use Node.js runtime
export const runtime = 'nodejs'

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

// Category-specific prompts for food photography generation
const categoryPrompts: Record<string, string> = {
  'delivery': `Professional food photography of a delicious takeout meal in a branded delivery box.
The food should look appetizing, fresh, and ready to eat.
Clean white background, soft studio lighting, overhead angle.
Include packaging elements like paper bags, containers, chopsticks, or utensils.
Style: Modern delivery app aesthetic, GrabFood/Foodpanda quality.
The food should be colorful with visible steam or freshness indicators.`,

  'restaurant': `Elegant restaurant food photography of a beautifully plated main course.
Professional plating on a ceramic plate, artistic garnishes, sauce drizzles.
Warm ambient lighting, wooden table surface visible, shallow depth of field.
Style: Casual dining restaurant menu quality.
The dish should look inviting, homemade quality but professionally presented.`,

  'fine-dining': `Michelin-star quality food photography of an exquisite tasting course.
Minimalist plating on premium white porcelain, precise artistic arrangement.
Dark moody background, dramatic lighting highlighting food textures.
Micro-greens, edible flowers, foam, or gel accents as garnish.
Style: Fine dining magazine editorial quality.
Each element should look intentional and perfectly placed.`,

  'cafe': `Cozy cafe-style food photography of artisan coffee and pastry.
Rustic wooden surface, morning light streaming in, steam rising from cup.
Include elements like croissant, latte art, fresh pastries.
Warm tones, lifestyle aesthetic, Instagram-worthy presentation.
Style: Trendy coffee shop aesthetic, bright and inviting.
Props: ceramic cup, fresh flowers, newspaper, or book edge visible.`,

  'street-food': `Vibrant street food photography of authentic Asian hawker cuisine.
Close-up shot showing textures - crispy, saucy, steaming.
Night market atmosphere with warm lighting, slight motion blur in background.
Style: Authentic hawker centre aesthetic, appetizing and casual.
The food should look indulgent, messy-delicious, and irresistible.`
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'AI Image Generation API',
    categories: Object.keys(categoryPrompts)
  })
}

export async function POST(request: NextRequest) {
  console.log('[Generate] API called')

  try {
    const body = await request.json()
    const { category = 'restaurant', customPrompt } = body

    console.log('[Generate] Category:', category)

    // Get the category-specific prompt
    const basePrompt = categoryPrompts[category] || categoryPrompts['restaurant']

    // Combine with any custom additions
    const fullPrompt = customPrompt
      ? `${basePrompt}\n\nAdditional requirements: ${customPrompt}`
      : basePrompt

    console.log('[Generate] Using prompt:', fullPrompt.substring(0, 200) + '...')

    // Use Gemini 2.0 Flash for image generation
    // Note: Gemini 3 Pro Image is for editing, not text-to-image
    const model = getGoogleAI().getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        responseModalities: ['Text', 'Image'] as const,
        temperature: 1.0,
      }
    })

    console.log('[Generate] Calling Gemini for image generation...')

    const result = await model.generateContent([
      {
        text: `Generate a professional food photography image based on this description:

${fullPrompt}

IMPORTANT REQUIREMENTS:
- Create a photorealistic food photograph
- Professional studio/editorial quality
- Appetizing food styling and presentation
- Appropriate lighting for the style
- High resolution, suitable for marketing use

Generate the image now.`
      }
    ])

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
        }
      }
    }

    if (generatedImageBase64) {
      // Return the image as a data URL for display
      const imageDataUrl = `data:${generatedImageMimeType};base64,${generatedImageBase64}`

      return NextResponse.json({
        success: true,
        category,
        imageDataUrl,
        textResponse,
        message: `AI-generated ${category} food photo`
      })
    }

    // If no image was generated, return the text response
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
