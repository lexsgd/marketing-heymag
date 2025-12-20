/**
 * Professional Food Photography Prompt Elements
 *
 * 8 key elements that make the difference between amateur and professional
 * food photography prompts for AI image generation.
 *
 * Reference: /docs/FOOD_PHOTOGRAPHY_PROMPT_ELEMENTS.md
 */

// ═══════════════════════════════════════════════════════════════════════════════
// ELEMENT 1: LENS
// ═══════════════════════════════════════════════════════════════════════════════

export interface LensOption {
  id: string
  focalLength: string
  promptText: string
  bestFor: string[]
  characteristics: string
}

export const lensOptions: LensOption[] = [
  {
    id: 'lens-35',
    focalLength: '35mm',
    promptText: 'shot with 35mm lens',
    bestFor: ['flat lays', 'environmental shots', 'table scenes'],
    characteristics: 'Wide perspective, shows context, minimal distortion',
  },
  {
    id: 'lens-50',
    focalLength: '50mm',
    promptText: 'shot with 50mm lens',
    bestFor: ['overhead shots', 'general use', 'natural perspective'],
    characteristics: 'Natural human eye perspective, versatile all-rounder',
  },
  {
    id: 'lens-85',
    focalLength: '85mm',
    promptText: 'shot with 85mm lens',
    bestFor: ['hero shots', '45-degree angles', 'stacked items'],
    characteristics: 'Beautiful compression, intimate feel, flattering for tall subjects',
  },
  {
    id: 'lens-100-macro',
    focalLength: '100mm macro',
    promptText: 'shot with 100mm macro lens',
    bestFor: ['hero images', 'detail shots', 'texture close-ups'],
    characteristics: 'Industry standard for food, creamy backgrounds, intimate detail',
  },
]

export const defaultLens = lensOptions[3] // 100mm macro

// ═══════════════════════════════════════════════════════════════════════════════
// ELEMENT 2: APERTURE / DEPTH OF FIELD
// ═══════════════════════════════════════════════════════════════════════════════

export interface ApertureOption {
  id: string
  fStop: string
  promptText: string
  dofDescription: string
  bestFor: string[]
}

export const apertureOptions: ApertureOption[] = [
  {
    id: 'f1.8',
    fStop: 'f/1.8',
    promptText: 'f/1.8 aperture, extremely shallow depth of field, dreamy bokeh, creamy background blur',
    dofDescription: 'Very shallow - dramatic blur',
    bestFor: ['artistic shots', 'single items', 'drinks with bokeh'],
  },
  {
    id: 'f2.8',
    fStop: 'f/2.8',
    promptText: 'f/2.8 aperture, shallow depth of field, soft background blur with subject separation',
    dofDescription: 'Shallow - balanced',
    bestFor: ['hero shots', 'desserts', 'eye-level items'],
  },
  {
    id: 'f4',
    fStop: 'f/4',
    promptText: 'f/4 aperture, shallow depth of field, sharp focus on main subject with soft background blur',
    dofDescription: 'Sweet spot - subject sharp, background soft',
    bestFor: ['most food photography', 'plated dishes', 'general use'],
  },
  {
    id: 'f5.6',
    fStop: 'f/5.6',
    promptText: 'f/5.6 aperture, moderate depth of field, most of dish in sharp focus',
    dofDescription: 'Moderate - mostly sharp',
    bestFor: ['individual dishes', 'multiple items', 'group shots'],
  },
  {
    id: 'f8',
    fStop: 'f/8',
    promptText: 'f/8 aperture, deep depth of field, everything in sharp focus',
    dofDescription: 'Deep - all sharp',
    bestFor: ['flat lays', 'overhead shots', 'ingredient spreads'],
  },
  {
    id: 'f11',
    fStop: 'f/11',
    promptText: 'f/11 aperture, maximum sharpness throughout, all details crisp',
    dofDescription: 'Very deep - maximum detail',
    bestFor: ['commercial shots', 'packaging', 'catalog photography'],
  },
]

export const defaultAperture = apertureOptions[2] // f/4

// ═══════════════════════════════════════════════════════════════════════════════
// ELEMENT 3: CAMERA ANGLE
// ═══════════════════════════════════════════════════════════════════════════════

export interface AngleOption {
  id: string
  degrees: number
  name: string
  promptText: string
  bestFor: string[]
  autoAdjust: {
    lens: string
    aperture: string
  }
}

export const angleOptions: AngleOption[] = [
  {
    id: 'angle-0',
    degrees: 0,
    name: 'Eye Level',
    promptText: 'straight-on eye-level shot, emphasizing height and layers, front-facing hero angle',
    bestFor: ['burgers', 'layer cakes', 'tall drinks', 'sandwiches', 'parfaits'],
    autoAdjust: {
      lens: '85mm lens',
      aperture: 'f/2.8',
    },
  },
  {
    id: 'angle-45',
    degrees: 45,
    name: 'Three-Quarter',
    promptText: '45-degree camera angle, three-quarter view showing both top and side of the dish, depth and dimension',
    bestFor: ['bowls', 'plated dishes', 'pasta', 'curries', 'most foods'],
    autoAdjust: {
      lens: '100mm macro lens',
      aperture: 'f/4',
    },
  },
  {
    id: 'angle-90',
    degrees: 90,
    name: 'Overhead',
    promptText: '90-degree overhead flat lay, perfect bird\'s eye view, top-down perspective',
    bestFor: ['pizza', 'flat lay', 'cookies', 'table scenes', 'ingredient spreads'],
    autoAdjust: {
      lens: '50mm lens',
      aperture: 'f/8',
    },
  },
]

export const defaultAngle = angleOptions[1] // 45-degree

// ═══════════════════════════════════════════════════════════════════════════════
// ELEMENT 4: LIGHTING
// ═══════════════════════════════════════════════════════════════════════════════

export interface LightingOption {
  id: string
  name: string
  promptText: string
  characteristics: string
  bestFor: string[]
}

export const lightingOptions: LightingOption[] = [
  {
    id: 'natural-window',
    name: 'Natural Window',
    promptText: 'soft natural window light from the side, diffused daylight, gentle shadows with bright highlights',
    characteristics: 'Soft, authentic, inviting',
    bestFor: ['most food', 'lifestyle shots', 'authentic feel'],
  },
  {
    id: 'studio-softbox',
    name: 'Studio Softbox',
    promptText: 'professional studio lighting, large softbox from 45 degrees, soft diffused even illumination',
    characteristics: 'Even, professional, controlled',
    bestFor: ['commercial shots', 'product photography', 'consistent style'],
  },
  {
    id: 'backlit',
    name: 'Backlit',
    promptText: 'backlit with rim lighting, glowing luminous edges, soft fill from front, ethereal atmosphere',
    characteristics: 'Glowing, luminous, dreamy',
    bestFor: ['drinks', 'soups', 'translucent items', 'steam shots'],
  },
  {
    id: 'dramatic',
    name: 'Dramatic',
    promptText: 'single directional side light, deep dramatic shadows, chiaroscuro lighting, moody atmosphere',
    characteristics: 'High contrast, dramatic, editorial',
    bestFor: ['fine dining', 'dark moody', 'premium items'],
  },
  {
    id: 'golden-hour',
    name: 'Golden Hour',
    promptText: 'warm golden hour sunlight, long soft shadows, rich amber glow, sunset warmth',
    characteristics: 'Warm, romantic, nostalgic',
    bestFor: ['comfort food', 'outdoor dining', 'warm atmosphere'],
  },
  {
    id: 'bright-even',
    name: 'Bright & Even',
    promptText: 'bright even studio lighting, minimal shadows, high-key clean illumination',
    characteristics: 'Clean, bright, commercial',
    bestFor: ['fast food', 'delivery apps', 'clean aesthetic'],
  },
  {
    id: 'overhead-soft',
    name: 'Overhead Soft',
    promptText: 'soft overhead diffused lighting, minimal shadows, even top-down illumination',
    characteristics: 'Flat, even, uniform',
    bestFor: ['flat lays', 'overhead shots', 'ingredient spreads'],
  },
]

export const defaultLighting = lightingOptions[0] // Natural Window

// ═══════════════════════════════════════════════════════════════════════════════
// ELEMENT 5: COLOR
// ═══════════════════════════════════════════════════════════════════════════════

export interface ColorOption {
  id: string
  name: string
  kelvin: string
  promptText: string
  mood: string
  bestFor: string[]
}

export const colorOptions: ColorOption[] = [
  {
    id: 'warm-comfort',
    name: 'Warm Comfort',
    kelvin: '4000-4500K',
    promptText: 'warm inviting color temperature at 4500K, cozy amber tones, appetizing warmth',
    mood: 'Cozy, inviting, homestyle',
    bestFor: ['comfort food', 'hot dishes', 'BBQ', 'hawker food'],
  },
  {
    id: 'balanced-warm',
    name: 'Balanced Warm',
    kelvin: '5000K',
    promptText: 'natural color balance at 5000K, slightly warm tones, vibrant but natural saturation',
    mood: 'Natural, appetizing, balanced',
    bestFor: ['most foods', 'restaurant', 'general use'],
  },
  {
    id: 'neutral-fresh',
    name: 'Neutral Fresh',
    kelvin: '5200-5500K',
    promptText: 'cool fresh tones at 5500K, crisp clean colors, bright and refreshing',
    mood: 'Fresh, clean, bright',
    bestFor: ['salads', 'cold dishes', 'summer items', 'desserts'],
  },
  {
    id: 'editorial-precise',
    name: 'Editorial Precise',
    kelvin: '5200K',
    promptText: 'precise color accuracy at 5200K, true-to-life colors, balanced neutral white point',
    mood: 'Accurate, professional, neutral',
    bestFor: ['editorial', 'magazine', 'precise reproduction'],
  },
  {
    id: 'moody-rich',
    name: 'Moody Rich',
    kelvin: '4800K',
    promptText: 'rich deep tones at 4800K, warm shadows with cool highlights, dramatic color depth',
    mood: 'Sophisticated, dramatic, premium',
    bestFor: ['fine dining', 'dark moody', 'premium items'],
  },
  {
    id: 'pastel-soft',
    name: 'Pastel Soft',
    kelvin: '5200K',
    promptText: 'soft pastel tones at 5200K, muted candy colors, gentle understated palette',
    mood: 'Sweet, gentle, Instagram aesthetic',
    bestFor: ['desserts', 'cafe', 'feminine aesthetic'],
  },
]

export const defaultColor = colorOptions[1] // Balanced Warm

// ═══════════════════════════════════════════════════════════════════════════════
// ELEMENT 6: STYLE
// ═══════════════════════════════════════════════════════════════════════════════

export interface StyleOption {
  id: string
  name: string
  promptText: string
  era?: string
  characteristics: string
  bestFor: string[]
}

export const styleOptions: StyleOption[] = [
  {
    id: 'contemporary',
    name: 'Contemporary',
    promptText: 'contemporary professional food photography, clean modern aesthetic, polished finish',
    characteristics: 'Modern, clean, timeless',
    bestFor: ['most uses', 'versatile', 'professional'],
  },
  {
    id: 'editorial',
    name: 'Editorial Magazine',
    promptText: 'high-end editorial food photography, magazine-worthy finish, sophisticated styling',
    characteristics: 'Refined, prestigious, publication-ready',
    bestFor: ['fine dining', 'magazines', 'premium content'],
  },
  {
    id: 'rustic',
    name: 'Rustic Organic',
    promptText: 'rustic organic style, natural textures, earthy artisanal handcrafted feel',
    characteristics: 'Natural, authentic, artisanal',
    bestFor: ['farm-to-table', 'organic food', 'homestyle'],
  },
  {
    id: 'lifestyle',
    name: 'Lifestyle Instagram',
    promptText: 'lifestyle Instagram aesthetic, cozy inviting atmosphere, aspirational yet relatable',
    characteristics: 'Aspirational, relatable, shareable',
    bestFor: ['cafe', 'brunch', 'social media'],
  },
  {
    id: 'dark-moody',
    name: 'Dark Moody',
    promptText: 'dark moody food photography, deep shadows, dramatic contrast, rich atmospheric depth',
    characteristics: 'Dramatic, sophisticated, premium',
    bestFor: ['fine dining', 'evening meals', 'premium'],
  },
  {
    id: 'bright-airy',
    name: 'Bright Airy',
    promptText: 'bright airy style, high-key soft lighting, fresh light aesthetic, dreamy atmosphere',
    characteristics: 'Light, fresh, cheerful',
    bestFor: ['breakfast', 'desserts', 'healthy food'],
  },
  {
    id: 'documentary',
    name: 'Documentary Authentic',
    promptText: 'authentic documentary style, raw genuine aesthetic, unpolished reality',
    characteristics: 'Real, authentic, storytelling',
    bestFor: ['street food', 'hawker', 'travel content'],
  },
  {
    id: 'commercial',
    name: 'Commercial Bold',
    promptText: 'commercial advertising photography, bold high-energy aesthetic, appetite-triggering',
    characteristics: 'Bold, punchy, sells',
    bestFor: ['fast food', 'advertising', 'menus'],
  },
  {
    id: 'vintage-film',
    name: 'Vintage Film',
    promptText: 'shot on Kodak Portra 400, analog film aesthetic, natural film color science, organic grain',
    era: '1990s-2000s',
    characteristics: 'Nostalgic, warm, analog',
    bestFor: ['retro brands', 'nostalgic content', 'indie cafes'],
  },
]

export const defaultStyle = styleOptions[0] // Contemporary

// ═══════════════════════════════════════════════════════════════════════════════
// ELEMENT 7: REALISM (Imperfections)
// ═══════════════════════════════════════════════════════════════════════════════

export interface RealismOption {
  id: string
  name: string
  level: 'minimal' | 'subtle' | 'natural' | 'vintage'
  promptText: string
  characteristics: string
}

export const realismOptions: RealismOption[] = [
  {
    id: 'minimal',
    name: 'Minimal',
    level: 'minimal',
    promptText: 'hint of fine film grain, minimal optical vignette, nearly perfect capture',
    characteristics: 'Clean, polished, commercial',
  },
  {
    id: 'subtle',
    name: 'Subtle',
    level: 'subtle',
    promptText: 'subtle fine film grain, natural optical vignette, authentic photographic texture',
    characteristics: 'Professional with character',
  },
  {
    id: 'natural',
    name: 'Natural',
    level: 'natural',
    promptText: 'visible film grain, soft vignette, natural lens character, authentic analog photography feel',
    characteristics: 'Organic, authentic, real',
  },
  {
    id: 'vintage',
    name: 'Vintage',
    level: 'vintage',
    promptText: 'prominent film grain, light leak on corner, chromatic aberration, analog film warmth',
    characteristics: 'Nostalgic, analog, retro',
  },
]

export const defaultRealism = realismOptions[1] // Subtle

// ═══════════════════════════════════════════════════════════════════════════════
// ELEMENT 8: FOOD-SPECIFIC REALISM CUES
// ═══════════════════════════════════════════════════════════════════════════════

export interface FoodRealismCue {
  foodType: string
  cue: string
  promptAddition: string
}

export const foodRealismCues: FoodRealismCue[] = [
  {
    foodType: 'cold-beverage',
    cue: 'condensation',
    promptAddition: 'realistic condensation droplets on glass surface, cold moisture texture',
  },
  {
    foodType: 'iced-drink',
    cue: 'frost',
    promptAddition: 'frost crystals on glass, cold moisture texture, icy freshness',
  },
  {
    foodType: 'hot-food',
    cue: 'steam',
    promptAddition: 'subtle rising steam, wisps of vapor, visible heat indication',
  },
  {
    foodType: 'hot-drink',
    cue: 'steam',
    promptAddition: 'gentle steam rising from cup, warmth visible, cozy atmosphere',
  },
  {
    foodType: 'baked-goods',
    cue: 'crumbs',
    promptAddition: 'authentic crumb scatter, natural imperfection, fresh-baked texture',
  },
  {
    foodType: 'saucy-dish',
    cue: 'drips',
    promptAddition: 'natural sauce drip on plate edge, appetizing imperfection',
  },
  {
    foodType: 'chocolate',
    cue: 'melt',
    promptAddition: 'slight chocolate melt, tempting glossy texture, indulgent appearance',
  },
  {
    foodType: 'ice-cream',
    cue: 'melt',
    promptAddition: 'beginning to melt drip, fresh-served moment, tempting texture',
  },
  {
    foodType: 'cheese',
    cue: 'pull',
    promptAddition: 'cheese pull stretch, melted gooey texture, irresistible melt',
  },
  {
    foodType: 'grilled',
    cue: 'char',
    promptAddition: 'authentic grill marks, slight char, smoky essence, flame-kissed',
  },
]

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get appropriate lens based on angle
 */
export function getLensForAngle(angleId: string): LensOption {
  const angle = angleOptions.find((a) => a.id === angleId)
  if (!angle) return defaultLens

  switch (angle.degrees) {
    case 90: // Overhead
      return lensOptions.find((l) => l.focalLength === '50mm') || defaultLens
    case 0: // Eye level
      return lensOptions.find((l) => l.focalLength === '85mm') || defaultLens
    default: // 45 degree
      return lensOptions.find((l) => l.focalLength === '100mm macro') || defaultLens
  }
}

/**
 * Get appropriate aperture based on angle
 */
export function getApertureForAngle(angleId: string): ApertureOption {
  const angle = angleOptions.find((a) => a.id === angleId)
  if (!angle) return defaultAperture

  switch (angle.degrees) {
    case 90: // Overhead - need deep DoF
      return apertureOptions.find((a) => a.fStop === 'f/8') || defaultAperture
    case 0: // Eye level - shallow DoF for drama
      return apertureOptions.find((a) => a.fStop === 'f/2.8') || defaultAperture
    default: // 45 degree - balanced
      return apertureOptions.find((a) => a.fStop === 'f/4') || defaultAperture
  }
}

/**
 * Build complete technical specification prompt
 */
export function buildTechnicalPrompt(options: {
  lens?: LensOption
  aperture?: ApertureOption
  angle?: AngleOption
  lighting?: LightingOption
  color?: ColorOption
  style?: StyleOption
  realism?: RealismOption
}): string {
  const lens = options.lens || defaultLens
  const aperture = options.aperture || defaultAperture
  const angle = options.angle || defaultAngle
  const lighting = options.lighting || defaultLighting
  const color = options.color || defaultColor
  const style = options.style || defaultStyle
  const realism = options.realism || defaultRealism

  return `
TECHNICAL SPECIFICATIONS:
- LENS: ${lens.promptText}
- APERTURE: ${aperture.promptText}
- ANGLE: ${angle.promptText}
- LIGHTING: ${lighting.promptText}
- COLOR: ${color.promptText}
- STYLE: ${style.promptText}
- REALISM: ${realism.promptText}
`
}

/**
 * Get default complete prompt template
 */
export function getDefaultPromptTemplate(): string {
  return `
Professional food photography enhancement.

${buildTechnicalPrompt({})}

ENHANCEMENT GOALS:
- Make food look irresistibly appetizing
- Enhance colors without oversaturation
- Preserve original food and composition
- Apply professional photography quality
- Create authentic, not artificial, appearance
`
}
