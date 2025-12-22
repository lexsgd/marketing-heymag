'use client'

import { useState, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Download,
  Loader2,
  ChevronDown,
  ImageIcon,
  Sparkles,
  Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { BeforeAfterSlider } from './BeforeAfterSlider'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

interface ImageEditorProps {
  /** Image ID for API calls */
  imageId: string
  /** Original image URL */
  originalUrl: string
  /** AI-enhanced image URL (from Gemini) */
  enhancedUrl?: string
  /** Original filename for downloads */
  originalFilename?: string
  /** Credits remaining for user */
  creditsRemaining?: number
  /** Called after successful download */
  onDownloadComplete?: () => void
}

type DownloadOption = '2K' | '4K' | 'PNG' | 'PNG_HD'

export function ImageEditor({
  imageId,
  originalUrl,
  enhancedUrl,
  originalFilename = 'image',
  creditsRemaining = 0,
  onDownloadComplete,
}: ImageEditorProps) {
  // UI state
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadingOption, setDownloadingOption] = useState<DownloadOption | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [bgRemovalProgress, setBgRemovalProgress] = useState(0)

  // Ref for background removal module
  const bgRemovalModuleRef = useRef<{ removeBackground: (source: string, config: Record<string, unknown>) => Promise<Blob> } | null>(null)

  // Download 2K (current enhanced image)
  const handleDownload2K = useCallback(async () => {
    if (!enhancedUrl) return

    setIsDownloading(true)
    setDownloadingOption('2K')
    setError(null)

    try {
      // Fetch the image as blob
      const response = await fetch(enhancedUrl)
      const blob = await response.blob()

      // Create download link
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `zazzles-2k-${originalFilename}.jpg`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      onDownloadComplete?.()
    } catch (err) {
      setError('Download failed. Please try again.')
      console.error('2K download error:', err)
    } finally {
      setIsDownloading(false)
      setDownloadingOption(null)
    }
  }, [enhancedUrl, originalFilename, onDownloadComplete])

  // Download 4K (upscale via API)
  const handleDownload4K = useCallback(async () => {
    if (!enhancedUrl) return

    // Check credits
    if (creditsRemaining < 1) {
      setError('Insufficient credits. You need 1 credit for 4K download.')
      return
    }

    setIsDownloading(true)
    setDownloadingOption('4K')
    setError(null)

    try {
      // Call upscale API
      const response = await fetch('/api/ai/upscale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageId,
          resolution: '4K',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Upscale failed')
      }

      // Download the upscaled image
      const imageResponse = await fetch(data.upscaledUrl)
      const blob = await imageResponse.blob()

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `zazzles-4k-${originalFilename}.jpg`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      onDownloadComplete?.()
    } catch (err) {
      setError((err as Error).message || 'Failed to generate 4K image.')
      console.error('4K download error:', err)
    } finally {
      setIsDownloading(false)
      setDownloadingOption(null)
    }
  }, [imageId, enhancedUrl, originalFilename, creditsRemaining, onDownloadComplete])

  // Load background removal module from CDN
  const loadBgRemovalModule = useCallback(async () => {
    if (bgRemovalModuleRef.current) return bgRemovalModuleRef.current

    // Load from CDN at runtime
    const cdnUrl = 'https://esm.sh/@imgly/background-removal@1.7.0'
    const callbackName = `__bgRemoval_${Date.now()}`

    return new Promise<typeof bgRemovalModuleRef.current>((resolve, reject) => {
      const script = document.createElement('script')
      script.type = 'module'
      script.textContent = `
        import * as module from '${cdnUrl}';
        window['${callbackName}'] = module;
        window.dispatchEvent(new CustomEvent('${callbackName}'));
      `

      const handler = () => {
        const windowAny = window as unknown as Record<string, unknown>
        const loadedModule = windowAny[callbackName] as typeof bgRemovalModuleRef.current
        delete windowAny[callbackName]
        window.removeEventListener(callbackName, handler)
        document.head.removeChild(script)
        bgRemovalModuleRef.current = loadedModule
        resolve(loadedModule)
      }

      window.addEventListener(callbackName, handler)
      script.onerror = () => {
        window.removeEventListener(callbackName, handler)
        document.head.removeChild(script)
        reject(new Error('Failed to load background removal module'))
      }

      document.head.appendChild(script)

      // Timeout after 30 seconds
      setTimeout(() => {
        const windowAny = window as unknown as Record<string, unknown>
        if (windowAny[callbackName] === undefined) {
          window.removeEventListener(callbackName, handler)
          if (script.parentNode) document.head.removeChild(script)
          reject(new Error('Timeout loading background removal module'))
        }
      }, 30000)
    })
  }, [])

  // Download PNG with background removed (client-side - FREE!)
  const handleDownloadPNG = useCallback(async () => {
    if (!enhancedUrl) return

    setIsDownloading(true)
    setDownloadingOption('PNG')
    setError(null)
    setBgRemovalProgress(0)

    try {
      // Load background removal module
      const bgModule = await loadBgRemovalModule()
      if (!bgModule) throw new Error('Failed to load background removal module')

      // Fetch the enhanced image
      const imageResponse = await fetch(enhancedUrl)
      const imageBlob = await imageResponse.blob()

      // Remove background with progress tracking
      // Using 'medium' model for better edge detection quality
      // ISNet with fp16 precision provides cleaner edges on complex images
      const resultBlob = await bgModule.removeBackground(URL.createObjectURL(imageBlob), {
        debug: false,
        progress: (_key: string, current: number, total: number) => {
          setBgRemovalProgress(Math.round((current / total) * 100))
        },
        model: 'medium',  // Better quality than 'small', ~80MB model
        device: 'gpu',    // WebGPU acceleration
        output: {
          format: 'image/png',
          quality: 1,     // Maximum quality
          type: 'foreground'  // Return foreground with transparency
        }
      })

      // Download the PNG
      const url = URL.createObjectURL(resultBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = `zazzles-nobg-${originalFilename}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      onDownloadComplete?.()
    } catch (err) {
      setError((err as Error).message || 'Background removal failed.')
      console.error('PNG download error:', err)
    } finally {
      setIsDownloading(false)
      setDownloadingOption(null)
      setBgRemovalProgress(0)
    }
  }, [enhancedUrl, originalFilename, onDownloadComplete, loadBgRemovalModule])

  // Download PNG HD (cloud Remove.bg API - 1 credit, better quality)
  const handleDownloadPNGHD = useCallback(async () => {
    if (!enhancedUrl) return

    // Check credits
    if (creditsRemaining < 1) {
      setError('Insufficient credits. HD background removal requires 1 credit.')
      return
    }

    setIsDownloading(true)
    setDownloadingOption('PNG_HD')
    setError(null)

    try {
      // Call HD background removal API
      const response = await fetch('/api/ai/background-remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'HD background removal failed')
      }

      // Download the HD PNG
      const imageResponse = await fetch(data.nobgUrl)
      const blob = await imageResponse.blob()

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `zazzles-hd-nobg-${originalFilename}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      onDownloadComplete?.()
    } catch (err) {
      setError((err as Error).message || 'HD background removal failed.')
      console.error('PNG HD download error:', err)
    } finally {
      setIsDownloading(false)
      setDownloadingOption(null)
    }
  }, [imageId, enhancedUrl, originalFilename, creditsRemaining, onDownloadComplete])

  const displayUrl = enhancedUrl || originalUrl
  const hasEnhanced = !!enhancedUrl

  return (
    <div className="flex flex-col gap-4 md:gap-6 pb-20 md:pb-0">
      {/* Main Comparison Area */}
      {hasEnhanced ? (
        <>
          {/* Before/After Comparison Slider */}
          <div className="relative rounded-xl md:rounded-2xl overflow-hidden bg-gradient-to-br from-gray-900 to-black">
            {/* Mobile: Fixed height, Desktop: viewport-based */}
            <div className="relative h-[300px] sm:h-[350px] md:h-[calc(100vh-320px)] md:min-h-[400px]">
              <BeforeAfterSlider
                beforeUrl={originalUrl}
                afterUrl={enhancedUrl}
                alt="Original vs AI Enhanced comparison"
                className="w-full h-full"
              />
            </div>
          </div>

          {/* Side-by-Side Comparison - stacked on mobile, side-by-side on desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            {/* Original */}
            <div className="group relative rounded-2xl overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900">
              <div className="aspect-[4/3] relative flex items-center justify-center p-4">
                <img
                  src={originalUrl}
                  alt="Original"
                  className="max-w-full max-h-full object-contain rounded-lg transition-transform duration-500 group-hover:scale-[1.02]"
                />
              </div>
              {/* Gradient overlay at bottom */}
              <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
              {/* Label */}
              <div className="absolute bottom-3 left-3 z-10">
                <Badge variant="secondary" className="bg-gray-800/90 text-gray-300 border-0">
                  Original
                </Badge>
              </div>
            </div>

            {/* AI Enhanced */}
            <div className="group relative rounded-2xl overflow-hidden bg-gradient-to-br from-orange-950/30 to-gray-900">
              <div className="aspect-[4/3] relative flex items-center justify-center p-4">
                <img
                  src={enhancedUrl}
                  alt="AI Enhanced"
                  className="max-w-full max-h-full object-contain rounded-lg transition-transform duration-500 group-hover:scale-[1.02]"
                />
              </div>
              {/* Gradient overlay at bottom */}
              <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
              {/* Label */}
              <div className="absolute bottom-3 left-3 z-10">
                <Badge className="bg-orange-500/90 text-white border-0">
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI Enhanced
                </Badge>
              </div>
              {/* Check mark */}
              <div className="absolute top-3 right-3 z-10">
                <div className="h-7 w-7 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
                  <Check className="h-4 w-4 text-white" />
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Single View Mode - no enhanced yet */
        <div className="relative rounded-xl md:rounded-2xl overflow-hidden bg-gradient-to-br from-gray-900 to-black">
          {/* Mobile: Fixed height, Desktop: viewport-based */}
          <div className="relative flex items-center justify-center h-[300px] sm:h-[350px] md:h-[calc(100vh-280px)] md:min-h-[400px]">
            <img
              src={displayUrl}
              alt="Preview"
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Action Bar - Sticky on mobile */}
      <div className={cn(
        "flex items-center justify-between p-4 rounded-xl md:rounded-2xl bg-card border border-border",
        // Mobile: Fixed at bottom
        "fixed bottom-0 left-0 right-0 z-40 rounded-b-none border-b-0 md:relative md:rounded-2xl md:border-b"
      )}>
        {/* Credits indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 text-orange-500" />
            <span>Credits:</span>
            <Badge variant="secondary" className="font-semibold">
              {creditsRemaining}
            </Badge>
          </div>
        </div>

        {/* Download Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              className="bg-orange-500 hover:bg-orange-600 px-6"
              disabled={!enhancedUrl || isDownloading}
              size="lg"
            >
              {isDownloading ? (
                <div className="flex items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>
                    {downloadingOption === '4K' ? 'Generating 4K...' :
                     downloadingOption === 'PNG' ? `Removing BG${bgRemovalProgress > 0 ? ` ${bgRemovalProgress}%` : '...'}` :
                     downloadingOption === 'PNG_HD' ? 'HD Processing...' :
                     'Downloading...'}
                  </span>
                </div>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                  <ChevronDown className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            {/* 2K Option */}
            <DropdownMenuItem
              onClick={handleDownload2K}
              disabled={isDownloading}
              className="flex items-start gap-3 p-3 cursor-pointer"
            >
              <ImageIcon className="h-5 w-5 mt-0.5 text-muted-foreground" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Download 2K</span>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-green-500/20 text-green-600">
                    Free
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  2048 × 2048 px • High quality
                </p>
              </div>
            </DropdownMenuItem>

            {/* 4K Option */}
            <DropdownMenuItem
              onClick={handleDownload4K}
              disabled={isDownloading || creditsRemaining < 1}
              className="flex items-start gap-3 p-3 cursor-pointer"
            >
              <Sparkles className="h-5 w-5 mt-0.5 text-orange-500" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Download 4K</span>
                  <Badge
                    variant={creditsRemaining >= 1 ? "outline" : "destructive"}
                    className="text-[10px] px-1.5 py-0"
                  >
                    1 credit
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  4096 × 4096 px • Print quality
                </p>
                {creditsRemaining < 1 && (
                  <p className="text-xs text-destructive mt-1">
                    Not enough credits
                  </p>
                )}
              </div>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {/* PNG with Background Removal - Standard (Free) */}
            <DropdownMenuItem
              onClick={handleDownloadPNG}
              disabled={isDownloading}
              className="flex items-start gap-3 p-3 cursor-pointer"
            >
              <div className="h-5 w-5 mt-0.5 bg-[url('/checkerboard.svg')] bg-repeat rounded border border-border" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">PNG (Standard)</span>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-green-500/20 text-green-600">
                    Free
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Transparent background • Good for most uses
                </p>
              </div>
            </DropdownMenuItem>

            {/* PNG with Background Removal - HD Quality (1 credit) */}
            <DropdownMenuItem
              onClick={handleDownloadPNGHD}
              disabled={isDownloading || creditsRemaining < 1}
              className="flex items-start gap-3 p-3 cursor-pointer"
            >
              <div className="relative h-5 w-5 mt-0.5">
                <div className="h-5 w-5 bg-[url('/checkerboard.svg')] bg-repeat rounded border border-border" />
                <Sparkles className="h-3 w-3 absolute -top-1 -right-1 text-purple-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">PNG (HD Quality)</span>
                  <Badge
                    variant={creditsRemaining >= 1 ? "outline" : "destructive"}
                    className="text-[10px] px-1.5 py-0"
                  >
                    1 credit
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Professional edges • Perfect for product shots
                </p>
                {creditsRemaining < 1 && (
                  <p className="text-xs text-destructive mt-1">
                    Not enough credits
                  </p>
                )}
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
