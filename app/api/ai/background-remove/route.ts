import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import {
  checkRateLimit,
  rateLimitedResponse,
  aiLogger as logger,
} from '@/lib/security'

// Use Node.js runtime for Remove.bg API
export const runtime = 'nodejs'
export const maxDuration = 60

// Remove.bg API endpoint
const REMOVEBG_API_URL = 'https://api.remove.bg/v1.0/removebg'

// HD background removal costs 1 credit
const CREDIT_COST = 1

export async function POST(request: NextRequest) {
  logger.info('Background Remove API called (HD)')

  try {
    // Rate limiting
    const identifier = request.headers.get('x-forwarded-for') || 'anonymous'
    const rateLimitResult = await checkRateLimit(identifier, 'ai-enhance')
    if (!rateLimitResult.success) {
      return rateLimitedResponse(rateLimitResult)
    }

    // Parse request
    const body = await request.json()
    const { imageId } = body as { imageId: string }

    if (!imageId) {
      return NextResponse.json({ error: 'Image ID is required' }, { status: 400 })
    }

    logger.info('HD background removal requested', { imageId })

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

    // Check credits
    const serviceSupabase = createServiceRoleClient()
    const { data: credits } = await supabase
      .from('credits')
      .select('credits_remaining, credits_used')
      .eq('business_id', business.id)
      .single()

    if (!credits || credits.credits_remaining < CREDIT_COST) {
      return NextResponse.json({
        error: 'Insufficient credits',
        creditsRequired: CREDIT_COST,
        creditsRemaining: credits?.credits_remaining || 0
      }, { status: 402 })
    }

    // Check for API key
    const removeBgApiKey = process.env.REMOVEBG_API_KEY
    if (!removeBgApiKey) {
      logger.error('Remove.bg API key not configured')
      return NextResponse.json({ error: 'Background removal service not configured' }, { status: 503 })
    }

    // Fetch the enhanced image
    logger.debug('Fetching enhanced image')
    const imageResponse = await fetch(image.enhanced_url)
    if (!imageResponse.ok) {
      throw new Error('Failed to fetch enhanced image')
    }

    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer())

    // Call Remove.bg API
    logger.debug('Calling Remove.bg API')
    const formData = new FormData()
    formData.append('image_file', new Blob([imageBuffer], { type: 'image/png' }), 'image.png')
    formData.append('size', 'full')  // Full resolution output
    formData.append('format', 'png')  // PNG with transparency
    formData.append('type', 'food')  // Optimize for food images

    const removeBgResponse = await fetch(REMOVEBG_API_URL, {
      method: 'POST',
      headers: {
        'X-Api-Key': removeBgApiKey,
      },
      body: formData,
    })

    if (!removeBgResponse.ok) {
      const errorText = await removeBgResponse.text()
      logger.error('Remove.bg API error', { status: removeBgResponse.status, error: errorText })

      if (removeBgResponse.status === 402) {
        return NextResponse.json({ error: 'Background removal service credits exhausted' }, { status: 503 })
      }

      throw new Error(`Remove.bg API failed: ${removeBgResponse.status}`)
    }

    const resultBuffer = Buffer.from(await removeBgResponse.arrayBuffer())
    logger.debug('Received HD background-removed image', { size: resultBuffer.length })

    // Upload to Supabase storage
    const fileName = `${business.id}/nobg/${imageId}-hd-${Date.now()}.png`

    const { error: uploadError } = await serviceSupabase.storage
      .from('images')
      .upload(fileName, resultBuffer, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      throw new Error('Failed to upload processed image')
    }

    const { data: { publicUrl } } = serviceSupabase.storage
      .from('images')
      .getPublicUrl(fileName)

    // Deduct credit
    await serviceSupabase
      .from('credits')
      .update({
        credits_remaining: credits.credits_remaining - CREDIT_COST,
        credits_used: credits.credits_used + CREDIT_COST,
        updated_at: new Date().toISOString(),
      })
      .eq('business_id', business.id)

    // Log transaction
    await serviceSupabase
      .from('credit_transactions')
      .insert({
        business_id: business.id,
        amount: -CREDIT_COST,
        transaction_type: 'usage',
        description: `HD background removal - ${image.original_filename || 'image'}`,
        image_id: imageId,
        balance_after: credits.credits_remaining - CREDIT_COST,
      })

    // Update image record with HD nobg URL
    await supabase
      .from('images')
      .update({
        nobg_hd_url: publicUrl,
        nobg_hd_created_at: new Date().toISOString(),
      })
      .eq('id', imageId)

    logger.info('HD background removal complete', { imageId, url: publicUrl })

    return NextResponse.json({
      success: true,
      imageId,
      nobgUrl: publicUrl,
      creditsCost: CREDIT_COST,
      creditsRemaining: credits.credits_remaining - CREDIT_COST,
    })

  } catch (error: unknown) {
    logger.error('Background Remove API error', error as Error)
    return NextResponse.json(
      { error: (error as Error).message || 'Background removal failed' },
      { status: 500 }
    )
  }
}
