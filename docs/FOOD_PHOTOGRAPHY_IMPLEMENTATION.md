# FoodSnap AI - Style System Implementation Plan

**Created**: 2025-12-20
**Status**: Implementation Ready
**Reference**: `/Users/lexnaweiming/Test/marketing-heymag/docs/FOOD_PHOTOGRAPHY_PROMPT_ELEMENTS.md`

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current System Analysis](#2-current-system-analysis)
3. [Problems Identified](#3-problems-identified)
4. [Conflict Rules Matrix](#4-conflict-rules-matrix)
5. [Simplified MVP Categories](#5-simplified-mvp-categories)
6. [Hidden Advanced Options](#6-hidden-advanced-options)
7. [Smart Defaults System](#7-smart-defaults-system)
8. [User Flow Design](#8-user-flow-design)
9. [Updated Style Recipes](#9-updated-style-recipes)
10. [Implementation Tasks](#10-implementation-tasks)
11. [Files to Modify](#11-files-to-modify)

---

## 1. Executive Summary

### Goal
Create an extremely simple flow for F&B hawker owners and restaurant owners to:
1. Upload their photo
2. Optionally customize 1-2 simple choices
3. Get professional, platform-optimized results

### Key Changes
1. **Reduce** 6 categories → 3 simple categories for MVP
2. **Hide** 23 advanced options → show only 15 essential options
3. **Add** conflict prevention → prevent incompatible selections
4. **Implement** smart defaults → great results with zero selections
5. **Integrate** 8 professional elements → lens, aperture, angle, lighting, color, style, realism, format

---

## 2. Current System Analysis

### Existing Categories (6 total, 41 styles)

| Category | Selection | Required | Styles | Status |
|----------|-----------|----------|--------|--------|
| Venue Type | Single | Yes | 7 | Keep, simplify |
| Delivery Platform | Single | No | 6 | Hide, auto-detect |
| Social Platform | Multiple | No | 7 | Merge into "Use Case" |
| Seasonal & Events | Single | No | 6 | Keep, make advanced |
| Background Style | Single | No | 8 | Merge into "Mood" |
| Photography Style | Multiple | No | 7 | Hide, auto-apply |

### Current Style Inventory

**Venue Type (7)**
- fine-dining, casual-dining, fast-food, cafe, street-food, hawker, dessert

**Delivery Platform (6)**
- grab, foodpanda, deliveroo, gojek, shopee, generic-delivery

**Social Platform (7)**
- instagram-feed, instagram-stories, tiktok, facebook, xiaohongshu, wechat, pinterest

**Seasonal (6)**
- christmas, chinese-new-year, valentines, hari-raya, deepavali, mid-autumn

**Background Style (8)**
- minimal-white, rustic-wood, marble, dark-moody, bright-airy, tropical, concrete, botanical

**Photography Style (7)**
- flat-lay, natural-light, neon-night, vintage, hdr, bokeh, macro

---

## 3. Problems Identified

### 3.1 Too Many Options (41 total)
- Overwhelming for F&B owners who aren't photographers
- Paralysis of choice leads to poor or no selections
- Many options require professional knowledge

### 3.2 Conflicting Styles Possible

| Conflict Type | Example | Problem |
|---------------|---------|---------|
| **Angle conflict** | Flat Lay + Bokeh | Flat lay = 90°, Bokeh needs 45° |
| **Lighting conflict** | Neon Night + Natural Light | Opposite lighting types |
| **Mood conflict** | Dark Moody + Bright Airy | Opposite aesthetics |
| **Venue + Background** | Hawker + Marble | Culturally mismatched |
| **Technique + Technique** | HDR + Vintage | Opposite processing styles |

### 3.3 Missing Professional Elements
- No lens specification
- No aperture/DoF control
- No angle selection (0°, 45°, 90°)
- No color temperature
- No realism/imperfection options

### 3.4 No Smart Defaults
- Empty selection = generic result
- Should auto-optimize based on minimal input

---

## 4. Conflict Rules Matrix

### 4.1 Category Conflicts (Mutually Exclusive)

```typescript
const categoryConflicts = {
  // Photography Style conflicts
  'flat-lay': {
    blocks: ['bokeh', 'macro', 'neon-night'],
    reason: 'Flat lay uses 90° overhead which is incompatible with these techniques'
  },
  'bokeh': {
    blocks: ['flat-lay', 'hdr'],
    reason: 'Bokeh requires shallow DoF which conflicts with these styles'
  },
  'hdr': {
    blocks: ['vintage', 'bokeh'],
    reason: 'HDR enhances detail everywhere, opposite of vintage/bokeh softness'
  },
  'vintage': {
    blocks: ['hdr', 'neon-night'],
    reason: 'Vintage desaturates colors, opposite of HDR/neon vibrancy'
  },
  'neon-night': {
    blocks: ['natural-light', 'vintage', 'flat-lay'],
    reason: 'Neon is artificial night lighting, opposite of natural/vintage'
  },
  'natural-light': {
    blocks: ['neon-night'],
    reason: 'Natural daylight conflicts with neon night aesthetic'
  },

  // Background Style conflicts
  'dark-moody': {
    blocks: ['bright-airy', 'tropical'],
    reason: 'Opposite lighting moods'
  },
  'bright-airy': {
    blocks: ['dark-moody', 'neon-night'],
    reason: 'Opposite lighting moods'
  },
}
```

### 4.2 Cross-Category Compatibility Matrix

| Venue | Compatible Backgrounds | Incompatible |
|-------|----------------------|--------------|
| fine-dining | dark-moody, marble, minimal-white | tropical, rustic-wood |
| casual-dining | rustic-wood, bright-airy | marble, concrete |
| fast-food | minimal-white, bright-airy | dark-moody, botanical |
| cafe | marble, rustic-wood, botanical | dark-moody, concrete |
| street-food | concrete, rustic-wood | marble, botanical |
| hawker | rustic-wood, concrete | marble, botanical |
| dessert | minimal-white, marble, bright-airy | dark-moody, concrete |

### 4.3 Technique Compatibility

| Technique | Can Combine With | Cannot Combine With |
|-----------|------------------|---------------------|
| flat-lay | natural-light | bokeh, macro, neon-night |
| natural-light | flat-lay, bokeh, vintage | neon-night, hdr |
| bokeh | natural-light | flat-lay, hdr |
| vintage | natural-light | hdr, neon-night |
| macro | bokeh, natural-light | flat-lay |
| hdr | (solo) | vintage, bokeh |
| neon-night | (solo) | natural-light, flat-lay, vintage |

---

## 5. Simplified MVP Categories

### 5.1 New Category Structure (3 main + 1 optional)

```typescript
// MVP Launch: 3 simple categories + 1 optional seasonal
const mvpCategories = {
  // STEP 1: What's your business? (Required)
  businessType: {
    name: 'What type of food?',
    required: true,
    selection: 'single',
    options: [
      { id: 'restaurant', name: 'Restaurant', icon: '🍽️' },
      { id: 'cafe', name: 'Cafe & Bakery', icon: '☕' },
      { id: 'hawker', name: 'Hawker & Street Food', icon: '🍜' },
      { id: 'fastfood', name: 'Fast Food', icon: '🍔' },
      { id: 'dessert', name: 'Desserts & Sweets', icon: '🍰' },
    ]
  },

  // STEP 2: Where will you use it? (Optional but recommended)
  useCase: {
    name: 'Where will you use this?',
    required: false,
    selection: 'single',
    options: [
      { id: 'delivery', name: 'Delivery Apps', icon: '🚀', format: '1:1' },
      { id: 'instagram', name: 'Instagram Feed', icon: '📸', format: '4:5' },
      { id: 'stories', name: 'Stories/TikTok', icon: '📱', format: '9:16' },
      { id: 'menu', name: 'Menu & Print', icon: '📋', format: '1:1' },
      { id: 'general', name: 'General Use', icon: '✨', format: '1:1' },
    ]
  },

  // STEP 3: What mood? (Optional - has smart defaults)
  mood: {
    name: 'What mood/look?',
    required: false,
    selection: 'single',
    options: [
      { id: 'bright', name: 'Bright & Fresh', icon: '☀️' },
      { id: 'warm', name: 'Warm & Cozy', icon: '🔥' },
      { id: 'elegant', name: 'Dark & Elegant', icon: '🌙' },
      { id: 'natural', name: 'Natural Light', icon: '🪟' },
      { id: 'auto', name: 'Auto (Recommended)', icon: '✨' },
    ]
  },

  // OPTIONAL: Seasonal theme (expandable section)
  seasonal: {
    name: 'Seasonal Theme',
    required: false,
    selection: 'single',
    expanded: false, // Collapsed by default
    options: [
      { id: 'christmas', name: 'Christmas', icon: '🎄' },
      { id: 'cny', name: 'Chinese New Year', icon: '🧧' },
      { id: 'valentines', name: "Valentine's Day", icon: '💝' },
      { id: 'hari-raya', name: 'Hari Raya', icon: '🌙' },
      { id: 'deepavali', name: 'Deepavali', icon: '🪔' },
      { id: 'mid-autumn', name: 'Mid-Autumn', icon: '🥮' },
    ]
  }
}
```

### 5.2 Style Count Comparison

| Before | After |
|--------|-------|
| 6 categories | 3 main + 1 optional |
| 41 options | 21 options |
| Multiple selections allowed | Single selections only |
| No smart defaults | Smart defaults for everything |

---

## 6. Hidden Advanced Options

### 6.1 Options to Hide (Show in "Advanced" expandable section)

These options are hidden from main flow but accessible via "Advanced Options" toggle:

```typescript
const advancedOptions = {
  // Specific delivery platforms (hidden - use generic)
  deliveryPlatforms: ['grab', 'foodpanda', 'deliveroo', 'gojek', 'shopee'],

  // Specific social platforms (hidden - use generic)
  socialPlatforms: ['xiaohongshu', 'wechat', 'pinterest'],

  // Photography techniques (hidden - auto-applied)
  techniques: ['flat-lay', 'bokeh', 'macro', 'hdr', 'neon-night', 'vintage'],

  // Background surfaces (hidden - auto-selected)
  backgrounds: ['marble', 'concrete', 'botanical', 'tropical', 'rustic-wood'],

  // Fine-grained venue types (hidden - merged)
  venues: ['fine-dining', 'kopitiam', 'street-food'],
}
```

### 6.2 When to Show Advanced Options

Show "Advanced Options" toggle when:
- User clicks "More options" link
- User is on paid tier (Pro/Business)
- User has used the app > 3 times

---

## 7. Smart Defaults System

### 7.1 Default Mappings

When user selects Business Type, auto-apply these defaults:

```typescript
const smartDefaults = {
  // RESTAURANT
  'restaurant': {
    background: 'auto', // AI decides based on image
    mood: 'warm',
    lighting: 'soft diffused side light',
    color: '5000K, slightly warm',
    style: 'contemporary professional',
    angle: '45-degree',
    lens: '100mm macro',
    aperture: 'f/4',
    realism: 'subtle grain and vignette',
  },

  // CAFE
  'cafe': {
    background: 'bright-airy',
    mood: 'bright',
    lighting: 'natural window light',
    color: '5200K, warm',
    style: 'lifestyle aesthetic',
    angle: '45-degree',
    lens: '85mm',
    aperture: 'f/2.8',
    realism: 'subtle grain, soft glow',
  },

  // HAWKER
  'hawker': {
    background: 'auto',
    mood: 'warm',
    lighting: 'warm mixed lighting',
    color: '4500K, warm vibrant',
    style: 'authentic documentary',
    angle: '45-degree',
    lens: '50mm',
    aperture: 'f/4',
    realism: 'natural grain, authentic texture',
  },

  // FAST FOOD
  'fastfood': {
    background: 'minimal-white',
    mood: 'bright',
    lighting: 'bright even lighting',
    color: '5000K, saturated',
    style: 'commercial bold',
    angle: '45-degree',
    lens: '85mm',
    aperture: 'f/4',
    realism: 'minimal, clean',
  },

  // DESSERT
  'dessert': {
    background: 'bright-airy',
    mood: 'bright',
    lighting: 'soft diffused light',
    color: '5200K, pastel tones',
    style: 'instagram aesthetic',
    angle: '45-degree',
    lens: '100mm macro',
    aperture: 'f/2.8',
    realism: 'soft glow, dreamy',
  },
}
```

### 7.2 Use Case Format Overrides

```typescript
const useCaseFormats = {
  'delivery': {
    format: '1:1',
    resolution: '1024x1024',
    notes: 'Square, centered, clean background',
  },
  'instagram': {
    format: '4:5',
    resolution: '1080x1350',
    notes: 'Portrait, lifestyle props ok',
  },
  'stories': {
    format: '9:16',
    resolution: '1080x1920',
    notes: 'Vertical, text-safe zones',
  },
  'menu': {
    format: '1:1',
    resolution: '2048x2048',
    notes: 'High-res, consistent style',
  },
  'general': {
    format: '1:1',
    resolution: '1024x1024',
    notes: 'Versatile square format',
  },
}
```

### 7.3 Mood to Technical Mapping

```typescript
const moodToTechnical = {
  'bright': {
    lighting: 'bright even studio lighting, high-key illumination',
    color: '5500K, clean fresh tones, +5 saturation',
    background: 'bright-airy or minimal-white',
    style: 'contemporary bright aesthetic',
  },
  'warm': {
    lighting: 'warm amber lighting, soft shadows',
    color: '4500K, warm inviting tones, natural saturation',
    background: 'rustic-wood or warm surface',
    style: 'cozy inviting aesthetic',
  },
  'elegant': {
    lighting: 'dramatic side lighting, deep shadows',
    color: '4800K, rich deep tones, moody contrast',
    background: 'dark-moody',
    style: 'fine dining editorial',
  },
  'natural': {
    lighting: 'natural window light from side',
    color: '5200K, authentic natural tones',
    background: 'auto-contextual',
    style: 'authentic natural photography',
  },
  'auto': {
    // Inherit from businessType defaults
  },
}
```

---

## 8. User Flow Design

### 8.1 Simplified 3-Step Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     STEP 1: UPLOAD                          │
│                                                             │
│     [  Drag & drop your food photo here  ]                 │
│                                                             │
│     or click to browse                                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  STEP 2: QUICK SETUP                        │
│                                                             │
│  What type of food? (Required)                              │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                  │
│  │ 🍽️  │ │ ☕  │ │ 🍜  │ │ 🍔  │ │ 🍰  │                  │
│  │Rest-│ │Cafe │ │Hawk-│ │Fast │ │Dess-│                  │
│  │aurant│ │     │ │er   │ │Food │ │ert  │                  │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘                  │
│                                                             │
│  Where will you use this? (Optional)                        │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                  │
│  │ 🚀  │ │ 📸  │ │ 📱  │ │ 📋  │ │ ✨  │                  │
│  │Deliv│ │Insta│ │Story│ │Menu │ │Gene-│                  │
│  │ery  │ │gram │ │/Tik │ │     │ │ral  │                  │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘                  │
│                                                             │
│  ▼ More options (seasonal themes, mood)                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   STEP 3: ENHANCE                           │
│                                                             │
│            [ ✨ Enhance My Photo ]                          │
│                                                             │
│  Preview:                                                   │
│  ┌──────────────┐    ┌──────────────┐                      │
│  │   Original   │ →  │   Enhanced   │                      │
│  └──────────────┘    └──────────────┘                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 8.2 Progressive Disclosure

```
Level 1 (Default):
- Business Type (5 options)
- Use Case (5 options)
- [Enhance] button

Level 2 (Expand "More options"):
- Mood (5 options)
- Seasonal (6 options, collapsed)

Level 3 (Advanced - toggle):
- Specific platforms (Grab, Foodpanda, etc.)
- Photography techniques (Flat lay, Bokeh, etc.)
- Background surfaces
- Fine-tuned venue types
```

### 8.3 Zero-Selection Flow

If user uploads and clicks Enhance without selecting anything:

```typescript
const zeroSelectionDefaults = {
  businessType: 'restaurant', // Most common default
  useCase: 'general',
  mood: 'auto', // AI decides based on image

  // Technical defaults applied
  format: '1:1',
  angle: '45-degree (auto-detected)',
  lighting: 'soft natural light',
  color: '5000K balanced',
  style: 'contemporary professional',
  realism: 'subtle authentic texture',
}
```

---

## 9. Updated Style Recipes

### 9.1 Business Type Recipes

```typescript
const businessTypeRecipes = {
  'restaurant': {
    id: 'restaurant',
    name: 'Restaurant',
    emoji: '🍽️',
    description: 'Casual to fine dining',

    // Professional elements (from research doc)
    lens: '100mm macro lens',
    aperture: 'f/4 aperture, shallow depth of field',
    angle: '45-degree camera angle, three-quarter view',
    lighting: 'soft diffused natural light from the side with gentle shadows',
    color: 'natural color balance at 5000K with slightly warm tones',
    style: 'contemporary professional food photography',
    realism: 'subtle fine film grain with natural optical vignette',

    // Full prompt
    basePrompt: `
Professional restaurant food photography.

TECHNICAL SPECIFICATIONS:
- Shot with 100mm macro lens at f/4 aperture
- 45-degree camera angle, three-quarter view showing depth and dimension
- Soft diffused natural light from the side, gentle shadows with bright highlights
- Natural color balance at 5000K, slightly warm tones
- Shallow depth of field, sharp focus on main subject, soft background blur
- Subtle fine film grain for authentic photographic texture

STYLING:
- Clean, appetizing presentation
- Warm, inviting restaurant atmosphere
- Professional but approachable
- Generous portions that show value
- Comfort food appeal

ENHANCEMENT GOALS:
- Make food look irresistibly appetizing
- Enhance colors without oversaturation
- Professional quality suitable for any platform
`,
  },

  'cafe': {
    id: 'cafe',
    name: 'Cafe & Bakery',
    emoji: '☕',
    description: 'Coffee shops, bakeries, brunch spots',

    lens: '85mm lens',
    aperture: 'f/2.8 aperture, shallow depth of field with dreamy bokeh',
    angle: '45-degree camera angle',
    lighting: 'natural window light from the side, soft overexposed whites',
    color: 'warm color temperature at 5200K, golden tones',
    style: 'lifestyle Instagram aesthetic',
    realism: 'soft glow, gentle vignette, authentic texture',

    basePrompt: `
Instagram-worthy cafe photography.

TECHNICAL SPECIFICATIONS:
- Shot with 85mm lens at f/2.8 aperture
- 45-degree angle with dreamy bokeh background
- Natural window light, soft overexposed highlights
- Warm golden tones at 5200K
- Shallow depth of field, lifestyle aesthetic

STYLING:
- Lifestyle props welcome (magazine edge, flowers)
- Latte art visible if coffee present
- Marble or light wood surface
- Cozy, inviting atmosphere
- Instagram-aesthetic composition

ENHANCEMENT GOALS:
- Bright, airy, inviting mood
- Golden hour warmth
- Save-worthy aesthetic
`,
  },

  'hawker': {
    id: 'hawker',
    name: 'Hawker & Street Food',
    emoji: '🍜',
    description: 'Hawker centres, kopitiams, street vendors',

    lens: '50mm lens',
    aperture: 'f/4 aperture, moderate depth of field',
    angle: '45-degree camera angle',
    lighting: 'warm mixed lighting, fluorescent with ambient warmth',
    color: 'warm color temperature at 4500K, vibrant saturated tones',
    style: 'authentic documentary street photography',
    realism: 'natural grain, authentic texture, slight imperfection',

    basePrompt: `
Authentic hawker centre food photography.

TECHNICAL SPECIFICATIONS:
- Shot with 50mm lens at f/4 aperture
- 45-degree angle showing food authentically
- Mixed warm lighting (fluorescent + ambient)
- Warm vibrant colors at 4500K
- Moderate depth of field

STYLING:
- Authentic hawker serving dishes (red plates, metal trays)
- Kopitiam table texture
- Chili sauce, lime, tissue packets as natural props
- Raw, unpolished authenticity
- Bustling atmosphere through color mood

ENHANCEMENT GOALS:
- Authentic, appetizing, local
- Vibrant colors that pop
- Wok hei energy and freshness
`,
  },

  'fastfood': {
    id: 'fastfood',
    name: 'Fast Food',
    emoji: '🍔',
    description: 'Quick service, burgers, fried chicken',

    lens: '85mm lens',
    aperture: 'f/4 aperture',
    angle: '45-degree or straight-on for burgers',
    lighting: 'bright even lighting, commercial style',
    color: '5000K with bold saturated colors',
    style: 'commercial advertising photography',
    realism: 'minimal grain, clean polished look',

    basePrompt: `
Bold fast food commercial photography.

TECHNICAL SPECIFICATIONS:
- Shot with 85mm lens at f/4 aperture
- 45-degree or eye-level angle (eye-level for burgers/stacked items)
- Bright even studio lighting
- Bold saturated colors at 5000K
- Sharp focus throughout

STYLING:
- Cheese pulls, sauce drips enhanced
- Steam rising, freshness cues
- Clean, appetizing presentation
- Bold red and yellow appetite colors
- High energy, grab-and-go feeling

ENHANCEMENT GOALS:
- Irresistible crave-ability
- Commercial advertising quality
- Bold, punchy, appetite-triggering
`,
  },

  'dessert': {
    id: 'dessert',
    name: 'Desserts & Sweets',
    emoji: '🍰',
    description: 'Cakes, ice cream, pastries, sweet treats',

    lens: '100mm macro lens',
    aperture: 'f/2.8 aperture, very shallow depth of field',
    angle: '45-degree angle',
    lighting: 'soft diffused light, bright and airy',
    color: '5200K with soft pastel tones',
    style: 'Instagram dessert aesthetic',
    realism: 'soft glow, dreamy atmosphere',

    basePrompt: `
Instagram-worthy dessert photography.

TECHNICAL SPECIFICATIONS:
- Shot with 100mm macro lens at f/2.8 aperture
- 45-degree angle showing height and detail
- Soft diffused bright lighting
- Soft pastel color palette at 5200K
- Shallow depth of field, dreamy bokeh

STYLING:
- Pretty plates, elegant presentation
- Drips, swirls, toppings enhanced
- Fresh berries, chocolate details
- Light, airy, dreamy atmosphere
- Instagram-aesthetic composition

ENHANCEMENT GOALS:
- Sweet, irresistible, pretty
- Bright, cheerful colors
- Save-worthy Instagram quality
`,
  },
}
```

### 9.2 Use Case Recipes (Format Overrides)

```typescript
const useCaseRecipes = {
  'delivery': {
    id: 'delivery',
    name: 'Delivery Apps',
    emoji: '🚀',
    format: '1:1',
    resolution: '1024x1024',

    promptAddition: `
DELIVERY APP OPTIMIZATION:
- Square 1:1 format with dish perfectly centered
- Leave small margins on all sides for app cropping
- Clean, uncluttered background
- Food filling 80% of frame
- Works for GrabFood, Foodpanda, Deliveroo, etc.
- High resolution suitable for mobile viewing
- Single dish focus - one item only
`,
  },

  'instagram': {
    id: 'instagram',
    name: 'Instagram Feed',
    emoji: '📸',
    format: '4:5',
    resolution: '1080x1350',

    promptAddition: `
INSTAGRAM FEED OPTIMIZATION:
- Portrait 4:5 format maximizing screen space
- Rule of thirds composition
- Rich, saturated colors without oversaturation
- Lifestyle context welcome
- Filter-friendly base
- Save-worthy, grid-aesthetic composition
`,
  },

  'stories': {
    id: 'stories',
    name: 'Stories/TikTok',
    emoji: '📱',
    format: '9:16',
    resolution: '1080x1920',

    promptAddition: `
STORIES/TIKTOK OPTIMIZATION:
- Vertical 9:16 full-screen format
- Text-safe zones at top and bottom 15%
- Scroll-stopping high contrast
- Bold colors that grab attention
- Central focal point
- Works for Instagram Stories, TikTok, Reels
`,
  },

  'menu': {
    id: 'menu',
    name: 'Menu & Print',
    emoji: '📋',
    format: '1:1',
    resolution: '2048x2048',

    promptAddition: `
MENU/PRINT OPTIMIZATION:
- High resolution 2048x2048 for print quality
- Consistent lighting style
- Clean, professional presentation
- Color-accurate for print reproduction
- Works for menus, flyers, signage
`,
  },

  'general': {
    id: 'general',
    name: 'General Use',
    emoji: '✨',
    format: '1:1',
    resolution: '1024x1024',

    promptAddition: `
GENERAL USE OPTIMIZATION:
- Versatile square 1:1 format
- Works for any platform
- Professional quality
- Easy to crop to other formats if needed
`,
  },
}
```

### 9.3 Mood Recipes

```typescript
const moodRecipes = {
  'bright': {
    id: 'bright',
    name: 'Bright & Fresh',
    emoji: '☀️',

    lighting: 'bright even studio lighting, high-key illumination, minimal shadows',
    color: 'cool fresh tones at 5500K, crisp clean colors, +5 saturation',
    background: 'bright-airy, minimal-white',
    style: 'contemporary bright aesthetic, fresh and cheerful',
    realism: 'minimal grain, clean polished look',

    promptAddition: `
MOOD: BRIGHT & FRESH
- High-key bright lighting
- Cool, crisp 5500K color temperature
- Minimal shadows, even illumination
- Fresh, cheerful, summer feeling
- Clean, polished aesthetic
`,
  },

  'warm': {
    id: 'warm',
    name: 'Warm & Cozy',
    emoji: '🔥',

    lighting: 'warm amber lighting, soft directional shadows',
    color: 'warm inviting tones at 4500K, golden amber warmth',
    background: 'rustic-wood, warm natural surfaces',
    style: 'cozy inviting aesthetic, comfort food appeal',
    realism: 'subtle grain, authentic warmth',

    promptAddition: `
MOOD: WARM & COZY
- Warm amber lighting
- Golden 4500K color temperature
- Soft, inviting shadows
- Comfort food atmosphere
- Homestyle, welcoming feeling
`,
  },

  'elegant': {
    id: 'elegant',
    name: 'Dark & Elegant',
    emoji: '🌙',

    lighting: 'dramatic side lighting, deep shadows, chiaroscuro',
    color: 'rich deep tones at 4800K, moody contrast',
    background: 'dark-moody, black or deep brown',
    style: 'fine dining editorial, sophisticated drama',
    realism: 'subtle grain, velvety shadows',

    promptAddition: `
MOOD: DARK & ELEGANT
- Dramatic side lighting
- Deep shadows, Rembrandt style
- Rich, dark color palette at 4800K
- Fine dining sophistication
- Editorial magazine quality
`,
  },

  'natural': {
    id: 'natural',
    name: 'Natural Light',
    emoji: '🪟',

    lighting: 'natural window light from side, soft diffused daylight',
    color: 'authentic natural tones at 5200K, true-to-life colors',
    background: 'contextual, natural setting',
    style: 'authentic natural photography, unprocessed feel',
    realism: 'natural grain, organic texture, authentic imperfection',

    promptAddition: `
MOOD: NATURAL LIGHT
- Natural window light from side
- Soft, authentic 5200K daylight
- True-to-life colors
- Unprocessed, organic feeling
- Real, approachable aesthetic
`,
  },

  'auto': {
    id: 'auto',
    name: 'Auto (Recommended)',
    emoji: '✨',

    // Inherits from businessType
    promptAddition: `
MOOD: AUTO-OPTIMIZED
Apply the most appropriate mood based on:
- The food type detected in the image
- The business type selected
- Best practices for professional food photography
`,
  },
}
```

### 9.4 Seasonal Recipes

```typescript
const seasonalRecipes = {
  'christmas': {
    id: 'christmas',
    name: 'Christmas',
    emoji: '🎄',

    color: 'warm festive palette at 4000K, rich red and green accents, cozy golden warmth',
    props: 'pine branches, cinnamon sticks, red berries, candles',
    mood: 'cozy winter holiday atmosphere',

    promptAddition: `
SEASONAL: CHRISTMAS
- Warm festive color palette at 4000K
- Rich red and green accent colors
- Cozy golden candlelight warmth
- Holiday bokeh lights in background
- Pine, cinnamon, cranberry props
- Gift-wrapped, winter comfort feeling

IMPORTANT: Add seasonal elements as ACCENTS only.
Keep the original food as the hero - do not replace it.
`,
  },

  'cny': {
    id: 'cny',
    name: 'Chinese New Year',
    emoji: '🧧',

    color: 'prosperous red and gold at 4500K, rich auspicious colors',
    props: 'mandarin oranges, red envelopes, gold ingots, lanterns',
    mood: 'prosperity, celebration, reunion',

    promptAddition: `
SEASONAL: CHINESE NEW YEAR
- Rich red and gold color scheme
- Prosperous 4500K warm tones
- Mandarin oranges, red envelopes as props
- Lanterns, gold accents
- Reunion dinner abundance
- Auspicious, celebratory atmosphere

IMPORTANT: Add seasonal elements as ACCENTS only.
Keep the original food as the hero - do not replace it.
`,
  },

  'valentines': {
    id: 'valentines',
    name: "Valentine's Day",
    emoji: '💝',

    color: 'romantic pink and red, soft warm glow',
    props: 'rose petals, hearts, chocolates, champagne hints',
    mood: 'romantic, intimate, indulgent',

    promptAddition: `
SEASONAL: VALENTINE'S DAY
- Romantic pink and red palette
- Soft warm glowing light
- Rose petals, heart motifs
- Intimate couple-dining atmosphere
- Love and indulgence visual messaging

IMPORTANT: Add seasonal elements as ACCENTS only.
Keep the original food as the hero - do not replace it.
`,
  },

  'hari-raya': {
    id: 'hari-raya',
    name: 'Hari Raya',
    emoji: '🌙',

    color: 'elegant green and gold at 4800K, warm festive tones',
    props: 'ketupat, pelita lights, Islamic geometric patterns',
    mood: 'family gathering, celebration, elegance',

    promptAddition: `
SEASONAL: HARI RAYA
- Elegant green and gold palette
- Warm festive tones at 4800K
- Ketupat, lemang, rendang styling
- Pelita (oil lamps), geometric patterns
- Open house abundance
- Family reunion warmth

IMPORTANT: Add seasonal elements as ACCENTS only.
Keep the original food as the hero - do not replace it.
`,
  },

  'deepavali': {
    id: 'deepavali',
    name: 'Deepavali',
    emoji: '🪔',

    color: 'vibrant jewel tones at 4500K, orange, purple, gold',
    props: 'diyas (oil lamps), rangoli patterns, flower garlands, marigolds',
    mood: 'festival of lights, joyful celebration',

    promptAddition: `
SEASONAL: DEEPAVALI
- Vibrant jewel-tone colors
- Rich orange, purple, gold at 4500K
- Diyas (oil lamps) with warm glow
- Rangoli patterns, flower garlands
- Festival of lights atmosphere
- Joyful celebration energy

IMPORTANT: Add seasonal elements as ACCENTS only.
Keep the original food as the hero - do not replace it.
`,
  },

  'mid-autumn': {
    id: 'mid-autumn',
    name: 'Mid-Autumn',
    emoji: '🥮',

    color: 'warm golden autumn at 4500K, harvest moon palette',
    props: 'lanterns, mooncakes, pomelo, lotus seeds',
    mood: 'family reunion, nostalgic, elegant',

    promptAddition: `
SEASONAL: MID-AUTUMN FESTIVAL
- Warm golden autumn tones at 4500K
- Harvest moon color palette
- Lanterns, mooncakes as hero elements
- Pomelo, lotus seeds, tea as props
- Full moon aesthetic
- Nostalgic family reunion mood

IMPORTANT: Add seasonal elements as ACCENTS only.
Keep the original food as the hero - do not replace it.
`,
  },
}
```

---

## 10. Implementation Tasks

### Phase 1: Core System (Priority: High)

- [ ] **Task 1.1**: Create new `simplified-styles.ts` with MVP categories
- [ ] **Task 1.2**: Create `smart-defaults.ts` with default mappings
- [ ] **Task 1.3**: Create `conflict-rules.ts` with conflict prevention logic
- [ ] **Task 1.4**: Update `multi-style-prompt-builder.ts` to use new system
- [ ] **Task 1.5**: Create `prompt-elements.ts` with 8 professional elements

### Phase 2: UI Updates (Priority: High)

- [ ] **Task 2.1**: Simplify style selection UI component
- [ ] **Task 2.2**: Add progressive disclosure (More Options toggle)
- [ ] **Task 2.3**: Add conflict warning/prevention in UI
- [ ] **Task 2.4**: Add "Auto (Recommended)" options

### Phase 3: Recipe Updates (Priority: Medium)

- [ ] **Task 3.1**: Update all businessType recipes with 8 elements
- [ ] **Task 3.2**: Update useCase recipes with format specifications
- [ ] **Task 3.3**: Update mood recipes with technical mappings
- [ ] **Task 3.4**: Update seasonal recipes with accent-only approach

### Phase 4: Testing (Priority: High)

- [ ] **Task 4.1**: Test zero-selection flow produces good results
- [ ] **Task 4.2**: Test each businessType default
- [ ] **Task 4.3**: Test conflict prevention blocks incompatible selections
- [ ] **Task 4.4**: Test seasonal themes apply as accents only
- [ ] **Task 4.5**: Test format outputs for each useCase

### Phase 5: Advanced Options (Priority: Low)

- [ ] **Task 5.1**: Add expandable Advanced Options section
- [ ] **Task 5.2**: Wire hidden options (specific platforms, techniques)
- [ ] **Task 5.3**: Add user preference saving

---

## 11. Files to Modify

### New Files to Create

| File | Purpose |
|------|---------|
| `/lib/simplified-styles.ts` | New simplified category definitions |
| `/lib/smart-defaults.ts` | Smart default mappings |
| `/lib/conflict-rules.ts` | Conflict detection and prevention |
| `/lib/prompt-elements.ts` | 8 professional photography elements |

### Existing Files to Update

| File | Changes |
|------|---------|
| `/lib/styles-data.ts` | Add `hidden` flag to advanced options |
| `/lib/style-prompts.ts` | Update with 8-element prompts |
| `/lib/multi-style-prompt-builder.ts` | Integrate new system |
| `/lib/ai/angle-aware-styles.ts` | Keep, integrate with new system |
| `/components/editor/style-selector.tsx` | Simplified UI |

### Files to Review

| File | Purpose |
|------|---------|
| `/app/api/ai/enhance/route.ts` | Main enhancement endpoint |
| `/app/api/ai/generate/route.ts` | Generation endpoint |

---

## Appendix A: Before/After Comparison

### Before (Current)

```
User sees:
├── Venue Type (7 options) - REQUIRED
├── Delivery Platform (6 options)
├── Social Platform (7 options, multi-select)
├── Seasonal (6 options)
├── Background Style (8 options)
└── Photography Style (7 options, multi-select)

Total: 41 options across 6 categories
Average user confusion: HIGH
Risk of conflicting selections: HIGH
```

### After (MVP)

```
User sees:
├── What type of food? (5 options) - REQUIRED
├── Where will you use this? (5 options)
├── [More Options]
│   ├── What mood/look? (5 options)
│   └── Seasonal Theme (6 options, collapsed)
└── [Advanced Options] (hidden by default)
    └── (23 hidden options for power users)

Total visible: 15 options across 3 categories
Average user confusion: LOW
Risk of conflicting selections: PREVENTED
```

---

## Appendix B: Quick Reference

### Minimum Viable Selection

```typescript
// User selects ONLY business type
{
  businessType: 'hawker'
}

// System auto-applies:
{
  useCase: 'general',
  format: '1:1',
  mood: 'warm', // inherited from hawker defaults
  lens: '50mm',
  aperture: 'f/4',
  angle: '45-degree',
  lighting: 'warm mixed lighting',
  color: '4500K warm vibrant',
  style: 'authentic documentary',
  realism: 'natural grain',
}
```

### Full Selection

```typescript
// User selects everything
{
  businessType: 'cafe',
  useCase: 'instagram',
  mood: 'bright',
  seasonal: 'valentines',
}

// System combines:
{
  // From businessType: cafe
  lens: '85mm lens',
  aperture: 'f/2.8',

  // From useCase: instagram
  format: '4:5',
  resolution: '1080x1350',

  // From mood: bright (overrides cafe defaults)
  lighting: 'high-key bright lighting',
  color: '5500K crisp fresh',

  // From seasonal: valentines (added as accent)
  props: 'rose petals, hearts',
  colorAccent: 'pink and red accents',
}
```

---

*Document created: 2025-12-20*
*Last updated: 2025-12-20*
*Version: 1.0*
