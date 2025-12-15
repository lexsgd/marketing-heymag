/**
 * Client-side image processing utilities using Canvas API
 * Applies enhancement settings (brightness, contrast, saturation, etc.)
 * to images in the browser - no server-side processing needed.
 */

export interface EnhancementSettings {
  brightness?: number      // -100 to 100 (0 = no change)
  contrast?: number        // -100 to 100 (0 = no change)
  saturation?: number      // -100 to 100 (0 = no change)
  warmth?: number          // -100 to 100 (0 = no change)
  sharpness?: number       // 0 to 100 (0 = no sharpening)
  highlights?: number      // -100 to 100 (0 = no change)
  shadows?: number         // -100 to 100 (0 = no change)
}

/**
 * Load an image from a URL and return it as an HTMLImageElement
 */
export async function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = (e) => reject(new Error(`Failed to load image: ${e}`))
    img.src = url
  })
}

/**
 * Apply enhancement settings to an image using Canvas API
 * Returns a data URL of the processed image
 */
export async function applyEnhancements(
  imageUrl: string,
  settings: EnhancementSettings
): Promise<string> {
  const img = await loadImage(imageUrl)

  const canvas = document.createElement('canvas')
  canvas.width = img.width
  canvas.height = img.height

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Could not get canvas context')
  }

  // Build CSS filter string
  const filters: string[] = []

  // Brightness: CSS filter uses 1 as baseline (100%)
  // Our range is -100 to 100, so we map to 0 to 2
  if (settings.brightness !== undefined && settings.brightness !== 0) {
    const brightnessValue = 1 + (settings.brightness / 100)
    filters.push(`brightness(${brightnessValue})`)
  }

  // Contrast: CSS filter uses 1 as baseline (100%)
  if (settings.contrast !== undefined && settings.contrast !== 0) {
    const contrastValue = 1 + (settings.contrast / 100)
    filters.push(`contrast(${contrastValue})`)
  }

  // Saturation: CSS filter uses 1 as baseline (100%)
  if (settings.saturation !== undefined && settings.saturation !== 0) {
    const saturationValue = 1 + (settings.saturation / 100)
    filters.push(`saturate(${saturationValue})`)
  }

  // Warmth: Use sepia + hue-rotate for warm tones
  if (settings.warmth !== undefined && settings.warmth !== 0) {
    if (settings.warmth > 0) {
      // Warm: add slight sepia
      const sepiaValue = settings.warmth / 200 // Max 0.5 sepia
      filters.push(`sepia(${sepiaValue})`)
    } else {
      // Cool: shift hue towards blue
      const hueValue = settings.warmth * 0.3 // -30 to 0 degrees
      filters.push(`hue-rotate(${hueValue}deg)`)
    }
  }

  // Apply CSS filters
  if (filters.length > 0) {
    ctx.filter = filters.join(' ')
  }

  // Draw the image with filters applied
  ctx.drawImage(img, 0, 0)

  // Reset filter for additional processing
  ctx.filter = 'none'

  // Apply sharpness using unsharp mask technique
  if (settings.sharpness !== undefined && settings.sharpness > 0) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const sharpenedData = applySharpen(imageData, settings.sharpness / 100)
    ctx.putImageData(sharpenedData, 0, 0)
  }

  // Apply highlights/shadows adjustments
  if ((settings.highlights !== undefined && settings.highlights !== 0) ||
      (settings.shadows !== undefined && settings.shadows !== 0)) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const adjustedData = applyHighlightsShadows(
      imageData,
      settings.highlights || 0,
      settings.shadows || 0
    )
    ctx.putImageData(adjustedData, 0, 0)
  }

  return canvas.toDataURL('image/jpeg', 0.92)
}

/**
 * Apply sharpening using a convolution kernel (unsharp mask)
 */
function applySharpen(imageData: ImageData, amount: number): ImageData {
  const data = imageData.data
  const width = imageData.width
  const height = imageData.height
  const output = new Uint8ClampedArray(data)

  // Sharpening kernel
  const kernel = [
    0, -amount, 0,
    -amount, 1 + (4 * amount), -amount,
    0, -amount, 0
  ]

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      for (let c = 0; c < 3; c++) {
        let sum = 0
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4 + c
            sum += data[idx] * kernel[(ky + 1) * 3 + (kx + 1)]
          }
        }
        const idx = (y * width + x) * 4 + c
        output[idx] = Math.min(255, Math.max(0, sum))
      }
    }
  }

  return new ImageData(output, width, height)
}

/**
 * Adjust highlights and shadows
 * Highlights affect bright pixels, shadows affect dark pixels
 */
function applyHighlightsShadows(
  imageData: ImageData,
  highlights: number,
  shadows: number
): ImageData {
  const data = imageData.data
  const output = new Uint8ClampedArray(data)

  // Convert adjustment values to multipliers
  const highlightsFactor = highlights / 100
  const shadowsFactor = shadows / 100

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]

    // Calculate luminance (brightness)
    const luminance = (r * 0.299 + g * 0.587 + b * 0.114) / 255

    // Calculate adjustment amount based on luminance
    let adjustment = 0

    if (luminance > 0.5) {
      // Highlights: affect bright pixels
      // Weight by how bright the pixel is (more effect on brighter pixels)
      adjustment = highlightsFactor * (luminance - 0.5) * 2 * 50
    } else {
      // Shadows: affect dark pixels
      // Weight by how dark the pixel is (more effect on darker pixels)
      adjustment = shadowsFactor * (0.5 - luminance) * 2 * 50
    }

    output[i] = Math.min(255, Math.max(0, r + adjustment))
    output[i + 1] = Math.min(255, Math.max(0, g + adjustment))
    output[i + 2] = Math.min(255, Math.max(0, b + adjustment))
    // Alpha unchanged
  }

  return new ImageData(output, imageData.width, imageData.height)
}

/**
 * Convert a data URL to a Blob for upload
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const [header, data] = dataUrl.split(',')
  const mime = header.match(/:(.*?);/)?.[1] || 'image/jpeg'
  const binary = atob(data)
  const array = new Uint8Array(binary.length)

  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i)
  }

  return new Blob([array], { type: mime })
}

/**
 * Preview enhancements in real-time on a canvas element
 * Useful for live preview without generating new data URLs
 */
export async function previewEnhancements(
  canvas: HTMLCanvasElement,
  imageUrl: string,
  settings: EnhancementSettings
): Promise<void> {
  const img = await loadImage(imageUrl)

  canvas.width = img.width
  canvas.height = img.height

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Could not get canvas context')
  }

  // Build CSS filter string
  const filters: string[] = []

  if (settings.brightness !== undefined && settings.brightness !== 0) {
    filters.push(`brightness(${1 + settings.brightness / 100})`)
  }

  if (settings.contrast !== undefined && settings.contrast !== 0) {
    filters.push(`contrast(${1 + settings.contrast / 100})`)
  }

  if (settings.saturation !== undefined && settings.saturation !== 0) {
    filters.push(`saturate(${1 + settings.saturation / 100})`)
  }

  if (settings.warmth !== undefined && settings.warmth !== 0) {
    if (settings.warmth > 0) {
      filters.push(`sepia(${settings.warmth / 200})`)
    } else {
      filters.push(`hue-rotate(${settings.warmth * 0.3}deg)`)
    }
  }

  ctx.filter = filters.length > 0 ? filters.join(' ') : 'none'
  ctx.drawImage(img, 0, 0)
}

/**
 * Resize image to fit within max dimensions while maintaining aspect ratio
 */
export async function resizeImage(
  imageUrl: string,
  maxWidth: number,
  maxHeight: number,
  quality: number = 0.92
): Promise<string> {
  const img = await loadImage(imageUrl)

  let { width, height } = img

  // Calculate new dimensions
  if (width > maxWidth || height > maxHeight) {
    const ratio = Math.min(maxWidth / width, maxHeight / height)
    width = Math.round(width * ratio)
    height = Math.round(height * ratio)
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Could not get canvas context')
  }

  ctx.drawImage(img, 0, 0, width, height)

  return canvas.toDataURL('image/jpeg', quality)
}
