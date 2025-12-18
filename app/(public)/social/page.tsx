'use client'

import { Suspense, useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  Instagram,
  Facebook,
  ExternalLink,
  Loader2,
  RefreshCw,
  MoreHorizontal,
  Plus,
  Unlink,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Clock,
  Send,
  Image as ImageIcon,
  Link2,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MainNavAuth } from '@/components/main-nav-auth'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'

// Platform configurations with proper brand colors
const platformConfig = {
  instagram: {
    id: 'instagram',
    name: 'Instagram',
    description: 'Share photos to your Instagram Business account',
    features: ['Feed posts', 'Stories', 'Reels'],
    status: 'available' as const,
    oauthProvider: 'meta',
    icon: Instagram,
    bgImage: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=400&h=400&fit=crop',
    colors: {
      bg: 'bg-gradient-to-br from-pink-500/10 via-purple-500/10 to-orange-500/10',
      iconBg: 'bg-gradient-to-br from-pink-500 via-purple-500 to-orange-500',
      icon: 'text-white',
      border: 'border-pink-500/20',
    },
  },
  facebook: {
    id: 'facebook',
    name: 'Facebook',
    description: 'Post to your Facebook Page',
    features: ['Page posts', 'Albums', 'Stories'],
    status: 'available' as const,
    oauthProvider: 'meta',
    icon: Facebook,
    bgImage: 'https://images.unsplash.com/photo-1432888622747-4eb9a8f2c064?w=400&h=400&fit=crop',
    colors: {
      bg: 'bg-blue-500/10',
      iconBg: 'bg-[#1877f2]',
      icon: 'text-white',
      border: 'border-blue-500/20',
    },
  },
  tiktok: {
    id: 'tiktok',
    name: 'TikTok',
    description: 'Share video content to TikTok',
    features: ['Video posts', 'Photo mode'],
    status: 'coming_soon' as const,
    icon: () => (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
      </svg>
    ),
    bgImage: 'https://images.unsplash.com/photo-1596558450268-9c27524ba856?w=400&h=400&fit=crop',
    colors: {
      bg: 'bg-black/5 dark:bg-white/5',
      iconBg: 'bg-black dark:bg-white',
      icon: 'text-white dark:text-black',
      border: 'border-black/10 dark:border-white/10',
    },
  },
  xiaohongshu: {
    id: 'xiaohongshu',
    name: 'Xiaohongshu',
    description: 'Reach Chinese consumers on RED',
    features: ['Notes', 'Photo posts'],
    status: 'coming_soon' as const,
    icon: () => (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm4 0h-2v-6h2v6zm0-8H9V7h6v2z"/>
      </svg>
    ),
    bgImage: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=400&fit=crop',
    colors: {
      bg: 'bg-red-500/10',
      iconBg: 'bg-[#ff2741]',
      icon: 'text-white',
      border: 'border-red-500/20',
    },
  },
  wechat: {
    id: 'wechat',
    name: 'WeChat',
    description: 'Share to WeChat Official Account',
    features: ['Moments', 'Official Account'],
    status: 'coming_soon' as const,
    icon: () => (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
        <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.49.49 0 0 1 .176-.553C23.02 18.345 24 16.635 24 14.753c0-3.37-3.212-6.102-7.062-5.895zm-1.834 2.89c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.983.97-.983zm4.857 0c.536 0 .97.44.97.982a.976.976 0 0 1-.97.983.976.976 0 0 1-.969-.983c0-.542.433-.983.97-.983z"/>
      </svg>
    ),
    bgImage: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop',
    colors: {
      bg: 'bg-green-500/10',
      iconBg: 'bg-[#07c160]',
      icon: 'text-white',
      border: 'border-green-500/20',
    },
  },
} as const

type PlatformId = keyof typeof platformConfig

interface SocialAccount {
  id: string
  platform: string
  platform_id: string
  platform_display_name?: string
  platform_username?: string
  is_connected: boolean
  account_info: Record<string, unknown>
  facebook_page_id?: string
  connected_at?: string
}

function SocialPageContent() {
  const searchParams = useSearchParams()
  const [user, setUser] = useState<{ email?: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [disconnecting, setDisconnecting] = useState<string | null>(null)
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([])
  const [disconnectDialog, setDisconnectDialog] = useState<SocialAccount | null>(null)
  const [activeFilter, setActiveFilter] = useState<'all' | 'connected' | 'available'>('all')

  const syncAccounts = useCallback(async () => {
    setSyncing(true)
    try {
      const response = await fetch('/api/social/accounts')
      const data = await response.json()
      if (data.success && data.accounts) {
        setSocialAccounts(data.accounts.filter((a: SocialAccount) => a.is_connected))
      }
    } catch (error) {
      console.error('Error syncing accounts:', error)
    } finally {
      setSyncing(false)
    }
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setUser({ email: user.email })
          await syncAccounts()
        }
      } catch (error) {
        console.error('Error fetching social data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [syncAccounts])

  useEffect(() => {
    const connected = searchParams.get('connected')
    const count = searchParams.get('count')
    const error = searchParams.get('error')
    const message = searchParams.get('message')

    if (connected === 'true' && user) {
      const accountCount = count ? parseInt(count, 10) : 1
      toast.success(`Successfully connected ${accountCount} account${accountCount > 1 ? 's' : ''}!`)
      syncAccounts()
      window.history.replaceState({}, '', '/social')
    } else if (error) {
      const errorMessages: Record<string, string> = {
        oauth_denied: 'You declined the connection. Please try again.',
        missing_params: 'Connection failed due to missing parameters.',
        invalid_state: 'Connection expired. Please try again.',
        token_exchange_failed: 'Failed to complete authentication. Please try again.',
        no_pages: message || 'No Facebook Pages found.',
        no_business: 'Business profile not found.',
        callback_error: 'Connection failed. Please try again.',
        config_error: 'Social media connection is not configured.',
      }
      toast.error(errorMessages[error] || 'Connection failed. Please try again.')
      window.history.replaceState({}, '', '/social')
    }
  }, [searchParams, user, syncAccounts])

  const connectedPlatformIds = socialAccounts.map((a) => a.platform)
  const availablePlatforms = Object.keys(platformConfig).filter(
    (id) => !connectedPlatformIds.includes(id)
  ) as PlatformId[]

  const handleConnectMeta = () => {
    setConnecting(true)
    window.location.href = '/api/auth/meta'
  }

  const handleDisconnect = async (account: SocialAccount) => {
    setDisconnecting(account.platform)
    try {
      const params = new URLSearchParams({ platform: account.platform })
      if (account.platform_id) {
        params.append('platformId', account.platform_id)
      }
      const response = await fetch(`/api/social/accounts?${params.toString()}`, { method: 'DELETE' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to disconnect')
      toast.success(`${platformConfig[account.platform as PlatformId]?.name || account.platform} disconnected`)
      await syncAccounts()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to disconnect account')
    } finally {
      setDisconnecting(null)
      setDisconnectDialog(null)
    }
  }

  // Get filtered platforms for display
  const getDisplayPlatforms = () => {
    const allPlatforms = Object.entries(platformConfig)

    if (activeFilter === 'connected') {
      return allPlatforms.filter(([id]) => connectedPlatformIds.includes(id))
    }
    if (activeFilter === 'available') {
      return allPlatforms.filter(([id]) => !connectedPlatformIds.includes(id))
    }
    return allPlatforms
  }

  const displayPlatforms = getDisplayPlatforms()

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <MainNavAuth />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <MainNavAuth />

      <div className="pt-16 flex">
        {/* Left Sidebar - Matching Explore pattern */}
        <aside className="hidden lg:block w-64 border-r border-border h-[calc(100vh-64px)] sticky top-16 overflow-y-auto p-6">
          {/* Filter Section */}
          <div className="mb-8">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              PLATFORMS
            </h3>
            <nav className="space-y-1">
              <button
                onClick={() => setActiveFilter('all')}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-between',
                  activeFilter === 'all'
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                <span>All Platforms</span>
                <Badge variant="secondary" className="text-xs">{Object.keys(platformConfig).length}</Badge>
              </button>
              <button
                onClick={() => setActiveFilter('connected')}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between',
                  activeFilter === 'connected'
                    ? 'bg-muted text-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                <span>Connected</span>
                <Badge variant="secondary" className="text-xs">{socialAccounts.length}</Badge>
              </button>
              <button
                onClick={() => setActiveFilter('available')}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between',
                  activeFilter === 'available'
                    ? 'bg-muted text-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                <span>Available</span>
                <Badge variant="secondary" className="text-xs">{availablePlatforms.length}</Badge>
              </button>
            </nav>
          </div>

          {/* Status Section */}
          <div className="mb-8">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              STATUS
            </h3>
            <nav className="space-y-1">
              <div className="px-3 py-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span>{socialAccounts.length} connected</span>
                </div>
              </div>
              <div className="px-3 py-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="h-2 w-2 rounded-full bg-orange-500" />
                  <span>3 coming soon</span>
                </div>
              </div>
            </nav>
          </div>

          {/* Quick Actions */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              ACTIONS
            </h3>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={syncAccounts}
                disabled={syncing}
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", syncing && "animate-spin")} />
                Refresh
              </Button>
              <Button
                size="sm"
                className="w-full justify-start bg-orange-500 hover:bg-orange-600"
                onClick={handleConnectMeta}
                disabled={connecting}
              >
                {connecting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Connect Account
              </Button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">
              {activeFilter === 'all' && 'All Platforms'}
              {activeFilter === 'connected' && 'Connected Accounts'}
              {activeFilter === 'available' && 'Available Platforms'}
            </h1>
            <span className="text-sm text-muted-foreground">
              {displayPlatforms.length} platforms
            </span>
          </div>

          {!user ? (
            /* Not Logged In - CTA Card */
            <Card className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border-orange-200/50 dark:border-orange-900/50">
              <CardContent className="flex flex-col md:flex-row items-center gap-6 p-8">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shrink-0">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-xl font-semibold mb-2">Ready to start posting?</h3>
                  <p className="text-muted-foreground">
                    Sign up for free to connect your social media accounts and start publishing your enhanced food photos.
                  </p>
                </div>
                <Button size="lg" className="bg-orange-500 hover:bg-orange-600 shrink-0" asChild>
                  <Link href="/auth/signup">
                    Get Started Free
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : displayPlatforms.length === 0 ? (
            /* Empty State */
            <div className="text-center py-20">
              <p className="text-muted-foreground">No platforms found for this filter.</p>
              <Button
                onClick={() => setActiveFilter('all')}
                variant="link"
                className="mt-2 text-orange-500"
              >
                View all platforms
              </Button>
            </div>
          ) : (
            /* Masonry Grid - Matching Explore pattern */
            <div className="columns-2 md:columns-3 lg:columns-4 gap-4">
              {displayPlatforms.map(([platformId, platform]) => {
                const isConnected = connectedPlatformIds.includes(platformId)
                const connectedAccount = socialAccounts.find(a => a.platform === platformId)
                const isComingSoon = platform.status === 'coming_soon'
                const Icon = platform.icon

                return (
                  <div
                    key={platformId}
                    className="break-inside-avoid mb-4 group"
                  >
                    <div className={cn(
                      "relative overflow-hidden rounded-xl bg-muted",
                      isComingSoon && "opacity-60"
                    )}>
                      {/* Platform Visual - Using gradient background */}
                      <div className={cn(
                        "aspect-square relative",
                        platform.colors.bg
                      )}>
                        {/* Large centered icon */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className={cn(
                            "h-20 w-20 rounded-3xl flex items-center justify-center transition-transform duration-300",
                            !isComingSoon && "group-hover:scale-110",
                            platform.colors.iconBg
                          )}>
                            <Icon className={cn("h-10 w-10", platform.colors.icon)} />
                          </div>
                        </div>

                        {/* Status Badge */}
                        {isConnected && (
                          <div className="absolute top-3 right-3">
                            <Badge className="bg-green-500 hover:bg-green-600 text-white text-xs border-0">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Connected
                            </Badge>
                          </div>
                        )}
                        {isComingSoon && (
                          <div className="absolute top-3 right-3">
                            <Badge variant="secondary" className="text-xs">
                              <Clock className="h-3 w-3 mr-1" />
                              Coming Soon
                            </Badge>
                          </div>
                        )}

                        {/* Hover Overlay - Matching Explore pattern */}
                        {!isComingSoon && (
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="absolute bottom-0 left-0 right-0 p-4">
                              <h3 className="text-white font-medium text-sm mb-1">
                                {platform.name}
                              </h3>
                              <p className="text-white/70 text-xs mb-3">
                                {platform.description}
                              </p>

                              {isConnected ? (
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    className="flex-1 h-8 text-xs"
                                    asChild
                                  >
                                    <Link href="/gallery">
                                      <Send className="h-3 w-3 mr-1" />
                                      Post
                                    </Link>
                                  </Button>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-white hover:bg-white/20">
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48">
                                      {connectedAccount?.platform_username && (
                                        <>
                                          <DropdownMenuItem asChild>
                                            <a
                                              href={`https://${platformId}.com/${connectedAccount.platform_username}`}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                            >
                                              <ExternalLink className="mr-2 h-4 w-4" />
                                              View Profile
                                            </a>
                                          </DropdownMenuItem>
                                          <DropdownMenuSeparator />
                                        </>
                                      )}
                                      <DropdownMenuItem
                                        onClick={() => connectedAccount && setDisconnectDialog(connectedAccount)}
                                        className="text-destructive focus:text-destructive"
                                      >
                                        <Unlink className="mr-2 h-4 w-4" />
                                        Disconnect
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              ) : (
                                <Button
                                  size="sm"
                                  className="w-full h-8 text-xs bg-white text-black hover:bg-white/90"
                                  onClick={handleConnectMeta}
                                  disabled={connecting}
                                >
                                  {connecting ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <>
                                      <Plus className="h-3 w-3 mr-1" />
                                      Connect
                                    </>
                                  )}
                                </Button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Platform Info - Always visible */}
                      <div className="p-3 bg-card">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">
                              {platform.name}
                            </p>
                            {isConnected && connectedAccount?.platform_username && (
                              <p className="text-xs text-muted-foreground">
                                @{connectedAccount.platform_username}
                              </p>
                            )}
                            {!isConnected && !isComingSoon && (
                              <p className="text-xs text-muted-foreground">
                                Not connected
                              </p>
                            )}
                          </div>
                          {isConnected && (
                            <div className="h-2 w-2 rounded-full bg-green-500" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Quick Action Card - Bottom */}
          {user && socialAccounts.length > 0 && (
            <Card className="mt-8 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
              <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <ImageIcon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Ready to post?</h3>
                    <p className="text-sm text-muted-foreground">
                      Select photos from your library to publish
                    </p>
                  </div>
                </div>
                <Button asChild>
                  <Link href="/gallery">
                    Select Photos
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </main>
      </div>

      {/* Disconnect Confirmation Dialog */}
      <AlertDialog open={!!disconnectDialog} onOpenChange={(open) => !open && setDisconnectDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Disconnect {disconnectDialog && platformConfig[disconnectDialog.platform as PlatformId]?.name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              You won&apos;t be able to post to this platform until you reconnect.
              {disconnectDialog?.platform === 'facebook' && (
                <span className="block mt-2 text-orange-600 dark:text-orange-400">
                  Note: This will also disconnect any linked Instagram accounts.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => disconnectDialog && handleDisconnect(disconnectDialog)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default function SocialPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <SocialPageContent />
    </Suspense>
  )
}
