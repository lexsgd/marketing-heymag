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
  /** Detailed explanation for users who aren't photographers */
  detailedHelp?: string
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
    detailedHelp: 'AI will emphasize plate presentation and garnishes. Works best for dishes that are artfully arranged on plates. The lighting will highlight textures and create depth.',
  },
  {
    id: 'cafe',
    name: 'Cafe & Bakery',
    emoji: '☕',
    description: 'Coffee, pastries, brunch spots',
    detailedHelp: 'AI will add soft, dreamy lighting with warm tones. Perfect for lattes, croissants, cakes, and brunch items. Creates an Instagram-worthy, inviting aesthetic.',
  },
  {
    id: 'hawker',
    name: 'Hawker & Street Food',
    emoji: '🍜',
    description: 'Hawker centres, kopitiams, street vendors',
    detailedHelp: 'AI will capture the authentic, hearty appeal of local food. Emphasizes generous portions and rich colors. Makes dishes look appetizing without being overly polished.',
  },
  {
    id: 'fastfood',
    name: 'Fast Food',
    emoji: '🍔',
    description: 'Burgers, fried chicken, quick service',
    detailedHelp: 'AI will make food look fresh and craveable. Highlights crispy textures, melty cheese, and juicy meats. Uses bold colors and punchy lighting typical of fast food ads.',
  },
  {
    id: 'dessert',
    name: 'Desserts & Sweets',
    emoji: '🍰',
    description: 'Cakes, ice cream, sweet treats',
    detailedHelp: 'AI will enhance sweetness and indulgence. Perfect lighting to show glossy glazes, creamy textures, and vibrant colors. Makes desserts look irresistible.',
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
    detailedHelp: 'AI analyzes your food type and automatically selects the most appealing look. Best for most users - the AI is trained on millions of successful food photos.',
  },
  {
    id: 'bright',
    name: 'Bright & Fresh',
    emoji: '☀️',
    description: 'Clean, cheerful, high-energy',
    detailedHelp: 'Think "cafe in the morning sun". Uses white/light backgrounds, high brightness, and minimal shadows. Makes food look clean and healthy. Great for salads, smoothies, light dishes, and cafes.',
  },
  {
    id: 'warm',
    name: 'Warm & Cozy',
    emoji: '🔥',
    description: 'Inviting, comfortable, homestyle',
    detailedHelp: 'Think "grandma\'s kitchen". Uses wood textures, golden lighting, and earthy tones. Makes food look comforting and homemade. Perfect for soups, baked goods, comfort food, and family restaurants.',
  },
  {
    id: 'elegant',
    name: 'Dark & Elegant',
    emoji: '🌙',
    description: 'Sophisticated, dramatic, premium',
    detailedHelp: 'Think "fine dining magazine". Uses dark/black backgrounds with dramatic lighting that highlights the food. Creates contrast and luxury feel. Best for premium dishes, steaks, and upscale restaurants.',
  },
  {
    id: 'natural',
    name: 'Natural Light',
    emoji: '🪟',
    description: 'Authentic, soft, organic feel',
    detailedHelp: 'Think "by the window on a sunny day". Uses soft, diffused lighting that mimics natural sunlight. Keeps colors true-to-life. Perfect for organic food, farm-to-table, and health-focused brands.',
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
    detailedHelp: 'No seasonal decorations added. Use this for evergreen content that you can reuse year-round.',
  },
  {
    id: 'christmas',
    name: 'Christmas',
    emoji: '🎄',
    description: 'Festive red & green, cozy winter vibes',
    detailedHelp: 'AI adds Christmas elements like pine branches, ornaments, fairy lights, and red/green/gold accents. Creates a warm, festive atmosphere.',
  },
  {
    id: 'cny',
    name: 'Chinese New Year',
    emoji: '🧧',
    description: 'Prosperous red & gold styling',
    detailedHelp: 'AI adds auspicious elements like red lanterns, gold coins, cherry blossoms, and traditional Chinese patterns. Creates prosperity and celebration vibes.',
  },
  {
    id: 'valentines',
    name: "Valentine's Day",
    emoji: '💝',
    description: 'Romantic pink & red hearts',
    detailedHelp: 'AI adds romantic elements like hearts, roses, pink lighting, and soft bokeh effects. Perfect for couple-sized portions and romantic dining promotions.',
  },
  {
    id: 'hari-raya',
    name: 'Hari Raya',
    emoji: '🌙',
    description: 'Elegant green & gold celebration',
    detailedHelp: 'AI adds traditional Malay elements with green and gold colors, ketupat motifs, and elegant celebration styling. Perfect for Eid promotions.',
  },
  {
    id: 'deepavali',
    name: 'Deepavali',
    emoji: '🪔',
    description: 'Vibrant festival of lights',
    detailedHelp: 'AI adds diya lamps, rangoli patterns, and warm golden lighting. Uses vibrant jewel tones to celebrate the festival of lights.',
  },
  {
    id: 'mid-autumn',
    name: 'Mid-Autumn',
    emoji: '🥮',
    description: 'Mooncake season elegance',
    detailedHelp: 'AI adds moon motifs, lanterns, and elegant Chinese elements. Uses deep jewel tones and moonlight ambiance. Perfect for mooncake and tea promotions.',
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

// ═══════════════════════════════════════════════════════════════════════════════
// BACKGROUND CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

export type BackgroundMode = 'auto' | 'describe' | 'upload'

export interface BackgroundConfig {
  /** How the background should be handled */
  mode: BackgroundMode
  /** User's description for AI (only for 'describe' mode) */
  description?: string
  /** Uploaded background URL (only for 'upload' mode) */
  uploadedUrl?: string
  /** Whether to save this as default for future uploads */
  saveAsDefault?: boolean
}

export const defaultBackgroundConfig: BackgroundConfig = {
  mode: 'auto',
  description: undefined,
  uploadedUrl: undefined,
  saveAsDefault: false,
}

/** Mood recommendations based on background mode/description */
export const backgroundMoodRecommendations: Record<string, { mood: string; reason: string }> = {
  // Keywords that suggest bright mood
  'white': { mood: 'bright', reason: 'White backgrounds work best with bright, clean lighting' },
  'clean': { mood: 'bright', reason: 'Clean backgrounds pair well with bright, fresh styling' },
  'minimal': { mood: 'bright', reason: 'Minimalist backgrounds look best with bright lighting' },
  'light': { mood: 'bright', reason: 'Light backgrounds complement bright, airy styling' },

  // Keywords that suggest warm mood
  'wood': { mood: 'warm', reason: 'Wood backgrounds pair beautifully with warm, cozy lighting' },
  'rustic': { mood: 'warm', reason: 'Rustic backgrounds look best with warm, homestyle lighting' },
  'cozy': { mood: 'warm', reason: 'Cozy themes naturally pair with warm lighting' },
  'homestyle': { mood: 'warm', reason: 'Homestyle backgrounds work well with warm, inviting light' },

  // Keywords that suggest elegant mood
  'dark': { mood: 'elegant', reason: 'Dark backgrounds create dramatic, elegant contrast' },
  'black': { mood: 'elegant', reason: 'Black backgrounds look stunning with elegant, moody lighting' },
  'marble': { mood: 'elegant', reason: 'Marble backgrounds suit sophisticated, elegant styling' },
  'luxury': { mood: 'elegant', reason: 'Luxury themes pair with dark, elegant atmospheres' },
  'premium': { mood: 'elegant', reason: 'Premium branding looks best with elegant, dramatic lighting' },

  // Keywords that suggest natural mood
  'natural': { mood: 'natural', reason: 'Natural themes pair with soft, natural lighting' },
  'organic': { mood: 'natural', reason: 'Organic backgrounds work best with natural light styling' },
  'garden': { mood: 'natural', reason: 'Garden themes complement natural, outdoor lighting' },
  'outdoor': { mood: 'natural', reason: 'Outdoor settings look best with natural light' },
}

/**
 * Get mood recommendation based on background description
 */
export function getMoodRecommendationFromBackground(description: string): { mood: string; reason: string } | null {
  const lowerDesc = description.toLowerCase()

  for (const [keyword, recommendation] of Object.entries(backgroundMoodRecommendations)) {
    if (lowerDesc.includes(keyword)) {
      return recommendation
    }
  }

  return null
}

export const emptySimpleSelection: SimpleSelection = {
  businessType: null,
  format: null,
  mood: null,
  seasonal: null,
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRO MODE CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Pro Mode Configuration
 * Structured customization inputs for power users who want more control
 * over the AI enhancement process while still benefiting from smart defaults.
 *
 * Pro Mode is ADDITIVE - it adds structured instructions ON TOP of the
 * smart defaults, it doesn't replace them.
 */
export interface ProModeConfig {
  /** Whether Pro Mode is enabled (false = Simple Mode with single text blob) */
  enabled: boolean

  /** Props & Styling instructions
   * @example "Add chopsticks on the left, small soy sauce dish, scattered sesame seeds"
   * @maxLength 500
   */
  propsAndStyling?: string

  /** Photography adjustments to override or enhance defaults
   * @example "45-degree angle, shallow depth of field, soft side lighting"
   * @maxLength 300
   */
  photographyNotes?: string

  /** Additional composition notes
   * @example "Leave space on the right for text overlay"
   * @maxLength 200
   */
  compositionNotes?: string
}

/** Default Pro Mode configuration (disabled) */
export const defaultProModeConfig: ProModeConfig = {
  enabled: false,
  propsAndStyling: undefined,
  photographyNotes: undefined,
  compositionNotes: undefined,
}

/** Character limits for Pro Mode sections */
export const proModeCharLimits = {
  propsAndStyling: 500,
  photographyNotes: 300,
  compositionNotes: 200,
} as const

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
