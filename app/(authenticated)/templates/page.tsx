import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  Wand2,
  Truck,
  UtensilsCrossed,
  Sparkles,
  Coffee,
  Gift,
  Search,
  ImageIcon,
  ChevronRight
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MainNav } from '@/components/main-nav'
import {
  allTemplates,
  templateCounts,
  type TemplateImage
} from '@/lib/template-images'

// Category configuration
const categories = [
  { id: 'all', name: 'All', icon: ImageIcon, count: templateCounts.total },
  { id: 'delivery', name: 'Delivery', icon: Truck, count: templateCounts.delivery },
  { id: 'restaurant', name: 'Restaurant', icon: UtensilsCrossed, count: templateCounts.restaurant },
  { id: 'fine-dining', name: 'Fine Dining', icon: Sparkles, count: templateCounts['fine-dining'] },
  { id: 'cafe', name: 'Cafe', icon: Coffee, count: templateCounts.cafe },
  { id: 'christmas', name: 'Christmas', icon: Gift, count: templateCounts.christmas },
  { id: 'chinese-new-year', name: 'CNY', icon: Gift, count: templateCounts['chinese-new-year'] },
]

// Category display names and colors
const categoryConfig: Record<string, { name: string; color: string; description: string }> = {
  'delivery': {
    name: 'Delivery & Takeout',
    color: 'bg-green-500',
    description: 'Perfect for delivery app listings - high contrast, appetizing presentation'
  },
  'restaurant': {
    name: 'Restaurant',
    color: 'bg-blue-500',
    description: 'Elegant plating for restaurant menus and websites'
  },
  'fine-dining': {
    name: 'Fine Dining',
    color: 'bg-purple-500',
    description: 'Michelin-star presentation with artistic plating'
  },
  'cafe': {
    name: 'Cafe & Coffee',
    color: 'bg-amber-500',
    description: 'Cozy, warm aesthetics for cafes and coffee shops'
  },
  'christmas': {
    name: 'Christmas',
    color: 'bg-red-500',
    description: 'Festive holiday themes with red and green colors'
  },
  'chinese-new-year': {
    name: 'Chinese New Year',
    color: 'bg-orange-500',
    description: 'Prosperity themes with red and gold accents'
  },
}

// Template card component
function TemplateCard({ template }: { template: TemplateImage }) {
  const config = categoryConfig[template.category]

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-orange-500/30">
      <Link href={`/editor?template=${template.id}`}>
        <div className="relative aspect-square overflow-hidden">
          <Image
            src={template.thumbUrl}
            alt={template.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="absolute bottom-3 left-3 right-3">
              <Button size="sm" className="w-full bg-orange-500 hover:bg-orange-600">
                <Wand2 className="mr-2 h-4 w-4" />
                Use Template
              </Button>
            </div>
          </div>
          <Badge
            className={`absolute top-2 right-2 ${config?.color || 'bg-gray-500'} text-white text-xs`}
          >
            {config?.name?.split(' ')[0] || template.category}
          </Badge>
        </div>
        <CardContent className="p-3">
          <h3 className="font-semibold text-sm truncate">{template.name}</h3>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
            {template.description}
          </p>
        </CardContent>
      </Link>
    </Card>
  )
}

// Category section component
function CategorySection({
  category,
  templates,
  showAll = false
}: {
  category: string
  templates: TemplateImage[]
  showAll?: boolean
}) {
  const config = categoryConfig[category]
  const displayTemplates = showAll ? templates : templates.slice(0, 4)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-lg ${config?.color || 'bg-gray-500'} flex items-center justify-center`}>
            <ImageIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">{config?.name || category}</h2>
            <p className="text-sm text-muted-foreground">{templates.length} AI-generated images</p>
          </div>
        </div>
        {!showAll && templates.length > 4 && (
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/templates?category=${category}`}>
              View All
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        )}
      </div>

      {config?.description && (
        <p className="text-sm text-muted-foreground pl-13">{config.description}</p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {displayTemplates.map((template) => (
          <TemplateCard key={template.id} template={template} />
        ))}
      </div>
    </div>
  )
}

export default async function TemplatesPage() {
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

  // Get all templates combined for "All" tab
  const allTemplatesList = Object.values(allTemplates).flat()

  return (
    <div className="min-h-screen bg-background">
      <MainNav user={user} credits={creditsRemaining} subscriptionStatus={business?.subscription_status} />
      <div className="pt-16 p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Template Gallery</h1>
            <p className="text-muted-foreground">
              {templateCounts.total} AI-generated food photography templates
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/editor">
                <Wand2 className="mr-2 h-4 w-4" />
                Create from Scratch
              </Link>
            </Button>
          </div>
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
          <TabsList className="flex flex-wrap h-auto gap-2 bg-transparent p-0">
            {categories.map((cat) => (
              <TabsTrigger
                key={cat.id}
                value={cat.id}
                className="data-[state=active]:bg-orange-500 data-[state=active]:text-white flex items-center gap-2"
              >
                <cat.icon className="h-4 w-4" />
                {cat.name}
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {cat.count}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* All Templates */}
          <TabsContent value="all" className="space-y-10">
            {Object.entries(allTemplates).map(([category, templates]) => (
              <CategorySection
                key={category}
                category={category}
                templates={templates}
              />
            ))}
          </TabsContent>

          {/* Individual category tabs */}
          {Object.entries(allTemplates).map(([category, templates]) => (
            <TabsContent key={category} value={category} className="space-y-6">
              <CategorySection
                category={category}
                templates={templates}
                showAll={true}
              />

              {/* Category info card */}
              <Card className="bg-muted/50 border-muted">
                <CardContent className="flex items-start gap-4 p-4">
                  <div className={`h-10 w-10 rounded-lg ${categoryConfig[category]?.color || 'bg-gray-500'} flex items-center justify-center flex-shrink-0`}>
                    <ImageIcon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{categoryConfig[category]?.name || category}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {categoryConfig[category]?.description}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      All images are AI-generated at 2048x2048 resolution using Gemini 3 Pro + Real-ESRGAN upscaling.
                      Click any template to use it as a base for your own food photos.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

        {/* Bottom CTA */}
        <Card className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 border-orange-500/20">
          <CardContent className="flex flex-col md:flex-row items-center justify-between gap-4 p-6">
            <div className="text-center md:text-left">
              <h3 className="text-lg font-semibold">Need a Custom Style?</h3>
              <p className="text-sm text-muted-foreground">
                Upload your own photo and let AI transform it into professional marketing content
              </p>
            </div>
            <Button asChild className="bg-orange-500 hover:bg-orange-600">
              <Link href="/editor">
                <Wand2 className="mr-2 h-4 w-4" />
                Open Editor
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
