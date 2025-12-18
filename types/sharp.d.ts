/**
 * Sharp type declarations for dynamic import
 * Sharp may not be available on all platforms (e.g., Vercel Edge),
 * so we use dynamic require with fallback handling
 */
declare module 'sharp' {
  interface Sharp {
    toBuffer(): Promise<Buffer>
    resize(width: number, height?: number, options?: object): Sharp
    jpeg(options?: object): Sharp
    png(options?: object): Sharp
    webp(options?: object): Sharp
    modulate(options: {
      brightness?: number
      saturation?: number
      hue?: number
      lightness?: number
    }): Sharp
    tint(rgb: { r: number; g: number; b: number }): Sharp
    gamma(gamma?: number, gammaOut?: number): Sharp
    linear(a: number | number[], b: number | number[]): Sharp
    normalise(): Sharp
    blur(sigma?: number): Sharp
    sharpen(options?: { sigma?: number; m1?: number; m2?: number }): Sharp
    metadata(): Promise<{
      width?: number
      height?: number
      format?: string
      size?: number
    }>
    composite(images: Array<{ input: Buffer | string; blend?: string }>): Sharp
    clone(): Sharp
  }

  interface SharpConstructor {
    (input?: Buffer | string | { create?: object }): Sharp
  }

  const sharp: SharpConstructor
  export = sharp
}
