'use client'

import { ChevronDown, Grid2X2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

// Variation options with visual grid representation
const variationOptions = [
  { count: 1, label: 'Single', credits: 1, description: 'One high-quality result' },
  { count: 2, label: 'Pair', credits: 2, description: 'Compare two styles' },
  { count: 3, label: 'Triple', credits: 3, description: 'More variety' },
  { count: 4, label: 'Quad', credits: 4, description: 'Maximum choices', popular: true },
]

interface VariationsPickerProps {
  value: number
  onChange: (value: number) => void
  className?: string
}

export function VariationsPicker({
  value,
  onChange,
  className
}: VariationsPickerProps) {
  const selectedOption = variationOptions.find(v => v.count === value) || variationOptions[0]

  // Visual grid preview component
  const GridPreview = ({ count, small = false }: { count: number; small?: boolean }) => {
    const size = small ? 4 : 8
    const gap = small ? 0.5 : 1

    // Grid layout based on count
    const getGridLayout = (n: number) => {
      if (n === 1) return { cols: 1, rows: 1 }
      if (n === 2) return { cols: 2, rows: 1 }
      if (n === 3) return { cols: 3, rows: 1 }
      return { cols: 2, rows: 2 }
    }

    const { cols } = getGridLayout(count)

    return (
      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${cols}, ${size}px)`,
          gap: `${gap}px`,
        }}
      >
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="bg-current rounded-[1px]"
            style={{ width: size, height: size }}
          />
        ))}
      </div>
    )
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className={cn("h-auto px-3 py-2 gap-2 hover:bg-muted", className)}
        >
          <div className="text-muted-foreground">
            <GridPreview count={value} small />
          </div>
          <span className="text-sm font-medium">
            {value} {value === 1 ? 'image' : 'images'}
          </span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="center" side="top">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Images to Generate</h4>
            <span className="text-xs text-muted-foreground">
              Credits per run
            </span>
          </div>

          <div className="space-y-2">
            {variationOptions.map((option) => {
              const isSelected = option.count === value
              return (
                <button
                  key={option.count}
                  onClick={() => onChange(option.count)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left",
                    isSelected
                      ? "border-orange-500 bg-orange-500/10"
                      : "border-border hover:border-muted-foreground/50 hover:bg-muted/50"
                  )}
                >
                  {/* Grid preview */}
                  <div className={cn(
                    "flex-shrink-0 p-2 rounded",
                    isSelected ? "text-orange-500" : "text-muted-foreground"
                  )}>
                    <GridPreview count={option.count} />
                  </div>

                  {/* Labels */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">
                        {option.count} {option.count === 1 ? 'Image' : 'Images'}
                      </p>
                      {option.popular && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-500/20 text-orange-600 font-medium">
                          Popular
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {option.description}
                    </p>
                  </div>

                  {/* Credits */}
                  <div className={cn(
                    "text-right flex-shrink-0",
                    isSelected ? "text-orange-500" : "text-muted-foreground"
                  )}>
                    <p className="text-sm font-bold">{option.credits}</p>
                    <p className="text-[10px]">credits</p>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Credit info */}
          <div className="pt-2 border-t border-border flex items-center justify-between">
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Sparkles className="h-3 w-3 text-orange-500" />
              <span>Each image is a unique AI result</span>
            </div>
            <span className="text-[11px] text-orange-500 font-medium">
              {selectedOption.credits} credits
            </span>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
