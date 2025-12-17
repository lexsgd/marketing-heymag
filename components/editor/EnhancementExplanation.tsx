'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp, Sparkles, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { EnhancementSettings } from '@/lib/image-processing'

interface EnhancementExplanationProps {
  /** The style preset used (e.g., 'grab', 'instagram') */
  stylePreset?: string
  /** Current enhancement settings */
  settings: EnhancementSettings
  /** AI-suggested settings (if different from current) */
  aiSettings?: EnhancementSettings
  /** Optional user prompt/description */
  userPrompt?: string
  /** Whether the component starts expanded */
  defaultExpanded?: boolean
}

// Style preset display names and descriptions
const styleInfo: Record<string, { name: string; platform: string; goal: string }> = {
  'grab': {
    name: 'GrabFood',
    platform: 'GrabFood delivery app',
    goal: 'Make food look appetizing in small thumbnail listings while maintaining a natural appearance'
  },
  'foodpanda': {
    name: 'Foodpanda',
    platform: 'Foodpanda delivery app',
    goal: 'Create eye-catching menu photos that stand out in the Foodpanda interface'
  },
  'deliveroo': {
    name: 'Deliveroo',
    platform: 'Deliveroo delivery app',
    goal: 'Optimize for Deliveroo\'s clean, premium aesthetic'
  },
  'gojek': {
    name: 'GoFood',
    platform: 'Gojek GoFood app',
    goal: 'Enhance for GoFood\'s vibrant marketplace style'
  },
  'shopee': {
    name: 'ShopeeFood',
    platform: 'ShopeeFood marketplace',
    goal: 'Make photos pop in ShopeeFood\'s busy marketplace environment'
  },
  'delivery': {
    name: 'Delivery Generic',
    platform: 'delivery apps',
    goal: 'Create universally appealing food photos for any delivery platform'
  },
  'instagram': {
    name: 'Instagram Feed',
    platform: 'Instagram',
    goal: 'Create scroll-stopping content with vibrant colors and high engagement potential'
  },
  'instagram-stories': {
    name: 'Instagram Stories',
    platform: 'Instagram Stories',
    goal: 'Optimize for vertical format with trendy, attention-grabbing visuals'
  },
  'tiktok': {
    name: 'TikTok',
    platform: 'TikTok',
    goal: 'Create visually striking content that performs well in video thumbnails'
  },
  'xiaohongshu': {
    name: 'Xiaohongshu',
    platform: 'Xiaohongshu (Little Red Book)',
    goal: 'Match the trendy, lifestyle-focused aesthetic popular on Xiaohongshu'
  },
  'fine-dining': {
    name: 'Fine Dining',
    platform: 'upscale restaurants',
    goal: 'Create elegant, sophisticated imagery with dramatic lighting'
  },
  'cafe': {
    name: 'Cafe Style',
    platform: 'cafes and coffee shops',
    goal: 'Achieve a warm, cozy, artisan aesthetic'
  },
  'street-food': {
    name: 'Street Food',
    platform: 'hawker stalls and street vendors',
    goal: 'Capture authentic, vibrant street food energy'
  }
}

// Explanations for each adjustment type
function getAdjustmentExplanation(
  key: keyof EnhancementSettings,
  value: number,
  stylePreset?: string
): string {
  const platform = stylePreset ? styleInfo[stylePreset]?.platform || 'food photography' : 'food photography'

  const explanations: Record<keyof EnhancementSettings, (v: number) => string> = {
    brightness: (v) => {
      if (v > 15) return `Brightness increased significantly (+${v}) to make the food appear fresh and inviting in ${platform} thumbnails.`
      if (v > 0) return `Slight brightness boost (+${v}) to enhance the food's appeal without overexposure.`
      if (v < -10) return `Brightness reduced (${v}) to create a more dramatic, moody atmosphere.`
      if (v < 0) return `Slight brightness reduction (${v}) for a more natural, warm appearance.`
      return 'Brightness unchanged to preserve the original lighting.'
    },
    contrast: (v) => {
      if (v > 20) return `High contrast (+${v}) to make the food stand out strongly against backgrounds.`
      if (v > 0) return `Moderate contrast boost (+${v}) to add depth and definition to food textures.`
      if (v < 0) return `Reduced contrast (${v}) for a softer, more gentle look.`
      return 'Contrast unchanged to maintain natural tonal balance.'
    },
    saturation: (v) => {
      if (v > 30) return `Saturation boosted significantly (+${v}) to make colors vibrant and eye-catching in small thumbnails.`
      if (v > 15) return `Moderate saturation increase (+${v}) to enhance food colors while keeping them natural-looking.`
      if (v > 0) return `Subtle saturation boost (+${v}) to gently enhance the natural colors of the food.`
      if (v < 0) return `Saturation reduced (${v}) for a more muted, sophisticated color palette.`
      return 'Saturation unchanged to preserve original color intensity.'
    },
    warmth: (v) => {
      if (v > 15) return `Warm tones added (+${v}) to make the food look more appetizing and cozy.`
      if (v > 0) return `Slight warmth (+${v}) added to enhance the food's golden tones.`
      if (v < -10) return `Cool tones (${v}) applied for a clean, fresh appearance.`
      if (v < 0) return `Slight cooling (${v}) for a more neutral color balance.`
      return 'Color temperature unchanged to preserve natural white balance.'
    },
    sharpness: (v) => {
      if (v > 50) return `High sharpness (+${v}) to ensure crisp details visible even at small sizes on ${platform}.`
      if (v > 30) return `Moderate sharpening (+${v}) to enhance food textures and details.`
      if (v > 0) return `Light sharpening (+${v}) to subtly improve definition.`
      return 'No additional sharpening applied.'
    },
    highlights: (v) => {
      if (v > 10) return `Highlights boosted (+${v}) to add brightness to the brightest areas.`
      if (v < -10) return `Highlights reduced (${v}) to recover detail in bright areas and prevent overexposure.`
      if (v !== 0) return `Highlights adjusted (${v}) for balanced exposure.`
      return 'Highlights unchanged.'
    },
    shadows: (v) => {
      if (v > 15) return `Shadows lifted (+${v}) to reveal more detail in darker areas.`
      if (v > 0) return `Shadows slightly lifted (+${v}) to brighten dark areas without losing depth.`
      if (v < -10) return `Shadows deepened (${v}) for more dramatic contrast.`
      if (v < 0) return `Shadows slightly deepened (${v}) for added depth.`
      return 'Shadows unchanged.'
    }
  }

  const explanation = explanations[key]
  if (typeof explanation === 'function') {
    return explanation(value)
  }
  return `${key} adjusted to ${value}.`
}

export function EnhancementExplanation({
  stylePreset,
  settings,
  aiSettings,
  userPrompt,
  defaultExpanded = false
}: EnhancementExplanationProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  const style = stylePreset ? styleInfo[stylePreset] : null

  // Determine which settings to explain (AI suggested or current)
  const settingsToExplain = aiSettings || settings

  // Valid enhancement keys
  const validKeys: (keyof EnhancementSettings)[] = [
    'brightness', 'contrast', 'saturation', 'warmth', 'sharpness', 'highlights', 'shadows'
  ]

  // Get non-zero adjustments (only valid keys)
  const activeAdjustments = settingsToExplain
    ? Object.entries(settingsToExplain)
        .filter(([key, value]) => validKeys.includes(key as keyof EnhancementSettings) && typeof value === 'number' && value !== 0)
        .map(([key, value]) => [key, value] as [keyof EnhancementSettings, number])
    : []

  return (
    <Card className="mt-4">
      <CardHeader className="pb-2">
        <Button
          variant="ghost"
          className="w-full flex items-center justify-between p-0 h-auto hover:bg-transparent"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-orange-500" />
            AI Enhancement Explanation
          </CardTitle>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </CardHeader>

      <div
        className={cn(
          'overflow-hidden transition-all duration-200',
          isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <CardContent className="pt-2 space-y-4">
          {/* Style Overview */}
          {style && (
            <div className="bg-orange-50 dark:bg-orange-950/30 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-orange-700 dark:text-orange-400">
                    Optimized for {style.name}
                  </p>
                  <p className="text-muted-foreground mt-1">
                    {style.goal}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* User Prompt (if provided) */}
          {userPrompt && (
            <div className="text-sm">
              <p className="font-medium text-muted-foreground mb-1">Your description:</p>
              <p className="italic text-foreground">&ldquo;{userPrompt}&rdquo;</p>
            </div>
          )}

          {/* Adjustment Explanations */}
          {activeAdjustments.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Adjustments Applied
              </p>
              <ul className="space-y-2">
                {activeAdjustments.map(([key, value]) => (
                  <li key={key} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-orange-500 mt-1">•</span>
                    <span>{getAdjustmentExplanation(key, value, stylePreset)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* No adjustments */}
          {activeAdjustments.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No adjustments have been applied. The image is displayed as originally captured.
            </p>
          )}

          {/* Tip */}
          <div className="border-t pt-3 mt-3">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">Tip:</span> Use the sliders above to fine-tune these settings.
              Click &ldquo;AI Suggest&rdquo; to restore the recommended values, or &ldquo;Reset&rdquo; to start fresh.
            </p>
          </div>
        </CardContent>
      </div>
    </Card>
  )
}
