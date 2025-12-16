import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Use Node.js runtime for better error handling
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    console.log('[Upload] Starting upload request')

    // Get user session
    let supabase
    try {
      supabase = await createClient()
    } catch (clientError) {
      console.error('[Upload] Supabase client error:', clientError)
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      console.error('[Upload] Auth error:', authError)
      return NextResponse.json({ error: 'Authentication failed: ' + authError.message }, { status: 401 })
    }

    if (!user) {
      console.log('[Upload] No user found')
      return NextResponse.json({ error: 'Unauthorized - please log in' }, { status: 401 })
    }

    console.log('[Upload] User authenticated:', user.id)

    // Get business
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()

    if (businessError) {
      console.error('[Upload] Business query error:', businessError)
      return NextResponse.json({
        error: 'Database error: ' + businessError.message,
        hint: businessError.hint || 'Make sure the database migration has been run'
      }, { status: 500 })
    }

    if (!business) {
      console.log('[Upload] No business found for user')
      return NextResponse.json({ error: 'Business not found. Please complete account setup.' }, { status: 404 })
    }

    console.log('[Upload] Business found:', business.id)

    // Get the form data with error handling
    let formData
    try {
      formData = await request.formData()
    } catch (formError) {
      console.error('[Upload] Form data parse error:', formError)
      return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
    }

    const file = formData.get('file') as File
    const stylePreset = formData.get('stylePreset') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
    }

    // Validate file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 50MB' }, { status: 400 })
    }

    // Create unique filename - sanitize to remove emojis and special chars
    const originalFilename = file.name || 'image'
    const fileExt = originalFilename.split('.').pop()?.toLowerCase() || 'jpg'
    // Use timestamp only for storage path to avoid encoding issues
    const fileName = `${business.id}/original/${Date.now()}.${fileExt}`

    console.log('[Upload] Preparing to upload file:', fileName, 'Original:', originalFilename)

    // Use service role client for storage operations (bypasses RLS)
    let serviceClient
    try {
      serviceClient = createServiceRoleClient()
    } catch (serviceError) {
      console.error('[Upload] Service client error:', serviceError)
      return NextResponse.json({
        error: 'Service configuration error',
        hint: 'Check SUPABASE_SERVICE_ROLE_KEY environment variable'
      }, { status: 500 })
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    console.log('[Upload] Uploading to storage, size:', buffer.length)

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await serviceClient.storage
      .from('images')
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('[Upload] Storage upload error:', uploadError)
      return NextResponse.json({
        error: 'Storage upload failed: ' + uploadError.message,
        hint: 'Make sure the "images" bucket exists and is configured correctly'
      }, { status: 500 })
    }

    console.log('[Upload] File uploaded successfully:', uploadData?.path)

    // Get public URL
    const { data: { publicUrl } } = serviceClient.storage
      .from('images')
      .getPublicUrl(fileName)

    console.log('[Upload] Creating image record in database')

    // Create image record
    const { data: imageRecord, error: imageError } = await supabase
      .from('images')
      .insert({
        business_id: business.id,
        original_url: publicUrl,
        original_filename: file.name,
        file_size_bytes: file.size,
        mime_type: file.type,
        style_preset: stylePreset || null,
        status: 'pending',
      })
      .select()
      .single()

    if (imageError) {
      console.error('[Upload] Image insert error:', imageError)
      return NextResponse.json({
        error: 'Failed to create image record: ' + imageError.message,
        hint: imageError.hint || 'Make sure the images table exists and RLS policies are configured'
      }, { status: 500 })
    }

    console.log('[Upload] Image record created:', imageRecord.id)

    return NextResponse.json({
      success: true,
      image: imageRecord,
      publicUrl,
    })
  } catch (error: unknown) {
    console.error('[Upload] Error:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Upload failed' },
      { status: 500 }
    )
  }
}
