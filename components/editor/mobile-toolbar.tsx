'use client'

import { Palette, MessageSquare, ImageIcon, Sparkles, Loader2, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface MobileToolbarProps {
  onStyleClick: () => void
  onPromptClick: () => void
  onTransformClick: () => void
  hasImage: boolean
  hasStyleSelected: boolean
  isProcessing: boolean
  disabled?: boolean
  variations: number
  onVariationsChange: (value: number) => void
}

export function MobileToolbar({
  onStyleClick,
  onPromptClick,
  onTransformClick,
  hasImage,
  hasStyleSelected,
  isProcessing,
  disabled = false,
  variations,
  onVariationsChange,
}: MobileToolbarProps) {
  const canTransform = hasImage && hasStyleSelected && !isProcessing

  // Cycle through 1-4 images
  const handleImagesClick = () => {
    const next = variations >= 4 ? 1 : variations + 1
    onVariationsChange(next)
  }

  return (
    <TooltipProvider>
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

          {/* Images Count Button - Locked with tooltip */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                onClick={handleImagesClick}
                disabled={true}
                className="flex flex-col items-center gap-0.5 h-auto py-2 px-4 min-w-[60px] opacity-40 relative"
              >
                <div className="relative">
                  <ImageIcon className="h-5 w-5" />
                  <Lock className="h-2.5 w-2.5 absolute -bottom-0.5 -right-0.5 text-muted-foreground" />
                </div>
                <span className="text-[10px] font-medium">{variations} Image</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[200px] text-center">
              <p className="text-xs">Multiple images coming soon! Currently transforms 1 image at a time.</p>
            </TooltipContent>
          </Tooltip>

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
    </TooltipProvider>
  )
}
