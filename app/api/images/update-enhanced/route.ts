import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

/**
 * Updates an existing image record with a new enhanced image
 * Used after client-side background replacement
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[UpdateEnhanced] Starting update request')

    // Get user session
    let supabase
    try {
      supabase = await createClient()
    } catch (clientError) {
      console.error('[UpdateEnhanced] Supabase client error:', clientError)
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      console.error('[UpdateEnhanced] Auth error:', authError)
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 })
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get business
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()

    if (businessError || !business) {
      console.error('[UpdateEnhanced] Business lookup error:', businessError)
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    // Parse form data
    let formData
    try {
      formData = await request.formData()
    } catch (formError) {
      console.error('[UpdateEnhanced] Form data parse error:', formError)
      return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
    }

    const file = formData.get('file') as File
    const imageId = formData.get('imageId') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!imageId) {
      return NextResponse.json({ error: 'Image ID required' }, { status: 400 })
    }

    // Verify the image belongs to this business
    const { data: existingImage, error: imageError } = await supabase
      .from('images')
      .select('id, business_id')
      .eq('id', imageId)
      .eq('business_id', business.id)
      .single()

    if (imageError || !existingImage) {
      console.error('[UpdateEnhanced] Image not found or not owned:', imageError)
      return NextResponse.json({ error: 'Image not found' }, { status: 404 })
    }

    // Use service role client for storage operations
    let serviceClient
    try {
      serviceClient = createServiceRoleClient()
    } catch (serviceError) {
      console.error('[UpdateEnhanced] Service client error:', serviceError)
      return NextResponse.json({ error: 'Service configuration error' }, { status: 500 })
    }

    // Create unique filename for the composited image
    const fileName = `${business.id}/enhanced/${Date.now()}_composited.jpg`

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    console.log('[UpdateEnhanced] Uploading composited image:', fileName, 'size:', buffer.length)

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await serviceClient.storage
      .from('images')
      .upload(fileName, buffer, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('[UpdateEnhanced] Storage upload error:', uploadError)
      return NextResponse.json({ error: 'Storage upload failed' }, { status: 500 })
    }

    console.log('[UpdateEnhanced] File uploaded:', uploadData?.path)

    // Get public URL
    const { data: { publicUrl } } = serviceClient.storage
      .from('images')
      .getPublicUrl(fileName)

    // Update image record with new enhanced URL
    const { error: updateError } = await supabase
      .from('images')
      .update({
        enhanced_url: publicUrl,
        metadata: {
          hasCustomBackground: true,
          compositedAt: new Date().toISOString()
        }
      })
      .eq('id', imageId)

    if (updateError) {
      console.error('[UpdateEnhanced] Database update error:', updateError)
      return NextResponse.json({ error: 'Failed to update image record' }, { status: 500 })
    }

    console.log('[UpdateEnhanced] Image record updated successfully')

    return NextResponse.json({
      success: true,
      enhancedUrl: publicUrl,
    })
  } catch (error: unknown) {
    console.error('[UpdateEnhanced] Error:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Update failed' },
      { status: 500 }
    )
  }
}
