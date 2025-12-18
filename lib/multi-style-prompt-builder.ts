/**
 * Multi-Style Prompt Builder
 *
 * Intelligently combines multiple style selections into a cohesive AI prompt.
 * Uses research-backed defaults for missing categories to ensure great results.
 *
 * Architecture:
 * - Base Layer: Venue Type (defines overall aesthetic)
 * - Platform Layer: Delivery/Social optimization
 * - Modifier Layers: Seasonal, Background, Technique
 *
 * Priority order (most to least important):
 * 1. Venue Type - Sets the foundational style
 * 2. Delivery Platform - Platform-specific requirements
 * 3. Social Platform - Format and aesthetic requirements
 * 4. Seasonal Theme - Overlay of festive elements
 * 5. Background Style - Surface and backdrop preferences
 * 6. Photography Technique - Technical approach
 */

import { stylePrompts, defaultPrompt, getPlatformConfig } from './style-prompts'
import { styleCategories, type SelectedStyles } from './styles-data'

// ═══════════════════════════════════════════════════════════════════════════════
// INTELLIGENT DEFAULTS
// Research-backed fallbacks when users don't select certain categories
// ═══════════════════════════════════════════════════════════════════════════════

const intelligentDefaults = {
  // If no venue selected, use casual dining as most versatile
  venue: {
    fallbackId: 'casual-dining',
    fallbackPrompt: `
VENUE AESTHETIC (Default - Casual Dining):
Warm, inviting restaurant atmosphere. Approachable and appetizing presentation.
Natural portions that showcase value. Comfortable, friendly visual tone.
Works well for most food types and audiences.
`
  },

  // If no delivery platform, use universal delivery optimization
  delivery: {
    fallbackId: null,  // Optional - no fallback needed
    fallbackPrompt: null
  },

  // If no social platform, optimize for general digital use
  social: {
    fallbackId: null,  // Optional
    fallbackPrompt: null
  },

  // If no seasonal theme, none needed
  seasonal: {
    fallbackId: null,
    fallbackPrompt: null
  },

  // If no background specified, use natural/contextual
  background: {
    fallbackId: null,
    fallbackPrompt: `
BACKGROUND (Default - Natural Context):
Use appropriate background based on the food type.
For Asian dishes: wood or dark surfaces work well.
For Western dishes: marble or light surfaces complement.
For desserts: bright, clean backgrounds preferred.
`
  },

  // If no technique specified, use professional best practices
  technique: {
    fallbackId: null,
    fallbackPrompt: `
PHOTOGRAPHY TECHNIQUE (Default - Best Practices):
Use the most appropriate angle for the dish:
- Overhead for flat items (pizza, salads, flat noodles)
- 45-degree for items with height (burgers, cakes, drinks)
- Eye-level for layered items (sandwiches, parfaits)
Natural-looking lighting that enhances without over-processing.
Sharp focus on hero elements with appropriate depth of field.
`
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// STYLE LOOKUP HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function getStyleName(categoryId: string, styleId: string): string {
  const category = styleCategories.find(c => c.id === categoryId)
  if (!category) return styleId
  const style = category.styles.find(s => s.id === styleId)
  return style?.name || styleId
}

function getCategoryName(categoryId: string): string {
  const category = styleCategories.find(c => c.id === categoryId)
  return category?.name || categoryId
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROMPT SECTION BUILDERS
// Each function builds one layer of the composite prompt
// ═══════════════════════════════════════════════════════════════════════════════

function buildVenueSection(venueId: string | undefined): string {
  if (venueId && stylePrompts[venueId]) {
    const venueName = getStyleName('venue', venueId)
    return `
═══════════════════════════════════════════════════════════════════════════════
VENUE TYPE: ${venueName.toUpperCase()}
═══════════════════════════════════════════════════════════════════════════════
${stylePrompts[venueId]}
`
  }
  return `
═══════════════════════════════════════════════════════════════════════════════
VENUE TYPE: VERSATILE (Default)
═══════════════════════════════════════════════════════════════════════════════
${intelligentDefaults.venue.fallbackPrompt}
`
}

function buildDeliverySection(deliveryId: string | undefined): string {
  if (!deliveryId) return ''

  if (stylePrompts[deliveryId]) {
    const deliveryName = getStyleName('delivery', deliveryId)
    const platformConfig = getPlatformConfig(deliveryId)
    return `

═══════════════════════════════════════════════════════════════════════════════
DELIVERY PLATFORM OPTIMIZATION: ${deliveryName.toUpperCase()}
═══════════════════════════════════════════════════════════════════════════════
${stylePrompts[deliveryId]}

PLATFORM SPECS:
- Aspect Ratio: ${platformConfig.aspectRatio}
- Resolution: ${platformConfig.imageSize}
- Requirements: ${platformConfig.platformRequirements || 'Standard delivery format'}
`
  }
  return ''
}

function buildSocialSection(socialIds: string[]): string {
  if (!socialIds || socialIds.length === 0) return ''

  const sections = socialIds
    .filter(id => stylePrompts[id])
    .map(id => {
      const name = getStyleName('social', id)
      const config = getPlatformConfig(id)
      return `
• ${name.toUpperCase()}:
  ${stylePrompts[id]}
  Format: ${config.aspectRatio} | ${config.imageSize}
`
    })

  if (sections.length === 0) return ''

  return `

═══════════════════════════════════════════════════════════════════════════════
SOCIAL MEDIA OPTIMIZATION (${socialIds.length} platforms)
═══════════════════════════════════════════════════════════════════════════════
Apply styling that works across these platforms:
${sections.join('\n')}
`
}

function buildSeasonalSection(seasonalId: string | undefined): string {
  if (!seasonalId) return ''

  // Map our new style IDs to the existing prompt keys
  const promptMap: Record<string, string> = {
    'christmas': 'Christmas festive photography. Warm cozy atmosphere with red and green accents. Holiday bokeh lights, pine branches, cinnamon sticks as props. Gift-wrapped presentation. Winter comfort food styling.',
    'chinese-new-year': 'Chinese New Year prosperity photography. Rich red and gold color scheme symbolizing luck and wealth. Mandarin oranges, red envelopes, lanterns as props. Reunion dinner abundance. Auspicious presentation with lucky symbols.',
    'valentines': 'Valentine\'s Day romantic photography. Pink and red color palette with heart motifs. Rose petals, chocolates, champagne styling. Intimate couple-dining atmosphere. Love and indulgence visual messaging.',
    'hari-raya': 'Hari Raya Aidilfitri photography. Elegant green and gold color scheme. Ketupat, lemang, rendang presentation. Open house abundance styling. Family gathering warmth. Islamic geometric patterns.',
    'deepavali': 'Deepavali festival of lights photography. Vibrant jewel-tone colors - orange, purple, gold. Diyas (oil lamps), rangoli patterns, flower garlands. Festive sweets and savories presentation. Joyful celebration atmosphere.',
    'mid-autumn': 'Mid-Autumn Festival photography. Mooncakes as hero with elegant presentation. Lanterns, lotus seeds, pomelo as props. Full moon aesthetic. Traditional Chinese tea pairing. Nostalgic family reunion mood.',
  }

  const prompt = promptMap[seasonalId]
  if (!prompt) return ''

  const name = getStyleName('seasonal', seasonalId)
  return `

═══════════════════════════════════════════════════════════════════════════════
SEASONAL THEME: ${name.toUpperCase()}
═══════════════════════════════════════════════════════════════════════════════
${prompt}

IMPORTANT: Apply seasonal elements as accents and styling, but keep the ORIGINAL FOOD as the hero.
Do not replace the food - enhance the presentation with seasonal props and color grading.
`
}

function buildBackgroundSection(backgroundId: string | undefined): string {
  if (!backgroundId) {
    return `

───────────────────────────────────────────────────────────────────────────────
BACKGROUND: AUTO-SELECT
───────────────────────────────────────────────────────────────────────────────
${intelligentDefaults.background.fallbackPrompt}
`
  }

  // Map new IDs to existing prompts
  const idMap: Record<string, string> = {
    'minimal-white': 'minimal',
    'rustic-wood': 'rustic',
    'marble': 'marble',
    'dark-moody': 'dark-moody',
    'bright-airy': 'bright-airy',
    'tropical': 'tropical',
    'concrete': 'concrete',
    'botanical': 'botanical',
  }

  const promptKey = idMap[backgroundId] || backgroundId
  if (stylePrompts[promptKey]) {
    const name = getStyleName('background', backgroundId)
    return `

───────────────────────────────────────────────────────────────────────────────
BACKGROUND STYLE: ${name.toUpperCase()}
───────────────────────────────────────────────────────────────────────────────
${stylePrompts[promptKey]}
`
  }
  return ''
}

function buildTechniqueSection(techniqueIds: string[]): string {
  if (!techniqueIds || techniqueIds.length === 0) {
    return `

───────────────────────────────────────────────────────────────────────────────
PHOTOGRAPHY TECHNIQUE: AUTO-SELECT
───────────────────────────────────────────────────────────────────────────────
${intelligentDefaults.technique.fallbackPrompt}
`
  }

  // Map new IDs to existing prompts
  const idMap: Record<string, string> = {
    'flat-lay': 'overhead',
    'natural-light': 'natural-light',
    'neon-night': 'neon',
    'vintage': 'vintage',
    'hdr': 'hdr',
    'bokeh': 'bokeh',
    'macro': 'hdr', // Use HDR for macro detail
  }

  const sections = techniqueIds
    .map(id => {
      const promptKey = idMap[id] || id
      const name = getStyleName('technique', id)
      if (stylePrompts[promptKey]) {
        return `
• ${name.toUpperCase()}:
  ${stylePrompts[promptKey]}
`
      }
      return null
    })
    .filter(Boolean)

  if (sections.length === 0) return ''

  return `

───────────────────────────────────────────────────────────────────────────────
PHOTOGRAPHY TECHNIQUES (${techniqueIds.length} selected)
───────────────────────────────────────────────────────────────────────────────
Combine these techniques in the enhancement:
${sections.join('\n')}
`
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT: BUILD MULTI-STYLE PROMPT
// ═══════════════════════════════════════════════════════════════════════════════

export interface MultiStylePromptOptions {
  selection: SelectedStyles
  aspectRatio?: string
  customInstructions?: string
}

export function buildMultiStylePrompt(options: MultiStylePromptOptions): {
  prompt: string
  primaryPlatform: string
  selectedCount: number
  debug: {
    venue: string | null
    delivery: string | null
    social: string[]
    seasonal: string | null
    background: string | null
    technique: string[]
  }
} {
  const { selection, aspectRatio, customInstructions } = options

  // Count selections
  let selectedCount = 0
  if (selection.venue) selectedCount++
  if (selection.delivery) selectedCount++
  if (selection.seasonal) selectedCount++
  if (selection.background) selectedCount++
  selectedCount += selection.social?.length || 0
  selectedCount += selection.technique?.length || 0

  // Determine primary platform for config (delivery takes priority, then first social)
  const primaryPlatform = selection.delivery || selection.social?.[0] || 'instagram'

  // Build the composite prompt
  const sections: string[] = []

  // Header
  sections.push(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                    ZAZZLES AI FOOD PHOTOGRAPHY ENHANCEMENT                    ║
╚═══════════════════════════════════════════════════════════════════════════════╝

You are a professional food photography retoucher with expertise in commercial food styling.
Your task is to ENHANCE the provided food photo while PRESERVING the original food content.

ABSOLUTE RULES:
1. KEEP the exact same food items - do not replace or change what is being photographed
2. KEEP the same plates, bowls, and serving dishes
3. KEEP the same composition and arrangement
4. ONLY enhance: lighting, colors, textures, background styling, and overall polish
5. Make the food look MORE appetizing, not different
`)

  // Add venue section (always included, with fallback)
  sections.push(buildVenueSection(selection.venue))

  // Add delivery platform if selected
  sections.push(buildDeliverySection(selection.delivery))

  // Add social platforms if selected
  sections.push(buildSocialSection(selection.social || []))

  // Add seasonal theme if selected
  sections.push(buildSeasonalSection(selection.seasonal))

  // Add background style
  sections.push(buildBackgroundSection(selection.background))

  // Add photography techniques
  sections.push(buildTechniqueSection(selection.technique || []))

  // Add aspect ratio if specified
  if (aspectRatio) {
    sections.push(`

───────────────────────────────────────────────────────────────────────────────
OUTPUT FORMAT
───────────────────────────────────────────────────────────────────────────────
Aspect Ratio: ${aspectRatio}
Optimize composition for this format while maintaining food as the hero.
`)
  }

  // Add custom instructions if provided
  if (customInstructions) {
    sections.push(`

───────────────────────────────────────────────────────────────────────────────
CUSTOM INSTRUCTIONS
───────────────────────────────────────────────────────────────────────────────
${customInstructions}
`)
  }

  // Add footer with verification checklist
  sections.push(`

═══════════════════════════════════════════════════════════════════════════════
VERIFICATION CHECKLIST
═══════════════════════════════════════════════════════════════════════════════
Before outputting, verify:
✓ Same food items as input image
✓ Same plates/dishes as input image
✓ Same arrangement as input image
✓ Enhanced lighting and colors
✓ Professional, appetizing appearance
✓ No artificial or fake-looking elements

After enhancement, provide 3 tips in format:
SUGGESTIONS: [tip1] | [tip2] | [tip3]
`)

  const prompt = sections.filter(Boolean).join('')

  return {
    prompt,
    primaryPlatform,
    selectedCount,
    debug: {
      venue: selection.venue || null,
      delivery: selection.delivery || null,
      social: selection.social || [],
      seasonal: selection.seasonal || null,
      background: selection.background || null,
      technique: selection.technique || [],
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// LEGACY COMPATIBILITY
// Convert comma-separated style IDs to SelectedStyles format
// ═══════════════════════════════════════════════════════════════════════════════

export function parseStyleIds(styleIdsString: string): SelectedStyles {
  const ids = styleIdsString.split(',').map(id => id.trim()).filter(Boolean)

  const selection: SelectedStyles = {
    venue: undefined,
    delivery: undefined,
    social: [],
    seasonal: undefined,
    background: undefined,
    technique: [],
  }

  for (const id of ids) {
    // Try to find which category this ID belongs to
    for (const category of styleCategories) {
      const style = category.styles.find(s => s.id === id)
      if (style) {
        if (category.selectionType === 'single') {
          // Handle single-select categories
          const catId = category.id as keyof SelectedStyles
          if (catId === 'venue' || catId === 'delivery' || catId === 'seasonal' || catId === 'background') {
            selection[catId] = id
          }
        } else {
          // Handle multi-select categories
          const key = category.id as 'social' | 'technique'
          if (!selection[key].includes(id)) {
            selection[key].push(id)
          }
        }
        break
      }
    }
  }

  return selection
}

// ═══════════════════════════════════════════════════════════════════════════════
// SIMPLE API FOR ENHANCE ROUTE
// ═══════════════════════════════════════════════════════════════════════════════

export function getMultiStylePrompt(
  stylePreset: string,
  styleIdsJson?: string,
  aspectRatio?: string
): string {
  // If styleIds JSON is provided, parse it
  if (styleIdsJson) {
    try {
      const styleIds = JSON.parse(styleIdsJson) as string[]
      const selection = parseStyleIds(styleIds.join(','))
      const result = buildMultiStylePrompt({ selection, aspectRatio })
      console.log('[MultiStyle] Built prompt for', result.selectedCount, 'styles')
      console.log('[MultiStyle] Selections:', JSON.stringify(result.debug))
      return result.prompt
    } catch {
      console.warn('[MultiStyle] Failed to parse styleIds JSON, falling back to stylePreset')
    }
  }

  // Fallback: Parse comma-separated stylePreset
  if (stylePreset && stylePreset.includes(',')) {
    const selection = parseStyleIds(stylePreset)
    const result = buildMultiStylePrompt({ selection, aspectRatio })
    console.log('[MultiStyle] Built prompt from comma-separated IDs:', result.selectedCount, 'styles')
    return result.prompt
  }

  // Ultimate fallback: Single style or template
  if (stylePreset?.startsWith('template-')) {
    // Template-based enhancement - use generic prompt
    return defaultPrompt
  }

  // Single style - use original style prompt
  if (stylePreset && stylePrompts[stylePreset]) {
    return stylePrompts[stylePreset]
  }

  return defaultPrompt
}
