'use client'

import { Suspense, useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  Instagram,
  Facebook,
  MessageCircle,
  Sparkles,
  Smartphone,
  Plus,
  ExternalLink,
  CheckCircle2,
  Settings,
  Calendar,
  Send,
  Clock,
  Image as ImageIcon,
  LogIn,
  Loader2,
  Unlink,
  RefreshCw,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MainNavAuth } from '@/components/main-nav-auth'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
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

// Platform configurations
const platforms = [
  {
    id: 'instagram',
    name: 'Instagram',
    icon: Instagram,
    color: 'bg-gradient-to-br from-purple-500 to-pink-500',
    description: 'Connect your Instagram Business account to post photos and stories',
    features: ['Feed posts', 'Stories', 'Reels thumbnail'],
    apiStatus: 'available',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: Facebook,
    color: 'bg-blue-600',
    description: 'Connect your Facebook Page to share food photos with followers',
    features: ['Page posts', 'Albums', 'Stories'],
    apiStatus: 'available',
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: MessageCircle,
    color: 'bg-black',
    description: 'Connect your TikTok Business account for posting',
    features: ['Video thumbnails', 'Cover images'],
    apiStatus: 'available',
  },
  {
    id: 'xiaohongshu',
    name: 'Xiaohongshu (RED)',
    icon: Sparkles,
    color: 'bg-red-500',
    description: 'Connect your Xiaohongshu account to reach Chinese consumers',
    features: ['Photo posts', 'Notes'],
    apiStatus: 'coming_soon',
  },
  {
    id: 'wechat',
    name: 'WeChat',
    icon: Smartphone,
    color: 'bg-green-500',
    description: 'Share to WeChat Moments via official account',
    features: ['Moments', 'Official Account'],
    apiStatus: 'coming_soon',
  },
]

interface SocialAccount {
  id: string
  platform: string
  platform_display_name?: string
  platform_username?: string
  is_connected: boolean
  account_info: Record<string, unknown>
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
  const [disconnectDialog, setDisconnectDialog] = useState<string | null>(null)

  // Sync accounts from Ayrshare API
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
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          setUser({ email: user.email })

          // Get business
          const { data: business } = await supabase
            .from('businesses')
            .select('id')
            .eq('auth_user_id', user.id)
            .single()

          if (business?.id) {
            // Sync connected social accounts from API
            await syncAccounts()

            // Get recent posts
            const { data: posts } = await supabase
              .from('social_posts')
              .select(
                `
                *,
                images (id, thumbnail_url, enhanced_url, original_url, original_filename)
              `
              )
              .eq('business_id', business.id)
              .order('created_at', { ascending: false })
              .limit(10)

            setRecentPosts(posts || [])

            // Get scheduled posts
            const { data: scheduled } = await supabase
              .from('social_posts')
              .select(
                `
                *,
                images (id, thumbnail_url, enhanced_url, original_url, original_filename)
              `
              )
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

  // Check for successful connection redirect
  useEffect(() => {
    if (searchParams.get('connected') === 'true' && user) {
      toast.success('Social account connection completed!')
      syncAccounts()
      // Clean up URL
      window.history.replaceState({}, '', '/social')
    }
  }, [searchParams, user, syncAccounts])

  const connectedPlatforms = socialAccounts.map((a) => a.platform)

  // Handle connecting social accounts
  const handleConnect = async () => {
    setConnecting(true)
    try {
      const response = await fetch('/api/social/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          redirectUrl: `${window.location.origin}/social?connected=true`,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start connection')
      }

      if (data.url) {
        // Open Ayrshare's social linking page in a new window
        const popup = window.open(data.url, 'Connect Social Accounts', 'width=600,height=700')

        // Poll to check if popup is closed
        const checkClosed = setInterval(() => {
          if (popup?.closed) {
            clearInterval(checkClosed)
            // Sync accounts after popup closes
            syncAccounts()
          }
        }, 1000)
      }
    } catch (error) {
      console.error('Error connecting:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to connect social accounts')
    } finally {
      setConnecting(false)
    }
  }

  // Handle disconnecting a social account
  const handleDisconnect = async (platform: string) => {
    setDisconnecting(platform)
    try {
      const response = await fetch('/api/social/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to disconnect')
      }

      toast.success(`${platform} disconnected successfully`)
      await syncAccounts()
    } catch (error) {
      console.error('Error disconnecting:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to disconnect account')
    } finally {
      setDisconnecting(null)
      setDisconnectDialog(null)
    }
  }

  // Get account details for a platform
  const getAccountDetails = (platformId: string): SocialAccount | undefined => {
    return socialAccounts.find((a) => a.platform === platformId)
  }

  return (
    <div className="min-h-screen bg-background">
      <MainNavAuth />
      <div className="pt-16 p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Social Media</h1>
            <p className="text-muted-foreground">
              Connect accounts and post your food photos to social platforms
            </p>
          </div>
          <div className="flex gap-2">
            {user && (
              <Button variant="outline" onClick={syncAccounts} disabled={syncing}>
                <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                Sync
              </Button>
            )}
            {user ? (
              <Button className="bg-orange-500 hover:bg-orange-600" asChild>
                <Link href="/gallery">
                  <ImageIcon className="mr-2 h-4 w-4" />
                  Select Photos to Post
                </Link>
              </Button>
            ) : (
              <Button className="bg-orange-500 hover:bg-orange-600" asChild>
                <Link href="/auth/signup">
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign Up to Get Started
                </Link>
              </Button>
            )}
          </div>
        </div>

        <Tabs defaultValue="accounts" className="space-y-6">
          <TabsList>
            <TabsTrigger value="accounts">
              <Settings className="mr-2 h-4 w-4" />
              {user ? 'Connected Accounts' : 'Platforms'}
            </TabsTrigger>
            {user && (
              <>
                <TabsTrigger value="posts">
                  <Send className="mr-2 h-4 w-4" />
                  Recent Posts
                </TabsTrigger>
                <TabsTrigger value="scheduled">
                  <Calendar className="mr-2 h-4 w-4" />
                  Scheduled
                </TabsTrigger>
              </>
            )}
          </TabsList>

          {/* Connected Accounts / Platforms Tab */}
          <TabsContent value="accounts" className="space-y-6">
            {/* Stats - Only show for logged in users */}
            {user && (
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Connected</CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{connectedPlatforms.length}</div>
                    <p className="text-xs text-muted-foreground">
                      of {platforms.filter((p) => p.apiStatus === 'available').length} available
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Posts This Month</CardTitle>
                    <Send className="h-4 w-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{recentPosts.length}</div>
                    <p className="text-xs text-muted-foreground">Across all platforms</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
                    <Clock className="h-4 w-4 text-orange-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{scheduledPosts.length}</div>
                    <p className="text-xs text-muted-foreground">Posts queued</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Platform Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {platforms.map((platform) => {
                const isConnected = user && connectedPlatforms.includes(platform.id)
                const accountDetails = getAccountDetails(platform.id)

                return (
                  <Card key={platform.id} className="overflow-hidden">
                    <div className={`${platform.color} p-4`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                            <platform.icon className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-white">{platform.name}</h3>
                            {isConnected ? (
                              <Badge
                                variant="secondary"
                                className="bg-white/20 text-white hover:bg-white/30"
                              >
                                Connected
                              </Badge>
                            ) : platform.apiStatus === 'coming_soon' ? (
                              <Badge
                                variant="secondary"
                                className="bg-white/20 text-white hover:bg-white/30"
                              >
                                Coming Soon
                              </Badge>
                            ) : (
                              <Badge
                                variant="secondary"
                                className="bg-white/20 text-white hover:bg-white/30"
                              >
                                {user ? 'Not Connected' : 'Available'}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <CardContent className="p-4 space-y-4">
                      <p className="text-sm text-muted-foreground">{platform.description}</p>

                      {/* Show connected account info */}
                      {isConnected && accountDetails && (
                        <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-3">
                          <p className="text-sm font-medium text-green-700 dark:text-green-400">
                            {accountDetails.platform_display_name ||
                              accountDetails.platform_username ||
                              'Connected'}
                          </p>
                          {accountDetails.platform_username && (
                            <p className="text-xs text-green-600 dark:text-green-500">
                              @{accountDetails.platform_username}
                            </p>
                          )}
                        </div>
                      )}

                      <div>
                        <p className="text-xs font-medium mb-2">Features</p>
                        <div className="flex flex-wrap gap-1">
                          {platform.features.map((feature) => (
                            <Badge key={feature} variant="outline" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {isConnected ? (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => setDisconnectDialog(platform.id)}
                            disabled={disconnecting === platform.id}
                          >
                            {disconnecting === platform.id ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Unlink className="mr-2 h-4 w-4" />
                            )}
                            Disconnect
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1" asChild>
                            <a
                              href={`https://${platform.id}.com`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="mr-2 h-4 w-4" />
                              View Profile
                            </a>
                          </Button>
                        </div>
                      ) : platform.apiStatus === 'available' ? (
                        user ? (
                          <Button
                            className="w-full bg-orange-500 hover:bg-orange-600"
                            onClick={handleConnect}
                            disabled={connecting}
                          >
                            {connecting ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Plus className="mr-2 h-4 w-4" />
                            )}
                            Connect {platform.name}
                          </Button>
                        ) : (
                          <Button className="w-full bg-orange-500 hover:bg-orange-600" asChild>
                            <Link href="/auth/signup">
                              <LogIn className="mr-2 h-4 w-4" />
                              Sign Up to Connect
                            </Link>
                          </Button>
                        )
                      ) : (
                        <Button disabled className="w-full">
                          <Clock className="mr-2 h-4 w-4" />
                          Coming Soon
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Sign up CTA for anonymous users */}
            {!user && !loading && (
              <Card className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 border-orange-200 dark:border-orange-900/50">
                <CardContent className="flex flex-col md:flex-row items-center justify-between gap-4 p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center">
                      <Sparkles className="h-6 w-6 text-orange-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Ready to start posting?</h3>
                      <p className="text-sm text-muted-foreground">
                        Sign up for free and connect your social media accounts
                      </p>
                    </div>
                  </div>
                  <Button className="bg-orange-500 hover:bg-orange-600" asChild>
                    <Link href="/auth/signup">Get Started Free</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Recent Posts Tab - Only for logged in users */}
          {user && (
            <TabsContent value="posts" className="space-y-4">
              {recentPosts.length > 0 ? (
                <div className="space-y-4">
                  {recentPosts.map((post) => (
                    <Card key={post.id}>
                      <CardContent className="flex items-center gap-4 p-4">
                        {/* Thumbnail */}
                        <div className="h-16 w-16 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                          {post.images ? (
                            <img
                              src={
                                post.images.thumbnail_url ||
                                post.images.enhanced_url ||
                                post.images.original_url
                              }
                              alt="Post image"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium line-clamp-2">
                            {post.caption || 'No caption'}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            {post.platforms?.map((platformId: string) => {
                              const p = platforms.find((p) => p.id === platformId)
                              if (!p) return null
                              return (
                                <Badge key={platformId} variant="outline" className="text-xs">
                                  <p.icon className="mr-1 h-3 w-3" />
                                  {p.name}
                                </Badge>
                              )
                            })}
                          </div>
                        </div>

                        {/* Status */}
                        <div className="text-right">
                          {post.status === 'posted' && (
                            <Badge className="bg-green-500">Posted</Badge>
                          )}
                          {post.status === 'draft' && <Badge variant="outline">Draft</Badge>}
                          {post.status === 'failed' && (
                            <Badge variant="destructive">Failed</Badge>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {post.posted_at
                              ? new Date(post.posted_at).toLocaleDateString()
                              : new Date(post.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                      <Send className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-medium mb-1">No posts yet</h3>
                    <p className="text-sm text-muted-foreground mb-4 text-center max-w-sm">
                      Connect your social accounts and start posting your enhanced food photos
                    </p>
                    <Button asChild className="bg-orange-500 hover:bg-orange-600">
                      <Link href="/gallery">
                        <ImageIcon className="mr-2 h-4 w-4" />
                        Select Photos to Post
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          )}

          {/* Scheduled Tab - Only for logged in users */}
          {user && (
            <TabsContent value="scheduled" className="space-y-4">
              {scheduledPosts.length > 0 ? (
                <div className="space-y-4">
                  {scheduledPosts.map((post) => (
                    <Card key={post.id}>
                      <CardContent className="flex items-center gap-4 p-4">
                        {/* Thumbnail */}
                        <div className="h-16 w-16 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                          {post.images ? (
                            <img
                              src={
                                post.images.thumbnail_url ||
                                post.images.enhanced_url ||
                                post.images.original_url
                              }
                              alt="Post image"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium line-clamp-2">
                            {post.caption || 'No caption'}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Clock className="h-3 w-3 text-orange-500" />
                            <span className="text-xs text-muted-foreground">
                              Scheduled for{' '}
                              {post.scheduled_at
                                ? new Date(post.scheduled_at).toLocaleString()
                                : 'N/A'}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                          <Button variant="outline" size="sm" className="text-destructive">
                            Cancel
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                      <Calendar className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-medium mb-1">No scheduled posts</h3>
                    <p className="text-sm text-muted-foreground mb-4 text-center max-w-sm">
                      Schedule posts to be published at the best times for engagement
                    </p>
                    <Button asChild className="bg-orange-500 hover:bg-orange-600">
                      <Link href="/gallery">
                        <Plus className="mr-2 h-4 w-4" />
                        Schedule a Post
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Disconnect Confirmation Dialog */}
      <AlertDialog
        open={!!disconnectDialog}
        onOpenChange={(open) => !open && setDisconnectDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect {disconnectDialog}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will disconnect your {disconnectDialog} account from Zazzles. You won&apos;t be
              able to post to this platform until you reconnect.
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
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-pulse text-muted-foreground">Loading...</div></div>}>
      <SocialPageContent />
    </Suspense>
  )
}
