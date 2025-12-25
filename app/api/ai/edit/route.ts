/**
 * AI Image Edit API - True Inpainting with Vertex AI Imagen 3
 *
 * This endpoint provides REAL preservation editing - adding props to food photos
 * while keeping the original image pixels intact.
 *
 * Unlike the regular enhance endpoint (which regenerates the entire image),
 * this uses Vertex AI's mask-based editing to only modify specified areas.
 *
 * POST /api/ai/edit
 * Body: {
 *   imageId: string - ID of the image to edit
 *   prompt: string - What to add (e.g., "chopsticks and red chilies")
 *   editType: 'add_props' | 'expand_canvas' | 'remove_object'
 *   aspectRatio?: string - For expand_canvas mode
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import {
  addPropsToFoodPhoto,
  expandImageCanvas,
  editImageWithVertexAI,
  isVertexAIConfigured,
} from '@/lib/ai/vertex-ai'
import {
  checkRateLimit,
  rateLimitedResponse,
  aiLogger as logger,
} from '@/lib/security'
import { checkAndExecuteAutoTopUp } from '@/lib/auto-topup'

export const runtime = 'nodejs'
export const maxDuration = 60 // Allow up to 60s for Vertex AI

export async function GET() {
  const configured = isVertexAIConfigured()
  return NextResponse.json({
    status: 'ok',
    message: 'Edit API route is loaded',
    vertexAIConfigured: configured,
    timestamp: new Date().toISOString(),
  })
}

export async function POST(request: NextRequest) {
  logger.info('Edit API called')

  try {
    // Check if Vertex AI is configured
    if (!isVertexAIConfigured()) {
      logger.error('Vertex AI not configured')
      return NextResponse.json(
        { error: 'True editing is not available - Vertex AI not configured' },
        { status: 503 }
      )
    }

    // Rate limiting
    const identifier = request.headers.get('x-forwarded-for') || 'anonymous'
    const rateLimitResult = await checkRateLimit(identifier, 'ai-enhance')
    if (!rateLimitResult.success) {
      logger.warn('Rate limit exceeded', { identifier })
      return rateLimitedResponse(rateLimitResult)
    }

    // Parse request body
    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { imageId, prompt, editType = 'add_props', aspectRatio } = body

    if (!imageId) {
      return NextResponse.json({ error: 'imageId is required' }, { status: 400 })
    }

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'prompt is required' }, { status: 400 })
    }

    logger.info('Processing edit request', {
      imageId,
      editType,
      promptPreview: prompt.substring(0, 50),
    })

    // Get authenticated user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get business
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()

    if (businessError || !business) {
      logger.warn('Business not found', { userId: user.id })
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
      logger.warn('Image not found', { imageId })
      return NextResponse.json({ error: 'Image not found' }, { status: 404 })
    }

    // For editing, we need an enhanced image or original
    const sourceUrl = image.enhanced_url || image.original_url
    if (!sourceUrl) {
      return NextResponse.json({ error: 'No source image available' }, { status: 400 })
    }

    // Check credits
    const { data: credits, error: creditsError } = await supabase
      .from('credits')
      .select('credits_remaining, credits_used')
      .eq('business_id', business.id)
      .single()

    if (creditsError || !credits || credits.credits_remaining < 1) {
      logger.warn('Insufficient credits', { remaining: credits?.credits_remaining || 0 })
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 })
    }

    // Update status to processing
    await supabase
      .from('images')
      .update({ status: 'processing' })
      .eq('id', imageId)

    const serviceSupabase = createServiceRoleClient()

    try {
      // Fetch source image
      logger.debug('Fetching source image', { url: sourceUrl.substring(0, 50) })
      const imageResponse = await fetch(sourceUrl)

      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image: ${imageResponse.status}`)
      }

      const imageBuffer = Buffer.from(await imageResponse.arrayBuffer())
      const imageBase64 = imageBuffer.toString('base64')
      logger.debug('Image ready for editing', { size: imageBuffer.length })

      // Perform the edit based on type
      let result: { imageBase64: string; mimeType: string }

      switch (editType) {
        case 'add_props':
          logger.info('Adding props using Vertex AI inpainting')
          result = await addPropsToFoodPhoto(imageBase64, prompt, { aspectRatio })
          break

        case 'expand_canvas':
          logger.info('Expanding canvas using Vertex AI outpainting')
          result = await expandImageCanvas(imageBase64, prompt, aspectRatio || '1:1')
          break

        case 'remove_object':
          logger.info('Removing object using Vertex AI inpainting')
          result = await editImageWithVertexAI(imageBase64, prompt, {
            editMode: 'inpaint_removal',
            maskMode: 'semantic',
            aspectRatio,
          })
          break

        default:
          return NextResponse.json({ error: 'Invalid editType' }, { status: 400 })
      }

      // Upload the edited image
      const editedBuffer = Buffer.from(result.imageBase64, 'base64')
      const fileName = `${business.id}/edited/${Date.now()}.png`

      logger.debug('Uploading edited image', { fileName })

      const { error: uploadError } = await serviceSupabase.storage
        .from('images')
        .upload(fileName, editedBuffer, {
          contentType: result.mimeType,
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        logger.error('Upload error', uploadError)
        throw new Error('Failed to upload edited image')
      }

      const { data: urlData } = serviceSupabase.storage
        .from('images')
        .getPublicUrl(fileName)

      const editedUrl = urlData.publicUrl

      // Create new image record for the edited version
      const { data: newImage, error: insertError } = await supabase
        .from('images')
        .insert({
          business_id: business.id,
          original_url: sourceUrl, // The source becomes the "original" for this edit
          enhanced_url: editedUrl,
          thumbnail_url: image.thumbnail_url,
          original_filename: `${image.original_filename?.replace(/\.[^/.]+$/, '') || 'image'}_edited.png`,
          style_preset: image.style_preset,
          status: 'completed',
          enhancement_settings: {
            editType,
            prompt,
            method: 'vertex-ai-inpainting',
            aspectRatio,
          },
          processed_at: new Date().toISOString(),
          ai_model: 'vertex-ai-imagen-3-capability',
          metadata: {
            ...(image.metadata || {}),
            editedFrom: imageId,
            editPrompt: prompt,
            editType,
            truePreservation: true, // Flag indicating this used real inpainting
          },
        })
        .select('id')
        .single()

      if (insertError) {
        logger.error('Failed to create edited image record', insertError)
        throw new Error('Failed to save edited image')
      }

      // Deduct credit
      const { error: creditUpdateError } = await serviceSupabase
        .from('credits')
        .update({
          credits_remaining: credits.credits_remaining - 1,
          credits_used: credits.credits_used + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('business_id', business.id)

      if (creditUpdateError) {
        logger.error('Credit update error', creditUpdateError)
      }

      // Log transaction
      await serviceSupabase
        .from('credit_transactions')
        .insert({
          business_id: business.id,
          amount: -1,
          transaction_type: 'usage',
          description: `AI Edit (${editType}) - ${prompt.substring(0, 50)}`,
          image_id: newImage.id,
          balance_after: credits.credits_remaining - 1,
        })

      // Check auto top-up
      checkAndExecuteAutoTopUp(business.id).catch(err => {
        logger.error('Auto top-up error', err)
      })

      // Reset original image status
      await supabase
        .from('images')
        .update({ status: 'completed' })
        .eq('id', imageId)

      logger.info('Edit complete', {
        originalId: imageId,
        newId: newImage.id,
        editType,
      })

      return NextResponse.json({
        success: true,
        imageId: newImage.id,
        originalImageId: imageId,
        editedUrl,
        editType,
        creditsRemaining: credits.credits_remaining - 1,
        truePreservation: true,
      })
    } catch (editError: unknown) {
      const errorMessage = (editError as Error).message || 'Unknown error'
      logger.error('Edit error', editError as Error)

      // Reset image status
      await supabase
        .from('images')
        .update({
          status: 'failed',
          error_message: `Edit failed: ${errorMessage}`,
        })
        .eq('id', imageId)

      return NextResponse.json(
        {
          error: 'Edit failed',
          details: process.env.NODE_ENV === 'production' ? undefined : errorMessage,
        },
        { status: 500 }
      )
    }
  } catch (error: unknown) {
    logger.error('Edit API error', error as Error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
