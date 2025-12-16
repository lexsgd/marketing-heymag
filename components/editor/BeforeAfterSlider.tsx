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
}

/**
 * Before/After Image Comparison Slider
 *
 * Standard Convention (per industry best practices):
 * - Before (Original) on LEFT
 * - After (Enhanced) on RIGHT
 * - Dragging LEFT reveals MORE of the Enhanced (right) image
 * - Dragging RIGHT reveals MORE of the Original (left) image
 *
 * Implementation:
 * - Original image is the full background
 * - Enhanced image is clipped from the RIGHT side
 * - Slider position controls the clip edge
 */
export function BeforeAfterSlider({
  beforeUrl,
  afterUrl,
  alt = 'Image comparison',
  className,
  initialPosition = 50
}: BeforeAfterSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(initialPosition)
  const [isDragging, setIsDragging] = useState(false)
  const [imagesLoaded, setImagesLoaded] = useState({ before: false, after: false })
  const containerRef = useRef<HTMLDivElement>(null)

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
    setIsDragging(true)
    handleMove(e.clientX)
  }
  const handleMouseUp = () => setIsDragging(false)
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
    window.addEventListener('mouseup', handleGlobalMouseUp)
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp)
  }, [])

  const allLoaded = imagesLoaded.before && imagesLoaded.after

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative overflow-hidden rounded-lg cursor-col-resize select-none',
        'aspect-[4/3]', // Consistent aspect ratio for comparison
        className
      )}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={() => setIsDragging(false)}
    >
      {/* BEFORE Image (Original) - Full background on LEFT */}
      <img
        src={beforeUrl}
        alt={`${alt} - Original`}
        className="absolute inset-0 w-full h-full object-contain bg-black/5"
        onLoad={() => setImagesLoaded(prev => ({ ...prev, before: true }))}
        draggable={false}
      />

      {/* AFTER Image (Enhanced) - Clipped overlay on RIGHT */}
      {/*
        Clip logic:
        - sliderPosition = 0%: Full Enhanced visible (clip edge at left)
        - sliderPosition = 50%: Right half shows Enhanced
        - sliderPosition = 100%: No Enhanced visible (clip edge at right)

        Behavior:
        - Drag LEFT (decrease position) → More Enhanced visible
        - Drag RIGHT (increase position) → More Original visible
      */}
      <div
        className="absolute top-0 right-0 h-full overflow-hidden"
        style={{ width: `${100 - sliderPosition}%` }}
      >
        <img
          src={afterUrl}
          alt={`${alt} - Enhanced`}
          className="absolute top-0 right-0 h-full object-contain bg-black/5"
          style={{
            width: containerRef.current ? `${containerRef.current.offsetWidth}px` : '100vw',
          }}
          onLoad={() => setImagesLoaded(prev => ({ ...prev, after: true }))}
          draggable={false}
        />
      </div>

      {/* Slider Handle */}
      <div
        className="absolute top-0 h-full w-0.5 bg-white shadow-[0_0_8px_rgba(0,0,0,0.3)]"
        style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
      >
        {/* Handle Circle with arrows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg border-2 border-orange-500 flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-orange-500">
            {/* Left arrow */}
            <path d="M7 10L4 7M4 7L7 4M4 7H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            {/* Right arrow */}
            <path d="M13 10L16 13M16 13L13 16M16 13H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {/* Labels - positioned at the edges for clarity */}
      <div
        className="absolute bottom-3 left-3 px-2.5 py-1 bg-black/70 text-white text-xs font-medium rounded"
        style={{ opacity: sliderPosition > 10 ? 1 : 0.3 }}
      >
        Original
      </div>
      <div
        className="absolute bottom-3 right-3 px-2.5 py-1 bg-green-600/90 text-white text-xs font-medium rounded"
        style={{ opacity: sliderPosition < 90 ? 1 : 0.3 }}
      >
        AI Enhanced
      </div>

      {/* Drag hint - shows briefly */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-black/60 text-white text-xs rounded-full pointer-events-none opacity-70">
        Drag to compare
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
