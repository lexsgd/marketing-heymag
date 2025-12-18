// Style system with layered categories and conflict prevention
// Each category has its own selection rules (single vs multiple)

export interface Style {
  id: string
  name: string
  description: string
  thumbnail: string
  keywords: string[] // for search
}

export interface StyleCategory {
  id: string
  name: string
  icon: string
  emoji: string
  selectionType: 'single' | 'multiple'
  required: boolean
  description: string
  styles: Style[]
}

// All style categories with their selection rules
export const styleCategories: StyleCategory[] = [
  {
    id: 'venue',
    name: 'Venue Type',
    icon: 'Store',
    emoji: '🏪',
    selectionType: 'single',
    required: true,
    description: 'What type of food establishment?',
    styles: [
      {
        id: 'fine-dining',
        name: 'Fine Dining',
        description: 'Elegant, sophisticated presentation with dark backgrounds',
        thumbnail: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=100&h=100&fit=crop',
        keywords: ['elegant', 'upscale', 'michelin', 'gourmet', 'luxury']
      },
      {
        id: 'casual-dining',
        name: 'Casual Dining',
        description: 'Warm, inviting atmosphere for everyday restaurants',
        thumbnail: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=100&h=100&fit=crop',
        keywords: ['family', 'comfortable', 'relaxed', 'friendly']
      },
      {
        id: 'fast-food',
        name: 'Fast Food',
        description: 'Bold, appetizing, high-energy visuals',
        thumbnail: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=100&h=100&fit=crop',
        keywords: ['quick', 'bold', 'vibrant', 'burger', 'fries']
      },
      {
        id: 'cafe',
        name: 'Cafe & Bakery',
        description: 'Cozy, artisan aesthetic with warm tones',
        thumbnail: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=100&h=100&fit=crop',
        keywords: ['coffee', 'pastry', 'cozy', 'artisan', 'brunch']
      },
      {
        id: 'street-food',
        name: 'Street Food',
        description: 'Authentic, vibrant hawker-style presentation',
        thumbnail: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=100&h=100&fit=crop',
        keywords: ['hawker', 'authentic', 'local', 'vibrant']
      },
      {
        id: 'hawker',
        name: 'Hawker Centre',
        description: 'Singapore/SEA hawker stall vibes',
        thumbnail: 'https://images.unsplash.com/photo-1722995690313-9ef561d30143?w=100&h=100&fit=crop',
        keywords: ['singapore', 'malaysia', 'local', 'kopitiam']
      },
      {
        id: 'dessert',
        name: 'Dessert & Sweets',
        description: 'Sweet, colorful, Instagram-worthy treats',
        thumbnail: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=100&h=100&fit=crop',
        keywords: ['sweet', 'cake', 'ice cream', 'colorful', 'pretty']
      },
    ]
  },
  {
    id: 'delivery',
    name: 'Delivery Platform',
    icon: 'Truck',
    emoji: '🚀',
    selectionType: 'single',
    required: false,
    description: 'Optimize for a delivery app?',
    styles: [
      {
        id: 'grab',
        name: 'GrabFood',
        description: 'Optimized for GrabFood app listings',
        thumbnail: 'https://cdn.simpleicons.org/grab/00B14F',
        keywords: ['grab', 'delivery', 'app', 'green']
      },
      {
        id: 'foodpanda',
        name: 'Foodpanda',
        description: 'Perfect pink-themed Foodpanda menus',
        thumbnail: 'https://cdn.simpleicons.org/foodpanda/D70F64',
        keywords: ['foodpanda', 'delivery', 'pink', 'app']
      },
      {
        id: 'deliveroo',
        name: 'Deliveroo',
        description: 'Deliveroo teal-optimized style',
        thumbnail: 'https://cdn.simpleicons.org/deliveroo/00CCBC',
        keywords: ['deliveroo', 'delivery', 'teal', 'premium']
      },
      {
        id: 'gojek',
        name: 'GoFood',
        description: 'Gojek GoFood green style',
        thumbnail: 'https://cdn.simpleicons.org/gojek/00AA13',
        keywords: ['gojek', 'gofood', 'indonesia', 'green']
      },
      {
        id: 'shopee',
        name: 'ShopeeFood',
        description: 'ShopeeFood marketplace orange style',
        thumbnail: 'https://cdn.simpleicons.org/shopee/EE4D2D',
        keywords: ['shopee', 'shopeefood', 'orange', 'marketplace']
      },
      {
        id: 'generic-delivery',
        name: 'Universal Delivery',
        description: 'Works for any delivery platform',
        thumbnail: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='none' stroke='%23888888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2'/%3E%3Cpath d='M15 18H9'/%3E%3Cpath d='M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14'/%3E%3Ccircle cx='17' cy='18' r='2'/%3E%3Ccircle cx='7' cy='18' r='2'/%3E%3C/svg%3E",
        keywords: ['delivery', 'universal', 'app', 'general']
      },
    ]
  },
  {
    id: 'social',
    name: 'Social Platform',
    icon: 'Share2',
    emoji: '📱',
    selectionType: 'multiple',
    required: false,
    description: 'Where will you post? (pick multiple)',
    styles: [
      {
        id: 'instagram-feed',
        name: 'Instagram Feed',
        description: 'Square format, vibrant colors for the grid',
        thumbnail: 'https://cdn.simpleicons.org/instagram/E4405F',
        keywords: ['instagram', 'ig', 'square', 'feed', 'grid']
      },
      {
        id: 'instagram-stories',
        name: 'Instagram Stories',
        description: 'Vertical 9:16, trendy and eye-catching',
        thumbnail: 'https://cdn.simpleicons.org/instagram/C13584',
        keywords: ['instagram', 'stories', 'vertical', 'trendy']
      },
      {
        id: 'tiktok',
        name: 'TikTok',
        description: 'Scroll-stopping vertical visuals',
        thumbnail: 'https://cdn.simpleicons.org/tiktok/000000',
        keywords: ['tiktok', 'viral', 'vertical', 'trending']
      },
      {
        id: 'facebook',
        name: 'Facebook',
        description: 'Optimized for Facebook feed engagement',
        thumbnail: 'https://cdn.simpleicons.org/facebook/1877F2',
        keywords: ['facebook', 'fb', 'social', 'share']
      },
      {
        id: 'xiaohongshu',
        name: 'Xiaohongshu',
        description: 'Trendy lifestyle aesthetic for Little Red Book',
        thumbnail: 'https://cdn.simpleicons.org/xiaohongshu/FE2C55',
        keywords: ['xiaohongshu', 'xhs', 'chinese', 'lifestyle', 'red']
      },
      {
        id: 'wechat',
        name: 'WeChat Moments',
        description: 'Clean, shareable format for WeChat',
        thumbnail: 'https://cdn.simpleicons.org/wechat/07C160',
        keywords: ['wechat', 'moments', 'chinese', 'share']
      },
      {
        id: 'pinterest',
        name: 'Pinterest',
        description: 'Tall pins that get saved and shared',
        thumbnail: 'https://cdn.simpleicons.org/pinterest/BD081C',
        keywords: ['pinterest', 'pin', 'tall', 'save']
      },
    ]
  },
  {
    id: 'seasonal',
    name: 'Seasonal & Events',
    icon: 'Calendar',
    emoji: '🎉',
    selectionType: 'single',
    required: false,
    description: 'Add a seasonal theme?',
    styles: [
      {
        id: 'christmas',
        name: 'Christmas',
        description: 'Festive red & green, cozy winter vibes',
        thumbnail: 'https://images.unsplash.com/photo-1545048702-79362596cdc9?w=100&h=100&fit=crop',
        keywords: ['christmas', 'xmas', 'holiday', 'winter', 'festive']
      },
      {
        id: 'chinese-new-year',
        name: 'Chinese New Year',
        description: 'Prosperous red & gold styling',
        thumbnail: 'https://images.unsplash.com/photo-1758183056857-0ce684ebb634?w=100&h=100&fit=crop',
        keywords: ['cny', 'chinese', 'lunar', 'red', 'gold', 'prosperity']
      },
      {
        id: 'valentines',
        name: "Valentine's Day",
        description: 'Romantic pink & red hearts theme',
        thumbnail: 'https://images.unsplash.com/photo-1706515056156-845f73bc81f3?w=100&h=100&fit=crop',
        keywords: ['valentine', 'love', 'romantic', 'pink', 'hearts']
      },
      {
        id: 'hari-raya',
        name: 'Hari Raya',
        description: 'Elegant green & gold Eid celebration',
        thumbnail: 'https://images.unsplash.com/photo-1620795541878-62d9eaf5b56c?w=100&h=100&fit=crop',
        keywords: ['hari raya', 'eid', 'raya', 'green', 'gold', 'ketupat']
      },
      {
        id: 'deepavali',
        name: 'Deepavali',
        description: 'Vibrant colors and festive lights',
        thumbnail: 'https://images.unsplash.com/photo-1675507324104-19488fba67ff?w=100&h=100&fit=crop',
        keywords: ['deepavali', 'diwali', 'lights', 'colorful', 'indian']
      },
      {
        id: 'mid-autumn',
        name: 'Mid-Autumn Festival',
        description: 'Mooncake season elegant styling',
        thumbnail: 'https://images.unsplash.com/photo-1601727175630-f4500cfc1c0e?w=100&h=100&fit=crop',
        keywords: ['mid-autumn', 'mooncake', 'lantern', 'moon']
      },
    ]
  },
  {
    id: 'background',
    name: 'Background Style',
    icon: 'Image',
    emoji: '🖼️',
    selectionType: 'single',
    required: false,
    description: 'What surface/backdrop?',
    styles: [
      {
        id: 'minimal-white',
        name: 'Minimal White',
        description: 'Clean white background, product focus',
        thumbnail: 'https://images.unsplash.com/photo-1490818387583-1baba5e638af?w=100&h=100&fit=crop',
        keywords: ['white', 'clean', 'minimal', 'simple']
      },
      {
        id: 'rustic-wood',
        name: 'Rustic Wood',
        description: 'Warm wooden table backdrop',
        thumbnail: 'https://images.unsplash.com/photo-1565661833906-f1da5fd3b6ab?w=100&h=100&fit=crop',
        keywords: ['wood', 'rustic', 'warm', 'natural']
      },
      {
        id: 'marble',
        name: 'Marble Surface',
        description: 'Elegant marble for premium feel',
        thumbnail: 'https://images.unsplash.com/photo-1517427294546-5aa121f68e8a?w=100&h=100&fit=crop',
        keywords: ['marble', 'elegant', 'premium', 'luxury']
      },
      {
        id: 'dark-moody',
        name: 'Dark & Moody',
        description: 'Dramatic dark backgrounds with accent lighting',
        thumbnail: 'https://images.unsplash.com/photo-1556761223-4c4282c73f77?w=100&h=100&fit=crop',
        keywords: ['dark', 'moody', 'dramatic', 'contrast']
      },
      {
        id: 'bright-airy',
        name: 'Bright & Airy',
        description: 'Light, fresh, and welcoming',
        thumbnail: 'https://images.unsplash.com/photo-1687029968603-904d3833b50f?w=100&h=100&fit=crop',
        keywords: ['bright', 'airy', 'light', 'fresh']
      },
      {
        id: 'tropical',
        name: 'Tropical Vibes',
        description: 'Colorful tropical leaves and fruits',
        thumbnail: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=100&h=100&fit=crop',
        keywords: ['tropical', 'colorful', 'summer', 'fresh']
      },
      {
        id: 'concrete',
        name: 'Industrial Concrete',
        description: 'Modern concrete/cement look',
        thumbnail: 'https://images.unsplash.com/photo-1690983321815-6438f4850ca3?w=100&h=100&fit=crop',
        keywords: ['concrete', 'industrial', 'modern', 'urban']
      },
      {
        id: 'botanical',
        name: 'Botanical Garden',
        description: 'Food styled with plants and flowers',
        thumbnail: 'https://images.unsplash.com/photo-1624709953504-b9b4400a3599?w=100&h=100&fit=crop',
        keywords: ['botanical', 'plants', 'flowers', 'nature']
      },
    ]
  },
  {
    id: 'technique',
    name: 'Photography Style',
    icon: 'Camera',
    emoji: '📷',
    selectionType: 'multiple',
    required: false,
    description: 'Photography techniques (pick multiple)',
    styles: [
      {
        id: 'flat-lay',
        name: 'Flat Lay',
        description: 'Top-down overhead perspective',
        thumbnail: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=100&h=100&fit=crop',
        keywords: ['flat lay', 'overhead', 'top-down', 'birds eye']
      },
      {
        id: 'natural-light',
        name: 'Natural Light',
        description: 'Soft window-lit natural feel',
        thumbnail: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=100&h=100&fit=crop',
        keywords: ['natural', 'window', 'soft', 'daylight']
      },
      {
        id: 'neon-night',
        name: 'Neon Night',
        description: 'Vibrant neon night market style',
        thumbnail: 'https://images.unsplash.com/photo-1756713545237-7c97075b71da?w=100&h=100&fit=crop',
        keywords: ['neon', 'night', 'vibrant', 'glow']
      },
      {
        id: 'vintage',
        name: 'Vintage Film',
        description: 'Nostalgic warm film tones',
        thumbnail: 'https://images.unsplash.com/photo-1737958946719-13dd1573f6bf?w=100&h=100&fit=crop',
        keywords: ['vintage', 'film', 'retro', 'nostalgic']
      },
      {
        id: 'hdr',
        name: 'HDR Enhanced',
        description: 'High dynamic range for maximum pop',
        thumbnail: 'https://images.unsplash.com/photo-1710887869102-36fd5d1f3352?w=100&h=100&fit=crop',
        keywords: ['hdr', 'enhanced', 'vivid', 'pop']
      },
      {
        id: 'bokeh',
        name: 'Bokeh Background',
        description: 'Beautiful blurred background effect',
        thumbnail: 'https://images.unsplash.com/photo-1548365327-ba68b3991b34?w=100&h=100&fit=crop',
        keywords: ['bokeh', 'blur', 'depth', 'focus']
      },
      {
        id: 'macro',
        name: 'Macro Close-up',
        description: 'Extreme close-up detail shots',
        thumbnail: 'https://images.unsplash.com/photo-1531279390331-0db31e853a49?w=100&h=100&fit=crop',
        keywords: ['macro', 'closeup', 'detail', 'texture']
      },
    ]
  },
]

// Helper to get total style count
export function getTotalStyleCount(): number {
  return styleCategories.reduce((acc, cat) => acc + cat.styles.length, 0)
}

// Helper to search styles across all categories
export function searchStyles(query: string): { category: StyleCategory; style: Style }[] {
  const lowerQuery = query.toLowerCase()
  const results: { category: StyleCategory; style: Style }[] = []

  for (const category of styleCategories) {
    for (const style of category.styles) {
      const matchesName = style.name.toLowerCase().includes(lowerQuery)
      const matchesDescription = style.description.toLowerCase().includes(lowerQuery)
      const matchesKeywords = style.keywords.some(k => k.toLowerCase().includes(lowerQuery))

      if (matchesName || matchesDescription || matchesKeywords) {
        results.push({ category, style })
      }
    }
  }

  return results
}

// Type for selected styles state
export interface SelectedStyles {
  venue?: string           // single
  delivery?: string        // single
  social: string[]         // multiple
  seasonal?: string        // single
  background?: string      // single
  technique: string[]      // multiple
}

// Default empty selection
export const emptySelection: SelectedStyles = {
  venue: undefined,
  delivery: undefined,
  social: [],
  seasonal: undefined,
  background: undefined,
  technique: [],
}

// Get selected count
export function getSelectedCount(selection: SelectedStyles): number {
  let count = 0
  if (selection.venue) count++
  if (selection.delivery) count++
  if (selection.seasonal) count++
  if (selection.background) count++
  count += selection.social.length
  count += selection.technique.length
  return count
}

// Convert selection to array of style IDs for API
export function selectionToStyleIds(selection: SelectedStyles): string[] {
  const ids: string[] = []
  if (selection.venue) ids.push(selection.venue)
  if (selection.delivery) ids.push(selection.delivery)
  if (selection.seasonal) ids.push(selection.seasonal)
  if (selection.background) ids.push(selection.background)
  ids.push(...selection.social)
  ids.push(...selection.technique)
  return ids
}

// Get style by ID
export function getStyleById(styleId: string): { category: StyleCategory; style: Style } | null {
  for (const category of styleCategories) {
    const style = category.styles.find(s => s.id === styleId)
    if (style) {
      return { category, style }
    }
  }
  return null
}
