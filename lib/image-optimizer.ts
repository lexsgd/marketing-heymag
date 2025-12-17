import { createClient } from '@supabase/supabase-js'

// Dynamic import for Sharp - required for Vercel serverless compatibility
// Sharp has native binaries that need to load at runtime, not build time
let sharpModule: typeof import('sharp') | null = null

async function getSharp() {
  if (!sharpModule) {
    try {
      sharpModule = await import('sharp')
    } catch (error) {
      console.error('[ImageOptimizer] Failed to load Sharp:', error)
      throw new Error('Sharp image processing not available')
    }
  }
  return sharpModule.default
}

// ═══════════════════════════════════════════════════════════════════════════
// IMAGE OPTIMIZATION PIPELINE
// Creates optimized versions for web delivery:
// - Original: 2048x2048 PNG (for download/print)
// - Web: 1200x1200 WebP ~150KB (for gallery display)
// - Thumb: 400x400 WebP ~25KB (for grid views)
// ═══════════════════════════════════════════════════════════════════════════

export interface OptimizedImages {
  original: {
    buffer: Buffer
    size: number
    width: number
    height: number
    format: 'png'
  }
  web: {
    buffer: Buffer
    size: number
    width: number
    height: number
    format: 'webp'
  }
  thumb: {
    buffer: Buffer
    size: number
    width: number
    height: number
    format: 'webp'
  }
}

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
 * Create optimized versions of an image using Sharp
 * @param base64Image - Base64 encoded image string
 * @param mimeType - Original image mime type
 * @returns Buffers for original, web, and thumbnail versions
 */
export async function createOptimizedVersions(
  base64Image: string,
  mimeType: string
): Promise<OptimizedImages> {
  console.log('[ImageOptimizer] Starting optimization pipeline...')
  const startTime = Date.now()

  // Get Sharp instance (dynamic import for Vercel compatibility)
  const sharp = await getSharp()

  // Convert base64 to buffer
  const originalBuffer = Buffer.from(base64Image, 'base64')
  console.log('[ImageOptimizer] Original buffer size:', originalBuffer.length)

  // Get original dimensions
  const metadata = await sharp(originalBuffer).metadata()
  console.log('[ImageOptimizer] Original dimensions:', metadata.width, 'x', metadata.height)

  // Create PNG version (ensure it's PNG for original)
  const originalPng = await sharp(originalBuffer)
    .png({ quality: 100, compressionLevel: 6 })
    .toBuffer()

  // Create 1200x1200 WebP for web display
  const webBuffer = await sharp(originalBuffer)
    .resize(1200, 1200, {
      fit: 'cover',
      position: 'center'
    })
    .webp({
      quality: 85,
      effort: 4
    })
    .toBuffer()

  // Create 400x400 WebP thumbnail
  const thumbBuffer = await sharp(originalBuffer)
    .resize(400, 400, {
      fit: 'cover',
      position: 'center'
    })
    .webp({
      quality: 80,
      effort: 4
    })
    .toBuffer()

  const duration = ((Date.now() - startTime) / 1000).toFixed(2)
  console.log(`[ImageOptimizer] Optimization complete in ${duration}s`)
  console.log('[ImageOptimizer] Sizes - Original:', originalPng.length, 'Web:', webBuffer.length, 'Thumb:', thumbBuffer.length)

  return {
    original: {
      buffer: originalPng,
      size: originalPng.length,
      width: metadata.width || 2048,
      height: metadata.height || 2048,
      format: 'png'
    },
    web: {
      buffer: webBuffer,
      size: webBuffer.length,
      width: 1200,
      height: 1200,
      format: 'webp'
    },
    thumb: {
      buffer: thumbBuffer,
      size: thumbBuffer.length,
      width: 400,
      height: 400,
      format: 'webp'
    }
  }
}

/**
 * Upload optimized images to Supabase Storage
 * @param images - OptimizedImages from createOptimizedVersions
 * @param category - Image category (for folder organization)
 * @returns Public URLs for all versions
 */
export async function uploadToStorage(
  images: OptimizedImages,
  category: string
): Promise<StoredImages> {
  console.log('[ImageOptimizer] Uploading to Supabase Storage...')
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

  // Generate unique image ID
  const timestamp = Date.now()
  const randomId = Math.random().toString(36).substring(2, 8)
  const imageId = `${category}-${timestamp}-${randomId}`

  const bucketName = 'generated-images'

  // Check if bucket exists, create if not
  const { data: buckets } = await supabase.storage.listBuckets()
  const bucketExists = buckets?.some(b => b.name === bucketName)

  if (!bucketExists) {
    console.log('[ImageOptimizer] Creating storage bucket:', bucketName)
    const { error: createError } = await supabase.storage.createBucket(bucketName, {
      public: true,
      fileSizeLimit: 10485760, // 10MB
      allowedMimeTypes: ['image/png', 'image/webp', 'image/jpeg']
    })
    if (createError && !createError.message.includes('already exists')) {
      console.error('[ImageOptimizer] Bucket creation error:', createError)
      throw createError
    }
  }

  // Upload all versions in parallel
  const uploadPromises = [
    // Original PNG
    supabase.storage
      .from(bucketName)
      .upload(`${imageId}/original.png`, images.original.buffer, {
        contentType: 'image/png',
        cacheControl: '31536000', // 1 year cache
        upsert: true
      }),
    // Web WebP
    supabase.storage
      .from(bucketName)
      .upload(`${imageId}/web.webp`, images.web.buffer, {
        contentType: 'image/webp',
        cacheControl: '31536000',
        upsert: true
      }),
    // Thumb WebP
    supabase.storage
      .from(bucketName)
      .upload(`${imageId}/thumb.webp`, images.thumb.buffer, {
        contentType: 'image/webp',
        cacheControl: '31536000',
        upsert: true
      })
  ]

  const results = await Promise.all(uploadPromises)

  // Check for errors
  for (const result of results) {
    if (result.error) {
      console.error('[ImageOptimizer] Upload error:', result.error)
      throw result.error
    }
  }

  // Get public URLs
  const { data: { publicUrl: originalUrl } } = supabase.storage
    .from(bucketName)
    .getPublicUrl(`${imageId}/original.png`)

  const { data: { publicUrl: webUrl } } = supabase.storage
    .from(bucketName)
    .getPublicUrl(`${imageId}/web.webp`)

  const { data: { publicUrl: thumbUrl } } = supabase.storage
    .from(bucketName)
    .getPublicUrl(`${imageId}/thumb.webp`)

  const duration = ((Date.now() - startTime) / 1000).toFixed(2)
  console.log(`[ImageOptimizer] Upload complete in ${duration}s`)
  console.log('[ImageOptimizer] URLs generated for:', imageId)

  return {
    original: {
      url: originalUrl,
      size: images.original.size,
      width: images.original.width,
      height: images.original.height
    },
    web: {
      url: webUrl,
      size: images.web.size,
      width: images.web.width,
      height: images.web.height
    },
    thumb: {
      url: thumbUrl,
      size: images.thumb.size,
      width: images.thumb.width,
      height: images.thumb.height
    },
    imageId
  }
}

/**
 * Full pipeline: optimize and upload
 */
export async function optimizeAndStore(
  base64Image: string,
  mimeType: string,
  category: string
): Promise<StoredImages> {
  const optimized = await createOptimizedVersions(base64Image, mimeType)
  const stored = await uploadToStorage(optimized, category)
  return stored
}
