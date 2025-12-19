/**
 * Angle-Aware Venue Style Prompts
 *
 * Different camera angles require physically different enhancements:
 * - Overhead (90°): Only table surface visible - no vertical backgrounds
 * - Hero (45°): Surface + soft background blur - hints of environment
 * - Eye-level (0°): Full vertical background visible - full scene possible
 *
 * This ensures physically realistic enhancements that don't break spatial logic.
 */

import type { CameraAngle } from './angle-detector'

export interface AngleAwareVenueStyle {
  id: string
  name: string
  description: string
  prompts: {
    overhead: string
    hero: string
    'eye-level': string
  }
}

/**
 * Base physics constraints added to ALL prompts based on angle
 */
export function getPhysicsConstraints(angle: CameraAngle): string {
  switch (angle) {
    case 'overhead':
      return `
PHYSICAL REALITY - OVERHEAD SHOT (90°):
This photograph is taken from DIRECTLY ABOVE, looking straight down.
At this angle, ONLY the table surface and items ON the table are visible.

PHYSICALLY IMPOSSIBLE at this angle (DO NOT ADD):
- Vertical backgrounds (walls, stalls, shelves, signs)
- Standing people or crowds
- Environment scenes behind the dish
- Anything requiring vertical height to be visible

PHYSICALLY POSSIBLE at this angle (CAN ENHANCE):
- Table/surface texture and pattern
- Items laid flat on the table
- Plate from above (appears circular)
- Scattered ingredients, napkins, cutlery ON the surface
`
    case 'hero':
      return `
PHYSICAL REALITY - HERO ANGLE (45°):
This photograph is taken at approximately 45 degrees.
The table surface is visible, with a softly blurred background behind.

AT THIS ANGLE:
- Table surface is clearly visible
- Background should be SOFT BLUR only (bokeh)
- No sharp, detailed background scenes
- Environmental hints through color and blur, not detail

ENHANCE with soft background treatment, NOT detailed scene replacement.
`
    case 'eye-level':
      return `
PHYSICAL REALITY - EYE LEVEL (0-30°):
This photograph is taken at eye level, looking horizontally at the food.
Full vertical background is visible behind the dish.

AT THIS ANGLE:
- Full environment/venue can be visible behind the dish
- Vertical elements (walls, stalls, decor) are appropriate
- Background depth and atmosphere are naturally visible
- Can show full venue context

Environmental enhancements are physically appropriate at this angle.
`
    default:
      return `
Preserve the existing composition and enhance appropriately.
Do not add elements that would violate the physics of the camera angle.
`
  }
}

/**
 * Angle-aware venue style definitions
 * Each venue has different prompts for different camera angles
 */
export const angleAwareVenueStyles: Record<string, AngleAwareVenueStyle> = {
  // ═══════════════════════════════════════════════════════════════════════════════
  // HAWKER CENTRE
  // ═══════════════════════════════════════════════════════════════════════════════
  'hawker': {
    id: 'hawker',
    name: 'Hawker Centre',
    description: 'Singapore/SEA hawker stall vibes',
    prompts: {
      overhead: `
HAWKER CENTRE - OVERHEAD ENHANCEMENT
Enhance this flat-lay food photo with authentic hawker centre atmosphere.

SURFACE STYLING (what's visible from above):
- Enhance table to show kopitiam formica/marble texture
- Red melamine plates, metal trays, plastic bowls are authentic
- Tissue paper packets, toothpicks, chili sauce dishes on table
- Chopsticks, spoons, forks laid flat
- Lime wedges, sambal dishes scattered around
- Newspaper or receipt edges visible

COLOR GRADING:
- Warm fluorescent lighting cast (slight yellow-green tint)
- Saturated reds, oranges, browns of local food
- Vibrant, appetizing colors
- High contrast for punchy look

DO NOT ADD any vertical backgrounds or hawker stalls - this is an overhead shot.
Style through TABLE ELEMENTS and COLOR only.
`,
      hero: `
HAWKER CENTRE - HERO ANGLE ENHANCEMENT
Enhance this 45-degree food photo with hawker centre atmosphere.

SURFACE & PROPS:
- Authentic hawker serving dishes (red plates, metal, plastic)
- Kopitiam table texture visible
- Tissue, condiments, lime wedges

BACKGROUND TREATMENT:
- Soft warm blur suggesting busy hawker atmosphere
- Hints of fluorescent lighting in bokeh
- Warm ambient glow behind
- DO NOT add sharp, detailed hawker stalls - keep background SOFT

COLOR GRADING:
- Mixed fluorescent and ambient warmth
- Vibrant, saturated local food colors
- High energy, bustling atmosphere through color mood
`,
      'eye-level': `
HAWKER CENTRE - EYE LEVEL ENHANCEMENT
Enhance this eye-level food photo with full hawker centre atmosphere.

BACKGROUND SCENE:
- Hawker stall visible in soft focus behind
- Neon menu boards, price signs (softly blurred)
- Hint of cooking action - wok hei flames, steam
- Fluorescent lighting creating authentic atmosphere
- Bustling crowd hints in far background

FOREGROUND:
- Authentic hawker serving dishes
- Red plastic, metal trays, traditional ware

COLOR & MOOD:
- Vibrant hawker centre energy
- Mix of warm and cool fluorescent tones
- Authentic, appetizing, local food feeling
`
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // FINE DINING
  // ═══════════════════════════════════════════════════════════════════════════════
  'fine-dining': {
    id: 'fine-dining',
    name: 'Fine Dining',
    description: 'Michelin-star elegant presentation',
    prompts: {
      overhead: `
FINE DINING - OVERHEAD ENHANCEMENT
Enhance this flat-lay with elegant fine dining sophistication.

SURFACE STYLING:
- White linen tablecloth texture with subtle shadows
- Elegant white/neutral ceramic plates
- Minimal, purposeful garnish
- Single flower stem or herb sprig laid flat
- Elegant cutlery at precise angles

PLATING ENHANCEMENT:
- Clean the plate edges (no drips or smears)
- Enhance sauce presentation (swoosh, dots)
- Sharpen microgreen and garnish details
- Add subtle height shadows for dimension

COLOR GRADING:
- Cool, sophisticated white balance
- Subtle contrast enhancement
- Magazine editorial quality
- Generous negative space feeling

NO backgrounds - fine dining overhead is ALL about the plate.
`,
      hero: `
FINE DINING - HERO ANGLE ENHANCEMENT
Enhance this 45-degree shot with fine dining elegance.

SURFACE & PROPS:
- White linen, elegant ceramics
- Minimal, purposeful props
- Wine glass edge in soft focus (if appropriate)

BACKGROUND:
- DARK, moody, sophisticated blur
- Restaurant ambiance through soft light hints
- Candle glow bokeh effect
- Intimate, exclusive atmosphere

LIGHTING:
- Soft directional light creating depth
- Gentle shadows for dimension
- Highlight on food surface

QUALITY:
- Magazine/editorial grade finish
- Every detail refined and purposeful
`,
      'eye-level': `
FINE DINING - EYE LEVEL ENHANCEMENT
Enhance with full fine dining restaurant atmosphere.

BACKGROUND:
- Dark, intimate restaurant setting
- Soft candlelight or warm spotlights in blur
- Hint of wine glasses, elegant decor
- Exclusive, sophisticated ambiance

FOREGROUND:
- Elegant plating, clean edges
- Height and texture showcased
- Professional food styling

MOOD:
- Intimate, luxurious, special occasion
- Dark moody with warm highlights
- Michelin-star quality presentation
`
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // CAFE
  // ═══════════════════════════════════════════════════════════════════════════════
  'cafe': {
    id: 'cafe',
    name: 'Cafe & Coffee',
    description: 'Cozy cafe aesthetic',
    prompts: {
      overhead: `
CAFE - OVERHEAD FLAT LAY ENHANCEMENT
Enhance this flat-lay with Instagram cafe aesthetic.

SURFACE STYLING:
- Marble or light wood table texture
- Lifestyle props laid flat: magazine edge, phone, sunglasses
- Latte art visible from above (if coffee in shot)
- Small flower vase (aerial view)
- Pretty napkin, aesthetic cutlery

COMPOSITION:
- Rule of thirds arrangement
- Intentional asymmetry
- Multiple items balanced

COLOR GRADING:
- Warm, golden tones
- Soft, slightly overexposed whites
- Dreamy, lifestyle blog aesthetic
- Cozy, inviting color palette

NO vertical backgrounds - cafe overhead is about SURFACE LIFESTYLE.
`,
      hero: `
CAFE - HERO ANGLE ENHANCEMENT
Enhance with cozy cafe atmosphere.

SURFACE:
- Marble/wood table visible
- Lifestyle props suggesting cafe moment
- Latte art showcased (if present)

BACKGROUND:
- Soft industrial blur (exposed brick hints)
- Window light glow
- Plant bokeh
- Warm, welcoming atmosphere

COLOR:
- Golden hour warmth
- Soft contrast
- Instagram-ready aesthetic
- Inviting, cozy mood
`,
      'eye-level': `
CAFE - EYE LEVEL ENHANCEMENT
Enhance with full cafe environment.

BACKGROUND:
- Industrial elements: exposed brick, pipes (soft focus)
- Large windows with natural light
- Indoor plants and greenery
- Cafe ambiance with other tables softly visible

FOREGROUND:
- Pretty plating and presentation
- Steam rising from coffee
- Lifestyle quality

MOOD:
- Warm, welcoming, third-place comfort
- Natural light feeling
- Instagram-worthy cafe moment
`
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // STREET FOOD
  // ═══════════════════════════════════════════════════════════════════════════════
  'street-food': {
    id: 'street-food',
    name: 'Street Food',
    description: 'Night market vibes',
    prompts: {
      overhead: `
STREET FOOD - OVERHEAD ENHANCEMENT
Enhance with authentic street food styling.

SURFACE ELEMENTS:
- Plastic bag, paper wrapper, newspaper under food
- Street vendor tray or metal plate
- Lime wedges, chili flakes scattered
- Plastic utensils, wooden skewers

COLOR GRADING:
- Mix of artificial and natural light colors
- Warm, slightly harsh street lighting feel
- High saturation for appetite appeal
- Authentic, unpolished aesthetic

TEXTURE:
- Show the messy, delicious reality
- Oil sheen, char marks, steam condensation
- Real street food authenticity

NO backgrounds - overhead street food is about the FOOD ITSELF.
`,
      hero: `
STREET FOOD - HERO ANGLE ENHANCEMENT
Enhance with night market atmosphere.

SURFACE:
- Authentic street vendor serving ware
- Paper, plastic, newspaper elements
- Messy, delicious presentation

BACKGROUND:
- Soft neon glow in blur
- Night market color hints (not detailed)
- Urban atmosphere through color cast

COLOR:
- Mixed neon lighting effect
- Warm food colors popping
- Night market energy
- Documentary authenticity
`,
      'eye-level': `
STREET FOOD - EYE LEVEL ENHANCEMENT
Enhance with full street food environment.

BACKGROUND:
- Street vendor stall visible
- Neon signs, string lights (soft blur)
- Night market atmosphere
- Other customers, bustle (distant blur)
- Steam and smoke atmosphere

FOREGROUND:
- Authentic presentation
- Action/moment feeling
- Real street food character

MOOD:
- Late night food adventure
- Urban, energetic, authentic
- Documentary photography style
`
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // FAST FOOD
  // ═══════════════════════════════════════════════════════════════════════════════
  'fast-food': {
    id: 'fast-food',
    name: 'Fast Food',
    description: 'Bold, craveable presentation',
    prompts: {
      overhead: `
FAST FOOD - OVERHEAD ENHANCEMENT
Enhance with bold fast food appeal.

SURFACE STYLING:
- Paper wrapper, branded tray (if present)
- Fries scattered around
- Sauce packets, condiments
- Napkins with brand colors

FOOD ENHANCEMENT:
- Cheese pull/melt enhanced
- Sauce drips looking delicious
- Crispy textures sharpened
- Steam/heat shimmer

COLOR:
- Bold reds and yellows (appetite colors)
- High saturation and contrast
- Punchy, craveable look
- Fast food advertising quality

NO backgrounds - fast food overhead is about CRAVE-ABILITY.
`,
      hero: `
FAST FOOD - HERO ANGLE ENHANCEMENT
Enhance with fast food energy.

FOOD:
- Cheese melting, sauce dripping
- Stack height impressive
- Crispy, juicy texture visible

BACKGROUND:
- Soft red/yellow color hints
- Fast food restaurant ambiance (very soft)
- Clean, branded feeling

COLOR:
- Bold, high contrast
- Appetite-triggering palette
- Commercial quality finish
`,
      'eye-level': `
FAST FOOD - EYE LEVEL ENHANCEMENT
Enhance with restaurant context.

BACKGROUND:
- Restaurant booth (soft focus)
- Brand colors in environment
- Clean, modern fast food setting

FOOD:
- Hero presentation
- Height and layers visible
- Cheese pull, steam, freshness

MOOD:
- Grab-and-go energy
- Craveable, satisfying
- Commercial advertising quality
`
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // KOPITIAM
  // ═══════════════════════════════════════════════════════════════════════════════
  'kopitiam': {
    id: 'kopitiam',
    name: 'Kopitiam',
    description: 'Traditional coffee shop heritage',
    prompts: {
      overhead: `
KOPITIAM - OVERHEAD ENHANCEMENT
Enhance with nostalgic kopitiam aesthetic.

SURFACE STYLING:
- Marble or formica kopitiam table texture
- Traditional kopitiam plates and cups
- Folded newspaper, kopi receipt
- Old-school sugar glass, condensed milk can
- Vintage kopitiam cutlery

COLOR GRADING:
- Warm, slightly desaturated nostalgic tones
- Morning light amber warmth
- Film photography feeling
- Heritage, comfort food mood

TEXTURE:
- Worn table texture visible
- Authentic traditional items
- Nostalgic, well-loved feel

NO backgrounds - kopitiam overhead is about TABLE HERITAGE.
`,
      hero: `
KOPITIAM - HERO ANGLE ENHANCEMENT
Enhance with traditional kopitiam atmosphere.

SURFACE:
- Marble/formica table
- Traditional serving ware
- Authentic props

BACKGROUND:
- Warm morning light glow
- Soft hint of traditional setting
- Nostalgic amber tones

COLOR:
- Vintage, desaturated warmth
- Film photography aesthetic
- Heritage comfort feeling
`,
      'eye-level': `
KOPITIAM - EYE LEVEL ENHANCEMENT
Enhance with full kopitiam environment.

BACKGROUND:
- Traditional kopitiam interior (soft focus)
- Tile walls, wooden furniture hints
- Morning light streaming in
- Other patrons (very soft blur)

MOOD:
- Nostalgic heritage atmosphere
- Traditional breakfast culture
- Comfort and familiarity
- Warm, amber morning light
`
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // CASUAL DINING
  // ═══════════════════════════════════════════════════════════════════════════════
  'casual-dining': {
    id: 'casual-dining',
    name: 'Casual Dining',
    description: 'Warm, inviting atmosphere',
    prompts: {
      overhead: `
CASUAL DINING - OVERHEAD ENHANCEMENT
Enhance with warm, inviting casual dining feel.

SURFACE STYLING:
- Wooden table or rustic surface texture
- Casual, approachable plating
- Sharing-style presentation
- Simple cutlery, cloth napkins

COLOR:
- Warm, amber restaurant lighting
- Inviting, comfortable tones
- Natural, unpretentious colors
- Homestyle warmth

PRESENTATION:
- Generous portions visible
- Family-style approachability
- Comfort food aesthetic

NO vertical backgrounds needed.
`,
      hero: `
CASUAL DINING - HERO ANGLE ENHANCEMENT
Enhance with casual restaurant warmth.

SURFACE:
- Warm wooden table
- Casual, comfortable plating
- Approachable presentation

BACKGROUND:
- Soft warm restaurant glow
- Hint of casual dining atmosphere
- Comfortable, inviting blur

COLOR:
- Amber warmth throughout
- Comfort and approachability
- Relaxed dining mood
`,
      'eye-level': `
CASUAL DINING - EYE LEVEL ENHANCEMENT
Enhance with full casual dining atmosphere.

BACKGROUND:
- Restaurant interior (soft focus)
- Warm lighting fixtures
- Other tables, comfortable setting
- Relaxed dining atmosphere

FOOD:
- Generous, shareable portions
- Approachable presentation
- Comfort food appeal

MOOD:
- Warm, welcoming, relaxed
- Family-friendly atmosphere
- Value and satisfaction visible
`
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // DESSERT & SWEETS
  // ═══════════════════════════════════════════════════════════════════════════════
  'dessert': {
    id: 'dessert',
    name: 'Dessert & Sweets',
    description: 'Sweet, colorful, Instagram-worthy treats',
    prompts: {
      overhead: `
DESSERT & SWEETS - OVERHEAD FLAT LAY ENHANCEMENT
Enhance this flat-lay dessert photo with Instagram-worthy styling.

SURFACE STYLING:
- Pretty pastel plates or vintage ceramics
- Marble or light wood surface
- Sprinkles, crumbs, sauce drizzles on surface
- Pretty napkins, small flowers laid flat
- Decorative props (macarons, berries) scattered

COLOR:
- Soft pastel palette (pink, mint, cream, lavender)
- Bright, candy-like colors for vibrant desserts
- Light, airy, dreamy color grading
- Instagram-aesthetic warmth

PRESENTATION:
- Dessert as hero, beautifully styled
- Texture detail enhanced (frosting swirls, chocolate drips)
- Fresh, appetizing, irresistible look

NO vertical backgrounds - dessert flat-lay is about SURFACE BEAUTY.
`,
      hero: `
DESSERT & SWEETS - HERO ANGLE ENHANCEMENT
Enhance with dreamy, sweet aesthetic.

SURFACE:
- Pretty plate or cake stand
- Elegant surface styling
- Sauce drips, toppings visible

BACKGROUND:
- Soft, dreamy pastel blur
- Bokeh light hints
- Romantic, sweet atmosphere

COLOR:
- Pastel and candy colors
- Soft, feminine aesthetic
- Instagram-worthy polish
- Bright, appetizing tones
`,
      'eye-level': `
DESSERT & SWEETS - EYE LEVEL ENHANCEMENT
Enhance with patisserie/bakery atmosphere.

BACKGROUND:
- Soft bakery/patisserie setting
- Display case hints (soft blur)
- Warm, inviting pastry shop feel
- Pretty lighting fixtures

FOOD:
- Height and layers showcased
- Chocolate drips, cream swirls detailed
- Fresh toppings enhanced
- Irresistible sweetness

MOOD:
- Sweet, indulgent, treat-yourself
- Instagram-worthy prettiness
- Bright, cheerful, appetizing
`
    }
  },
}

/**
 * Get angle-aware venue prompt
 * Falls back to hero angle if venue or angle not found
 */
export function getAngleAwareVenuePrompt(
  venueId: string,
  angle: CameraAngle
): string {
  const venueStyle = angleAwareVenueStyles[venueId]

  if (!venueStyle) {
    // Return generic enhancement if venue not found
    return `Enhance this food photo professionally while preserving the composition.`
  }

  // Get angle-specific prompt, fallback to hero if not found
  const angleKey = angle === 'unknown' ? 'hero' : angle
  const prompt = venueStyle.prompts[angleKey] || venueStyle.prompts.hero

  // Combine physics constraints with venue prompt
  return `${getPhysicsConstraints(angle)}

${prompt}`
}

/**
 * Check if venue has angle-aware styling available
 */
export function hasAngleAwareStyling(venueId: string): boolean {
  return venueId in angleAwareVenueStyles
}

/**
 * Get all venue IDs that support angle-aware styling
 */
export function getAngleAwareVenueIds(): string[] {
  return Object.keys(angleAwareVenueStyles)
}
