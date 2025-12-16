/**
 * AI Style Enhancement Prompts
 *
 * These prompts are based on comprehensive research including:
 * - Official platform specifications (GrabFood, Foodpanda, Deliveroo, etc.)
 * - Social media best practices (Instagram, TikTok, Xiaohongshu, etc.)
 * - Professional food photography techniques
 *
 * Users can customize these prompts per session via the UI.
 */

export const stylePrompts: Record<string, string> = {
  // SEA Delivery Platforms
  'grab': 'Professional GrabFood menu photography. Square 1:1 composition with dish perfectly centered, leaving small margins on all sides for app cropping. Clean uncluttered light background. Soft natural window lighting from above at 45 degrees. Single dish focus - one item only. High resolution, appetizing colors, food taking up majority of frame. Top-down overhead angle for bowls/plates, or 45-degree hero shot for burgers/sandwiches. No hands, faces, text, or watermarks. Fresh, vibrant, irresistible presentation optimized for mobile viewing.',

  'foodpanda': 'Foodpanda hero banner photography optimized for 16:9 aspect ratio. Bright, energetic, appetite-appealing composition. Warm lighting that complements the magenta brand color scheme. Food as hero with generous negative space on one side for text overlay. Vibrant saturated colors that pop against the platform\'s pink accent. Professional food styling with steam or condensation for freshness. Clean background that won\'t clash with the app interface. Motion-suggesting presentation.',

  'deliveroo': 'Deliveroo menu photography following brand guidelines. Clean 3:2 or 1:1 aspect ratio with 30% padding around edges for app UI elements. Neutral white or light grey background that complements the teal #00CCBC brand color. Soft diffused lighting eliminating harsh shadows. Single hero dish prominently centered. Natural, authentic food presentation - appetizing but not over-styled. Suitable for both app thumbnails and full-screen display.',

  'gojek': 'GoFood photography optimized for Indonesian market preferences. Square format with clean, uncluttered composition. Bright natural lighting showing food at its most appetizing. Bold colors that stand out in the green Gojek interface. Portion-focused shots showing value. Authentic local food styling. High resolution suitable for 8-bit PNG. Fresh garnishes and steam for appeal.',

  'shopee': 'ShopeeFood marketplace photography. Product-focused with clean white or simple background. Bright, evenly-lit composition optimized for orange brand compatibility. Square 1:1 format with food filling 80% of frame. E-commerce product photography style - clear, detailed, no distractions. Multiple angle consideration for carousel display. Price-value visual messaging.',

  'delivery': 'Generic food delivery app photography. Universal square format 1:1 optimized for all major platforms. Clean light background. Soft natural lighting with minimal shadows. Single dish hero shot with food filling majority of frame. Appetizing colors enhanced but natural. Top-down or 45-degree angle depending on dish type. No props, hands, or text. Mobile-first composition that looks great at thumbnail size.',

  // Social Media Platforms
  'instagram': 'Instagram feed photography optimized for 4:5 portrait format. Natural golden hour lighting with warm undertones. Rich, saturated colors without oversaturation. Rule of thirds composition with food as clear focal point. Lifestyle context with styled props (cutlery, napkins, drinks). Shallow depth of field creating dreamy bokeh. Consistent filter-friendly base that works with VSCO/Lightroom presets. Save-worthy, feed-aesthetic composition.',

  'instagram-stories': 'Instagram Stories vertical 9:16 photography. Bold, eye-catching composition for 3-second view time. Bright colors that pop against any background. Text-safe zones at top and bottom 15%. Central focal point for quick visual comprehension. High contrast for small screen visibility. Swipe-up friendly composition with clear call-to-action space. Motion-suggesting dynamic angles.',

  'instagram-reels': 'Instagram Reels cover frame photography. Vertical 9:16 with extremely high visual impact. Scroll-stopping colors and composition. Sharp contrast and saturation optimized for autoplay. Central subject placement for algorithm-friendly cropping. Trendy, viral-worthy presentation. Bright, energetic, youthful aesthetic.',

  'tiktok': 'TikTok food content photography optimized for 9:16 vertical. Scroll-stopping high contrast composition. Oversaturated, punchy colors that grab attention in 0.5 seconds. Dramatic lighting with bold shadows. Gen-Z aesthetic - trendy, authentic, slightly chaotic energy. ASMR-triggering texture detail. Steam, cheese pulls, sauce drips for satisfying visuals. Text overlay safe zones.',

  'facebook': 'Facebook feed photography for 1.91:1 aspect ratio. Bold, clear composition optimized for news feed competition. High contrast colors that stand out in scrolling. Family-friendly, shareable appeal. Text-overlay ready with negative space. Warm, inviting lighting. Cross-generational appeal - appetizing to all age groups. Mobile-optimized clarity.',

  'xiaohongshu': 'Xiaohongshu RED platform aesthetic food photography. Lulicore style with soft muted pastel color palette - pink, cream, sage green, soft brown, gentle yellow. Dreamy feminine atmosphere inspired by French patisserie aesthetic. Delicate plating on aesthetic ceramics or vintage plates. Soft natural lighting with slight overexposure for airy feel. Chinese Gen-Z lifestyle appeal. Cute, trendy presentation. Instagram-meets-Pinterest composition. Cafe lifestyle aesthetic with warm nostalgic mood. Designed for saves and collection boards.',

  'wechat': 'WeChat Moments photography for 9:16 portrait sharing. Clean, authentic presentation without heavy filters. Natural lighting that looks taken in-moment. Lifestyle context showing real dining experience. Shareable composition that encourages conversation. Food-focused but with human touch elements. Chinese social etiquette friendly - appetizing but not excessive. Warm, genuine, trustworthy aesthetic.',

  // Restaurant Styles
  'fine-dining': 'Michelin-star fine dining photography. Elegant minimalist plating on white or neutral ceramic. Artful sauce presentation - swoosh, dots, or geometric patterns. Microgreen and edible flower garnish used sparingly with purpose. Rule of thirds composition with generous negative space allowing plate to breathe. Soft directional lighting creating gentle shadows for depth. Shallow depth of field with sophisticated restaurant atmosphere softly blurred. Height and texture contrast in plating. Every element has purpose - no excessive garnish. Editorial magazine quality.',

  'casual': 'Casual dining atmosphere photography. Warm amber lighting creating inviting mood. Generous portions visible showing value. Rustic wooden table or textured surfaces. Family-style plating with shareable presentation. Natural, unpretentious food styling. Slight imperfection for authenticity. Warm color temperature suggesting comfort. Background hints at relaxed restaurant atmosphere. Approachable, craveable presentation.',

  'fast-food': 'Fast food photography with appetite psychology. Bold red and yellow color emphasis triggering hunger response. High contrast, punchy saturation. Dynamic angle suggesting grab-and-go energy. Melted cheese, sauce drips, steam for indulgence cues. Portion prominence showing value. Clean graphic composition. Sharp focus throughout. Speed and convenience visual messaging. Irresistible crave-ability.',

  'cafe': 'Cafe aesthetic overhead flat lay photography. Bird\'s eye view composition following rule of thirds. Latte art as hero element with foam patterns visible. Marble or light wood surface styling. Lifestyle props - magazines, flowers, phone, sunglasses. Natural window light creating soft shadows. Instagram-worthy lifestyle composition. Warm, cozy color palette. Multiple items arranged with intentional asymmetry. Brunch culture aesthetic.',

  'street-food': 'Street food documentary photography. Environmental context showing hawker stall or market atmosphere. Available light - could be fluorescent, neon, or natural. Authentic presentation in original serving dishes. Action and motion - hands, cooking, serving. Visible steam, sizzle, and cooking process. Crowded, busy background (bokeh). Raw, unpolished authenticity. Cultural context and storytelling. Flavor of the streets.',

  'menu': 'Menu card professional photography. Clean white background for versatile layout use. Consistent lighting setup replicable across all items. 45-degree three-quarter angle as standard. Every dish photographed at same distance and style. Color-accurate for print reproduction. High detail sharpness for ingredient visibility. Systematic approach for menu consistency. Standardized composition for easy layout.',

  'kopitiam': 'Kopitiam traditional coffee shop photography. Nostalgic vintage color treatment - slightly desaturated warm tones. Traditional serving dishes - kopitiam plates, old-school cups. Marble or formica table surfaces. Morning light atmosphere suggesting traditional breakfast. Local Singaporean/Malaysian food context. Newspaper, condiments, sugar glass as props. Cultural authenticity and heritage feel. Comfort food presentation.',

  'hawker': 'Hawker centre photography with SEA food court atmosphere. Vibrant available light - mix of fluorescent and natural. Action shots of wok hei, sizzling plates, steam rising. Authentic hawker stall presentation. Crowded market atmosphere in background. Red plastic plates, metal trays, traditional serving ware. Local cultural authenticity. Motion and energy of busy hawker centre. Sweat-inducing spicy food appeal.',

  // Background Styles
  'minimal': 'Pure minimalist white background photography. 100% clean white (#FFFFFF) backdrop with no gradients or shadows. Product photography studio style. Soft diffused lighting eliminating all shadows. Food floating on infinite white space. Maximum focus on dish with zero distractions. Suitable for e-commerce, apps, menus. High-key lighting setup. Commercial catalog aesthetic.',

  'rustic': 'Rustic wooden surface food photography. Weathered barn wood or reclaimed timber backdrop. Warm brown tones complementing food colors. Natural grain texture visible but not competing. Scattered herbs, salt, peppercorns as styling elements. Warm directional lighting creating wood texture. Farm-to-table artisanal aesthetic. Linen napkins, vintage utensils as props. Cozy, homestyle presentation.',

  'marble': 'Marble surface elegant food photography. White Carrara marble with subtle grey veining. Cool, sophisticated color temperature. Luxurious editorial aesthetic. Minimal props - perhaps gold cutlery or single flower. Soft overhead lighting showing marble pattern. High-end bakery or patisserie style. Clean, modern, premium presentation. Instagram-worthy surface styling.',

  'dark-moody': 'Dark moody chiaroscuro food photography. Black or very dark background absorbing light. Single directional light source creating Rembrandt-style drama. Deep shadows with selective highlights on food. Rich, saturated colors emerging from darkness. Dramatic, editorial, fine-art aesthetic. Old Master painting influence. Masculine, sophisticated mood. Steam and texture emphasized by light direction.',

  'bright-airy': 'Bright and airy high-key photography. Soft overexposed whites creating dreamy atmosphere. Natural window light flooding scene. Pastel and white props maintaining lightness. Minimal shadows, maximum luminosity. Fresh, clean, healthy food aesthetic. Spring/summer mood. Light tablecloth, white ceramics. Feminine, delicate presentation. Lifestyle blog aesthetic.',

  'tropical': 'Tropical paradise food photography. Saturated greens of palm leaves and monstera. Bright yellows, oranges, pinks of tropical fruits. Bamboo, rattan, coconut shell props. Natural sunlight creating dappled shadows. Fresh, vacation, island vibes. Exotic garnishes - orchids, hibiscus, tropical leaves. Beach club or resort atmosphere. Refreshing, thirst-quenching presentation.',

  'concrete': 'Industrial concrete surface photography. Cool grey cement or polished concrete background. Urban modern aesthetic. Minimalist plating on contemporary ceramics. Harsh directional lighting for texture. Metal, glass, geometric props. Architecture-inspired composition. Stark, contemporary, masculine mood. Design magazine aesthetic.',

  'botanical': 'Botanical garden photography with natural greenery. Fresh herbs, leaves, edible flowers as props and background. Garden-to-table farm fresh aesthetic. Natural daylight through greenhouse effect. Organic, healthy, sustainable visual messaging. Green dominant color palette. Sprigs of rosemary, basil, mint as styling. Fresh morning dew effect. Wellness and natural food presentation.',

  // Photography Techniques
  'overhead': 'Perfect flat lay overhead photography at exactly 90 degrees. Bird\'s eye view composition using rule of thirds grid. All elements parallel to frame edges. Multiple items arranged with intentional spacing. Consistent lighting eliminating all shadows. Graphics-ready clean edges. Narrative storytelling through arrangement. Magazine editorial spread style. Symmetrical or asymmetrical balance.',

  'natural-light': 'Natural window light photography. Soft diffused light from large window source. Side-lighting creating gentle shadow gradients. Golden hour warm tones or soft overcast coolness. No artificial light mixing. Reflector fill for shadow detail. Authentic, real, unprocessed aesthetic. Home cooking atmosphere. Soft, approachable, inviting mood.',

  'neon': 'Neon night market photography. Hong Kong or Tokyo night street aesthetic. Mixed neon color lighting - pink, blue, yellow, green. Urban street food atmosphere. Reflections on wet surfaces. Glowing signs in bokeh background. Cinematic color grading. Late night food culture. Moody, atmospheric, Blade Runner inspired.',

  'vintage': 'Vintage film photography emulation. 1970s Kodachrome color palette - warm, faded, nostalgic. Film grain texture overlay. Slightly desaturated with lifted blacks. Warm highlights, cool shadows color split. Retro props and styling. Polaroid or 35mm film aesthetic. Grandmother\'s cookbook photography style. Timeless, nostalgic comfort.',

  'hdr': 'HDR enhanced detail photography. Bracketed exposure combination. Full shadow and highlight detail recovery. Hyperreal detail in both bright and dark areas. Slightly surreal, video game aesthetic. Punchy local contrast. Every texture visible. Technical showcase photography. Commercial advertising intensity.',

  'bokeh': 'Bokeh background portrait photography. Shallow depth of field at f/1.4-2.8 equivalent. Creamy background blur with circular highlights. Sharp focus on hero subject only. Dreamy, romantic atmosphere. Background lights creating bokeh balls. Subject separation from environment. Professional camera simulation. Intimate, focused presentation.',
}

/**
 * Default prompt used when no style is specified
 */
export const defaultPrompt = 'Professional food photography. Appetizing presentation with natural lighting. Clean composition focusing on the dish. Enhanced colors and details while maintaining authenticity.'

/**
 * Get the prompt for a style, with optional custom override
 */
export function getStylePrompt(styleId: string, customPrompt?: string): string {
  if (customPrompt) return customPrompt
  return stylePrompts[styleId] || defaultPrompt
}

/**
 * Get all available style IDs
 */
export function getStyleIds(): string[] {
  return Object.keys(stylePrompts)
}
