/**
 * Background removal using @imgly/background-removal
 * Runs entirely in the browser using WASM - no API costs!
 *
 * Note: First run downloads ~5MB model, subsequent runs are cached
 *
 * IMPORTANT: This module must be dynamically imported on the client side only.
 * It uses WebAssembly/WebGPU which are not available during Next.js build.
 */

export interface BackgroundRemovalOptions {
  /** Quality setting: 'low', 'medium', 'high' */
  quality?: 'low' | 'medium' | 'high'
  /** Output format */
  format?: 'image/png' | 'image/jpeg' | 'image/webp'
  /** Progress callback (0-100) */
  onProgress?: (progress: number) => void
}

// Cache for the dynamically imported module
let bgRemovalModule: unknown = null

// CDN URL for the background removal package - loaded at runtime only
const BG_REMOVAL_CDN = 'https://esm.sh/@imgly/background-removal@1.7.0'

async function getBackgroundRemovalModule() {
  // Only run on client side
  if (typeof window === 'undefined') {
    throw new Error('Background removal can only run in the browser')
  }

  if (!bgRemovalModule) {
    // Load from CDN at runtime - completely bypasses Vercel build
    // The URL is computed at runtime to prevent static bundler analysis
    const cdnUrl = BG_REMOVAL_CDN
    // Use script injection for loading ESM from CDN
    // This avoids both static analysis and eval-based patterns
    bgRemovalModule = await loadModuleFromCDN(cdnUrl)
  }
  return bgRemovalModule
}

/**
 * Load an ESM module from CDN using script injection
 * This bypasses bundler static analysis and works with Vercel
 */
async function loadModuleFromCDN(url: string, retries = 2): Promise<unknown> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await loadModuleFromCDNOnce(url)
      console.log('[BgRemoval] Module loaded successfully on attempt', attempt + 1)
      return result
    } catch (error) {
      console.warn(`[BgRemoval] CDN load attempt ${attempt + 1} failed:`, error)
      if (attempt === retries) {
        throw error
      }
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
    }
  }
  throw new Error('Failed to load module after all retries')
}

async function loadModuleFromCDNOnce(url: string): Promise<unknown> {
  // Create a unique callback name
  const callbackName = `__bgRemoval_${Date.now()}_${Math.random().toString(36).slice(2)}`

  return new Promise((resolve, reject) => {
    // Create a script that imports and exposes the module
    const script = document.createElement('script')
    script.type = 'module'
    script.textContent = `
      import * as module from '${url}';
      window['${callbackName}'] = module;
      window.dispatchEvent(new CustomEvent('${callbackName}'));
    `

    let resolved = false
    const cleanup = () => {
      if (resolved) return
      resolved = true
      window.removeEventListener(callbackName, handler)
      if (script.parentNode) {
        document.head.removeChild(script)
      }
    }

    const handler = () => {
      const windowAny = window as unknown as Record<string, unknown>
      const loadedModule = windowAny[callbackName]
      delete windowAny[callbackName]
      cleanup()
      if (loadedModule) {
        resolve(loadedModule)
      } else {
        reject(new Error('Module loaded but was undefined'))
      }
    }

    window.addEventListener(callbackName, handler)

    script.onerror = (event) => {
      cleanup()
      reject(new Error(`Failed to load module from ${url}: ${event}`))
    }

    document.head.appendChild(script)

    // Timeout after 45 seconds (increased for slow connections)
    setTimeout(() => {
      if (!resolved) {
        cleanup()
        reject(new Error(`Timeout loading module from ${url}`))
      }
    }, 45000)
  })
}

/**
 * Remove background from an image
 * Returns a data URL with transparent background (PNG)
 */
export async function removeImageBackground(
  imageSource: string | Blob | File,
  options: BackgroundRemovalOptions = {}
): Promise<string> {
  const {
    quality = 'medium',
    format = 'image/png',
    onProgress
  } = options

  console.log('[BgRemoval] Starting background removal...')

  // Dynamically import the background removal module
  const bgModule = await getBackgroundRemovalModule() as { removeBackground: (source: string | Blob | File, config: Record<string, unknown>) => Promise<Blob> }
  const { removeBackground } = bgModule

  console.log('[BgRemoval] Module loaded, configuring...')

  // Determine model based on quality
  const modelType: 'isnet' | 'isnet_quint8' | 'isnet_fp16' =
    quality === 'high' ? 'isnet' : quality === 'low' ? 'isnet_quint8' : 'isnet'

  // Build config - will try GPU first, then fallback to CPU
  const buildConfig = (device: 'gpu' | 'cpu') => ({
    // Debug mode off for production
    debug: false,
    // Progress callback
    progress: (key: string, current: number, total: number) => {
      if (onProgress) {
        const percentage = Math.round((current / total) * 100)
        onProgress(percentage)
      }
    },
    // Model - uses isnet variants (the library's supported models)
    model: modelType,
    // Device for processing
    device: device,
    // Output settings
    output: {
      format: format,
      quality: quality === 'high' ? 1 : quality === 'low' ? 0.7 : 0.85
    }
  })

  // Try GPU first, fallback to CPU
  let resultBlob: Blob
  try {
    console.log('[BgRemoval] Attempting GPU processing...')
    resultBlob = await removeBackground(imageSource, buildConfig('gpu'))
    console.log('[BgRemoval] GPU processing successful')
  } catch (gpuError) {
    console.warn('[BgRemoval] GPU processing failed, falling back to CPU:', gpuError)
    try {
      resultBlob = await removeBackground(imageSource, buildConfig('cpu'))
      console.log('[BgRemoval] CPU processing successful')
    } catch (cpuError) {
      console.error('[BgRemoval] Both GPU and CPU processing failed:', cpuError)
      throw new Error(`Background removal failed: ${cpuError instanceof Error ? cpuError.message : 'Unknown error'}`)
    }
  }

  console.log('[BgRemoval] Converting result to data URL...')

  // Convert to data URL
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      console.log('[BgRemoval] Background removal complete!')
      resolve(reader.result as string)
    }
    reader.onerror = () => reject(new Error('Failed to read result'))
    reader.readAsDataURL(resultBlob)
  })
}

/**
 * Load an image from a source URL or data URL
 */
function loadImageFromUrl(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = src
  })
}

/**
 * Remove background and replace with a solid color
 */
export async function replaceBackground(
  imageSource: string | Blob | File,
  backgroundColor: string,
  options: BackgroundRemovalOptions = {}
): Promise<string> {
  // First remove the background
  const transparentImage = await removeImageBackground(imageSource, options)

  // Load the transparent image
  const img = await loadImageFromUrl(transparentImage)

  // Create canvas with background color
  const canvas = document.createElement('canvas')
  canvas.width = img.width
  canvas.height = img.height

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Could not get canvas context')
  }

  // Fill with background color
  ctx.fillStyle = backgroundColor
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Draw the transparent image on top
  ctx.drawImage(img, 0, 0)

  return canvas.toDataURL('image/jpeg', 0.92)
}

/**
 * Replace background with a gradient
 */
export async function replaceBackgroundGradient(
  imageSource: string | Blob | File,
  gradientColors: { start: string; end: string; direction?: 'vertical' | 'horizontal' | 'radial' },
  options: BackgroundRemovalOptions = {}
): Promise<string> {
  // First remove the background
  const transparentImage = await removeImageBackground(imageSource, options)

  // Load the transparent image
  const img = await loadImageFromUrl(transparentImage)

  // Create canvas
  const canvas = document.createElement('canvas')
  canvas.width = img.width
  canvas.height = img.height

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Could not get canvas context')
  }

  // Create gradient
  let gradient: CanvasGradient
  const { start, end, direction = 'vertical' } = gradientColors

  if (direction === 'radial') {
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const radius = Math.max(canvas.width, canvas.height) / 2
    gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius)
  } else if (direction === 'horizontal') {
    gradient = ctx.createLinearGradient(0, 0, canvas.width, 0)
  } else {
    gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
  }

  gradient.addColorStop(0, start)
  gradient.addColorStop(1, end)

  // Fill with gradient
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Draw the transparent image on top
  ctx.drawImage(img, 0, 0)

  return canvas.toDataURL('image/jpeg', 0.92)
}

/**
 * Replace background with another image
 */
export async function replaceBackgroundImage(
  foregroundSource: string | Blob | File,
  backgroundImageUrl: string,
  options: BackgroundRemovalOptions = {}
): Promise<string> {
  console.log('[BgRemoval] replaceBackgroundImage: Starting...')
  console.log('[BgRemoval] Foreground type:', foregroundSource instanceof Blob ? 'Blob' : foregroundSource instanceof File ? 'File' : 'string')
  console.log('[BgRemoval] Background URL type:', backgroundImageUrl.startsWith('data:') ? 'data URL' : 'external URL')

  // Remove foreground background
  console.log('[BgRemoval] Step 1: Removing background from foreground...')
  const transparentForeground = await removeImageBackground(foregroundSource, options)
  console.log('[BgRemoval] Step 1 complete: Got transparent foreground')

  // Load both images
  console.log('[BgRemoval] Step 2: Loading images...')
  const [foregroundImg, backgroundImg] = await Promise.all([
    loadImageFromUrl(transparentForeground),
    loadImageFromUrl(backgroundImageUrl)
  ])
  console.log('[BgRemoval] Step 2 complete: Foreground:', foregroundImg.width, 'x', foregroundImg.height, 'Background:', backgroundImg.width, 'x', backgroundImg.height)

  // Create canvas matching foreground dimensions
  const canvas = document.createElement('canvas')
  canvas.width = foregroundImg.width
  canvas.height = foregroundImg.height

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Could not get canvas context')
  }

  // Scale and position background to cover
  const bgScale = Math.max(
    canvas.width / backgroundImg.width,
    canvas.height / backgroundImg.height
  )
  const bgWidth = backgroundImg.width * bgScale
  const bgHeight = backgroundImg.height * bgScale
  const bgX = (canvas.width - bgWidth) / 2
  const bgY = (canvas.height - bgHeight) / 2

  console.log('[BgRemoval] Step 3: Compositing images...')

  // Draw background (scaled to cover)
  ctx.drawImage(backgroundImg, bgX, bgY, bgWidth, bgHeight)

  // Draw foreground on top
  ctx.drawImage(foregroundImg, 0, 0)

  const result = canvas.toDataURL('image/jpeg', 0.92)
  console.log('[BgRemoval] Step 3 complete: Composited image ready, size:', result.length, 'chars')

  return result
}

/**
 * Preset background colors for food photography
 */
export const presetBackgrounds = {
  // Clean whites
  cleanWhite: '#FFFFFF',
  softWhite: '#F8F8F8',
  warmWhite: '#FFFAF5',

  // Neutral grays
  lightGray: '#E5E5E5',
  mediumGray: '#A0A0A0',

  // Wood tones
  lightWood: '#D4A574',
  warmWood: '#B8860B',
  darkWood: '#5D4037',

  // Restaurant ambiance
  moodBlack: '#1A1A1A',
  elegantCharcoal: '#2D2D2D',

  // Pastel tones
  softPink: '#FFE4E1',
  softBlue: '#E6F3FF',
  softGreen: '#E8F5E9',

  // Trendy colors
  terracotta: '#E2725B',
  sage: '#9CAF88',
  clay: '#CC9966',
} as const

/**
 * Preset gradients for food photography
 */
export const presetGradients = {
  cleanToWarm: { start: '#FFFFFF', end: '#FFFAF5', direction: 'vertical' as const },
  softLight: { start: '#FFFFFF', end: '#F0F0F0', direction: 'radial' as const },
  sunsetGlow: { start: '#FFE4B5', end: '#FFA07A', direction: 'vertical' as const },
  moodyDark: { start: '#2D2D2D', end: '#1A1A1A', direction: 'vertical' as const },
  elegantGray: { start: '#E5E5E5', end: '#A0A0A0', direction: 'vertical' as const },
  warmWood: { start: '#D4A574', end: '#8B4513', direction: 'vertical' as const },
}
