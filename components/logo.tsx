'use client'

import { useTheme } from 'next-themes'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'

interface LogoProps {
  className?: string
  width?: number
  height?: number
  linkTo?: string
}

export function Logo({ className = '', width = 120, height = 70, linkTo = '/' }: LogoProps) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <Link href={linkTo} className={className}>
        <div style={{ width, height: height * 0.4 }} className="bg-muted animate-pulse rounded" />
      </Link>
    )
  }

  const logoSrc = resolvedTheme === 'dark'
    ? '/logos/Zazzles-White.png'
    : '/logos/Zazzles-Black.png'

  return (
    <Link href={linkTo} className={className}>
      <Image
        src={logoSrc}
        alt="Zazzles"
        width={width}
        height={height}
        className="object-contain"
        priority
      />
    </Link>
  )
}

// Icon-only version for compact spaces
export function LogoIcon({ className = '', size = 32 }: { className?: string; size?: number }) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div style={{ width: size, height: size }} className="bg-muted animate-pulse rounded-lg" />
  }

  // Use first letter styled or full logo cropped
  return (
    <div
      className={`flex items-center justify-center rounded-lg bg-orange-500 text-white font-bold ${className}`}
      style={{ width: size, height: size }}
    >
      <span style={{ fontSize: size * 0.5 }}>Z</span>
    </div>
  )
}
