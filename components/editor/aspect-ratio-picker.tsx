'use client'

import { Check, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

// Aspect ratio options with visual shapes and platform context
const aspectRatios = [
  {
    value: '1:1',
    label: 'Square',
    platform: 'Instagram Post',
    width: 24,
    height: 24,
    icon: '📸'
  },
  {
    value: '4:5',
    label: 'Portrait',
    platform: 'Instagram Feed',
    width: 20,
    height: 25,
    icon: '📱'
  },
  {
    value: '9:16',
    label: 'Vertical',
    platform: 'TikTok / Reels',
    width: 18,
    height: 32,
    icon: '🎬'
  },
  {
    value: '16:9',
    label: 'Landscape',
    platform: 'YouTube / Web',
    width: 32,
    height: 18,
    icon: '🖥️'
  },
  {
    value: '3:4',
    label: 'Classic',
    platform: 'Pinterest',
    width: 21,
    height: 28,
    icon: '📌'
  },
  {
    value: '4:3',
    label: 'Standard',
    platform: 'Traditional',
    width: 28,
    height: 21,
    icon: '🍽️'
  },
]

interface AspectRatioPickerProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

export function AspectRatioPicker({
  value,
  onChange,
  className
}: AspectRatioPickerProps) {
  const selectedRatio = aspectRatios.find(r => r.value === value) || aspectRatios[0]

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className={cn("h-auto px-3 py-2 gap-2 hover:bg-muted", className)}
        >
          {/* Visual ratio shape */}
          <div
            className="border-2 border-current rounded-sm flex-shrink-0"
            style={{
              width: selectedRatio.width * 0.5,
              height: selectedRatio.height * 0.5,
            }}
          />
          <span className="text-sm font-medium">{selectedRatio.value}</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3" align="center" side="top">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Aspect Ratio</h4>
            <span className="text-xs text-muted-foreground">
              Select output size
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {aspectRatios.map((ratio) => {
              const isSelected = ratio.value === value
              return (
                <button
                  key={ratio.value}
                  onClick={() => onChange(ratio.value)}
                  className={cn(
                    "relative flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all",
                    isSelected
                      ? "border-orange-500 bg-orange-500/10"
                      : "border-border hover:border-muted-foreground/50 hover:bg-muted/50"
                  )}
                >
                  {/* Selected indicator */}
                  {isSelected && (
                    <div className="absolute top-1 right-1">
                      <Check className="h-3 w-3 text-orange-500" />
                    </div>
                  )}

                  {/* Visual shape representation */}
                  <div
                    className={cn(
                      "border-2 rounded-sm",
                      isSelected ? "border-orange-500" : "border-muted-foreground"
                    )}
                    style={{
                      width: ratio.width,
                      height: ratio.height,
                    }}
                  />

                  {/* Ratio label */}
                  <div className="text-center">
                    <p className="text-xs font-medium">{ratio.value}</p>
                    <p className="text-[10px] text-muted-foreground leading-tight">
                      {ratio.platform}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Quick tip */}
          <div className="pt-2 border-t border-border">
            <p className="text-[10px] text-muted-foreground text-center">
              💡 {selectedRatio.label} format is best for {selectedRatio.platform}
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
