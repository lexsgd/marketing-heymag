import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Camera,
  Image as ImageIcon,
  Wand2,
  Share2,
  Sparkles,
  ArrowRight,
  Plus,
  TrendingUp,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MainNav } from '@/components/main-nav'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Get business first
  const { data: business, error: businessError } = await supabase
    .from('businesses')
    .select('*')
    .eq('auth_user_id', user.id)
    .single()

  // Get credits separately (more reliable than nested select)
  let creditsRemaining = 0
  let creditsUsed = 0

  if (business?.id) {
    const { data: creditsData } = await supabase
      .from('credits')
      .select('credits_remaining, credits_used')
      .eq('business_id', business.id)
      .single()

    creditsRemaining = creditsData?.credits_remaining || 0
    creditsUsed = creditsData?.credits_used || 0
  }

  // Debug logging
  console.log('[Dashboard] User ID:', user.id)
  console.log('[Dashboard] Business ID:', business?.id)
  console.log('[Dashboard] Credits:', { creditsRemaining, creditsUsed })
  const isTrialing = business?.subscription_status === 'trial'

  // Get recent images
  const { data: recentImages } = await supabase
    .from('images')
    .select('*')
    .eq('business_id', business?.id)
    .order('created_at', { ascending: false })
    .limit(6)

  // Get image stats
  const { count: totalImages } = await supabase
    .from('images')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', business?.id)

  const { count: enhancedImages } = await supabase
    .from('images')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', business?.id)
    .eq('status', 'completed')

  // Get social post stats
  const { count: totalPosts } = await supabase
    .from('social_posts')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', business?.id)
    .eq('status', 'posted')

  return (
    <div className="min-h-screen bg-background">
      <MainNav user={user} credits={creditsRemaining} subscriptionStatus={business?.subscription_status} />
      <div className="pt-20 p-6 space-y-6">
      {/* Mobile: Upload button at top (Issue #4) */}
      <div className="md:hidden">
        <Button asChild className="w-full bg-orange-500 hover:bg-orange-600 h-12 text-base">
          <Link href="/editor">
            <Plus className="mr-2 h-5 w-5" />
            Upload New Photo
          </Link>
        </Button>
      </div>

      {/* Welcome Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Welcome back!</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Here's what's happening with your food photos
          </p>
        </div>
        {/* Desktop: Upload button in header */}
        <Button asChild className="hidden md:flex bg-orange-500 hover:bg-orange-600">
          <Link href="/editor">
            <Plus className="mr-2 h-4 w-4" />
            Upload New Photo
          </Link>
        </Button>
      </div>

      {/* Trial Banner */}
      {isTrialing && (
        <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 dark:border-orange-900/50">
          <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center shrink-0">
                <Sparkles className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="font-medium">You're on a free trial!</p>
                <p className="text-sm text-muted-foreground">
                  {creditsRemaining} credits remaining. Upgrade for unlimited access.
                </p>
              </div>
            </div>
            <Button asChild variant="outline" className="border-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/30">
              <Link href="/billing">
                Upgrade Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid - Mobile optimized (Issue #5) */}
      {/* Mobile: Credits card prominent, others compact */}
      <div className="md:hidden space-y-3">
        {/* Credits - full width and prominent on mobile */}
        <Card className="border-orange-200 dark:border-orange-900/50">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Credits Remaining</p>
                <p className="text-2xl font-bold">{creditsRemaining}</p>
              </div>
            </div>
            <Button asChild size="sm" variant="outline" className="border-orange-300">
              <Link href="/billing">Get More</Link>
            </Button>
          </CardContent>
        </Card>
        {/* Other stats - compact 3-column grid */}
        <div className="grid grid-cols-3 gap-2">
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-lg font-bold">{totalImages || 0}</span>
            </div>
            <p className="text-xs text-muted-foreground">Images</p>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <Wand2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-lg font-bold">{enhancedImages || 0}</span>
            </div>
            <p className="text-xs text-muted-foreground">Enhanced</p>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <Share2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-lg font-bold">{totalPosts || 0}</span>
            </div>
            <p className="text-xs text-muted-foreground">Posts</p>
          </Card>
        </div>
      </div>

      {/* Desktop: Original 4-column grid */}
      <div className="hidden md:grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credits Remaining</CardTitle>
            <Sparkles className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{creditsRemaining}</div>
            <p className="text-xs text-muted-foreground">
              {creditsUsed} credits used this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Images</CardTitle>
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalImages || 0}</div>
            <p className="text-xs text-muted-foreground">
              In your gallery
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enhanced</CardTitle>
            <Wand2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{enhancedImages || 0}</div>
            <p className="text-xs text-muted-foreground">
              AI-enhanced photos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Posts Published</CardTitle>
            <Share2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPosts || 0}</div>
            <p className="text-xs text-muted-foreground">
              Across all platforms
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow cursor-pointer group">
          <Link href="/editor">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mb-2 group-hover:bg-orange-200 dark:group-hover:bg-orange-900/50 transition-colors">
                <Camera className="h-6 w-6 text-orange-500" />
              </div>
              <CardTitle className="text-lg">Upload & Enhance</CardTitle>
              <CardDescription>
                Upload a photo and transform it with AI-powered enhancement
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer group">
          <Link href="/explore">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-2 group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors">
                <Wand2 className="h-6 w-6 text-purple-500" />
              </div>
              <CardTitle className="text-lg">Explore Styles</CardTitle>
              <CardDescription>
                Discover 40+ AI styles for delivery apps, social media & more
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer group">
          <Link href="/social">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mb-2 group-hover:bg-orange-200 dark:group-hover:bg-orange-900/50 transition-colors">
                <Share2 className="h-6 w-6 text-orange-500" />
              </div>
              <CardTitle className="text-lg">Connect Social</CardTitle>
              <CardDescription>
                Link your Instagram, TikTok, Xiaohongshu and more
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>
      </div>

      {/* Recent Images */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Photos</CardTitle>
            <CardDescription>Your latest uploaded and enhanced images</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/gallery">
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentImages && recentImages.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {recentImages.map((image) => (
                <Link
                  key={image.id}
                  href={`/editor/${image.id}`}
                  className="group relative aspect-square rounded-lg overflow-hidden bg-muted hover:ring-2 hover:ring-orange-500 transition-all"
                >
                  {image.thumbnail_url || image.enhanced_url || image.original_url ? (
                    <img
                      src={image.thumbnail_url || image.enhanced_url || image.original_url}
                      alt="Food photo"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Camera className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  {image.status === 'completed' && (
                    <Badge className="absolute top-2 right-2 bg-green-500">
                      Enhanced
                    </Badge>
                  )}
                  {image.status === 'processing' && (
                    <Badge className="absolute top-2 right-2 bg-orange-500">
                      Processing
                    </Badge>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="h-16 w-16 rounded-full bg-muted mx-auto flex items-center justify-center mb-4">
                <Camera className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium mb-1">No photos yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Upload your first food photo to get started
              </p>
              <Button asChild className="bg-orange-500 hover:bg-orange-600">
                <Link href="/editor">
                  <Plus className="mr-2 h-4 w-4" />
                  Upload Photo
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Platform Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Style Presets</CardTitle>
            <CardDescription>Popular styles for your food photos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: 'Delivery App', uses: 12, color: 'bg-green-500' },
                { name: 'Instagram Feed', uses: 8, color: 'bg-pink-500' },
                { name: 'Xiaohongshu', uses: 5, color: 'bg-red-500' },
                { name: 'Menu Card', uses: 3, color: 'bg-amber-500' },
              ].map((preset) => (
                <div key={preset.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-3 w-3 rounded-full ${preset.color}`} />
                    <span className="text-sm">{preset.name}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{preset.uses} uses</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Connected Platforms</CardTitle>
            <CardDescription>Post to these social channels</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: 'Instagram', connected: false },
                { name: 'Facebook', connected: false },
                { name: 'TikTok', connected: false },
                { name: 'Xiaohongshu', connected: false },
              ].map((platform) => (
                <div key={platform.name} className="flex items-center justify-between">
                  <span className="text-sm">{platform.name}</span>
                  {platform.connected ? (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Connected
                    </Badge>
                  ) : (
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/social">Connect</Link>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  )
}
