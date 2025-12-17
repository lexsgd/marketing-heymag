'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Logo } from './logo'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sparkles } from 'lucide-react'

interface MainNavProps {
  user?: {
    email?: string
  } | null
  credits?: number
}

const navTabs = [
  { name: 'Explore', href: '/explore', badge: null },
  { name: 'Photography', href: '/editor', badge: null },
  { name: 'Creative', href: '/templates', badge: 'NEW' },
]

export function MainNav({ user, credits }: MainNavProps) {
  const pathname = usePathname()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Logo width={100} height={58} />

        {/* Center Navigation Tabs */}
        <nav className="hidden md:flex items-center">
          <div className="flex items-center bg-muted/50 rounded-full p-1">
            {navTabs.map((tab) => {
              const isActive = pathname === tab.href ||
                (tab.href === '/editor' && pathname.startsWith('/editor')) ||
                (tab.href === '/templates' && pathname.startsWith('/templates'))

              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={cn(
                    'relative px-6 py-2 rounded-full text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {tab.name}
                  {tab.badge && (
                    <Badge
                      className="absolute -top-2 -right-1 px-1.5 py-0.5 text-[10px] bg-pink-500 text-white border-0"
                    >
                      {tab.badge}
                    </Badge>
                  )}
                </Link>
              )
            })}
          </div>
        </nav>

        {/* Right Side Actions */}
        <div className="flex items-center gap-4">
          {/* Library Link */}
          <Link
            href="/gallery"
            className="hidden md:block text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Library
          </Link>

          {/* Pricing Link */}
          <Link
            href="/#pricing"
            className="hidden md:block text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Pricing
          </Link>

          {user ? (
            <>
              {/* Credits Display */}
              <div className="hidden sm:flex items-center gap-1.5 text-sm">
                <span className="text-muted-foreground">Credits:</span>
                <span className="font-semibold">{credits || 0}</span>
              </div>

              {/* User Avatar */}
              <Link href="/settings">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-medium text-sm">
                  {user.email?.charAt(0).toUpperCase() || 'U'}
                </div>
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Log In
              </Link>
              <Button asChild className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-6">
                <Link href="/auth/signup">
                  Sign Up
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
