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
  Save,
  SplitSquareHorizontal,
  Eye
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
  // Track if we're showing AI-enhanced version
  const [showingAiEnhanced, setShowingAiEnhanced] = useState(!!enhancedUrl)

  // UI state
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [activeTab, setActiveTab] = useState<'adjust' | 'background'>('adjust')
  const [hasChanges, setHasChanges] = useState(false)
  const [showComparison, setShowComparison] = useState(false)

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

  // Reset to original
  const handleReset = () => {
    setCurrentImageUrl(originalUrl)
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

    const a = document.createElement('a')
    a.href = previewUrl
    a.download = `foodsnap-enhanced-${Date.now()}.jpg`
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
                {/* AI Enhanced vs Original Toggle */}
                {enhancedUrl && (
                  <Button
                    variant={showingAiEnhanced ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      const newShowAi = !showingAiEnhanced
                      setShowingAiEnhanced(newShowAi)
                      setCurrentImageUrl(newShowAi ? enhancedUrl : originalUrl)
                      // Reset settings and preview when switching
                      setSettings(aiSettings || (stylePreset && enhancementPresets[stylePreset]) || defaultSettings)
                      setHasChanges(false)
                    }}
                    className={cn(
                      showingAiEnhanced && "bg-green-600 hover:bg-green-700"
                    )}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    {showingAiEnhanced ? "AI Enhanced" : "Original"}
                  </Button>
                )}
                {/* Before/After Comparison Toggle */}
                {enhancedUrl && (
                  <Button
                    variant={showComparison ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowComparison(!showComparison)}
                    className={cn(
                      showComparison && "bg-orange-500 hover:bg-orange-600"
                    )}
                  >
                    <SplitSquareHorizontal className="mr-2 h-4 w-4" />
                    {showComparison ? "Hide Compare" : "Compare"}
                  </Button>
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
            {showComparison && enhancedUrl ? (
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
                  afterUrl={enhancedUrl}
                  alt="Original vs AI Enhanced comparison"
                  className="w-full h-full"
                />
                <div className="absolute bottom-2 left-2 right-2 flex justify-between text-xs font-medium">
                  <span className="bg-black/70 text-white px-2 py-1 rounded">Original</span>
                  <span className="bg-green-600/90 text-white px-2 py-1 rounded">AI Enhanced</span>
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
