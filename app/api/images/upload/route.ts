import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Get user session
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

    // Get the form data
    const formData = await request.formData()
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

    // Create unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${business.id}/original/${Date.now()}.${fileExt}`

    // Use service role client for storage operations (bypasses RLS)
    const serviceClient = createServiceRoleClient()

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await serviceClient.storage
      .from('images')
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('[Upload] Storage error:', uploadError)
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    // Get public URL
    const { data: { publicUrl } } = serviceClient.storage
      .from('images')
      .getPublicUrl(fileName)

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
      console.error('[Upload] Database error:', imageError)
      return NextResponse.json({ error: imageError.message }, { status: 500 })
    }

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
