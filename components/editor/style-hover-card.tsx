'use client'

import { useState, useEffect, type ReactNode } from 'react'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'
import { Badge } from '@/components/ui/badge'
import { type Style, type StyleCategory } from '@/lib/styles-data'

interface StyleHoverCardProps {
  style: Style
  category: StyleCategory
  children: ReactNode
}

/**
 * StyleHoverCard - Shows enlarged preview on desktop hover
 *
 * Features:
 * - 200x200 thumbnail preview
 * - Full description text
 * - Category indicator
 * - Selection type hint (single/multiple)
 * - Disabled on touch devices
 */
export function StyleHoverCard({ style, category, children }: StyleHoverCardProps) {
  const [isTouchDevice, setIsTouchDevice] = useState(false)

  // Detect touch device
  useEffect(() => {
    setIsTouchDevice(
      'ontouchstart' in window || navigator.maxTouchPoints > 0
    )
  }, [])

  // On touch devices, just render children without hover
  if (isTouchDevice) {
    return <>{children}</>
  }

  // Get larger thumbnail URL by replacing size parameters
  const getLargerThumbnail = (url: string): string => {
    // For Unsplash URLs, increase the size
    if (url.includes('unsplash.com')) {
      return url
        .replace(/w=\d+/, 'w=400')
        .replace(/h=\d+/, 'h=400')
    }
    // For SVG icons (delivery platforms, social), return as-is
    return url
  }

  const isImageUrl = style.thumbnail.includes('unsplash.com')

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        {children}
      </HoverCardTrigger>
      <HoverCardContent
        side="right"
        align="start"
        sideOffset={8}
        className="w-72 p-0"
      >
        {/* Large Thumbnail */}
        <div className="relative overflow-hidden rounded-t-md bg-muted">
          {isImageUrl ? (
            <img
              src={getLargerThumbnail(style.thumbnail)}
              alt={style.name}
              className="w-full h-48 object-cover"
            />
          ) : (
            // For icons/SVGs, show a smaller centered version
            <div className="w-full h-32 flex items-center justify-center bg-muted">
              <img
                src={style.thumbnail}
                alt={style.name}
                className="w-20 h-20 object-contain"
              />
            </div>
          )}
          {/* Category badge overlay */}
          <Badge
            variant="secondary"
            className="absolute top-2 left-2 bg-background/90 backdrop-blur-sm text-xs"
          >
            {category.emoji} {category.name}
          </Badge>
        </div>

        {/* Content */}
        <div className="p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-semibold text-sm">{style.name}</h4>
            <Badge variant="outline" className="text-[10px] shrink-0">
              {category.selectionType === 'single' ? 'Pick one' : 'Pick many'}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {style.description}
          </p>
          {/* Keywords */}
          <div className="flex flex-wrap gap-1 pt-1">
            {style.keywords.slice(0, 4).map(keyword => (
              <span
                key={keyword}
                className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}
