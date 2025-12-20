'use client'

import { useState, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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

type DownloadOption = '2K' | '4K' | 'PNG'

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
  const [comparisonSliderPosition, setComparisonSliderPosition] = useState(50)
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
      const resultBlob = await bgModule.removeBackground(URL.createObjectURL(imageBlob), {
        debug: false,
        progress: (_key: string, current: number, total: number) => {
          setBgRemovalProgress(Math.round((current / total) * 100))
        },
        model: 'isnet',
        device: 'gpu',
        output: {
          format: 'image/png',
          quality: 1
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

  const displayUrl = enhancedUrl || originalUrl
  const hasEnhanced = !!enhancedUrl

  return (
    <div className="flex flex-col gap-4">
      {/* Image Preview */}
      <Card>
        <CardContent className="p-4 pt-2">
          {/* Image Display */}
          {hasEnhanced ? (
            <>
              {/* Before/After Comparison Mode */}
              <div
                className="relative overflow-hidden rounded-lg"
                style={{
                  height: 'calc(100vh - 280px)',
                  minHeight: '400px'
                }}
              >
                <BeforeAfterSlider
                  beforeUrl={originalUrl}
                  afterUrl={enhancedUrl}
                  alt="Original vs AI Enhanced comparison"
                  className="w-full h-full"
                  onPositionChange={setComparisonSliderPosition}
                />
                {/* Labels with smooth fade animation */}
                <div
                  className={cn(
                    'absolute bottom-4 left-4 z-20',
                    'px-3 py-1.5 rounded-md text-sm font-medium',
                    'bg-green-600 text-white',
                    'shadow-lg pointer-events-none',
                    'transition-opacity duration-200'
                  )}
                  style={{ opacity: Math.min(1, comparisonSliderPosition / 25) }}
                >
                  AI Enhanced
                </div>
                <div
                  className={cn(
                    'absolute bottom-4 right-4 z-20',
                    'px-3 py-1.5 rounded-md text-sm font-medium',
                    'bg-gray-800 text-white',
                    'shadow-lg pointer-events-none',
                    'transition-opacity duration-200'
                  )}
                  style={{ opacity: Math.min(1, (100 - comparisonSliderPosition) / 25) }}
                >
                  Original
                </div>
              </div>

              {/* Side-by-Side Comparison */}
              <div className="grid grid-cols-2 gap-4 mt-4">
                {/* Original */}
                <div>
                  <p className="text-sm font-medium mb-2">Original</p>
                  <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                    <img
                      src={originalUrl}
                      alt="Original"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                </div>
                {/* AI Enhanced */}
                <div>
                  <p className="text-sm font-medium mb-2 text-green-600">AI Enhanced</p>
                  <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                    <img
                      src={enhancedUrl}
                      alt="AI Enhanced"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Single View Mode - no enhanced yet */
            <div
              className="relative overflow-hidden rounded-lg bg-muted flex items-center justify-center"
              style={{
                height: 'calc(100vh - 280px)',
                minHeight: '400px'
              }}
            >
              <img
                src={displayUrl}
                alt="Preview"
                className="max-w-full max-h-full object-contain"
              />
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 mt-4">
            {/* Download Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  className="flex-1 bg-orange-500 hover:bg-orange-600"
                  disabled={!enhancedUrl || isDownloading}
                >
                  {isDownloading ? (
                    <div className="flex items-center w-full">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin flex-shrink-0" />
                      <span className="flex-1 text-left">
                        {downloadingOption === '4K' ? 'Generating 4K...' :
                         downloadingOption === 'PNG' ? `Removing Background${bgRemovalProgress > 0 ? ` (${bgRemovalProgress}%)` : '...'}` :
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
              <DropdownMenuContent align="end" className="w-64">
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
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        Recommended
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
                        +1 credit
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      4096 × 4096 px • Ultra high quality for print
                    </p>
                    {creditsRemaining < 1 && (
                      <p className="text-xs text-destructive mt-1">
                        Insufficient credits
                      </p>
                    )}
                  </div>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {/* PNG with Background Removal */}
                <DropdownMenuItem
                  onClick={handleDownloadPNG}
                  disabled={isDownloading}
                  className="flex items-start gap-3 p-3 cursor-pointer"
                >
                  <div className="h-5 w-5 mt-0.5 bg-[url('/checkerboard.svg')] bg-repeat rounded border border-border" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Download PNG</span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        No Background
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Transparent PNG • Perfect for overlays
                    </p>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Credits indicator */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <span>Credits remaining:</span>
        <Badge variant="secondary">{creditsRemaining}</Badge>
      </div>
    </div>
  )
}
