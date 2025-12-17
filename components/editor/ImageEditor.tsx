'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Download,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Loader2,
  Check,
  Sliders,
  Scissors,
  Save
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  applyEnhancements,
  dataUrlToBlob,
  type EnhancementSettings
} from '@/lib/image-processing'
import { EnhancementSliders, enhancementPresets } from './EnhancementSliders'
import { BackgroundRemover } from './BackgroundRemover'
import { BeforeAfterSlider } from './BeforeAfterSlider'
import { EnhancementExplanation } from './EnhancementExplanation'

interface ImageEditorProps {
  /** Original image URL */
  originalUrl: string
  /** AI-enhanced image URL (from Gemini) */
  enhancedUrl?: string
  /** AI-suggested enhancement settings (optional) */
  aiSettings?: EnhancementSettings
  /** Style preset name for presets */
  stylePreset?: string
  /** Called when user saves the enhanced image */
  onSave?: (imageBlob: Blob) => Promise<void>
  /** Called when settings change (for auto-save) */
  onSettingsChange?: (settings: EnhancementSettings) => void
}

const defaultSettings: EnhancementSettings = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  warmth: 0,
  sharpness: 0,
  highlights: 0,
  shadows: 0
}

export function ImageEditor({
  originalUrl,
  enhancedUrl,
  aiSettings,
  stylePreset,
  onSave,
  onSettingsChange
}: ImageEditorProps) {
  // Image state - start with AI-enhanced URL if available, otherwise original
  const [currentImageUrl, setCurrentImageUrl] = useState(enhancedUrl || originalUrl)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [settings, setSettings] = useState<EnhancementSettings>(
    aiSettings || (stylePreset && enhancementPresets[stylePreset]) || defaultSettings
  )

  // UI state
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [activeTab, setActiveTab] = useState<'adjust' | 'background'>('adjust')
  const [hasChanges, setHasChanges] = useState(false)
  // Default to comparison mode when enhanced URL exists
  const [comparisonSliderPosition, setComparisonSliderPosition] = useState(50)

  // Refs
  const previewTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Apply settings with debounce for live preview
  const applyPreview = useCallback(async () => {
    if (!currentImageUrl) return

    setIsProcessing(true)
    try {
      const result = await applyEnhancements(currentImageUrl, settings)
      setPreviewUrl(result)
    } catch (error) {
      console.error('Preview generation failed:', error)
    } finally {
      setIsProcessing(false)
    }
  }, [currentImageUrl, settings])

  // Debounced preview update
  useEffect(() => {
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current)
    }

    previewTimeoutRef.current = setTimeout(() => {
      applyPreview()
    }, 150) // 150ms debounce

    return () => {
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current)
      }
    }
  }, [settings, applyPreview])

  // Handle settings change
  const handleSettingsChange = (newSettings: EnhancementSettings) => {
    setSettings(newSettings)
    setHasChanges(true)
    onSettingsChange?.(newSettings)
  }

  // Handle background removal result
  const handleBackgroundResult = (resultUrl: string) => {
    setCurrentImageUrl(resultUrl)
    setHasChanges(true)
    // Trigger re-preview with new base image
    setSettings({ ...settings })
  }

  // Reset to initial state (AI-enhanced if available, otherwise original)
  const handleReset = () => {
    setCurrentImageUrl(enhancedUrl || originalUrl)
    setSettings(aiSettings || (stylePreset && enhancementPresets[stylePreset]) || defaultSettings)
    setHasChanges(false)
  }

  // Save the enhanced image
  const handleSave = async () => {
    if (!previewUrl || !onSave) return

    setIsSaving(true)
    try {
      const blob = dataUrlToBlob(previewUrl)
      await onSave(blob)
      setHasChanges(false)
    } catch (error) {
      console.error('Save failed:', error)
    } finally {
      setIsSaving(false)
    }
  }

  // Download the enhanced image
  const handleDownload = () => {
    if (!previewUrl) return

    // Detect format from data URL to use correct extension
    const isPng = previewUrl.startsWith('data:image/png')
    const extension = isPng ? 'png' : 'jpg'

    const a = document.createElement('a')
    a.href = previewUrl
    a.download = `foodsnap-enhanced-${Date.now()}.${extension}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  // Zoom controls
  const handleZoomIn = () => setZoom(Math.min(zoom + 0.25, 3))
  const handleZoomOut = () => setZoom(Math.max(zoom - 0.25, 0.5))
  const handleZoomReset = () => setZoom(1)

  const displayUrl = previewUrl || currentImageUrl

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Image Preview */}
      <div className="flex-1 space-y-4">
        <Card>
          <CardContent className="p-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleZoomOut}
                  disabled={zoom <= 0.5}
                  className="h-8 w-8"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground w-16 text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleZoomIn}
                  disabled={zoom >= 3}
                  className="h-8 w-8"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleZoomReset}
                  className="h-8 w-8"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                {isProcessing && (
                  <span className="flex items-center text-sm text-muted-foreground">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </span>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  disabled={!hasChanges || isSaving}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset
                </Button>
              </div>
            </div>

            {/* Image Display */}
            {enhancedUrl ? (
              /* Before/After Comparison Mode - Original vs AI Enhanced */
              <div
                className="relative overflow-hidden rounded-lg"
                style={{
                  maxHeight: '60vh',
                  minHeight: '300px'
                }}
              >
                <BeforeAfterSlider
                  beforeUrl={originalUrl}
                  afterUrl={previewUrl || enhancedUrl}
                  alt="Original vs AI Enhanced comparison"
                  className="w-full h-full"
                  onPositionChange={setComparisonSliderPosition}
                />
                {/* Labels with smooth fade animation - positioned in parent container to avoid overflow clipping */}
                {/* AI Enhanced (LEFT): Fades out when dragging left (revealing more Original) */}
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
                {/* Original (RIGHT): Fades out when dragging right (revealing more Enhanced) */}
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
            ) : (
              /* Normal Preview Mode */
              <div
                className="relative bg-[url('/checkerboard.svg')] bg-repeat overflow-auto rounded-lg"
                style={{
                  maxHeight: '60vh',
                  minHeight: '300px'
                }}
              >
                <div
                  className="transition-transform duration-200"
                  style={{
                    transform: `scale(${zoom})`,
                    transformOrigin: 'top left'
                  }}
                >
                  <img
                    src={displayUrl}
                    alt="Preview"
                    className="max-w-full block"
                    style={{
                      imageRendering: zoom > 1 ? 'pixelated' : 'auto'
                    }}
                  />
                </div>

                {/* Processing overlay */}
                {isProcessing && (
                  <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                    <div className="flex items-center gap-2 bg-background px-4 py-2 rounded-lg shadow-lg">
                      <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
                      <span className="text-sm">Applying changes...</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 mt-4">
              <Button
                variant="outline"
                onClick={handleDownload}
                disabled={!previewUrl || isProcessing}
                className="flex-1"
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
              {onSave && (
                <Button
                  onClick={handleSave}
                  disabled={!hasChanges || isProcessing || isSaving}
                  className="flex-1 bg-orange-500 hover:bg-orange-600"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Before/After Toggle (optional enhancement) */}
        {hasChanges && (
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Check className="h-4 w-4 text-green-500" />
              Live preview enabled
            </span>
          </div>
        )}
      </div>

      {/* Editor Controls */}
      <div className="w-full lg:w-[400px] space-y-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="adjust">
              <Sliders className="mr-2 h-4 w-4" />
              Adjust
            </TabsTrigger>
            <TabsTrigger value="background">
              <Scissors className="mr-2 h-4 w-4" />
              Background
            </TabsTrigger>
          </TabsList>

          <TabsContent value="adjust" className="mt-4">
            <EnhancementSliders
              settings={settings}
              onChange={handleSettingsChange}
              aiSuggestedSettings={aiSettings}
              disabled={isProcessing || isSaving}
            />
            {/* AI Explanation Section */}
            {enhancedUrl && (
              <EnhancementExplanation
                stylePreset={stylePreset}
                settings={settings}
                aiSettings={aiSettings}
              />
            )}
          </TabsContent>

          <TabsContent value="background" className="mt-4">
            <BackgroundRemover
              imageUrl={currentImageUrl}
              onResult={handleBackgroundResult}
              disabled={isProcessing || isSaving}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
