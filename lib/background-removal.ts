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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let bgRemovalModule: any = null

// Package name stored separately to prevent webpack static analysis
const BG_REMOVAL_PACKAGE = '@imgly/background-removal'

async function getBackgroundRemovalModule() {
  // Only run on client side
  if (typeof window === 'undefined') {
    throw new Error('Background removal can only run in the browser')
  }

  if (!bgRemovalModule) {
    // Use Function constructor to create truly dynamic import that webpack cannot analyze
    // This is necessary because @imgly/background-removal uses WASM which fails during SSR build
    const dynamicImport = new Function('pkg', 'return import(pkg)')
    bgRemovalModule = await dynamicImport(BG_REMOVAL_PACKAGE)
  }
  return bgRemovalModule
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

  // Dynamically import the background removal module
  const { removeBackground } = await getBackgroundRemovalModule()

  // Determine model based on quality
  const modelType: 'isnet' | 'isnet_quint8' | 'isnet_fp16' =
    quality === 'high' ? 'isnet' : quality === 'low' ? 'isnet_quint8' : 'isnet'

  // Configure the background removal
  const config = {
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
    // Use GPU if available for better performance
    device: 'gpu' as const,
    // Output settings
    output: {
      format: format,
      quality: quality === 'high' ? 1 : quality === 'low' ? 0.7 : 0.85
    }
  }

  try {
    // Remove background - returns a Blob
    const resultBlob = await removeBackground(imageSource, config)

    // Convert to data URL
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(new Error('Failed to read result'))
      reader.readAsDataURL(resultBlob)
    })
  } catch (error) {
    console.error('Background removal failed:', error)
    throw new Error(`Background removal failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
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
  // Remove foreground background
  const transparentForeground = await removeImageBackground(foregroundSource, options)

  // Load both images
  const [foregroundImg, backgroundImg] = await Promise.all([
    loadImageFromUrl(transparentForeground),
    loadImageFromUrl(backgroundImageUrl)
  ])

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

  // Draw background (scaled to cover)
  ctx.drawImage(backgroundImg, bgX, bgY, bgWidth, bgHeight)

  // Draw foreground on top
  ctx.drawImage(foregroundImg, 0, 0)

  return canvas.toDataURL('image/jpeg', 0.92)
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
