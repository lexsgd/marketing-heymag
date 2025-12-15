import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Wand2,
  Truck,
  Instagram,
  Smartphone,
  BookOpen,
  Sparkles,
  Coffee,
  Zap,
  Gift,
  Calendar,
  Filter,
  Search,
  Lock,
  Crown
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { config } from '@/lib/config'

// Template categories with icons
const categories = [
  { id: 'all', name: 'All Templates', icon: Wand2 },
  { id: 'delivery', name: 'Delivery Apps', icon: Truck },
  { id: 'social', name: 'Social Media', icon: Instagram },
  { id: 'menu', name: 'Menu & Print', icon: BookOpen },
  { id: 'thematic', name: 'Seasonal', icon: Calendar },
]

// Thematic templates for special occasions
const thematicTemplates = [
  {
    id: 'cny-2024',
    name: 'Chinese New Year 2024',
    description: 'Dragon-themed designs with red and gold colors',
    category: 'thematic',
    thumbnail: '/templates/cny-2024.jpg',
    isPremium: true,
  },
  {
    id: 'christmas',
    name: 'Christmas & Holiday',
    description: 'Festive red and green designs with winter themes',
    category: 'thematic',
    thumbnail: '/templates/christmas.jpg',
    isPremium: false,
  },
  {
    id: 'valentines',
    name: "Valentine's Day",
    description: 'Romantic pink and red designs for couples',
    category: 'thematic',
    thumbnail: '/templates/valentines.jpg',
    isPremium: true,
  },
  {
    id: 'halloween',
    name: 'Halloween',
    description: 'Spooky orange and black themed designs',
    category: 'thematic',
    thumbnail: '/templates/halloween.jpg',
    isPremium: false,
  },
  {
    id: 'thanksgiving',
    name: 'Thanksgiving',
    description: 'Autumn harvest colors and cozy vibes',
    category: 'thematic',
    thumbnail: '/templates/thanksgiving.jpg',
    isPremium: false,
  },
  {
    id: 'summer',
    name: 'Summer Vibes',
    description: 'Bright, tropical colors for summer promotions',
    category: 'thematic',
    thumbnail: '/templates/summer.jpg',
    isPremium: false,
  },
  {
    id: 'hari-raya',
    name: 'Hari Raya',
    description: 'Green and gold designs for Eid celebrations',
    category: 'thematic',
    thumbnail: '/templates/hari-raya.jpg',
    isPremium: true,
  },
  {
    id: 'diwali',
    name: 'Diwali',
    description: 'Vibrant colors and light themes for Diwali',
    category: 'thematic',
    thumbnail: '/templates/diwali.jpg',
    isPremium: true,
  },
  {
    id: 'mid-autumn',
    name: 'Mid-Autumn Festival',
    description: 'Mooncake and lantern themed designs',
    category: 'thematic',
    thumbnail: '/templates/mid-autumn.jpg',
    isPremium: true,
  },
  {
    id: 'mothers-day',
    name: "Mother's Day",
    description: 'Elegant floral designs to celebrate moms',
    category: 'thematic',
    thumbnail: '/templates/mothers-day.jpg',
    isPremium: false,
  },
]

// Map style presets to categories
function getPresetCategory(presetId: string): string {
  if (['delivery'].includes(presetId)) return 'delivery'
  if (['instagram', 'stories', 'tiktok', 'xiaohongshu', 'wechat'].includes(presetId)) return 'social'
  if (['menu', 'fine-dining'].includes(presetId)) return 'menu'
  return 'social'
}

// Get icon for preset
function getPresetIcon(presetId: string) {
  const icons: Record<string, typeof Wand2> = {
    'delivery': Truck,
    'instagram': Instagram,
    'stories': Smartphone,
    'menu': BookOpen,
    'fine-dining': Sparkles,
    'casual': Coffee,
    'fast-food': Zap,
    'cafe': Coffee,
    'xiaohongshu': Gift,
    'wechat': Smartphone,
  }
  return icons[presetId] || Wand2
}

export default async function TemplatesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Get business
  const { data: business } = await supabase
    .from('businesses')
    .select(`
      id,
      subscription_status,
      credits (credits_remaining)
    `)
    .eq('auth_user_id', user.id)
    .single()

  const isPro = business?.subscription_status === 'active'

  // Transform config presets to template format
  const styleTemplates = config.stylePresets.map(preset => ({
    id: preset.id,
    name: preset.name,
    description: preset.description,
    category: getPresetCategory(preset.id),
    isPremium: false,
    Icon: getPresetIcon(preset.id),
  }))

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Templates</h1>
          <p className="text-muted-foreground">
            Choose from 20+ style presets and thematic templates
          </p>
        </div>
        <Button asChild className="bg-orange-500 hover:bg-orange-600">
          <Link href="/editor">
            <Wand2 className="mr-2 h-4 w-4" />
            Use Template
          </Link>
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search templates..."
          className="pl-10"
        />
      </div>

      {/* Tabs for categories */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="flex-wrap h-auto gap-2 bg-transparent p-0">
          {categories.map((cat) => (
            <TabsTrigger
              key={cat.id}
              value={cat.id}
              className="data-[state=active]:bg-orange-500 data-[state=active]:text-white"
            >
              <cat.icon className="mr-2 h-4 w-4" />
              {cat.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* All Templates */}
        <TabsContent value="all" className="space-y-8">
          {/* Style Presets Section */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Style Presets</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {styleTemplates.map((template) => (
                <Card key={template.id} className="group overflow-hidden hover:shadow-md transition-shadow">
                  <Link href={`/editor?style=${template.id}`}>
                    <div className="relative aspect-square bg-gradient-to-br from-orange-100 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/20 flex items-center justify-center">
                      <template.Icon className="h-12 w-12 text-orange-500 group-hover:scale-110 transition-transform" />
                    </div>
                    <CardContent className="p-3">
                      <h3 className="font-medium text-sm">{template.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {template.description}
                      </p>
                    </CardContent>
                  </Link>
                </Card>
              ))}
            </div>
          </div>

          {/* Thematic Templates Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Seasonal & Thematic</h2>
              {!isPro && (
                <Badge variant="outline" className="text-orange-500 border-orange-500">
                  <Crown className="mr-1 h-3 w-3" />
                  Pro templates available
                </Badge>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {thematicTemplates.map((template) => (
                <Card
                  key={template.id}
                  className={`group overflow-hidden transition-shadow ${
                    template.isPremium && !isPro ? 'opacity-75' : 'hover:shadow-md'
                  }`}
                >
                  <Link
                    href={template.isPremium && !isPro ? '/billing' : `/editor?theme=${template.id}`}
                    className="block"
                  >
                    <div className="relative aspect-square bg-gradient-to-br from-purple-100 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/20 flex items-center justify-center">
                      <Calendar className="h-12 w-12 text-purple-500 group-hover:scale-110 transition-transform" />
                      {template.isPremium && !isPro && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <Lock className="h-8 w-8 text-white" />
                        </div>
                      )}
                      {template.isPremium && (
                        <Badge className="absolute top-2 right-2 bg-orange-500">
                          PRO
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-3">
                      <h3 className="font-medium text-sm">{template.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {template.description}
                      </p>
                    </CardContent>
                  </Link>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Delivery Apps */}
        <TabsContent value="delivery" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {styleTemplates.filter(t => t.category === 'delivery').map((template) => (
              <Card key={template.id} className="group overflow-hidden hover:shadow-md transition-shadow">
                <Link href={`/editor?style=${template.id}`}>
                  <div className="relative aspect-square bg-gradient-to-br from-green-100 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/20 flex items-center justify-center">
                    <template.Icon className="h-12 w-12 text-green-500 group-hover:scale-110 transition-transform" />
                  </div>
                  <CardContent className="p-3">
                    <h3 className="font-medium text-sm">{template.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {template.description}
                    </p>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
          <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
            <CardContent className="flex items-start gap-4 p-4">
              <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center flex-shrink-0">
                <Truck className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium">Optimized for Delivery Apps</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  These templates are specially designed for food delivery platforms like DoorDash, Uber Eats, GrabFood, and Deliveroo. High contrast, vibrant colors, and clean backgrounds ensure your dishes stand out in app listings.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Social Media */}
        <TabsContent value="social" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {styleTemplates.filter(t => t.category === 'social').map((template) => (
              <Card key={template.id} className="group overflow-hidden hover:shadow-md transition-shadow">
                <Link href={`/editor?style=${template.id}`}>
                  <div className="relative aspect-square bg-gradient-to-br from-pink-100 to-purple-50 dark:from-pink-950/30 dark:to-purple-950/20 flex items-center justify-center">
                    <template.Icon className="h-12 w-12 text-pink-500 group-hover:scale-110 transition-transform" />
                  </div>
                  <CardContent className="p-3">
                    <h3 className="font-medium text-sm">{template.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {template.description}
                    </p>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
          <Card className="bg-pink-50 dark:bg-pink-950/20 border-pink-200 dark:border-pink-900">
            <CardContent className="flex items-start gap-4 p-4">
              <div className="h-10 w-10 rounded-full bg-pink-100 dark:bg-pink-900/50 flex items-center justify-center flex-shrink-0">
                <Instagram className="h-5 w-5 text-pink-600" />
              </div>
              <div>
                <h3 className="font-medium">Social Media Ready</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Designed for Instagram, TikTok, Xiaohongshu, and other social platforms. Each style is optimized for maximum engagement with platform-specific aspect ratios and trending aesthetics.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Menu & Print */}
        <TabsContent value="menu" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {styleTemplates.filter(t => t.category === 'menu').map((template) => (
              <Card key={template.id} className="group overflow-hidden hover:shadow-md transition-shadow">
                <Link href={`/editor?style=${template.id}`}>
                  <div className="relative aspect-square bg-gradient-to-br from-blue-100 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/20 flex items-center justify-center">
                    <template.Icon className="h-12 w-12 text-blue-500 group-hover:scale-110 transition-transform" />
                  </div>
                  <CardContent className="p-3">
                    <h3 className="font-medium text-sm">{template.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {template.description}
                    </p>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
          <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
            <CardContent className="flex items-start gap-4 p-4">
              <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center flex-shrink-0">
                <BookOpen className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium">Print-Ready Quality</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Professional templates optimized for printed menus, table tents, and marketing materials. High resolution output with precise color accuracy for professional printing.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Seasonal */}
        <TabsContent value="thematic" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {thematicTemplates.map((template) => (
              <Card
                key={template.id}
                className={`group overflow-hidden transition-shadow ${
                  template.isPremium && !isPro ? 'opacity-75' : 'hover:shadow-md'
                }`}
              >
                <Link
                  href={template.isPremium && !isPro ? '/billing' : `/editor?theme=${template.id}`}
                  className="block"
                >
                  <div className="relative aspect-square bg-gradient-to-br from-purple-100 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/20 flex items-center justify-center">
                    <Calendar className="h-12 w-12 text-purple-500 group-hover:scale-110 transition-transform" />
                    {template.isPremium && !isPro && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Lock className="h-8 w-8 text-white" />
                      </div>
                    )}
                    {template.isPremium && (
                      <Badge className="absolute top-2 right-2 bg-orange-500">
                        PRO
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-3">
                    <h3 className="font-medium text-sm">{template.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {template.description}
                    </p>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
          <Card className="bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900">
            <CardContent className="flex items-start gap-4 p-4">
              <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center flex-shrink-0">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-medium">Seasonal Marketing Made Easy</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Pre-designed templates for major holidays and festivals. Just upload your food photos and let AI apply the perfect seasonal branding automatically.
                </p>
                {!isPro && (
                  <Button asChild size="sm" className="mt-3 bg-orange-500 hover:bg-orange-600">
                    <Link href="/billing">
                      <Crown className="mr-2 h-4 w-4" />
                      Upgrade to Pro
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
