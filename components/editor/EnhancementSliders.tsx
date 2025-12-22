'use client'

import { useState, useMemo } from 'react'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Wand2, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { EnhancementSettings } from '@/lib/image-processing'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip'

interface EnhancementSlidersProps {
  /** Current settings (from AI or user adjustments) */
  settings: EnhancementSettings
  /** Called when any setting changes */
  onChange: (settings: EnhancementSettings) => void
  /** Optional: AI-suggested settings for reset */
  aiSuggestedSettings?: EnhancementSettings
  /** Disabled state during processing */
  disabled?: boolean
  /** Compact mode for mobile - shows fewer sliders initially */
  compact?: boolean
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
  disabled = false,
  compact = false,
}: EnhancementSlidersProps) {
  // Track expanded state for compact mode
  const [isExpanded, setIsExpanded] = useState(!compact)

  const handleSliderChange = (key: keyof EnhancementSettings, value: number[]) => {
    onChange({
      ...settings,
      [key]: value[0]
    })
  }

  const handleApplyAISuggestions = () => {
    if (aiSuggestedSettings) {
      onChange(aiSuggestedSettings)
    }
  }

  // Reset a single slider to default
  const handleResetSlider = (key: keyof EnhancementSettings) => {
    const defaultVal = sliderConfigs.find(c => c.key === key)?.defaultValue ?? 0
    onChange({
      ...settings,
      [key]: defaultVal
    })
  }

  // Reset all sliders to defaults
  const handleResetAll = () => {
    onChange(defaultSettings)
  }

  // Calculate which sliders have been adjusted
  const adjustedSliders = useMemo(() => {
    return sliderConfigs.filter(config => {
      const value = settings[config.key] ?? config.defaultValue
      return value !== config.defaultValue
    })
  }, [settings])

  const hasAdjustments = adjustedSliders.length > 0

  // Sliders to show in compact mode (primary adjustments)
  const primarySliders = sliderConfigs.slice(0, 4) // brightness, contrast, saturation, warmth
  const secondarySliders = sliderConfigs.slice(4) // sharpness, highlights, shadows
  const visibleSliders = isExpanded ? sliderConfigs : primarySliders

  return (
    <TooltipProvider>
      <Card>
        {/* Sticky Header with adjusted values summary */}
        <CardHeader className="pb-3 sticky top-0 bg-card z-10 border-b border-border/50">
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg">Adjustments</CardTitle>
              {/* Summary of adjusted values - visible while scrolling */}
              {hasAdjustments && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {adjustedSliders.map(config => {
                    const value = settings[config.key] ?? config.defaultValue
                    return (
                      <Badge
                        key={config.key}
                        variant="secondary"
                        className={cn(
                          "text-[10px] px-1.5 py-0.5",
                          value > 0 ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"
                        )}
                      >
                        {config.label.charAt(0)}: {value > 0 ? '+' : ''}{value}
                      </Badge>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              {/* Reset All button */}
              {hasAdjustments && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleResetAll}
                      disabled={disabled}
                      className="h-8 w-8"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Reset all</TooltipContent>
                </Tooltip>
              )}
              {/* AI Suggest button */}
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
            </div>
          </div>
        </CardHeader>

        {/* Sliders - compact spacing for mobile */}
        <CardContent className={cn(
          "space-y-4",
          compact && "space-y-3"
        )}>
          {visibleSliders.map((config) => {
            const value = settings[config.key] ?? config.defaultValue
            const aiValue = aiSuggestedSettings?.[config.key]
            const isAdjusted = value !== config.defaultValue

            return (
              <div
                key={config.key}
                className={cn(
                  "space-y-1.5 group",
                  compact && "space-y-1"
                )}
              >
                <div className="flex items-center justify-between">
                  <Label className={cn(
                    "text-sm font-medium",
                    compact && "text-xs"
                  )}>
                    {config.label}
                  </Label>
                  <div className="flex items-center gap-1.5">
                    {aiValue !== undefined && aiValue !== value && (
                      <span className="text-[10px] text-orange-500">
                        AI: {aiValue}
                      </span>
                    )}
                    <span className={cn(
                      "text-sm font-mono text-muted-foreground w-8 text-right",
                      compact && "text-xs w-7"
                    )}>
                      {value}
                    </span>
                    {/* Individual reset button - shows on hover or when adjusted */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleResetSlider(config.key)}
                          disabled={disabled || !isAdjusted}
                          className={cn(
                            "h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity",
                            isAdjusted && "opacity-50"
                          )}
                        >
                          <RotateCcw className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="left">Reset {config.label.toLowerCase()}</TooltipContent>
                    </Tooltip>
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
                {/* Description - hidden in compact mode */}
                {!compact && (
                  <p className="text-xs text-muted-foreground">{config.description}</p>
                )}
              </div>
            )
          })}

          {/* Expand/Collapse for compact mode */}
          {compact && secondarySliders.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full text-xs text-muted-foreground hover:text-foreground"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-3.5 w-3.5 mr-1" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="h-3.5 w-3.5 mr-1" />
                  Show {secondarySliders.length} more adjustments
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}

/**
 * Quick presets for common food photography styles
 */
export const enhancementPresets: Record<string, EnhancementSettings> = {
  'delivery': {
    brightness: 8,
    contrast: 10,
    saturation: 16,
    warmth: 2,
    sharpness: 52,
    highlights: -5,
    shadows: 9
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
