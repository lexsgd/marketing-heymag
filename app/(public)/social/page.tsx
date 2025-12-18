'use client'

import { Suspense, useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  Instagram,
  Facebook,
  ExternalLink,
  Settings,
  Calendar,
  Send,
  Clock,
  Image as ImageIcon,
  LogIn,
  Loader2,
  RefreshCw,
  MoreHorizontal,
  Link2,
  Plus,
  Unlink,
  CheckCircle2,
  Sparkles,
  ArrowRight,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
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

interface SocialPost {
  id: string
  caption: string
  platforms: string[]
  status: string
  posted_at: string | null
  created_at: string
  scheduled_at: string | null
  images: {
    id: string
    thumbnail_url: string | null
    enhanced_url: string | null
    original_url: string
    original_filename: string
  } | null
}

// Connected Account Card Component
function ConnectedAccountCard({
  account,
  onDisconnect,
  isDisconnecting,
}: {
  account: SocialAccount
  onDisconnect: () => void
  isDisconnecting: boolean
}) {
  const platform = platformConfig[account.platform as PlatformId]
  if (!platform) return null

  const Icon = platform.icon
  const profileUrl =
    account.platform === 'instagram' && account.platform_username
      ? `https://instagram.com/${account.platform_username}`
      : account.platform === 'facebook' && account.platform_id
        ? `https://facebook.com/${account.platform_id}`
        : null

  return (
    <Card className={cn(
      "group transition-all duration-200 hover:shadow-md",
      platform.colors.border
    )}>
      <CardContent className="flex items-center gap-4 p-4">
        {/* Platform Icon */}
        <div className={cn(
          "h-12 w-12 rounded-xl flex items-center justify-center shrink-0",
          platform.colors.iconBg
        )}>
          <Icon className={cn("h-6 w-6", platform.colors.icon)} />
        </div>

        {/* Account Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">
              {account.platform_display_name || platform.name}
            </span>
            <Badge variant="secondary" className="bg-green-500/10 text-green-600 dark:text-green-400 border-0 shrink-0">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Connected
            </Badge>
          </div>
          {account.platform_username && (
            <p className="text-sm text-muted-foreground truncate">
              @{account.platform_username}
            </p>
          )}
        </div>

        {/* Actions Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {profileUrl && (
              <>
                <DropdownMenuItem asChild>
                  <a href={profileUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View Profile
                  </a>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem
              onClick={onDisconnect}
              disabled={isDisconnecting}
              className="text-destructive focus:text-destructive"
            >
              {isDisconnecting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Unlink className="mr-2 h-4 w-4" />
              )}
              Disconnect
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardContent>
    </Card>
  )
}

// Available Platform Card Component
function AvailablePlatformCard({
  platformId,
  onConnect,
  isConnecting,
}: {
  platformId: PlatformId
  onConnect: () => void
  isConnecting: boolean
}) {
  const platform = platformConfig[platformId]
  const Icon = platform.icon
  const isComingSoon = platform.status === 'coming_soon'

  return (
    <Card className={cn(
      "group transition-all duration-200 overflow-hidden",
      !isComingSoon && "hover:shadow-md hover:scale-[1.02] cursor-pointer",
      isComingSoon && "opacity-60",
      platform.colors.border
    )}>
      <CardContent className="flex flex-col items-center gap-4 p-6 text-center">
        {/* Platform Icon */}
        <div className={cn(
          "h-14 w-14 rounded-2xl flex items-center justify-center transition-transform",
          !isComingSoon && "group-hover:scale-110",
          platform.colors.iconBg
        )}>
          <Icon className={cn("h-7 w-7", platform.colors.icon)} />
        </div>

        {/* Platform Name */}
        <div>
          <h3 className="font-semibold">{platform.name}</h3>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {platform.description}
          </p>
        </div>

        {/* Action */}
        {isComingSoon ? (
          <Badge variant="outline" className="text-xs">
            <Clock className="h-3 w-3 mr-1" />
            Coming Soon
          </Badge>
        ) : (
          <Button
            size="sm"
            onClick={onConnect}
            disabled={isConnecting}
            className="w-full bg-primary/90 hover:bg-primary"
          >
            {isConnecting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Plus className="h-4 w-4 mr-1" />
                Connect
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

// Empty State Component
function EmptyState({ onConnect, isConnecting }: { onConnect: () => void; isConnecting: boolean }) {
  return (
    <Card className="border-dashed border-2">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="h-20 w-20 rounded-full bg-gradient-to-br from-orange-500/10 to-pink-500/10 flex items-center justify-center mb-6">
          <Link2 className="h-10 w-10 text-orange-500" />
        </div>
        <h3 className="text-xl font-semibold mb-2">No accounts connected</h3>
        <p className="text-muted-foreground max-w-sm mb-6">
          Connect your social media accounts to start publishing your enhanced food photos directly to your audience.
        </p>
        <Button onClick={onConnect} disabled={isConnecting} size="lg">
          {isConnecting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Plus className="h-4 w-4 mr-2" />
          )}
          Connect Your First Account
        </Button>
      </CardContent>
    </Card>
  )
}

// Stats Card Component
function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor,
}: {
  title: string
  value: number
  subtitle: string
  icon: React.ElementType
  iconColor: string
}) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50">
      <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", iconColor)}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  )
}

function SocialPageContent() {
  const searchParams = useSearchParams()
  const [user, setUser] = useState<{ email?: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [disconnecting, setDisconnecting] = useState<string | null>(null)
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([])
  const [recentPosts, setRecentPosts] = useState<SocialPost[]>([])
  const [scheduledPosts, setScheduledPosts] = useState<SocialPost[]>([])
  const [disconnectDialog, setDisconnectDialog] = useState<SocialAccount | null>(null)

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
          const { data: business } = await supabase
            .from('businesses')
            .select('id')
            .eq('auth_user_id', user.id)
            .single()

          if (business?.id) {
            await syncAccounts()
            const { data: posts } = await supabase
              .from('social_posts')
              .select(`*, images (id, thumbnail_url, enhanced_url, original_url, original_filename)`)
              .eq('business_id', business.id)
              .order('created_at', { ascending: false })
              .limit(10)
            setRecentPosts(posts || [])

            const { data: scheduled } = await supabase
              .from('social_posts')
              .select(`*, images (id, thumbnail_url, enhanced_url, original_url, original_filename)`)
              .eq('business_id', business.id)
              .eq('status', 'scheduled')
              .order('scheduled_at', { ascending: true })
              .limit(10)
            setScheduledPosts(scheduled || [])
          }
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

      <div className="container max-w-4xl py-8 px-4 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Social Connections</h1>
            <p className="text-muted-foreground mt-1">
              Connect your accounts to publish content directly to social media.
            </p>
          </div>
          {user && socialAccounts.length > 0 && (
            <Button variant="outline" size="sm" onClick={syncAccounts} disabled={syncing}>
              <RefreshCw className={cn("h-4 w-4 mr-2", syncing && "animate-spin")} />
              Refresh
            </Button>
          )}
        </div>

        {!user ? (
          /* Not Logged In State */
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
        ) : (
          <>
            {/* Stats Row */}
            {socialAccounts.length > 0 && (
              <div className="grid grid-cols-3 gap-4">
                <StatsCard
                  title="Connected"
                  value={socialAccounts.length}
                  subtitle="accounts"
                  icon={CheckCircle2}
                  iconColor="bg-green-500"
                />
                <StatsCard
                  title="Posts"
                  value={recentPosts.filter(p => p.status === 'posted').length}
                  subtitle="this month"
                  icon={Send}
                  iconColor="bg-blue-500"
                />
                <StatsCard
                  title="Scheduled"
                  value={scheduledPosts.length}
                  subtitle="queued"
                  icon={Calendar}
                  iconColor="bg-orange-500"
                />
              </div>
            )}

            {socialAccounts.length === 0 ? (
              /* Empty State */
              <EmptyState onConnect={handleConnectMeta} isConnecting={connecting} />
            ) : (
              <>
                {/* Connected Accounts Section */}
                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                      Connected Accounts
                    </h2>
                  </div>
                  <div className="space-y-3">
                    {socialAccounts.map((account) => (
                      <ConnectedAccountCard
                        key={account.id}
                        account={account}
                        onDisconnect={() => setDisconnectDialog(account)}
                        isDisconnecting={disconnecting === account.platform}
                      />
                    ))}
                  </div>
                </section>

                <Separator />

                {/* Available Platforms Section */}
                <section className="space-y-4">
                  <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Add More Accounts
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {availablePlatforms.map((platformId) => (
                      <AvailablePlatformCard
                        key={platformId}
                        platformId={platformId}
                        onConnect={handleConnectMeta}
                        isConnecting={connecting}
                      />
                    ))}
                  </div>
                </section>
              </>
            )}

            {/* Quick Action */}
            {socialAccounts.length > 0 && (
              <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
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
          </>
        )}
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
