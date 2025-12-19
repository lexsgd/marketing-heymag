"use client"

import Link from 'next/link'
import { ArrowLeft, Camera, Sparkles, Zap, Share2, Wand2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AuthLayoutProps {
  children: React.ReactNode
  showBackButton?: boolean
}

export function AuthLayout({ children, showBackButton = true }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding & Benefits */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-orange-500 via-orange-500 to-amber-500 p-12 text-white">
        <div className="w-full max-w-md mx-auto flex flex-col justify-between">
          <div>
            <Link href="/" className="inline-flex items-center gap-3 mb-12">
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                <Wand2 className="h-6 w-6" />
              </div>
              <span className="text-2xl font-bold">Zazzles</span>
            </Link>

            <h1 className="text-4xl font-bold leading-tight">
              AI Food Photography<br />
              Made Simple
            </h1>
            <p className="text-white/90 mt-4 text-lg">
              Transform phone photos into stunning marketing content for your F&B business
            </p>

            <div className="space-y-6 mt-10">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">AI Photo Enhancement</h3>
                  <p className="text-white/80 text-sm">
                    Pro-quality food photos in seconds with Google AI technology
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                  <Zap className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">30+ Style Presets</h3>
                  <p className="text-white/80 text-sm">
                    GrabFood, Foodpanda, Instagram, Xiaohongshu & more SEA platforms
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                  <Share2 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">AI Captions & Social Posting</h3>
                  <p className="text-white/80 text-sm">
                    Generate captions in EN/CN and post to all platforms in one click
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-white/20">
            <p className="text-sm font-medium">
              Start Free Today
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3 text-sm text-white/80">
              <span>✓ 5 Free Credits</span>
              <span>✓ No Credit Card</span>
              <span>✓ Cancel Anytime</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          {showBackButton && (
            <Button
              variant="ghost"
              size="sm"
              className="mb-8 -ml-2"
              asChild
            >
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to home
              </Link>
            </Button>
          )}

          {/* Mobile Logo */}
          <div className="lg:hidden mb-8 text-center">
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center">
                <Wand2 className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold">Zazzles</span>
            </Link>
          </div>

          {children}
        </div>
      </div>
    </div>
  )
}
