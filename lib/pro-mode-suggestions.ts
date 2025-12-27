/**
 * Pro Mode Context-Aware Suggestions
 *
 * Provides intelligent suggestions for Pro Mode based on the user's
 * business type selection. Different food categories have different
 * typical props, styling, and photography needs.
 *
 * Reference: /docs/PRO_MODE_IMPLEMENTATION_PLAN.md
 */

// ═══════════════════════════════════════════════════════════════════════════════
// PROPS & STYLING SUGGESTIONS
// Organized by business type for context-aware recommendations
// ═══════════════════════════════════════════════════════════════════════════════

export const propsAndStylingSuggestions: Record<string, string[]> = {
  restaurant: [
    'elegant utensils',
    'wine glass',
    'linen napkin',
    'candle',
    'bread basket',
    'salt & pepper',
    'water glass',
    'menu card edge',
  ],

  cafe: [
    'latte art cup',
    'pastry fork',
    'newspaper edge',
    'small flowers',
    'coffee beans',
    'sugar cubes',
    'croissant',
    'vintage spoon',
  ],

  hawker: [
    'chopsticks',
    'sambal dish',
    'lime wedge',
    'tissue packet',
    'chili padi',
    'soy sauce',
    'beer bottle',
    'melamine spoon',
  ],

  fastfood: [
    'branded cup',
    'fries container',
    'sauce packets',
    'paper tray',
    'napkins',
    'cheese pull',
    'drink straw',
    'branded wrapper',
  ],

  dessert: [
    'dessert spoon',
    'mint leaf',
    'chocolate drizzle',
    'fresh berries',
    'powdered sugar',
    'edible flowers',
    'ice cream scoop',
    'wafer stick',
  ],
}

// ═══════════════════════════════════════════════════════════════════════════════
// PHOTOGRAPHY NOTES SUGGESTIONS
// Universal suggestions for camera/lighting adjustments
// ═══════════════════════════════════════════════════════════════════════════════

export const photographyNotesSuggestions: string[] = [
  '45-degree angle',
  'overhead flat lay',
  'eye-level shot',
  'shallow depth of field',
  'soft shadows',
  'dramatic side light',
  'bokeh background',
  'natural window light',
  'high contrast',
  'soft diffused light',
  'golden hour warmth',
  'studio lighting',
]

// ═══════════════════════════════════════════════════════════════════════════════
// COMPOSITION NOTES SUGGESTIONS
// Suggestions for framing and layout
// ═══════════════════════════════════════════════════════════════════════════════

export const compositionNotesSuggestions: string[] = [
  'leave space for text',
  'center the dish',
  'rule of thirds',
  'negative space on left',
  'negative space on right',
  'tight crop on food',
  'show full table setting',
  'hero angle',
  'diagonal composition',
  'symmetrical layout',
]

// ═══════════════════════════════════════════════════════════════════════════════
// BACKGROUND SUGGESTIONS
// Context-aware background surface recommendations
// ═══════════════════════════════════════════════════════════════════════════════

export const backgroundSuggestions: Record<string, string[]> = {
  restaurant: [
    'white tablecloth',
    'dark wood table',
    'marble surface',
    'slate plate',
    'black background',
    'warm wood',
  ],

  cafe: [
    'reclaimed wood',
    'marble counter',
    'tiled surface',
    'light wood',
    'concrete texture',
    'pastel surface',
  ],

  hawker: [
    'formica table',
    'stainless steel',
    'kopitiam table',
    'newspaper',
    'melamine tray',
    'plastic table',
  ],

  fastfood: [
    'branded tray',
    'paper liner',
    'clean counter',
    'red background',
    'white surface',
    'gradient background',
  ],

  dessert: [
    'pastel surface',
    'marble slab',
    'cake stand',
    'doily',
    'pink background',
    'glass surface',
  ],
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get props & styling suggestions based on business type
 * Falls back to restaurant if business type not found
 */
export function getPropsAndStylingSuggestions(businessType: string | null): string[] {
  return propsAndStylingSuggestions[businessType || 'restaurant'] ||
         propsAndStylingSuggestions.restaurant
}

/**
 * Get photography notes suggestions (universal)
 */
export function getPhotographyNotesSuggestions(): string[] {
  return photographyNotesSuggestions
}

/**
 * Get composition notes suggestions (universal)
 */
export function getCompositionNotesSuggestions(): string[] {
  return compositionNotesSuggestions
}

/**
 * Get background suggestions based on business type
 * Falls back to restaurant if business type not found
 */
export function getBackgroundSuggestions(businessType: string | null): string[] {
  return backgroundSuggestions[businessType || 'restaurant'] ||
         backgroundSuggestions.restaurant
}

/**
 * Get all suggestions for a section based on business type and section name
 * This is the main entry point for UI components
 */
export function getSuggestionsForSection(
  businessType: string | null,
  section: 'propsAndStyling' | 'photographyNotes' | 'compositionNotes' | 'background'
): string[] {
  switch (section) {
    case 'propsAndStyling':
      return getPropsAndStylingSuggestions(businessType)
    case 'photographyNotes':
      return getPhotographyNotesSuggestions()
    case 'compositionNotes':
      return getCompositionNotesSuggestions()
    case 'background':
      return getBackgroundSuggestions(businessType)
    default:
      return []
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SIMPLE MODE SUGGESTIONS (backward compatible)
// Generic suggestions for Simple Mode custom prompt
// ═══════════════════════════════════════════════════════════════════════════════

export const simpleModeDefaultSuggestions: string[] = [
  'Make it look appetizing and professional',
  'Add warm, cozy lighting',
  'Make it Instagram-worthy',
  'Dark, moody restaurant feel',
  'Fresh and bright for delivery app',
]

/**
 * Get context-aware suggestions for Simple Mode based on business type
 */
export function getSimpleModeSuggestions(businessType: string | null): string[] {
  const baseType = businessType || 'restaurant'

  const contextualSuggestions: Record<string, string[]> = {
    restaurant: [
      'Add elegant utensils and wine glass on the side',
      'Dark moody lighting with candlelit ambiance',
      'Overhead angle showing full plate presentation',
      'White tablecloth background with soft shadows',
      'Fine dining magazine style',
    ],
    cafe: [
      'Soft window light with dreamy bokeh',
      'Add latte art cup beside the dish',
      'Lifestyle aesthetic with newspaper prop',
      'Bright and airy cafe atmosphere',
      'Cozy brunch vibes',
    ],
    hawker: [
      'Authentic street food atmosphere',
      'Add chopsticks and sambal dish',
      'Warm bustling hawker center feel',
      'Show generous portion size',
      'Local kopitiam aesthetic',
    ],
    fastfood: [
      'Commercial advertising style',
      'Show cheese pull or sauce drip',
      'Bold punchy colors',
      'Clean white background',
      'Hero shot with fries',
    ],
    dessert: [
      'Dreamy soft focus background',
      'Add fresh berries and mint garnish',
      'Pastel aesthetic with chocolate drizzle',
      'Instagram dessert style',
      'Bright and cheerful lighting',
    ],
  }

  return contextualSuggestions[baseType] || simpleModeDefaultSuggestions
}
