'use client'

import { useState } from 'react'
import { X, ChevronDown, ChevronUp, Palette } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  styleCategories,
  getSelectedCount,
  getStyleById,
  type SelectedStyles,
} from '@/lib/styles-data'

interface SelectedStylesSummaryProps {
  selection: SelectedStyles
  onRemoveStyle: (categoryId: string, styleId: string) => void
  className?: string
}

interface SelectedStyleItem {
  categoryId: string
  categoryName: string
  categoryEmoji: string
  styleId: string
  styleName: string
  styleDescription: string
  styleThumbnail: string
}

/**
 * SelectedStylesSummary - Displays selected styles in the main editor area
 *
 * Features:
 * - Shows larger thumbnails (120x120)
 * - Full descriptions visible
 * - Remove button on each style
 * - Collapsible when many styles selected
 * - Responsive grid layout
 */
export function SelectedStylesSummary({
  selection,
  onRemoveStyle,
  className,
}: SelectedStylesSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const selectedCount = getSelectedCount(selection)

  if (selectedCount === 0) {
    return null
  }

  // Collect all selected styles with their details
  const selectedStyles: SelectedStyleItem[] = []

  for (const category of styleCategories) {
    if (category.selectionType === 'single') {
      const key = category.id as keyof SelectedStyles
      const styleId = selection[key] as string | undefined
      if (styleId) {
        const result = getStyleById(styleId)
        if (result) {
          selectedStyles.push({
            categoryId: category.id,
            categoryName: category.name,
            categoryEmoji: category.emoji,
            styleId,
            styleName: result.style.name,
            styleDescription: result.style.description,
            styleThumbnail: result.style.thumbnail,
          })
        }
      }
    } else {
      const key = category.id as 'social' | 'technique'
      const styleIds = selection[key] || []
      for (const styleId of styleIds) {
        const result = getStyleById(styleId)
        if (result) {
          selectedStyles.push({
            categoryId: category.id,
            categoryName: category.name,
            categoryEmoji: category.emoji,
            styleId,
            styleName: result.style.name,
            styleDescription: result.style.description,
            styleThumbnail: result.style.thumbnail,
          })
        }
      }
    }
  }

  // Get larger thumbnail URL
  const getLargerThumbnail = (url: string): string => {
    if (url.includes('unsplash.com')) {
      return url.replace(/w=\d+/, 'w=240').replace(/h=\d+/, 'h=240')
    }
    return url
  }

  const isImageUrl = (url: string) => url.includes('unsplash.com')

  // Show collapsed view if more than 6 styles
  const shouldCollapse = selectedStyles.length > 6 && !isExpanded
  const displayedStyles = shouldCollapse
    ? selectedStyles.slice(0, 4)
    : selectedStyles

  return (
    <div className={cn('rounded-lg border bg-card p-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Palette className="h-4 w-4 text-orange-500" />
          <h3 className="font-semibold text-sm">Selected Styles</h3>
          <Badge variant="secondary" className="bg-orange-500/20 text-orange-500">
            {selectedCount}
          </Badge>
        </div>
        {selectedStyles.length > 4 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-7 text-xs gap-1"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-3 w-3" />
                Collapse
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3" />
                Show all ({selectedStyles.length})
              </>
            )}
          </Button>
        )}
      </div>

      {/* Styles Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {displayedStyles.map((item) => (
          <div
            key={`${item.categoryId}-${item.styleId}`}
            className="group relative bg-muted rounded-lg overflow-hidden"
          >
            {/* Thumbnail */}
            <div className="relative aspect-square">
              {isImageUrl(item.styleThumbnail) ? (
                <img
                  src={getLargerThumbnail(item.styleThumbnail)}
                  alt={item.styleName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  <img
                    src={item.styleThumbnail}
                    alt={item.styleName}
                    className="w-12 h-12 object-contain"
                  />
                </div>
              )}

              {/* Remove button - visible on hover */}
              <Button
                variant="destructive"
                size="icon"
                onClick={() => onRemoveStyle(item.categoryId, item.styleId)}
                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </Button>

              {/* Category badge */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 pt-6">
                <p className="text-white text-[10px] opacity-80">
                  {item.categoryEmoji} {item.categoryName}
                </p>
              </div>
            </div>

            {/* Info */}
            <div className="p-2">
              <p className="font-medium text-xs line-clamp-1">{item.styleName}</p>
              <p className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5">
                {item.styleDescription}
              </p>
            </div>
          </div>
        ))}

        {/* Show more indicator when collapsed */}
        {shouldCollapse && (
          <button
            onClick={() => setIsExpanded(true)}
            className="aspect-square bg-muted rounded-lg flex flex-col items-center justify-center gap-1 hover:bg-muted/80 transition-colors"
          >
            <span className="text-2xl font-bold text-muted-foreground">
              +{selectedStyles.length - 4}
            </span>
            <span className="text-xs text-muted-foreground">more styles</span>
          </button>
        )}
      </div>
    </div>
  )
}
