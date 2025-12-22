'use client'

import { useState, useEffect } from 'react'
import { X, Sparkles } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface PromptBottomSheetProps {
  isOpen: boolean
  onClose: () => void
  prompt: string
  onPromptChange: (prompt: string) => void
}

const MAX_CHARS = 500

const promptSuggestions = [
  'Make it look appetizing and professional',
  'Add warm, cozy lighting like a cafe',
  'Make it Instagram-worthy with vibrant colors',
  'Give it a dark, moody restaurant feel',
  'Make it look fresh and bright for delivery app',
]

export function PromptBottomSheet({
  isOpen,
  onClose,
  prompt,
  onPromptChange,
}: PromptBottomSheetProps) {
  const [localPrompt, setLocalPrompt] = useState(prompt)

  // Sync local state with prop
  useEffect(() => {
    setLocalPrompt(prompt)
  }, [prompt])

  const handleApply = () => {
    onPromptChange(localPrompt)
    onClose()
  }

  const handleClear = () => {
    setLocalPrompt('')
    onPromptChange('')
  }

  const handleSuggestionClick = (suggestion: string) => {
    setLocalPrompt(suggestion)
  }

  const charCount = localPrompt.length
  const isOverLimit = charCount > MAX_CHARS

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="bottom"
        className="h-auto max-h-[85vh] rounded-t-2xl"
        hideCloseButton
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-2 pb-2">
          <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
        </div>

        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-orange-500" />
            Describe Your Image
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4 pb-safe">
          {/* Textarea */}
          <div className="space-y-2">
            <Textarea
              value={localPrompt}
              onChange={(e) => setLocalPrompt(e.target.value)}
              placeholder="Describe how you want your food photo to look... (optional)"
              className="min-h-[120px] resize-none"
              maxLength={MAX_CHARS + 50} // Allow slight overage for UX
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Optional - AI will use smart defaults if empty</span>
              <span className={isOverLimit ? 'text-destructive' : ''}>
                {charCount}/{MAX_CHARS}
              </span>
            </div>
          </div>

          {/* Quick Suggestions */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Quick suggestions:</p>
            <div className="flex flex-wrap gap-2">
              {promptSuggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 transition-colors text-left"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={handleClear}
              className="flex-1"
              disabled={!localPrompt}
            >
              <X className="h-4 w-4 mr-2" />
              Clear
            </Button>
            <Button
              onClick={handleApply}
              className="flex-1 bg-orange-500 hover:bg-orange-600"
              disabled={isOverLimit}
            >
              Apply
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
