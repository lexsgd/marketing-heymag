'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { MainNav } from '@/components/main-nav'
import { cn } from '@/lib/utils'

// Sample template images - in production these would come from database/storage
const templateImages = [
  { id: 1, src: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=500&fit=crop', category: 'Restaurant', theme: null },
  { id: 2, src: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=300&fit=crop', category: 'Fine Dining', theme: null },
  { id: 3, src: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&h=400&fit=crop', category: 'Delivery & Takeout', theme: null },
  { id: 4, src: 'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=400&h=500&fit=crop', category: 'Restaurant', theme: null },
  { id: 5, src: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=350&fit=crop', category: 'Fine Dining', theme: null },
  { id: 6, src: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=400&fit=crop', category: 'Delivery & Takeout', theme: null },
  { id: 7, src: 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=400&h=300&fit=crop', category: 'Cafe & Coffee', theme: null },
  { id: 8, src: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=450&fit=crop', category: 'Restaurant', theme: null },
  { id: 9, src: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&h=400&fit=crop', category: 'Delivery & Takeout', theme: null },
  { id: 10, src: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=350&fit=crop', category: 'Cafe & Coffee', theme: null },
  { id: 11, src: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=400&h=500&fit=crop', category: 'Fine Dining', theme: null },
  { id: 12, src: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=400&fit=crop', category: 'Restaurant', theme: 'Christmas' },
]

const categories = [
  { id: 'all', name: 'All Templates' },
  { id: 'delivery', name: 'Delivery & Takeout' },
  { id: 'restaurant', name: 'Restaurant' },
  { id: 'fine-dining', name: 'Fine Dining' },
  { id: 'cafe', name: 'Cafe & Coffee' },
]

const themes = [
  { id: 'halloween', name: 'Halloween', emoji: '🎃' },
  { id: 'christmas', name: 'Christmas', emoji: '🎄' },
  { id: 'thanksgiving', name: 'Thanksgiving', emoji: '🦃' },
]

export default function ExplorePage() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [activeTheme, setActiveTheme] = useState<string | null>(null)

  const filteredImages = templateImages.filter(img => {
    if (activeCategory !== 'all') {
      const categoryMatch = img.category.toLowerCase().includes(activeCategory.replace('-', ' '))
      if (!categoryMatch) return false
    }
    if (activeTheme && img.theme !== activeTheme) {
      return false
    }
    return true
  })

  return (
    <div className="min-h-screen bg-background">
      <MainNav />

      <div className="pt-16 flex">
        {/* Left Sidebar */}
        <aside className="hidden lg:block w-64 border-r border-border h-[calc(100vh-64px)] sticky top-16 overflow-y-auto p-6">
          {/* Explore Section - Just All Templates */}
          <div className="mb-8">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              EXPLORE
            </h3>
            <nav className="space-y-1">
              <button
                onClick={() => {
                  setActiveCategory('all')
                  setActiveTheme(null)
                }}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  activeCategory === 'all' && !activeTheme
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                All Templates
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
                  onClick={() => {
                    setActiveCategory(cat.id)
                    setActiveTheme(null)
                  }}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
                    activeCategory === cat.id && !activeTheme
                      ? 'bg-muted text-foreground font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                >
                  {cat.name}
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
                  onClick={() => {
                    setActiveTheme(theme.id)
                    setActiveCategory('all')
                  }}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2',
                    activeTheme === theme.id
                      ? 'bg-muted text-foreground font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                >
                  <span>{theme.emoji}</span>
                  <span>{theme.name}</span>
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8">
          <h1 className="text-2xl font-bold mb-6">
            {activeTheme
              ? `${themes.find(t => t.id === activeTheme)?.name} Templates`
              : activeCategory === 'all'
              ? 'All Templates'
              : categories.find(c => c.id === activeCategory)?.name
            }
          </h1>

          {/* Masonry Grid */}
          <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
            {filteredImages.map((image) => (
              <Link
                key={image.id}
                href={`/editor?template=${image.id}`}
                className="block break-inside-avoid group"
              >
                <div className="relative overflow-hidden rounded-xl bg-muted">
                  <img
                    src={image.src}
                    alt={`Template ${image.id}`}
                    className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                </div>
              </Link>
            ))}
          </div>

          {filteredImages.length === 0 && (
            <div className="text-center py-20">
              <p className="text-muted-foreground">No templates found for this filter.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
