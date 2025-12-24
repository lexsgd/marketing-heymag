'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Logo } from './logo'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Sparkles,
  Menu,
  Camera,
  Compass,
  Share2,
  Image,
  CreditCard,
  Settings,
  LogOut,
} from 'lucide-react'

interface MainNavProps {
  user?: {
    email?: string
  } | null
  credits?: number
  subscriptionStatus?: string | null
  loading?: boolean
}

const navTabs = [
  { name: 'Explore', href: '/explore', badge: null, icon: Compass },
  { name: 'Photography', href: '/editor', badge: null, icon: Camera },
  { name: 'Social', href: '/social', badge: null, icon: Share2 },
]

const mobileNavItems = [
  { name: 'Explore Styles', href: '/explore', icon: Compass },
  { name: 'Photography', href: '/editor', icon: Camera },
  { name: 'Social', href: '/social', icon: Share2 },
  { name: 'Library', href: '/gallery', icon: Image },
  { name: 'Billing', href: '/billing', icon: CreditCard },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function MainNav({ user, credits, subscriptionStatus, loading }: MainNavProps) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between relative">
        {/* Mobile Menu Button + Logo */}
        <div className="flex items-center gap-2">
          {/* Mobile Hamburger Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden h-9 w-9">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72">
              <SheetHeader className="text-left pb-4 border-b">
                <SheetTitle>
                  <Logo width={80} height={46} />
                </SheetTitle>
              </SheetHeader>

              {/* User Info (if logged in) */}
              {user && (
                <div className="py-4 border-b">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white font-medium">
                      {user.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{user.email}</p>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Sparkles className="h-3 w-3 text-orange-500" />
                        <span>{credits || 0} credits</span>
                      </div>
                    </div>
                  </div>
                  {subscriptionStatus && (
                    <Badge
                      variant="outline"
                      className={cn(
                        "mt-2 text-xs",
                        subscriptionStatus === 'trial'
                          ? "border-orange-500/50 text-orange-500 bg-orange-500/10"
                          : "border-green-500/50 text-green-500 bg-green-500/10"
                      )}
                    >
                      {subscriptionStatus === 'trial' ? 'Free Trial' : subscriptionStatus.charAt(0).toUpperCase() + subscriptionStatus.slice(1)}
                    </Badge>
                  )}
                </div>
              )}

              {/* Navigation Links */}
              <nav className="py-4 space-y-1">
                {mobileNavItems.map((item) => {
                  const isActive = pathname === item.href ||
                    (item.href === '/editor' && pathname.startsWith('/editor')) ||
                    (item.href === '/social' && pathname.startsWith('/social'))

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-orange-500/10 text-orange-500'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.name}
                    </Link>
                  )
                })}
              </nav>

              {/* Sign Out (if logged in) */}
              {user && (
                <div className="pt-4 border-t">
                  <Link
                    href="/auth/logout"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </Link>
                </div>
              )}

              {/* Auth buttons (if not logged in) */}
              {!user && !loading && (
                <div className="pt-4 border-t space-y-2">
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                      Log In
                    </Link>
                  </Button>
                  <Button asChild className="w-full bg-orange-500 hover:bg-orange-600">
                    <Link href="/auth/signup" onClick={() => setMobileMenuOpen(false)}>
                      Sign Up Free
                    </Link>
                  </Button>
                </div>
              )}
            </SheetContent>
          </Sheet>

          {/* Logo - Links to dashboard when logged in, homepage when not */}
          <Logo width={100} height={58} linkTo={user ? '/dashboard' : '/'} />
        </div>

        {/* Center Navigation Tabs - Absolutely positioned to prevent shift */}
        <nav className="hidden md:flex items-center absolute left-1/2 -translate-x-1/2">
          <div className="flex items-center bg-muted/50 rounded-full p-1">
            {navTabs.map((tab) => {
              const isActive = pathname === tab.href ||
                (tab.href === '/editor' && pathname.startsWith('/editor')) ||
                (tab.href === '/social' && pathname.startsWith('/social'))

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

        {/* Right Side Actions - Hide entire section while loading to prevent flash */}
        <div className="flex items-center gap-4">
          {loading ? (
            /* Empty placeholder while checking auth */
            <div className="w-9 h-9" />
          ) : user ? (
            <>
              {/* Library Link */}
              <Link
                href="/gallery"
                className="hidden md:block text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Library
              </Link>

              {/* Billing Link */}
              <Link
                href="/billing"
                className="hidden md:block text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Billing
              </Link>

              {/* Plan Badge */}
              {subscriptionStatus && (
                <Badge
                  variant="outline"
                  className={cn(
                    "hidden sm:flex text-xs",
                    subscriptionStatus === 'trial'
                      ? "border-orange-500/50 text-orange-500 bg-orange-500/10"
                      : "border-green-500/50 text-green-500 bg-green-500/10"
                  )}
                >
                  {subscriptionStatus === 'trial' ? 'Free Trial' : subscriptionStatus.charAt(0).toUpperCase() + subscriptionStatus.slice(1)}
                </Badge>
              )}

              {/* Credits Display */}
              <div className="hidden sm:flex items-center gap-1.5 text-sm bg-muted/50 px-3 py-1.5 rounded-full">
                <Sparkles className="h-3.5 w-3.5 text-orange-500" />
                <span className="font-semibold">{credits || 0}</span>
                <span className="text-muted-foreground text-xs">credits</span>
              </div>

              {/* User Avatar */}
              <Link href="/settings">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white font-medium text-sm hover:opacity-90 transition-opacity">
                  {user.email?.charAt(0).toUpperCase() || 'U'}
                </div>
              </Link>
            </>
          ) : (
            <>
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
