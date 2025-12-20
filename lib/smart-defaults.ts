/**
 * Smart Defaults System for FoodSnap AI
 *
 * Automatically applies professional photography settings based on
 * minimal user input. A hawker owner who just selects "Hawker" should
 * get great results without understanding photography.
 *
 * Reference: /docs/FOOD_PHOTOGRAPHY_PROMPT_ELEMENTS.md
 */

import type { SimpleSelection } from './simplified-styles'
import { getFormatConfig } from './simplified-styles'

// ═══════════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

export interface PhotographyElements {
  // 8 Professional Elements from research
  lens: string
  aperture: string
  depthOfField: string
  angle: string
  lighting: string
  color: string
  style: string
  realism: string
}

export interface SmartDefaults extends PhotographyElements {
  // Additional context
  moodDefault: string
  backgroundHint: string
  propsHint: string
}

// ═══════════════════════════════════════════════════════════════════════════════
// BUSINESS TYPE DEFAULTS
// Each business type has optimized photography settings
// ═══════════════════════════════════════════════════════════════════════════════

export const businessTypeDefaults: Record<string, SmartDefaults> = {
  // ─────────────────────────────────────────────────────────────────────────────
  // RESTAURANT (Casual to Fine Dining)
  // ─────────────────────────────────────────────────────────────────────────────
  restaurant: {
    lens: '100mm macro lens',
    aperture: 'f/4',
    depthOfField: 'shallow depth of field, sharp focus on main subject with soft background blur',
    angle: '45-degree camera angle, three-quarter view showing depth and dimension',
    lighting: 'soft diffused natural light from the side, gentle shadows with bright highlights',
    color: 'natural color balance at 5000K, slightly warm tones, vibrant but natural saturation',
    style: 'contemporary professional food photography, clean modern aesthetic',
    realism: 'subtle fine film grain, natural optical vignette, authentic photographic texture',
    moodDefault: 'warm',
    backgroundHint: 'warm restaurant ambiance, wooden or neutral surfaces',
    propsHint: 'simple, elegant plating, minimal props',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // CAFE & BAKERY
  // ─────────────────────────────────────────────────────────────────────────────
  cafe: {
    lens: '85mm lens',
    aperture: 'f/2.8',
    depthOfField: 'shallow depth of field with dreamy bokeh background',
    angle: '45-degree camera angle, lifestyle composition',
    lighting: 'natural window light from the side, soft overexposed highlights, bright and airy',
    color: 'warm golden tones at 5200K, soft pastel palette, Instagram-aesthetic warmth',
    style: 'lifestyle Instagram aesthetic, cozy inviting atmosphere',
    realism: 'soft glow, gentle vignette, dreamy authentic texture',
    moodDefault: 'bright',
    backgroundHint: 'marble or light wood surface, bright airy space',
    propsHint: 'latte art, magazine edge, small flowers, lifestyle props',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // HAWKER & STREET FOOD
  // ─────────────────────────────────────────────────────────────────────────────
  hawker: {
    lens: '50mm lens',
    aperture: 'f/4',
    depthOfField: 'moderate depth of field, authentic documentary feel',
    angle: '45-degree camera angle, authentic presentation',
    lighting: 'warm mixed lighting with fluorescent and ambient warmth, bustling atmosphere',
    color: 'warm vibrant tones at 4500K, saturated local food colors, high energy palette',
    style: 'authentic documentary street photography, raw genuine aesthetic',
    realism: 'natural grain, authentic texture, slight imperfection for realism',
    moodDefault: 'warm',
    backgroundHint: 'kopitiam formica table, hawker stall atmosphere',
    propsHint: 'red melamine plates, tissue packets, chili sauce, lime wedges',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // FAST FOOD
  // ─────────────────────────────────────────────────────────────────────────────
  fastfood: {
    lens: '85mm lens',
    aperture: 'f/4',
    depthOfField: 'shallow depth of field, hero focus on food',
    angle: '45-degree or eye-level for stacked items like burgers',
    lighting: 'bright even studio lighting, commercial quality, minimal shadows',
    color: 'bold saturated colors at 5000K, punchy appetite-triggering palette',
    style: 'commercial advertising photography, bold high-energy aesthetic',
    realism: 'minimal grain, clean polished commercial look',
    moodDefault: 'bright',
    backgroundHint: 'clean minimal background, brand-friendly',
    propsHint: 'cheese pulls, sauce drips, steam rising, freshness cues',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // DESSERTS & SWEETS
  // ─────────────────────────────────────────────────────────────────────────────
  dessert: {
    lens: '100mm macro lens',
    aperture: 'f/2.8',
    depthOfField: 'shallow depth of field, dreamy soft bokeh',
    angle: '45-degree angle showing height and decorative details',
    lighting: 'soft diffused bright lighting, high-key airy atmosphere',
    color: 'soft pastel tones at 5200K, candy colors, bright cheerful palette',
    style: 'Instagram dessert aesthetic, pretty and indulgent',
    realism: 'soft glow, dreamy atmosphere, subtle vignette',
    moodDefault: 'bright',
    backgroundHint: 'bright airy background, pastel surfaces, marble',
    propsHint: 'pretty plates, drips and swirls, fresh berries, chocolate details',
  },
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOOD OVERRIDES
// When user explicitly selects a mood, these override business defaults
// ═══════════════════════════════════════════════════════════════════════════════

export const moodOverrides: Record<string, Partial<PhotographyElements>> = {
  bright: {
    lighting: 'bright even studio lighting, high-key illumination, minimal shadows',
    color: 'cool fresh tones at 5500K, crisp clean colors, enhanced vibrancy',
    style: 'contemporary bright aesthetic, fresh and cheerful',
    realism: 'minimal grain, clean polished look',
  },

  warm: {
    lighting: 'warm amber lighting, soft directional shadows, cozy atmosphere',
    color: 'warm inviting tones at 4500K, golden amber warmth, natural saturation',
    style: 'cozy inviting aesthetic, comfort food appeal',
    realism: 'subtle grain, authentic warmth, organic texture',
  },

  elegant: {
    lighting: 'dramatic side lighting, deep shadows, chiaroscuro style',
    color: 'rich deep tones at 4800K, moody contrast, sophisticated palette',
    style: 'fine dining editorial, dark and dramatic, magazine quality',
    realism: 'subtle grain, velvety shadows, premium texture',
  },

  natural: {
    lighting: 'natural window light from the side, soft diffused daylight',
    color: 'authentic natural tones at 5200K, true-to-life colors, balanced saturation',
    style: 'authentic natural photography, unprocessed organic feel',
    realism: 'natural grain, organic texture, authentic imperfection',
  },

  auto: {
    // No overrides - use business type defaults
  },
}

// ═══════════════════════════════════════════════════════════════════════════════
// SEASONAL ADDITIONS
// These ADD to the prompt, they don't replace
// ═══════════════════════════════════════════════════════════════════════════════

export interface SeasonalAddition {
  colorAccent: string
  props: string
  atmosphere: string
  warning: string // Remind AI not to replace food
}

export const seasonalAdditions: Record<string, SeasonalAddition> = {
  none: {
    colorAccent: '',
    props: '',
    atmosphere: '',
    warning: '',
  },

  christmas: {
    colorAccent: 'Add festive red and green accent colors, warm golden glow, cozy holiday warmth at 4000K',
    props: 'Style with subtle Christmas accents: pine branches, cinnamon sticks, red berries, fairy lights in bokeh',
    atmosphere: 'Cozy winter holiday atmosphere, warm candlelight feeling',
    warning: 'IMPORTANT: Add Christmas elements as ACCENTS and PROPS only. DO NOT replace or modify the original food.',
  },

  cny: {
    colorAccent: 'Add prosperous red and gold accent colors, auspicious warm tones at 4500K',
    props: 'Style with CNY accents: mandarin oranges, red envelopes, gold ingots, lantern bokeh',
    atmosphere: 'Prosperous celebration atmosphere, reunion dinner abundance',
    warning: 'IMPORTANT: Add CNY elements as ACCENTS and PROPS only. DO NOT replace or modify the original food.',
  },

  valentines: {
    colorAccent: 'Add romantic pink and red accent colors, soft warm romantic glow',
    props: 'Style with Valentine accents: rose petals scattered, heart shapes, romantic bokeh',
    atmosphere: 'Romantic intimate atmosphere, love and indulgence feeling',
    warning: 'IMPORTANT: Add Valentine elements as ACCENTS and PROPS only. DO NOT replace or modify the original food.',
  },

  'hari-raya': {
    colorAccent: 'Add elegant green and gold accent colors, warm festive tones at 4800K',
    props: 'Style with Hari Raya accents: ketupat decorations, pelita oil lamps, Islamic geometric patterns',
    atmosphere: 'Elegant celebration atmosphere, family gathering warmth',
    warning: 'IMPORTANT: Add Hari Raya elements as ACCENTS and PROPS only. DO NOT replace or modify the original food.',
  },

  deepavali: {
    colorAccent: 'Add vibrant jewel-tone accents: rich orange, purple, gold at 4500K',
    props: 'Style with Deepavali accents: diyas (oil lamps), rangoli patterns, marigold flowers',
    atmosphere: 'Festival of lights atmosphere, joyful celebration energy',
    warning: 'IMPORTANT: Add Deepavali elements as ACCENTS and PROPS only. DO NOT replace or modify the original food.',
  },

  'mid-autumn': {
    colorAccent: 'Add warm golden autumn accent colors, harvest moon palette at 4500K',
    props: 'Style with Mid-Autumn accents: lanterns, mooncake styling, pomelo, tea setting',
    atmosphere: 'Family reunion atmosphere, nostalgic moon festival mood',
    warning: 'IMPORTANT: Add Mid-Autumn elements as ACCENTS and PROPS only. DO NOT replace or modify the original food.',
  },
}

// ═══════════════════════════════════════════════════════════════════════════════
// FORMAT-SPECIFIC ADDITIONS
// ═══════════════════════════════════════════════════════════════════════════════

export interface FormatAddition {
  composition: string
  framing: string
  notes: string
}

export const formatAdditions: Record<string, FormatAddition> = {
  square: {
    composition: 'Square 1:1 composition, dish centered with balanced margins',
    framing: 'Food fills 80% of frame, leave margins for app UI elements',
    notes: 'Optimized for delivery apps and menu displays. Clean, focused presentation.',
  },

  portrait: {
    composition: 'Portrait 4:5 composition, maximizing vertical screen space',
    framing: 'Rule of thirds, food as clear focal point with lifestyle context',
    notes: 'Optimized for Instagram Feed and Xiaohongshu. Lifestyle props welcome.',
  },

  vertical: {
    composition: 'Full vertical 9:16 composition, scroll-stopping impact',
    framing: 'Central focal point, text-safe zones at top and bottom 15%',
    notes: 'Optimized for Stories and TikTok. Bold, attention-grabbing in 0.5 seconds.',
  },

  landscape: {
    composition: 'Wide landscape 16:9 composition, cinematic feel',
    framing: 'Food positioned with space for text overlay on one side',
    notes: 'Optimized for Facebook and website banners. Shareable, engaging format.',
  },

  foodpanda: {
    composition: 'Horizontal 4:3 composition, high resolution required',
    framing: 'Top-down or front view, food prominently displayed, no watermarks',
    notes: 'Foodpanda requires minimum 4000x3000px. Clean background essential.',
  },
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN FUNCTION: Build Complete Defaults
// ═══════════════════════════════════════════════════════════════════════════════

export interface CompleteDefaults {
  elements: PhotographyElements
  format: {
    aspectRatio: string
    width: number
    height: number
    addition: FormatAddition
  }
  seasonal: SeasonalAddition | null
  summary: string
}

/**
 * Get complete photography defaults based on user selection
 */
export function getCompleteDefaults(selection: SimpleSelection): CompleteDefaults {
  // 1. Get base defaults from business type
  const businessType = selection.businessType || 'restaurant'
  const baseDefaults = businessTypeDefaults[businessType] || businessTypeDefaults.restaurant

  // 2. Start with base elements
  let elements: PhotographyElements = {
    lens: baseDefaults.lens,
    aperture: baseDefaults.aperture,
    depthOfField: baseDefaults.depthOfField,
    angle: baseDefaults.angle,
    lighting: baseDefaults.lighting,
    color: baseDefaults.color,
    style: baseDefaults.style,
    realism: baseDefaults.realism,
  }

  // 3. Apply mood overrides if not "auto"
  if (selection.mood && selection.mood !== 'auto') {
    const moodOverride = moodOverrides[selection.mood]
    if (moodOverride) {
      elements = { ...elements, ...moodOverride }
    }
  }

  // 4. Get format configuration
  const formatConfig = getFormatConfig(selection.format)
  const formatAddition = formatAdditions[selection.format || 'square'] || formatAdditions.square

  // 5. Get seasonal addition if any
  const seasonal = selection.seasonal && selection.seasonal !== 'none'
    ? seasonalAdditions[selection.seasonal] || null
    : null

  // 6. Build summary
  const summaryParts: string[] = []
  summaryParts.push(`${businessType} style`)
  if (selection.mood && selection.mood !== 'auto') {
    summaryParts.push(`${selection.mood} mood`)
  }
  summaryParts.push(`${formatConfig.aspectRatio} format`)
  if (seasonal) {
    summaryParts.push(`with ${selection.seasonal} theme`)
  }

  return {
    elements,
    format: {
      aspectRatio: formatConfig.aspectRatio,
      width: formatConfig.width,
      height: formatConfig.height,
      addition: formatAddition,
    },
    seasonal,
    summary: summaryParts.join(', '),
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROMPT BUILDER: Convert Defaults to Prompt Text
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Build the complete AI prompt from selection
 */
export function buildSmartPrompt(selection: SimpleSelection): string {
  const defaults = getCompleteDefaults(selection)

  const sections: string[] = []

  // Header
  sections.push(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                    FOODSNAP AI PHOTO ENHANCEMENT                              ║
╚═══════════════════════════════════════════════════════════════════════════════╝

You are a professional food photography retoucher. Your task is to ENHANCE
the provided food photo while PRESERVING the original food content.

ABSOLUTE RULES:
1. KEEP the exact same food items - do not replace or change what is being photographed
2. KEEP the same plates, bowls, and serving dishes
3. KEEP the same composition and arrangement
4. ONLY enhance: lighting, colors, textures, background styling, and overall polish
5. Make the food look MORE appetizing, not different
6. NO HUMANS - Do NOT add any people, hands, arms, or body parts. Remove any visible humans from the background. The photo should show ONLY food, props, and surfaces.
`)

  // Technical specifications
  sections.push(`
═══════════════════════════════════════════════════════════════════════════════
TECHNICAL SPECIFICATIONS
═══════════════════════════════════════════════════════════════════════════════

LENS: ${defaults.elements.lens}
APERTURE: ${defaults.elements.aperture}
DEPTH OF FIELD: ${defaults.elements.depthOfField}
CAMERA ANGLE: ${defaults.elements.angle}
LIGHTING: ${defaults.elements.lighting}
COLOR: ${defaults.elements.color}
STYLE: ${defaults.elements.style}
REALISM: ${defaults.elements.realism}
`)

  // Format specification
  sections.push(`
═══════════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT: ${defaults.format.aspectRatio} (${defaults.format.width}x${defaults.format.height}px)
═══════════════════════════════════════════════════════════════════════════════

${defaults.format.addition.composition}
${defaults.format.addition.framing}

Note: ${defaults.format.addition.notes}
`)

  // Seasonal theme if present
  if (defaults.seasonal) {
    sections.push(`
═══════════════════════════════════════════════════════════════════════════════
SEASONAL THEME
═══════════════════════════════════════════════════════════════════════════════

${defaults.seasonal.warning}

COLOR ACCENT: ${defaults.seasonal.colorAccent}
PROPS & STYLING: ${defaults.seasonal.props}
ATMOSPHERE: ${defaults.seasonal.atmosphere}
`)
  }

  // Verification checklist
  sections.push(`
═══════════════════════════════════════════════════════════════════════════════
VERIFICATION CHECKLIST
═══════════════════════════════════════════════════════════════════════════════

Before outputting, verify:
✓ Same food items as input image
✓ Same plates/dishes as input image
✓ Same arrangement as input image
✓ Enhanced lighting and colors applied
✓ Professional, appetizing appearance
✓ No artificial or fake-looking elements
✓ Correct aspect ratio: ${defaults.format.aspectRatio}

Configuration: ${defaults.summary}
`)

  return sections.join('\n')
}

// ═══════════════════════════════════════════════════════════════════════════════
// ZERO SELECTION DEFAULTS
// When user uploads without selecting anything
// ═══════════════════════════════════════════════════════════════════════════════

export const zeroSelectionDefaults: SimpleSelection = {
  businessType: 'restaurant', // Most common default
  format: 'square', // Most versatile
  mood: 'auto', // Let AI decide
  seasonal: 'none', // No seasonal
}

/**
 * Get defaults for zero-selection scenario
 */
export function getZeroSelectionPrompt(): string {
  return buildSmartPrompt(zeroSelectionDefaults)
}
