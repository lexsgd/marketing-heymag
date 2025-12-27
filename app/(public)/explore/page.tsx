'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { MainNavAuth } from '@/components/main-nav-auth'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  allTemplates,
  templateCounts,
  type TemplateImage
} from '@/lib/template-images'

// Convert template data to explore page format
interface ExploreTemplate {
  id: string
  src: string
  thumbSrc: string
  name: string
  description: string
  category: string
  theme?: string
  tags: string[]
}

// Map category keys to display names
const categoryDisplayNames: Record<string, string> = {
  'delivery': 'Delivery & Takeout',
  'restaurant': 'Restaurant',
  'fine-dining': 'Fine Dining',
  'cafe': 'Cafe & Coffee',
  'hawker': 'Hawker & Street Food',
  'christmas': 'Christmas',
  'chinese-new-year': 'Chinese New Year',
}

// Build template array from generated data
const templateImages: ExploreTemplate[] = []

// Add regular categories
const regularCategories = ['delivery', 'restaurant', 'fine-dining', 'cafe', 'hawker'] as const
regularCategories.forEach(catKey => {
  const templates = allTemplates[catKey] || []
  templates.forEach((t: TemplateImage, idx: number) => {
    templateImages.push({
      id: t.id,
      src: t.webUrl,
      thumbSrc: t.thumbUrl,
      name: t.name,
      description: t.description,
      category: categoryDisplayNames[catKey],
      tags: [t.name.toLowerCase(), catKey],
    })
  })
})

// Add themed templates (Christmas, CNY)
const themeCategories = ['christmas', 'chinese-new-year'] as const
themeCategories.forEach(catKey => {
  const templates = allTemplates[catKey] || []
  const themeName = catKey === 'christmas' ? 'Christmas' : 'Chinese New Year'
  templates.forEach((t: TemplateImage, idx: number) => {
    templateImages.push({
      id: t.id,
      src: t.webUrl,
      thumbSrc: t.thumbUrl,
      name: t.name,
      description: t.description,
      category: catKey === 'christmas' ? 'Restaurant' : 'Restaurant', // Group under Restaurant for category filter
      theme: themeName,
      tags: [t.name.toLowerCase(), themeName.toLowerCase()],
    })
  })
})

const categories = [
  { id: 'all', name: 'All Templates' },
  { id: 'delivery', name: 'Delivery & Takeout', match: 'Delivery & Takeout' },
  { id: 'restaurant', name: 'Restaurant', match: 'Restaurant' },
  { id: 'fine-dining', name: 'Fine Dining', match: 'Fine Dining' },
  { id: 'cafe', name: 'Cafe & Coffee', match: 'Cafe & Coffee' },
  { id: 'hawker', name: 'Hawker & Street Food', match: 'Hawker & Street Food' },
]

const themes = [
  { id: 'christmas', name: 'Christmas', emoji: '🎄' },
  { id: 'chinese-new-year', name: 'Chinese New Year', emoji: '🧧' },
]

const ITEMS_PER_PAGE = 20

export default function ExplorePage() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [activeTheme, setActiveTheme] = useState<string | null>(null)
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE)

  // Filter images based on category and theme
  const filteredImages = useMemo(() => {
    return templateImages.filter(img => {
      // Theme filter
      if (activeTheme) {
        const themeName = themes.find(t => t.id === activeTheme)?.name
        return img.theme === themeName
      }
      // Category filter
      if (activeCategory !== 'all') {
        const category = categories.find(c => c.id === activeCategory)
        return category?.match === img.category
      }
      return true
    })
  }, [activeCategory, activeTheme])

  // Get displayed images (for pagination)
  const displayedImages = filteredImages.slice(0, displayCount)
  const remainingCount = filteredImages.length - displayCount

  // Get counts per category (excluding themed templates from category counts)
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: templateImages.length }
    categories.slice(1).forEach(cat => {
      counts[cat.id] = templateImages.filter(img => img.category === cat.match && !img.theme).length
    })
    return counts
  }, [])

  // Get counts per theme
  const themeCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    themes.forEach(theme => {
      counts[theme.id] = templateImages.filter(img => img.theme === theme.name).length
    })
    return counts
  }, [])

  const handleLoadMore = () => {
    setDisplayCount(prev => prev + ITEMS_PER_PAGE)
  }

  const handleCategoryClick = (categoryId: string) => {
    setActiveCategory(categoryId)
    setActiveTheme(null)
    setDisplayCount(ITEMS_PER_PAGE)
  }

  const handleThemeClick = (themeId: string) => {
    setActiveTheme(themeId)
    setActiveCategory('all')
    setDisplayCount(ITEMS_PER_PAGE)
  }

  return (
    <div className="min-h-screen bg-background">
      <MainNavAuth />

      <div className="pt-16 flex">
        {/* Left Sidebar */}
        <aside className="hidden lg:block w-64 border-r border-border h-[calc(100vh-64px)] sticky top-16 overflow-y-auto p-6">
          {/* Explore Section */}
          <div className="mb-8">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              EXPLORE
            </h3>
            <nav className="space-y-1">
              <button
                onClick={() => handleCategoryClick('all')}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-between',
                  activeCategory === 'all' && !activeTheme
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                <span>All Templates</span>
                <Badge variant="secondary" className="text-xs">{templateImages.length}</Badge>
              </button>
            </nav>
          </div>

          {/* Categories Section */}
          <div className="mb-8">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Categories
            </h3>
            <nav className="space-y-1">
              {categories.slice(1).map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.id)}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between',
                    activeCategory === cat.id && !activeTheme
                      ? 'bg-muted text-foreground font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                >
                  <span>{cat.name}</span>
                  <Badge variant="secondary" className="text-xs">{categoryCounts[cat.id]}</Badge>
                </button>
              ))}
            </nav>
          </div>

          {/* Themes Section */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Themes
            </h3>
            <nav className="space-y-1">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => handleThemeClick(theme.id)}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between',
                    activeTheme === theme.id
                      ? 'bg-muted text-foreground font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span>{theme.emoji}</span>
                    <span>{theme.name}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">{themeCounts[theme.id]}</Badge>
                </button>
              ))}
            </nav>
          </div>

        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8">
          {/* Header with count */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">
              {activeTheme
                ? `${themes.find(t => t.id === activeTheme)?.name} Templates`
                : activeCategory === 'all'
                ? 'All Templates'
                : categories.find(c => c.id === activeCategory)?.name
              }
            </h1>
            <span className="text-sm text-muted-foreground">
              {filteredImages.length} templates
            </span>
          </div>

          {/* Masonry Grid - 4 columns */}
          <div className="columns-2 md:columns-3 lg:columns-4 gap-4">
            {displayedImages.map((image) => (
              <Link
                key={image.id}
                href={`/editor?template=${image.id}`}
                className="block break-inside-avoid mb-4 group"
              >
                <div className="relative overflow-hidden rounded-xl bg-muted">
                  <Image
                    src={image.thumbSrc}
                    alt={image.name}
                    width={400}
                    height={400}
                    className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                  {/* Hover Overlay with Info */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="text-white font-medium text-sm mb-1 line-clamp-2">
                        {image.name}
                      </h3>
                      <p className="text-white/70 text-xs">
                        {image.description}
                      </p>
                    </div>
                  </div>
                  {/* Theme Badge */}
                  {image.theme && (
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-orange-500 hover:bg-orange-600 text-white text-xs">
                        {image.theme}
                      </Badge>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {/* Load More Button */}
          {remainingCount > 0 && (
            <div className="flex justify-center mt-8">
              <Button
                onClick={handleLoadMore}
                variant="outline"
                size="lg"
                className="px-8"
              >
                Load More ({remainingCount} remaining)
              </Button>
            </div>
          )}

          {/* Empty State */}
          {filteredImages.length === 0 && (
            <div className="text-center py-20">
              <p className="text-muted-foreground">No templates found for this filter.</p>
              <Button
                onClick={() => handleCategoryClick('all')}
                variant="link"
                className="mt-2 text-orange-500"
              >
                View all templates
              </Button>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
