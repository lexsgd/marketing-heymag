/**
 * Simplified Style System for FoodSnap AI
 *
 * Designed for F&B owners who aren't photographers.
 * 3 simple categories + 1 optional seasonal theme.
 *
 * Reference: /docs/FOOD_PHOTOGRAPHY_IMPLEMENTATION.md
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

export interface SimpleStyle {
  id: string
  name: string
  emoji: string
  description: string
  examples?: string[] // Platform examples for formats
}

export interface SimpleCategory {
  id: string
  name: string
  question: string // User-friendly question
  required: boolean
  expanded: boolean // Whether to show expanded by default
  styles: SimpleStyle[]
}

// ═══════════════════════════════════════════════════════════════════════════════
// CATEGORY 1: BUSINESS TYPE (Required)
// ═══════════════════════════════════════════════════════════════════════════════

export const businessTypes: SimpleStyle[] = [
  {
    id: 'restaurant',
    name: 'Restaurant',
    emoji: '🍽️',
    description: 'Casual to fine dining, plated dishes',
  },
  {
    id: 'cafe',
    name: 'Cafe & Bakery',
    emoji: '☕',
    description: 'Coffee, pastries, brunch spots',
  },
  {
    id: 'hawker',
    name: 'Hawker & Street Food',
    emoji: '🍜',
    description: 'Hawker centres, kopitiams, street vendors',
  },
  {
    id: 'fastfood',
    name: 'Fast Food',
    emoji: '🍔',
    description: 'Burgers, fried chicken, quick service',
  },
  {
    id: 'dessert',
    name: 'Desserts & Sweets',
    emoji: '🍰',
    description: 'Cakes, ice cream, sweet treats',
  },
]

// ═══════════════════════════════════════════════════════════════════════════════
// CATEGORY 2: FORMAT / ASPECT RATIO (Optional but recommended)
// ═══════════════════════════════════════════════════════════════════════════════

export interface FormatStyle extends SimpleStyle {
  aspectRatio: '1:1' | '4:5' | '9:16' | '16:9' | '4:3'
  width: number
  height: number
}

export const formats: FormatStyle[] = [
  {
    id: 'square',
    name: 'Square',
    emoji: '⬜',
    description: '1:1 - Most versatile format',
    aspectRatio: '1:1',
    width: 1024,
    height: 1024,
    examples: ['GrabFood', 'Deliveroo', 'GoFood', 'ShopeeFood', 'Menu', 'WeChat'],
  },
  {
    id: 'portrait',
    name: 'Portrait',
    emoji: '📱',
    description: '4:5 - Tall rectangle for feeds',
    aspectRatio: '4:5',
    width: 1080,
    height: 1350,
    examples: ['Instagram Feed', 'Xiaohongshu', 'Pinterest'],
  },
  {
    id: 'vertical',
    name: 'Vertical',
    emoji: '📲',
    description: '9:16 - Full screen vertical',
    aspectRatio: '9:16',
    width: 1080,
    height: 1920,
    examples: ['Instagram Stories', 'TikTok', 'Reels', 'YouTube Shorts'],
  },
  {
    id: 'landscape',
    name: 'Landscape',
    emoji: '🖼️',
    description: '16:9 - Wide horizontal',
    aspectRatio: '16:9',
    width: 1920,
    height: 1080,
    examples: ['Facebook', 'YouTube', 'Website banners', 'Presentations'],
  },
  {
    id: 'foodpanda',
    name: 'Foodpanda',
    emoji: '🐼',
    description: '4:3 - High resolution required',
    aspectRatio: '4:3',
    width: 4000,
    height: 3000,
    examples: ['Foodpanda menu listings'],
  },
]

// ═══════════════════════════════════════════════════════════════════════════════
// CATEGORY 3: MOOD / LOOK (Optional - has smart defaults)
// ═══════════════════════════════════════════════════════════════════════════════

export const moods: SimpleStyle[] = [
  {
    id: 'auto',
    name: 'Auto',
    emoji: '✨',
    description: 'Let AI choose the best look (Recommended)',
  },
  {
    id: 'bright',
    name: 'Bright & Fresh',
    emoji: '☀️',
    description: 'Clean, cheerful, high-energy',
  },
  {
    id: 'warm',
    name: 'Warm & Cozy',
    emoji: '🔥',
    description: 'Inviting, comfortable, homestyle',
  },
  {
    id: 'elegant',
    name: 'Dark & Elegant',
    emoji: '🌙',
    description: 'Sophisticated, dramatic, premium',
  },
  {
    id: 'natural',
    name: 'Natural Light',
    emoji: '🪟',
    description: 'Authentic, soft, organic feel',
  },
]

// ═══════════════════════════════════════════════════════════════════════════════
// CATEGORY 4: SEASONAL THEMES (Optional - collapsed by default)
// ═══════════════════════════════════════════════════════════════════════════════

export const seasonalThemes: SimpleStyle[] = [
  {
    id: 'none',
    name: 'No Theme',
    emoji: '➖',
    description: 'Keep it simple, no seasonal styling',
  },
  {
    id: 'christmas',
    name: 'Christmas',
    emoji: '🎄',
    description: 'Festive red & green, cozy winter vibes',
  },
  {
    id: 'cny',
    name: 'Chinese New Year',
    emoji: '🧧',
    description: 'Prosperous red & gold styling',
  },
  {
    id: 'valentines',
    name: "Valentine's Day",
    emoji: '💝',
    description: 'Romantic pink & red hearts',
  },
  {
    id: 'hari-raya',
    name: 'Hari Raya',
    emoji: '🌙',
    description: 'Elegant green & gold celebration',
  },
  {
    id: 'deepavali',
    name: 'Deepavali',
    emoji: '🪔',
    description: 'Vibrant festival of lights',
  },
  {
    id: 'mid-autumn',
    name: 'Mid-Autumn',
    emoji: '🥮',
    description: 'Mooncake season elegance',
  },
]

// ═══════════════════════════════════════════════════════════════════════════════
// CATEGORY DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

export const simpleCategories: SimpleCategory[] = [
  {
    id: 'businessType',
    name: 'Business Type',
    question: 'What type of food?',
    required: true,
    expanded: true,
    styles: businessTypes,
  },
  {
    id: 'format',
    name: 'Format',
    question: 'What format do you need?',
    required: false,
    expanded: true,
    styles: formats,
  },
  {
    id: 'mood',
    name: 'Mood',
    question: 'What mood/look?',
    required: false,
    expanded: false, // Collapsed - uses smart defaults
    styles: moods,
  },
  {
    id: 'seasonal',
    name: 'Seasonal',
    question: 'Add a seasonal theme?',
    required: false,
    expanded: false, // Collapsed by default
    styles: seasonalThemes,
  },
]

// ═══════════════════════════════════════════════════════════════════════════════
// SELECTION STATE
// ═══════════════════════════════════════════════════════════════════════════════

export interface SimpleSelection {
  businessType: string | null
  format: string | null
  mood: string | null
  seasonal: string | null
}

export const emptySimpleSelection: SimpleSelection = {
  businessType: null,
  format: null,
  mood: null,
  seasonal: null,
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get a style by ID from any category
 */
export function getSimpleStyleById(styleId: string): SimpleStyle | null {
  const allStyles = [
    ...businessTypes,
    ...formats,
    ...moods,
    ...seasonalThemes,
  ]
  return allStyles.find((s) => s.id === styleId) || null
}

/**
 * Get format configuration by ID
 */
export function getFormatConfig(formatId: string | null): FormatStyle {
  const format = formats.find((f) => f.id === formatId)
  // Default to square if not found
  return format || formats[0]
}

/**
 * Count non-null selections
 */
export function countSelections(selection: SimpleSelection): number {
  let count = 0
  if (selection.businessType) count++
  if (selection.format) count++
  if (selection.mood && selection.mood !== 'auto') count++
  if (selection.seasonal && selection.seasonal !== 'none') count++
  return count
}

/**
 * Check if selection is valid (has required fields)
 */
export function isSelectionValid(selection: SimpleSelection): boolean {
  return selection.businessType !== null
}

/**
 * Get human-readable summary of selection
 */
export function getSelectionSummary(selection: SimpleSelection): string {
  const parts: string[] = []

  if (selection.businessType) {
    const style = businessTypes.find((s) => s.id === selection.businessType)
    if (style) parts.push(`${style.emoji} ${style.name}`)
  }

  if (selection.format) {
    const format = formats.find((f) => f.id === selection.format)
    if (format) parts.push(`${format.aspectRatio}`)
  }

  if (selection.mood && selection.mood !== 'auto') {
    const mood = moods.find((m) => m.id === selection.mood)
    if (mood) parts.push(mood.name)
  }

  if (selection.seasonal && selection.seasonal !== 'none') {
    const seasonal = seasonalThemes.find((s) => s.id === selection.seasonal)
    if (seasonal) parts.push(`${seasonal.emoji} ${seasonal.name}`)
  }

  return parts.join(' • ') || 'No selections'
}

// ═══════════════════════════════════════════════════════════════════════════════
// LEGACY MAPPING (for backward compatibility)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Map old style IDs to new simplified IDs
 */
export const legacyIdMapping: Record<string, { category: keyof SimpleSelection; newId: string }> = {
  // Venue types → businessType
  'fine-dining': { category: 'businessType', newId: 'restaurant' },
  'casual-dining': { category: 'businessType', newId: 'restaurant' },
  'cafe': { category: 'businessType', newId: 'cafe' },
  'fast-food': { category: 'businessType', newId: 'fastfood' },
  'street-food': { category: 'businessType', newId: 'hawker' },
  'hawker': { category: 'businessType', newId: 'hawker' },
  'kopitiam': { category: 'businessType', newId: 'hawker' },
  'dessert': { category: 'businessType', newId: 'dessert' },

  // Delivery/Social platforms → format
  'grab': { category: 'format', newId: 'square' },
  'deliveroo': { category: 'format', newId: 'square' },
  'gojek': { category: 'format', newId: 'square' },
  'shopee': { category: 'format', newId: 'square' },
  'generic-delivery': { category: 'format', newId: 'square' },
  'foodpanda': { category: 'format', newId: 'foodpanda' },
  'instagram-feed': { category: 'format', newId: 'portrait' },
  'instagram-stories': { category: 'format', newId: 'vertical' },
  'tiktok': { category: 'format', newId: 'vertical' },
  'facebook': { category: 'format', newId: 'landscape' },
  'xiaohongshu': { category: 'format', newId: 'portrait' },
  'wechat': { category: 'format', newId: 'square' },
  'pinterest': { category: 'format', newId: 'portrait' },

  // Background styles → mood
  'minimal-white': { category: 'mood', newId: 'bright' },
  'bright-airy': { category: 'mood', newId: 'bright' },
  'rustic-wood': { category: 'mood', newId: 'warm' },
  'dark-moody': { category: 'mood', newId: 'elegant' },
  'marble': { category: 'mood', newId: 'elegant' },
  'tropical': { category: 'mood', newId: 'bright' },
  'concrete': { category: 'mood', newId: 'natural' },
  'botanical': { category: 'mood', newId: 'natural' },

  // Seasonal → seasonal
  'christmas': { category: 'seasonal', newId: 'christmas' },
  'chinese-new-year': { category: 'seasonal', newId: 'cny' },
  'valentines': { category: 'seasonal', newId: 'valentines' },
  'hari-raya': { category: 'seasonal', newId: 'hari-raya' },
  'deepavali': { category: 'seasonal', newId: 'deepavali' },
  'mid-autumn': { category: 'seasonal', newId: 'mid-autumn' },
}

/**
 * Convert legacy style IDs to new SimpleSelection
 */
export function convertLegacySelection(legacyIds: string[]): SimpleSelection {
  const selection: SimpleSelection = { ...emptySimpleSelection }

  for (const id of legacyIds) {
    const mapping = legacyIdMapping[id]
    if (mapping) {
      selection[mapping.category] = mapping.newId
    }
  }

  return selection
}
