import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Instagram,
  Facebook,
  MessageCircle,
  Sparkles,
  Smartphone,
  Plus,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Settings,
  Calendar,
  Send,
  Clock,
  Image as ImageIcon
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { MainNav } from '@/components/main-nav'

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

export default async function SocialPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Get business
  const { data: business } = await supabase
    .from('businesses')
    .select('id, subscription_status')
    .eq('auth_user_id', user.id)
    .single()

  // Get credits
  let creditsRemaining = 0
  if (business?.id) {
    const { data: creditsData } = await supabase
      .from('credits')
      .select('credits_remaining')
      .eq('business_id', business.id)
      .single()
    creditsRemaining = creditsData?.credits_remaining || 0
  }

  // Get connected social accounts
  const { data: socialAccounts } = await supabase
    .from('social_accounts')
    .select('*')
    .eq('business_id', business?.id)

  // Get recent posts
  const { data: recentPosts } = await supabase
    .from('social_posts')
    .select(`
      *,
      images (id, thumbnail_url, enhanced_url, original_url, original_filename)
    `)
    .eq('business_id', business?.id)
    .order('created_at', { ascending: false })
    .limit(10)

  // Get scheduled posts
  const { data: scheduledPosts } = await supabase
    .from('social_posts')
    .select(`
      *,
      images (id, thumbnail_url, enhanced_url, original_url, original_filename)
    `)
    .eq('business_id', business?.id)
    .eq('status', 'scheduled')
    .order('scheduled_at', { ascending: true })
    .limit(10)

  const connectedPlatforms = socialAccounts?.map(a => a.platform) || []

  return (
    <div className="min-h-screen bg-background">
      <MainNav user={user} credits={creditsRemaining} subscriptionStatus={business?.subscription_status} />
      <div className="pt-16 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Social Media</h1>
          <p className="text-muted-foreground">
            Connect accounts and post your food photos to social platforms
          </p>
        </div>
        <Button className="bg-orange-500 hover:bg-orange-600" asChild>
          <Link href="/gallery">
            <ImageIcon className="mr-2 h-4 w-4" />
            Select Photos to Post
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="accounts" className="space-y-6">
        <TabsList>
          <TabsTrigger value="accounts">
            <Settings className="mr-2 h-4 w-4" />
            Connected Accounts
          </TabsTrigger>
          <TabsTrigger value="posts">
            <Send className="mr-2 h-4 w-4" />
            Recent Posts
          </TabsTrigger>
          <TabsTrigger value="scheduled">
            <Calendar className="mr-2 h-4 w-4" />
            Scheduled
          </TabsTrigger>
        </TabsList>

        {/* Connected Accounts Tab */}
        <TabsContent value="accounts" className="space-y-6">
          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Connected</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{connectedPlatforms.length}</div>
                <p className="text-xs text-muted-foreground">
                  of {platforms.filter(p => p.apiStatus === 'available').length} available
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Posts This Month</CardTitle>
                <Send className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{recentPosts?.length || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Across all platforms
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
                <Clock className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{scheduledPosts?.length || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Posts queued
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Platform Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {platforms.map((platform) => {
              const isConnected = connectedPlatforms.includes(platform.id)
              const account = socialAccounts?.find(a => a.platform === platform.id)

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
                            <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/30">
                              Connected
                            </Badge>
                          ) : platform.apiStatus === 'coming_soon' ? (
                            <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/30">
                              Coming Soon
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/30">
                              Not Connected
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-4 space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {platform.description}
                    </p>

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
                        <Button variant="outline" size="sm" className="flex-1">
                          <Settings className="mr-2 h-4 w-4" />
                          Manage
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          View Profile
                        </Button>
                      </div>
                    ) : platform.apiStatus === 'available' ? (
                      <Button className="w-full bg-orange-500 hover:bg-orange-600">
                        <Plus className="mr-2 h-4 w-4" />
                        Connect {platform.name}
                      </Button>
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

          {/* API Integration Notice */}
          <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
            <CardContent className="flex items-start gap-4 p-4">
              <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium">Social Media Integration</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  We use official APIs (via Ayrshare) to connect to Facebook, Instagram, and TikTok. For Xiaohongshu and WeChat, we're working on partnerships with local API providers. Your credentials are securely encrypted and never shared.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recent Posts Tab */}
        <TabsContent value="posts" className="space-y-4">
          {recentPosts && recentPosts.length > 0 ? (
            <div className="space-y-4">
              {recentPosts.map((post) => (
                <Card key={post.id}>
                  <CardContent className="flex items-center gap-4 p-4">
                    {/* Thumbnail */}
                    <div className="h-16 w-16 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                      {post.images ? (
                        <img
                          src={post.images.thumbnail_url || post.images.enhanced_url || post.images.original_url}
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
                        {post.platforms?.map((platform: string) => {
                          const p = platforms.find(p => p.id === platform)
                          if (!p) return null
                          return (
                            <Badge key={platform} variant="outline" className="text-xs">
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
                      {post.status === 'draft' && (
                        <Badge variant="outline">Draft</Badge>
                      )}
                      {post.status === 'failed' && (
                        <Badge variant="destructive">Failed</Badge>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {post.posted_at
                          ? new Date(post.posted_at).toLocaleDateString()
                          : new Date(post.created_at).toLocaleDateString()
                        }
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

        {/* Scheduled Tab */}
        <TabsContent value="scheduled" className="space-y-4">
          {scheduledPosts && scheduledPosts.length > 0 ? (
            <div className="space-y-4">
              {scheduledPosts.map((post) => (
                <Card key={post.id}>
                  <CardContent className="flex items-center gap-4 p-4">
                    {/* Thumbnail */}
                    <div className="h-16 w-16 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                      {post.images ? (
                        <img
                          src={post.images.thumbnail_url || post.images.enhanced_url || post.images.original_url}
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
                          Scheduled for {new Date(post.scheduled_at).toLocaleString()}
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
      </Tabs>
      </div>
    </div>
  )
}
