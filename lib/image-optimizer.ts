import { createClient } from '@supabase/supabase-js'

// ═══════════════════════════════════════════════════════════════════════════
// IMAGE STORAGE PIPELINE (No Sharp - Vercel Compatible)
//
// Strategy: Upload original high-res image to Supabase Storage and use:
// 1. Supabase Image Transformation (URL params) for server-side resizing
// 2. Next.js Image component for client-side optimization
//
// This approach is more reliable than Sharp in serverless environments.
// ═══════════════════════════════════════════════════════════════════════════

export interface StoredImages {
  original: {
    url: string
    size: number
    width: number
    height: number
  }
  web: {
    url: string
    size: number
    width: number
    height: number
  }
  thumb: {
    url: string
    size: number
    width: number
    height: number
  }
  imageId: string
}

/**
 * Get Supabase Storage transformation URL
 * Supabase supports image transformations via URL parameters:
 * - width: resize width
 * - height: resize height
 * - resize: 'cover' | 'contain' | 'fill'
 * - quality: 1-100
 * - format: 'origin' (keep original) or auto-converts to WebP
 *
 * Transformation URL format:
 * /storage/v1/render/image/public/{bucket}/{path}?width=400&height=400
 */
function getTransformUrl(
  supabaseUrl: string,
  bucket: string,
  path: string,
  options: { width?: number; height?: number; quality?: number }
): string {
  const params = new URLSearchParams()
  if (options.width) params.set('width', options.width.toString())
  if (options.height) params.set('height', options.height.toString())
  if (options.quality) params.set('quality', options.quality.toString())
  params.set('resize', 'cover')

  // Use render endpoint for transformations
  return `${supabaseUrl}/storage/v1/render/image/public/${bucket}/${path}?${params.toString()}`
}

/**
 * Upload image to Supabase Storage and return URLs for different sizes
 * No server-side image processing - relies on Supabase transformations + Next.js Image
 *
 * @param base64Image - Base64 encoded image string
 * @param mimeType - Original image mime type
 * @param category - Image category (for folder organization)
 * @param dimensions - Optional dimensions of the image
 * @returns Public URLs for original, web, and thumbnail versions
 */
export async function optimizeAndStore(
  base64Image: string,
  mimeType: string,
  category: string,
  dimensions?: { width: number; height: number }
): Promise<StoredImages> {
  console.log('[ImageStorage] Starting upload pipeline...')
  const startTime = Date.now()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase configuration for storage')
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  // Convert base64 to buffer
  const imageBuffer = Buffer.from(base64Image, 'base64')
  const imageSize = imageBuffer.length
  console.log('[ImageStorage] Image buffer size:', imageSize, 'bytes')

  // Generate unique image ID
  const timestamp = Date.now()
  const randomId = Math.random().toString(36).substring(2, 8)
  const imageId = `${category}-${timestamp}-${randomId}`

  // Determine file extension from mime type
  const extension = mimeType.includes('png') ? 'png' :
                    mimeType.includes('webp') ? 'webp' : 'jpg'
  const fileName = `${imageId}/original.${extension}`

  const bucketName = 'generated-images'

  // Check if bucket exists, create if not
  const { data: buckets } = await supabase.storage.listBuckets()
  const bucketExists = buckets?.some(b => b.name === bucketName)

  if (!bucketExists) {
    console.log('[ImageStorage] Creating storage bucket:', bucketName)
    const { error: createError } = await supabase.storage.createBucket(bucketName, {
      public: true,
      fileSizeLimit: 20971520, // 20MB for high-res images
      allowedMimeTypes: ['image/png', 'image/webp', 'image/jpeg']
    })
    if (createError && !createError.message.includes('already exists')) {
      console.error('[ImageStorage] Bucket creation error:', createError)
      throw createError
    }
  }

  // Upload original image
  console.log('[ImageStorage] Uploading to:', fileName)
  const { error: uploadError } = await supabase.storage
    .from(bucketName)
    .upload(fileName, imageBuffer, {
      contentType: mimeType,
      cacheControl: '31536000', // 1 year cache
      upsert: true
    })

  if (uploadError) {
    console.error('[ImageStorage] Upload error:', uploadError)
    throw uploadError
  }

  // Get public URL for original
  const { data: { publicUrl: originalUrl } } = supabase.storage
    .from(bucketName)
    .getPublicUrl(fileName)

  // Get dimensions (use provided or default to 2048)
  const width = dimensions?.width || 2048
  const height = dimensions?.height || 2048

  // Generate transformation URLs for web and thumb
  // Note: These use Supabase's image transformation if enabled
  // If not enabled, they'll return the original image
  const webUrl = getTransformUrl(supabaseUrl, bucketName, fileName, {
    width: 1200,
    height: 1200,
    quality: 85
  })

  const thumbUrl = getTransformUrl(supabaseUrl, bucketName, fileName, {
    width: 400,
    height: 400,
    quality: 80
  })

  const duration = ((Date.now() - startTime) / 1000).toFixed(2)
  console.log(`[ImageStorage] Upload complete in ${duration}s`)
  console.log('[ImageStorage] Image ID:', imageId)
  console.log('[ImageStorage] Original URL:', originalUrl)

  return {
    original: {
      url: originalUrl,
      size: imageSize,
      width: width,
      height: height
    },
    web: {
      url: webUrl,
      size: Math.round(imageSize * 0.15), // Estimated ~85% reduction
      width: 1200,
      height: 1200
    },
    thumb: {
      url: thumbUrl,
      size: Math.round(imageSize * 0.05), // Estimated ~95% reduction
      width: 400,
      height: 400
    },
    imageId
  }
}

/**
 * Legacy compatibility - same as optimizeAndStore
 * Kept for backwards compatibility with existing code
 */
export async function uploadToStorage(
  base64Image: string,
  mimeType: string,
  category: string,
  dimensions?: { width: number; height: number }
): Promise<StoredImages> {
  return optimizeAndStore(base64Image, mimeType, category, dimensions)
}
