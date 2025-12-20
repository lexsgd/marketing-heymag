'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface BeforeAfterSliderProps {
  /** URL of the original (before) image */
  beforeUrl: string
  /** URL of the enhanced (after) image */
  afterUrl: string
  /** Alt text for accessibility */
  alt?: string
  /** Optional class name */
  className?: string
  /** Initial slider position (0-100), default 50 */
  initialPosition?: number
  /** Callback when slider position changes */
  onPositionChange?: (position: number) => void
}

/**
 * Before/After Image Comparison Slider
 *
 * Implementation based on industry best practices:
 * - Both images positioned in EXACT same location and size
 * - Enhanced (after) image on TOP with clip-path
 * - Original (before) image as background UNDERNEATH
 * - Dragging RIGHT reveals MORE of the Enhanced image
 * - Dragging LEFT reveals MORE of the Original image
 *
 * Reference: https://codepen.io/cgrkzlkn/pen/ZEooeeW
 */
export function BeforeAfterSlider({
  beforeUrl,
  afterUrl,
  alt = 'Image comparison',
  className,
  initialPosition = 50,
  onPositionChange
}: BeforeAfterSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(initialPosition)
  const [isDragging, setIsDragging] = useState(false)
  const [imagesLoaded, setImagesLoaded] = useState({ before: false, after: false })
  const containerRef = useRef<HTMLDivElement>(null)

  // Notify parent of position changes
  useEffect(() => {
    onPositionChange?.(sliderPosition)
  }, [sliderPosition, onPositionChange])

  // Handle mouse/touch movement
  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const x = clientX - rect.left
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100))
    setSliderPosition(percentage)
  }, [])

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    handleMove(e.clientX)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      handleMove(e.clientX)
    }
  }

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches[0]) {
      handleMove(e.touches[0].clientX)
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches[0]) {
      handleMove(e.touches[0].clientX)
    }
  }

  // Global mouse up listener
  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false)
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        handleMove(e.clientX)
      }
    }

    window.addEventListener('mouseup', handleGlobalMouseUp)
    window.addEventListener('mousemove', handleGlobalMouseMove)

    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp)
      window.removeEventListener('mousemove', handleGlobalMouseMove)
    }
  }, [isDragging, handleMove])

  const allLoaded = imagesLoaded.before && imagesLoaded.after

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative overflow-hidden rounded-lg select-none w-full h-full',
        isDragging ? 'cursor-grabbing' : 'cursor-grab',
        className
      )}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={() => setIsDragging(false)}
    >
      {/* Background for letterboxing - gradient for polish */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-950 to-black" />

      {/* BEFORE Image (Original) - Full background UNDERNEATH */}
      {/* Using object-contain to show the full image without cropping */}
      <img
        src={beforeUrl}
        alt={`${alt} - Original`}
        className="absolute inset-0 w-full h-full object-contain object-center"
        onLoad={() => setImagesLoaded(prev => ({ ...prev, before: true }))}
        draggable={false}
      />

      {/* AFTER Image (Enhanced/Generated) - On TOP with clip-path */}
      {/*
        Clip behavior:
        - sliderPosition = 0%: Enhanced completely clipped (hidden)
        - sliderPosition = 50%: Left half of Enhanced visible
        - sliderPosition = 100%: Full Enhanced visible

        User interaction:
        - Drag RIGHT → sliderPosition increases → More Enhanced visible
        - Drag LEFT → sliderPosition decreases → More Original visible

        Note: object-contain ensures both images are positioned identically,
        so the comparison works even with different aspect ratios.
      */}
      <img
        src={afterUrl}
        alt={`${alt} - Enhanced`}
        className="absolute inset-0 w-full h-full object-contain object-center"
        style={{
          clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)`
        }}
        onLoad={() => setImagesLoaded(prev => ({ ...prev, after: true }))}
        draggable={false}
      />

      {/* Slider Handle - Vertical line with draggable circle */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-white pointer-events-none"
        style={{
          left: `${sliderPosition}%`,
          transform: 'translateX(-50%)',
          boxShadow: '0 0 10px rgba(0,0,0,0.3)'
        }}
      >
        {/* Handle Circle */}
        <div
          className={cn(
            'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
            'w-12 h-12 bg-white rounded-full shadow-lg',
            'border-2 border-orange-500',
            'flex items-center justify-center',
            'pointer-events-auto',
            isDragging ? 'cursor-grabbing scale-110' : 'cursor-grab'
          )}
          style={{ transition: isDragging ? 'none' : 'transform 0.1s' }}
        >
          {/* Left/Right arrows */}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-orange-500">
            <path
              d="M8 12H4M4 12L7 9M4 12L7 15"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M16 12H20M20 12L17 9M20 12L17 15"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* Corner labels that fade based on slider position */}
      {/* AI Enhanced label - bottom left (visible when slider reveals enhanced) */}
      <div
        className="absolute bottom-4 left-4 pointer-events-none transition-opacity duration-300"
        style={{ opacity: Math.min(1, sliderPosition / 40) * 0.9 }}
      >
        <div className="px-3 py-1.5 bg-orange-500/90 text-white text-xs font-medium rounded-full flex items-center gap-1.5 shadow-lg backdrop-blur-sm">
          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2Z" />
          </svg>
          AI Enhanced
        </div>
      </div>

      {/* Original label - bottom right (visible when slider reveals original) */}
      <div
        className="absolute bottom-4 right-4 pointer-events-none transition-opacity duration-300"
        style={{ opacity: Math.min(1, (100 - sliderPosition) / 40) * 0.9 }}
      >
        <div className="px-3 py-1.5 bg-gray-800/90 text-gray-300 text-xs font-medium rounded-full shadow-lg backdrop-blur-sm">
          Original
        </div>
      </div>

      {/* Loading overlay */}
      {!allLoaded && (
        <div className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center">
          <span className="text-muted-foreground text-sm">Loading comparison...</span>
        </div>
      )}
    </div>
  )
}
