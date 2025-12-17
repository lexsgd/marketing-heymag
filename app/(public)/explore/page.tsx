'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { MainNav } from '@/components/main-nav'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

// Comprehensive template library with professional food photography
const templateImages = [
  // Delivery & Takeout (15 templates)
  { id: 1, src: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&h=600&fit=crop', name: 'Gourmet Burger Delivery Box', category: 'Delivery & Takeout', tags: ['burger', 'takeout', 'box'] },
  { id: 2, src: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=600&h=700&fit=crop', name: 'Sushi Delivery Platter', category: 'Delivery & Takeout', tags: ['sushi', 'japanese', 'delivery'] },
  { id: 3, src: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=600&h=500&fit=crop', name: 'Classic Burger & Fries Combo', category: 'Delivery & Takeout', tags: ['burger', 'fries', 'combo'] },
  { id: 4, src: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=600&h=600&fit=crop', name: 'Stacked Cheeseburger Photo', category: 'Delivery & Takeout', tags: ['burger', 'cheese', 'stacked'] },
  { id: 5, src: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&h=600&fit=crop', name: 'Fresh Pizza Delivery Style', category: 'Delivery & Takeout', tags: ['pizza', 'delivery', 'italian'] },
  { id: 6, src: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&h=700&fit=crop', name: 'Wood-Fired Pizza Presentation', category: 'Delivery & Takeout', tags: ['pizza', 'wood-fired', 'artisan'] },
  { id: 7, src: 'https://images.unsplash.com/photo-1551782450-17144efb9c50?w=600&h=500&fit=crop', name: 'Poke Bowl Takeout Container', category: 'Delivery & Takeout', tags: ['poke', 'bowl', 'healthy'] },
  { id: 8, src: 'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=600&h=600&fit=crop', name: 'Fried Chicken Wings Box', category: 'Delivery & Takeout', tags: ['chicken', 'wings', 'fried'] },
  { id: 9, src: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&h=700&fit=crop', name: 'Noodles Takeaway Box', category: 'Delivery & Takeout', tags: ['noodles', 'asian', 'takeaway'] },
  { id: 10, src: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600&h=500&fit=crop', name: 'Tacos Delivery Set', category: 'Delivery & Takeout', tags: ['tacos', 'mexican', 'delivery'] },
  { id: 11, src: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=600&h=600&fit=crop', name: 'Pad Thai Noodles Container', category: 'Delivery & Takeout', tags: ['pad thai', 'thai', 'noodles'] },
  { id: 12, src: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=600&h=700&fit=crop', name: 'Korean Fried Chicken', category: 'Delivery & Takeout', tags: ['korean', 'chicken', 'fried'] },
  { id: 13, src: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=600&h=500&fit=crop', name: 'Burrito Bowl Delivery', category: 'Delivery & Takeout', tags: ['burrito', 'bowl', 'mexican'] },
  { id: 14, src: 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=600&h=600&fit=crop', name: 'Loaded Fries Box', category: 'Delivery & Takeout', tags: ['fries', 'loaded', 'comfort'] },
  { id: 15, src: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=600&h=700&fit=crop', name: 'Grilled Steak Box', category: 'Delivery & Takeout', tags: ['steak', 'grilled', 'premium'] },

  // Restaurant (15 templates)
  { id: 16, src: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=600&fit=crop', name: 'Fresh Garden Salad Bowl', category: 'Restaurant', tags: ['salad', 'healthy', 'fresh'] },
  { id: 17, src: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&h=700&fit=crop', name: 'Vegetable Buddha Bowl', category: 'Restaurant', tags: ['buddha bowl', 'vegan', 'colorful'] },
  { id: 18, src: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600&h=500&fit=crop', name: 'Rainbow Veggie Plate', category: 'Restaurant', tags: ['vegetables', 'colorful', 'healthy'] },
  { id: 19, src: 'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=600&h=600&fit=crop', name: 'Rustic Pizza Board', category: 'Restaurant', tags: ['pizza', 'rustic', 'artisan'] },
  { id: 20, src: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&h=700&fit=crop', name: 'BBQ Ribs Platter', category: 'Restaurant', tags: ['bbq', 'ribs', 'meat'] },
  { id: 21, src: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=600&h=500&fit=crop', name: 'Berry Cheesecake Slice', category: 'Restaurant', tags: ['dessert', 'cheesecake', 'berries'] },
  { id: 22, src: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=600&fit=crop', name: 'Grilled Chicken Platter', category: 'Restaurant', tags: ['chicken', 'grilled', 'herbs'] },
  { id: 23, src: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600&h=700&fit=crop', name: 'Seafood Pasta Dish', category: 'Restaurant', tags: ['pasta', 'seafood', 'italian'] },
  { id: 24, src: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=600&h=500&fit=crop', name: 'Mediterranean Mezze Board', category: 'Restaurant', tags: ['mezze', 'mediterranean', 'sharing'] },
  { id: 25, src: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=600&fit=crop', name: 'Fine Plated Dinner', category: 'Restaurant', tags: ['dinner', 'plated', 'elegant'] },
  { id: 26, src: 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=600&h=700&fit=crop', name: 'Grilled Salmon Fillet', category: 'Restaurant', tags: ['salmon', 'fish', 'grilled'] },
  { id: 27, src: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&h=500&fit=crop', name: 'Seared Salmon Plate', category: 'Restaurant', tags: ['salmon', 'seared', 'fresh'] },
  { id: 28, src: 'https://images.unsplash.com/photo-1482049016530-2e8d4c3cde03?w=600&h=600&fit=crop', name: 'Quinoa Power Bowl', category: 'Restaurant', tags: ['quinoa', 'healthy', 'bowl'] },
  { id: 29, src: 'https://images.unsplash.com/photo-1547496502-affa22d38842?w=600&h=700&fit=crop', name: 'Breakfast Spread', category: 'Restaurant', tags: ['breakfast', 'spread', 'morning'] },
  { id: 30, src: 'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=600&h=500&fit=crop', name: 'French Toast Stack', category: 'Restaurant', tags: ['french toast', 'breakfast', 'sweet'] },

  // Fine Dining (12 templates)
  { id: 31, src: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&h=600&fit=crop', name: 'Prime Ribeye Steak', category: 'Fine Dining', tags: ['steak', 'beef', 'premium'] },
  { id: 32, src: 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=600&h=700&fit=crop', name: 'Gourmet Fish Course', category: 'Fine Dining', tags: ['fish', 'gourmet', 'plated'] },
  { id: 33, src: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=600&h=500&fit=crop', name: 'Lobster Tail Presentation', category: 'Fine Dining', tags: ['lobster', 'seafood', 'luxury'] },
  { id: 34, src: 'https://images.unsplash.com/photo-1560717789-0ac7c58ac90a?w=600&h=600&fit=crop', name: 'Wagyu Beef Plating', category: 'Fine Dining', tags: ['wagyu', 'beef', 'japanese'] },
  { id: 35, src: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=600&h=700&fit=crop', name: 'Duck Breast Fine Dining', category: 'Fine Dining', tags: ['duck', 'breast', 'elegant'] },
  { id: 36, src: 'https://images.unsplash.com/photo-1580476262798-bddd9f4b7369?w=600&h=500&fit=crop', name: 'Scallops with Foam', category: 'Fine Dining', tags: ['scallops', 'seafood', 'molecular'] },
  { id: 37, src: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600&h=600&fit=crop', name: 'Tuna Tartare Tower', category: 'Fine Dining', tags: ['tuna', 'tartare', 'raw'] },
  { id: 38, src: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=600&h=700&fit=crop', name: 'Beef Carpaccio Art', category: 'Fine Dining', tags: ['carpaccio', 'beef', 'italian'] },
  { id: 39, src: 'https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?w=600&h=500&fit=crop', name: 'Michelin Star Plating', category: 'Fine Dining', tags: ['michelin', 'plating', 'art'] },
  { id: 40, src: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600&h=600&fit=crop', name: 'Truffle Pasta Creation', category: 'Fine Dining', tags: ['truffle', 'pasta', 'luxury'] },
  { id: 41, src: 'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=600&h=700&fit=crop', name: 'Deconstructed Dessert', category: 'Fine Dining', tags: ['dessert', 'deconstructed', 'art'] },
  { id: 42, src: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?w=600&h=500&fit=crop', name: 'Oyster Presentation', category: 'Fine Dining', tags: ['oyster', 'seafood', 'fresh'] },

  // Cafe & Coffee (13 templates)
  { id: 43, src: 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=600&h=600&fit=crop', name: 'Gourmet Burger & Fries', category: 'Cafe & Coffee', tags: ['burger', 'cafe', 'casual'] },
  { id: 44, src: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&h=700&fit=crop', name: 'Latte Art Perfection', category: 'Cafe & Coffee', tags: ['latte', 'coffee', 'art'] },
  { id: 45, src: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&h=500&fit=crop', name: 'Cappuccino Heart Art', category: 'Cafe & Coffee', tags: ['cappuccino', 'heart', 'coffee'] },
  { id: 46, src: 'https://images.unsplash.com/photo-1514066558159-fc8c737ef259?w=600&h=600&fit=crop', name: 'Coffee & Croissant Set', category: 'Cafe & Coffee', tags: ['croissant', 'coffee', 'breakfast'] },
  { id: 47, src: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=600&h=700&fit=crop', name: 'Avocado Toast Brunch', category: 'Cafe & Coffee', tags: ['avocado', 'toast', 'brunch'] },
  { id: 48, src: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600&h=500&fit=crop', name: 'Eggs Benedict Classic', category: 'Cafe & Coffee', tags: ['eggs benedict', 'brunch', 'classic'] },
  { id: 49, src: 'https://images.unsplash.com/photo-1517433670267-30f41c281f67?w=600&h=600&fit=crop', name: 'Smoothie Bowl Art', category: 'Cafe & Coffee', tags: ['smoothie', 'bowl', 'healthy'] },
  { id: 50, src: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&h=700&fit=crop', name: 'Matcha Latte Aesthetic', category: 'Cafe & Coffee', tags: ['matcha', 'latte', 'green'] },
  { id: 51, src: 'https://images.unsplash.com/photo-1478145046317-39f10e56b5e9?w=600&h=500&fit=crop', name: 'Pancake Stack Morning', category: 'Cafe & Coffee', tags: ['pancakes', 'breakfast', 'stack'] },
  { id: 52, src: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&h=600&fit=crop', name: 'Fluffy Pancakes Syrup', category: 'Cafe & Coffee', tags: ['pancakes', 'syrup', 'fluffy'] },
  { id: 53, src: 'https://images.unsplash.com/photo-1481931098730-318b6f776db0?w=600&h=700&fit=crop', name: 'Granola Yogurt Bowl', category: 'Cafe & Coffee', tags: ['granola', 'yogurt', 'healthy'] },
  { id: 54, src: 'https://images.unsplash.com/photo-1464305795204-6f5bbfc7fb81?w=600&h=500&fit=crop', name: 'Pastry Display Selection', category: 'Cafe & Coffee', tags: ['pastry', 'bakery', 'selection'] },
  { id: 55, src: 'https://images.unsplash.com/photo-1486427944299-d1955d23e34d?w=600&h=600&fit=crop', name: 'Chocolate Croissant', category: 'Cafe & Coffee', tags: ['croissant', 'chocolate', 'pastry'] },

  // Seasonal Themes
  { id: 56, src: 'https://images.unsplash.com/photo-1574085733277-851d9d856a3a?w=600&h=700&fit=crop', name: 'Christmas Dinner Spread', category: 'Restaurant', theme: 'Christmas', tags: ['christmas', 'dinner', 'holiday'] },
  { id: 57, src: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&h=500&fit=crop', name: 'Holiday Roast Turkey', category: 'Restaurant', theme: 'Thanksgiving', tags: ['turkey', 'thanksgiving', 'roast'] },
  { id: 58, src: 'https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=600&h=600&fit=crop', name: 'Festive Food Table', category: 'Restaurant', theme: 'Christmas', tags: ['festive', 'table', 'spread'] },
  { id: 59, src: 'https://images.unsplash.com/photo-1504387432042-8aca549e4729?w=600&h=700&fit=crop', name: 'Halloween Treats Display', category: 'Cafe & Coffee', theme: 'Halloween', tags: ['halloween', 'treats', 'spooky'] },
  { id: 60, src: 'https://images.unsplash.com/photo-1540587659271-7b73fcf23503?w=600&h=500&fit=crop', name: 'Pumpkin Spice Season', category: 'Cafe & Coffee', theme: 'Halloween', tags: ['pumpkin', 'spice', 'fall'] },
]

const categories = [
  { id: 'all', name: 'All Templates' },
  { id: 'delivery', name: 'Delivery & Takeout', match: 'Delivery & Takeout' },
  { id: 'restaurant', name: 'Restaurant', match: 'Restaurant' },
  { id: 'fine-dining', name: 'Fine Dining', match: 'Fine Dining' },
  { id: 'cafe', name: 'Cafe & Coffee', match: 'Cafe & Coffee' },
]

const themes = [
  { id: 'halloween', name: 'Halloween', emoji: '🎃' },
  { id: 'christmas', name: 'Christmas', emoji: '🎄' },
  { id: 'thanksgiving', name: 'Thanksgiving', emoji: '🦃' },
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
        return img.theme?.toLowerCase() === activeTheme.toLowerCase()
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

  // Get counts per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: templateImages.length }
    categories.slice(1).forEach(cat => {
      counts[cat.id] = templateImages.filter(img => img.category === cat.match).length
    })
    return counts
  }, [])

  // Get counts per theme
  const themeCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    themes.forEach(theme => {
      counts[theme.id] = templateImages.filter(img => img.theme?.toLowerCase() === theme.id).length
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
      <MainNav />

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
                <Badge variant="secondary" className="text-xs">{categoryCounts.all}</Badge>
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
                  <img
                    src={image.src}
                    alt={image.name}
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
                        {image.category}
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
