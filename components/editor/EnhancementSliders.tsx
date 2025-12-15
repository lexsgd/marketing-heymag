'use client'

import { useState } from 'react'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RotateCcw, Wand2 } from 'lucide-react'
import type { EnhancementSettings } from '@/lib/image-processing'

interface EnhancementSlidersProps {
  /** Current settings (from AI or user adjustments) */
  settings: EnhancementSettings
  /** Called when any setting changes */
  onChange: (settings: EnhancementSettings) => void
  /** Optional: AI-suggested settings for reset */
  aiSuggestedSettings?: EnhancementSettings
  /** Disabled state during processing */
  disabled?: boolean
}

interface SliderConfig {
  key: keyof EnhancementSettings
  label: string
  min: number
  max: number
  defaultValue: number
  description: string
}

const sliderConfigs: SliderConfig[] = [
  {
    key: 'brightness',
    label: 'Brightness',
    min: -100,
    max: 100,
    defaultValue: 0,
    description: 'Adjust overall lightness'
  },
  {
    key: 'contrast',
    label: 'Contrast',
    min: -100,
    max: 100,
    defaultValue: 0,
    description: 'Difference between dark and light'
  },
  {
    key: 'saturation',
    label: 'Saturation',
    min: -100,
    max: 100,
    defaultValue: 0,
    description: 'Color intensity'
  },
  {
    key: 'warmth',
    label: 'Warmth',
    min: -100,
    max: 100,
    defaultValue: 0,
    description: 'Cool (blue) to warm (orange)'
  },
  {
    key: 'sharpness',
    label: 'Sharpness',
    min: 0,
    max: 100,
    defaultValue: 0,
    description: 'Edge definition'
  },
  {
    key: 'highlights',
    label: 'Highlights',
    min: -100,
    max: 100,
    defaultValue: 0,
    description: 'Brightest areas'
  },
  {
    key: 'shadows',
    label: 'Shadows',
    min: -100,
    max: 100,
    defaultValue: 0,
    description: 'Darkest areas'
  }
]

const defaultSettings: EnhancementSettings = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  warmth: 0,
  sharpness: 0,
  highlights: 0,
  shadows: 0
}

export function EnhancementSliders({
  settings,
  onChange,
  aiSuggestedSettings,
  disabled = false
}: EnhancementSlidersProps) {
  const handleSliderChange = (key: keyof EnhancementSettings, value: number[]) => {
    onChange({
      ...settings,
      [key]: value[0]
    })
  }

  const handleReset = () => {
    onChange(defaultSettings)
  }

  const handleApplyAISuggestions = () => {
    if (aiSuggestedSettings) {
      onChange(aiSuggestedSettings)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Adjustments</CardTitle>
          <div className="flex gap-2">
            {aiSuggestedSettings && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleApplyAISuggestions}
                disabled={disabled}
              >
                <Wand2 className="mr-2 h-4 w-4" />
                AI Suggest
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              disabled={disabled}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {sliderConfigs.map((config) => {
          const value = settings[config.key] ?? config.defaultValue
          const aiValue = aiSuggestedSettings?.[config.key]

          return (
            <div key={config.key} className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">{config.label}</Label>
                <div className="flex items-center gap-2">
                  {aiValue !== undefined && aiValue !== value && (
                    <span className="text-xs text-orange-500">
                      AI: {aiValue}
                    </span>
                  )}
                  <span className="text-sm font-mono text-muted-foreground w-10 text-right">
                    {value}
                  </span>
                </div>
              </div>
              <Slider
                value={[value]}
                min={config.min}
                max={config.max}
                step={1}
                onValueChange={(v) => handleSliderChange(config.key, v)}
                disabled={disabled}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">{config.description}</p>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

/**
 * Quick presets for common food photography styles
 */
export const enhancementPresets: Record<string, EnhancementSettings> = {
  'delivery': {
    brightness: 15,
    contrast: 20,
    saturation: 25,
    warmth: 10,
    sharpness: 40,
    highlights: -5,
    shadows: 15
  },
  'instagram': {
    brightness: 10,
    contrast: 15,
    saturation: 30,
    warmth: 15,
    sharpness: 35,
    highlights: 0,
    shadows: 10
  },
  'fine-dining': {
    brightness: -5,
    contrast: 25,
    saturation: 15,
    warmth: -5,
    sharpness: 30,
    highlights: -15,
    shadows: -10
  },
  'cafe': {
    brightness: 10,
    contrast: 10,
    saturation: 20,
    warmth: 20,
    sharpness: 25,
    highlights: 5,
    shadows: 15
  },
  'xiaohongshu': {
    brightness: 15,
    contrast: 12,
    saturation: 35,
    warmth: 8,
    sharpness: 30,
    highlights: 10,
    shadows: 10
  }
}
