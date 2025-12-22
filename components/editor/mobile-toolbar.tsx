'use client'

import { Palette, MessageSquare, SlidersHorizontal, Sparkles, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface MobileToolbarProps {
  onStyleClick: () => void
  onPromptClick: () => void
  onAdjustClick?: () => void
  onTransformClick: () => void
  hasImage: boolean
  hasStyleSelected: boolean
  isProcessing: boolean
  disabled?: boolean
}

export function MobileToolbar({
  onStyleClick,
  onPromptClick,
  onAdjustClick,
  onTransformClick,
  hasImage,
  hasStyleSelected,
  isProcessing,
  disabled = false,
}: MobileToolbarProps) {
  const canTransform = hasImage && hasStyleSelected && !isProcessing

  return (
    <div className="bg-background/95 backdrop-blur-sm border-t border-border px-4 py-2 pb-safe">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {/* Style Button */}
        <Button
          variant="ghost"
          onClick={onStyleClick}
          disabled={disabled || isProcessing}
          className={cn(
            'flex flex-col items-center gap-0.5 h-auto py-2 px-4 min-w-[60px]',
            hasStyleSelected && 'text-orange-500'
          )}
        >
          <Palette className="h-5 w-5" />
          <span className="text-[10px] font-medium">Style</span>
        </Button>

        {/* Prompt Button */}
        <Button
          variant="ghost"
          onClick={onPromptClick}
          disabled={disabled || isProcessing}
          className="flex flex-col items-center gap-0.5 h-auto py-2 px-4 min-w-[60px]"
        >
          <MessageSquare className="h-5 w-5" />
          <span className="text-[10px] font-medium">Prompt</span>
        </Button>

        {/* Adjust Button - Only enabled when image exists */}
        <Button
          variant="ghost"
          onClick={onAdjustClick}
          disabled={disabled || isProcessing || !hasImage}
          className={cn(
            'flex flex-col items-center gap-0.5 h-auto py-2 px-4 min-w-[60px]',
            !hasImage && 'opacity-40'
          )}
        >
          <SlidersHorizontal className="h-5 w-5" />
          <span className="text-[10px] font-medium">Adjust</span>
        </Button>

        {/* Transform Button - Primary CTA */}
        <Button
          onClick={onTransformClick}
          disabled={!canTransform}
          className={cn(
            'flex flex-col items-center gap-0.5 h-auto py-2 px-4 min-w-[60px] rounded-xl',
            canTransform
              ? 'bg-orange-500 hover:bg-orange-600 text-white'
              : 'bg-muted text-muted-foreground'
          )}
        >
          {isProcessing ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Sparkles className="h-5 w-5" />
          )}
          <span className="text-[10px] font-medium">
            {isProcessing ? 'Wait...' : 'Transform'}
          </span>
        </Button>
      </div>
    </div>
  )
}
