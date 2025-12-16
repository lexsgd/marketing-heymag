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
  /** Initial slider position (0-100) */
  initialPosition?: number
}

export function BeforeAfterSlider({
  beforeUrl,
  afterUrl,
  alt = 'Image comparison',
  className,
  initialPosition = 50
}: BeforeAfterSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(initialPosition)
  const [isDragging, setIsDragging] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
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
  const handleMouseDown = () => setIsDragging(true)
  const handleMouseUp = () => setIsDragging(false)
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      handleMove(e.clientX)
    }
  }

  // Touch events
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

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative overflow-hidden rounded-lg cursor-col-resize select-none',
        className
      )}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
      onTouchEnd={() => setIsDragging(false)}
    >
      {/* Before Image (Full) */}
      <img
        src={beforeUrl}
        alt={`${alt} - Original`}
        className="w-full h-full object-contain"
        onLoad={() => setImageLoaded(true)}
        draggable={false}
      />

      {/* After Image (Clipped) */}
      <div
        className="absolute top-0 left-0 h-full overflow-hidden"
        style={{ width: `${sliderPosition}%` }}
      >
        <img
          src={afterUrl}
          alt={`${alt} - Enhanced`}
          className="h-full object-contain"
          style={{
            width: containerRef.current ? `${containerRef.current.offsetWidth}px` : '100%',
            maxWidth: 'none'
          }}
          draggable={false}
        />
      </div>

      {/* Slider Handle */}
      <div
        className="absolute top-0 h-full w-1 bg-white shadow-lg cursor-col-resize"
        style={{ left: `calc(${sliderPosition}% - 2px)` }}
      >
        {/* Handle Circle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg border-2 border-orange-500 flex items-center justify-center">
          <div className="flex gap-0.5">
            <div className="w-0.5 h-4 bg-orange-500 rounded-full" />
            <div className="w-0.5 h-4 bg-orange-500 rounded-full" />
          </div>
        </div>
      </div>

      {/* Labels */}
      <div className="absolute bottom-4 left-4 px-3 py-1.5 bg-black/70 text-white text-sm font-medium rounded-full">
        Original
      </div>
      <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-orange-500 text-white text-sm font-medium rounded-full">
        Enhanced
      </div>

      {/* Loading overlay */}
      {!imageLoaded && (
        <div className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center">
          <span className="text-muted-foreground">Loading...</span>
        </div>
      )}
    </div>
  )
}
