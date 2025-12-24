'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Scissors,
  Loader2,
  Palette,
  Image as ImageIcon,
  Layers,
  Check,
  Upload,
  X
} from 'lucide-react'
import {
  removeImageBackground,
  replaceBackground,
  replaceBackgroundGradient,
  replaceBackgroundImage,
  presetBackgrounds,
  presetGradients,
  type BackgroundRemovalOptions
} from '@/lib/background-removal'
import { cn } from '@/lib/utils'

interface BackgroundRemoverProps {
  /** Current image URL */
  imageUrl: string
  /** Called when background is removed/replaced */
  onResult: (resultUrl: string) => void
  /** Disabled state */
  disabled?: boolean
}

type BackgroundTab = 'remove' | 'solid' | 'gradient' | 'custom'

export function BackgroundRemover({
  imageUrl,
  onResult,
  disabled = false
}: BackgroundRemoverProps) {
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [activeTab, setActiveTab] = useState<BackgroundTab>('remove')
  const [selectedColor, setSelectedColor] = useState<string | null>(null)
  const [selectedGradient, setSelectedGradient] = useState<string | null>(null)
  const [quality, setQuality] = useState<'low' | 'medium' | 'high'>('medium')
  const [customBackground, setCustomBackground] = useState<string | null>(null)

  const handleRemoveBackground = async () => {
    setProcessing(true)
    setProgress(0)

    try {
      const options: BackgroundRemovalOptions = {
        quality,
        onProgress: setProgress
      }

      const result = await removeImageBackground(imageUrl, options)
      onResult(result)
    } catch (error) {
      console.error('Background removal failed:', error)
    } finally {
      setProcessing(false)
      setProgress(0)
    }
  }

  const handleReplaceWithColor = async (color: string) => {
    setProcessing(true)
    setProgress(0)
    setSelectedColor(color)

    try {
      const options: BackgroundRemovalOptions = {
        quality,
        onProgress: setProgress
      }

      const result = await replaceBackground(imageUrl, color, options)
      onResult(result)
    } catch (error) {
      console.error('Background replacement failed:', error)
    } finally {
      setProcessing(false)
      setProgress(0)
    }
  }

  const handleReplaceWithGradient = async (gradientKey: string) => {
    setProcessing(true)
    setProgress(0)
    setSelectedGradient(gradientKey)

    try {
      const gradient = presetGradients[gradientKey as keyof typeof presetGradients]
      const options: BackgroundRemovalOptions = {
        quality,
        onProgress: setProgress
      }

      const result = await replaceBackgroundGradient(imageUrl, gradient, options)
      onResult(result)
    } catch (error) {
      console.error('Background replacement failed:', error)
    } finally {
      setProcessing(false)
      setProgress(0)
    }
  }

  const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => setCustomBackground(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleReplaceWithImage = async () => {
    if (!customBackground) return

    setProcessing(true)
    setProgress(0)

    try {
      const options: BackgroundRemovalOptions = {
        quality,
        onProgress: setProgress
      }

      const result = await replaceBackgroundImage(imageUrl, customBackground, options)
      onResult(result)
    } catch (error) {
      console.error('Background replacement with image failed:', error)
    } finally {
      setProcessing(false)
      setProgress(0)
    }
  }

  const colorGroups = {
    'Clean Whites': ['cleanWhite', 'softWhite', 'warmWhite'],
    'Neutral Grays': ['lightGray', 'mediumGray'],
    'Wood Tones': ['lightWood', 'warmWood', 'darkWood'],
    'Dark & Moody': ['moodBlack', 'elegantCharcoal'],
    'Pastels': ['softPink', 'softBlue', 'softGreen'],
    'Trendy': ['terracotta', 'sage', 'clay']
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Scissors className="h-5 w-5" />
          Background
        </CardTitle>
        <CardDescription>
          Remove or replace the background (AI-powered, runs in browser)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quality Selection */}
        <div className="space-y-2">
          <Label className="text-sm">Quality</Label>
          <Select
            value={quality}
            onValueChange={(v) => setQuality(v as typeof quality)}
            disabled={processing || disabled}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Fast (Lower Quality)</SelectItem>
              <SelectItem value="medium">Balanced (Recommended)</SelectItem>
              <SelectItem value="high">Best (Slower)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Progress Bar */}
        {processing && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Processing...</span>
              <span className="font-mono">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {progress < 30 ? 'Loading model...' :
               progress < 70 ? 'Detecting edges...' :
               'Finalizing...'}
            </p>
          </div>
        )}

        {/* Tab Options */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as BackgroundTab)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="remove" disabled={processing || disabled}>
              <Layers className="mr-1 h-4 w-4" />
              Remove
            </TabsTrigger>
            <TabsTrigger value="solid" disabled={processing || disabled}>
              <Palette className="mr-1 h-4 w-4" />
              Solid
            </TabsTrigger>
            <TabsTrigger value="gradient" disabled={processing || disabled}>
              <ImageIcon className="mr-1 h-4 w-4" />
              Gradient
            </TabsTrigger>
            <TabsTrigger value="custom" disabled={processing || disabled}>
              <Upload className="mr-1 h-4 w-4" />
              Custom
            </TabsTrigger>
          </TabsList>

          {/* Remove Tab */}
          <TabsContent value="remove" className="mt-4">
            <Button
              onClick={handleRemoveBackground}
              disabled={processing || disabled}
              className="w-full bg-orange-500 hover:bg-orange-600"
            >
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Removing Background...
                </>
              ) : (
                <>
                  <Scissors className="mr-2 h-4 w-4" />
                  Remove Background (PNG)
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Creates transparent PNG - perfect for overlays
            </p>
          </TabsContent>

          {/* Solid Color Tab */}
          <TabsContent value="solid" className="mt-4 space-y-4">
            {Object.entries(colorGroups).map(([groupName, colorKeys]) => (
              <div key={groupName}>
                <Label className="text-xs text-muted-foreground">{groupName}</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {colorKeys.map((colorKey) => {
                    const color = presetBackgrounds[colorKey as keyof typeof presetBackgrounds]
                    const isSelected = selectedColor === color
                    return (
                      <button
                        key={colorKey}
                        onClick={() => handleReplaceWithColor(color)}
                        disabled={processing || disabled}
                        className={cn(
                          'relative w-10 h-10 rounded-lg border-2 transition-all',
                          'hover:scale-110 hover:shadow-md',
                          isSelected ? 'border-orange-500 ring-2 ring-orange-500 ring-offset-2' : 'border-border'
                        )}
                        style={{ backgroundColor: color }}
                        title={colorKey}
                      >
                        {isSelected && processing && (
                          <Loader2 className="absolute inset-0 m-auto h-4 w-4 animate-spin text-orange-500" />
                        )}
                        {isSelected && !processing && (
                          <Check className="absolute inset-0 m-auto h-4 w-4 text-orange-500" />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </TabsContent>

          {/* Gradient Tab */}
          <TabsContent value="gradient" className="mt-4">
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(presetGradients).map(([key, gradient]) => {
                const isSelected = selectedGradient === key
                const dir = gradient.direction as 'vertical' | 'horizontal' | 'radial'
                const gradientStyle = dir === 'radial'
                  ? `radial-gradient(circle, ${gradient.start}, ${gradient.end})`
                  : dir === 'horizontal'
                    ? `linear-gradient(90deg, ${gradient.start}, ${gradient.end})`
                    : `linear-gradient(180deg, ${gradient.start}, ${gradient.end})`

                return (
                  <button
                    key={key}
                    onClick={() => handleReplaceWithGradient(key)}
                    disabled={processing || disabled}
                    className={cn(
                      'relative h-16 rounded-lg border-2 transition-all',
                      'hover:scale-105 hover:shadow-md',
                      isSelected ? 'border-orange-500 ring-2 ring-orange-500 ring-offset-2' : 'border-border'
                    )}
                    style={{ background: gradientStyle }}
                    title={key}
                  >
                    {isSelected && processing && (
                      <Loader2 className="absolute inset-0 m-auto h-5 w-5 animate-spin text-white drop-shadow-md" />
                    )}
                    {isSelected && !processing && (
                      <Check className="absolute inset-0 m-auto h-5 w-5 text-white drop-shadow-md" />
                    )}
                    <span className="absolute bottom-1 left-2 text-xs text-white drop-shadow-md capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                  </button>
                )
              })}
            </div>
          </TabsContent>

          {/* Custom Background Tab */}
          <TabsContent value="custom" className="mt-4 space-y-4">
            {/* Preview of uploaded background */}
            {customBackground && (
              <div className="relative aspect-video rounded-lg overflow-hidden border">
                <img
                  src={customBackground}
                  alt="Custom background"
                  className="object-cover w-full h-full"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8 bg-background/80 hover:bg-background"
                  onClick={() => setCustomBackground(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Upload zone */}
            {!customBackground && (
              <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">Upload your background</span>
                <span className="text-xs text-muted-foreground mt-1">PNG, JPG up to 10MB</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleBackgroundUpload}
                  disabled={processing || disabled}
                />
              </label>
            )}

            {/* Apply button */}
            <Button
              onClick={handleReplaceWithImage}
              disabled={!customBackground || processing || disabled}
              className="w-full bg-orange-500 hover:bg-orange-600"
            >
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Applying Background...
                </>
              ) : (
                <>
                  <ImageIcon className="mr-2 h-4 w-4" />
                  Apply Custom Background
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              FREE - Your food will be placed on this background
            </p>
          </TabsContent>
        </Tabs>

        {/* Info Note */}
        <div className="text-xs text-muted-foreground p-3 bg-muted rounded-lg">
          <strong>Note:</strong> Background removal runs entirely in your browser.
          First use downloads a ~5MB AI model (cached for future use).
        </div>
      </CardContent>
    </Card>
  )
}
