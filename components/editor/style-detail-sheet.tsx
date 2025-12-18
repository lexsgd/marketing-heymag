'use client'

import { Check, X } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { type Style, type StyleCategory } from '@/lib/styles-data'

interface StyleDetailSheetProps {
  style: Style | null
  category: StyleCategory | null
  isSelected: boolean
  isOpen: boolean
  onClose: () => void
  onSelect: () => void
}

/**
 * StyleDetailSheet - Mobile-friendly bottom sheet for style details
 *
 * Features:
 * - Slides up from bottom on mobile
 * - Large image preview
 * - Full description
 * - Keywords display
 * - Quick select/deselect button
 */
export function StyleDetailSheet({
  style,
  category,
  isSelected,
  isOpen,
  onClose,
  onSelect,
}: StyleDetailSheetProps) {
  if (!style || !category) {
    return null
  }

  // Get larger thumbnail URL
  const getLargerThumbnail = (url: string): string => {
    if (url.includes('unsplash.com')) {
      return url.replace(/w=\d+/, 'w=800').replace(/h=\d+/, 'h=800')
    }
    return url
  }

  const isImageUrl = style.thumbnail.includes('unsplash.com')

  const handleSelect = () => {
    onSelect()
    onClose()
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-auto max-h-[85vh] rounded-t-xl p-0">
        {/* Handle bar for dragging */}
        <div className="flex justify-center py-3">
          <div className="w-12 h-1.5 rounded-full bg-muted-foreground/30" />
        </div>

        <SheetHeader className="sr-only">
          <SheetTitle>{style.name}</SheetTitle>
        </SheetHeader>

        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute top-3 right-3 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm z-10"
        >
          <X className="h-4 w-4" />
        </Button>

        {/* Large Image */}
        <div className="relative">
          {isImageUrl ? (
            <img
              src={getLargerThumbnail(style.thumbnail)}
              alt={style.name}
              className="w-full h-64 object-cover"
            />
          ) : (
            <div className="w-full h-40 flex items-center justify-center bg-muted">
              <img
                src={style.thumbnail}
                alt={style.name}
                className="w-24 h-24 object-contain"
              />
            </div>
          )}

          {/* Category badge */}
          <Badge
            variant="secondary"
            className="absolute top-3 left-3 bg-background/90 backdrop-blur-sm"
          >
            {category.emoji} {category.name}
          </Badge>

          {/* Selected indicator */}
          {isSelected && (
            <div className="absolute bottom-3 right-3 bg-orange-500 text-white rounded-full p-2">
              <Check className="h-5 w-5" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">{style.name}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {style.description}
              </p>
            </div>
            <Badge variant="outline" className="shrink-0">
              {category.selectionType === 'single' ? 'Pick one' : 'Pick many'}
            </Badge>
          </div>

          {/* Keywords */}
          <div className="flex flex-wrap gap-2">
            {style.keywords.map(keyword => (
              <span
                key={keyword}
                className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full"
              >
                {keyword}
              </span>
            ))}
          </div>

          {/* Selection hint */}
          <p className="text-xs text-muted-foreground">
            {category.selectionType === 'single'
              ? category.required
                ? 'One selection required for this category'
                : 'You can select one option from this category'
              : 'You can select multiple options from this category'}
          </p>

          {/* Action button */}
          <Button
            onClick={handleSelect}
            variant={isSelected ? 'outline' : 'default'}
            className="w-full h-12 text-base"
          >
            {isSelected ? (
              <>
                <Check className="h-5 w-5 mr-2" />
                Selected - Tap to Remove
              </>
            ) : (
              'Select This Style'
            )}
          </Button>
        </div>

        {/* Safe area padding for iOS */}
        <div className="h-safe-area-inset-bottom" />
      </SheetContent>
    </Sheet>
  )
}
