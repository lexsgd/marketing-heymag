# Food Photography Prompt Elements - Technical Specification

**Created**: 2025-12-20
**Purpose**: Reference document for implementing professional food photography prompts in FoodSnap AI
**Based on**: Comprehensive research from professional food photographers, AI image generation best practices

---

## Table of Contents

1. [Element Structure Overview](#1-element-structure-overview)
2. [Format Element](#2-format-element)
3. [Lens Element](#3-lens-element)
4. [Aperture / Depth of Field Element](#4-aperture--depth-of-field-element)
5. [Angle Element](#5-angle-element)
6. [Lighting Element](#6-lighting-element)
7. [Color Element](#7-color-element)
8. [Style Element](#8-style-element)
9. [Realism Element](#9-realism-element)
10. [Complete Default Prompt Template](#10-complete-default-prompt-template)
11. [Element Interaction Rules](#11-element-interaction-rules)
12. [Photography Technique Presets](#12-photography-technique-presets)
13. [Implementation Checklist](#13-implementation-checklist)

---

## 1. Element Structure Overview

### The 8 Professional Elements

| # | Element | What It Controls | Default Value |
|---|---------|------------------|---------------|
| 1 | **Format** | Aspect ratio | 1:1 (square) |
| 2 | **Lens** | Focal length | 100mm macro |
| 3 | **Aperture/DoF** | Depth of field | f/4, shallow DoF |
| 4 | **Angle** | Camera position | 45 degrees |
| 5 | **Lighting** | Light setup | Soft diffused side light |
| 6 | **Color** | Temperature & saturation | 5000K, slightly warm |
| 7 | **Style** | Era/aesthetic | Contemporary professional |
| 8 | **Realism** | Imperfections | Subtle grain + vignette |

### Amateur vs Professional Prompts

| Element | Amateur Version | Professional Version |
|---------|-----------------|---------------------|
| **Lens** | "zoom" | "100mm macro lens" |
| **Aperture** | "blurry background" | "f/4 aperture, shallow depth of field" |
| **Angle** | "nice angle" | "45-degree camera angle, three-quarter view" |
| **Lighting** | "good light" | "soft diffused natural light from the side" |
| **Color** | "warm" | "5000K color temperature, slightly warm tones" |
| **Style** | "professional" | "contemporary editorial food photography" |
| **Realism** | (missing) | "subtle film grain, natural optical vignette" |

---

## 2. Format Element

### Default

```
1:1 square format
```

### Why Square as Default

- Universal compatibility across all delivery platforms
- Works well for most food compositions
- Easy to crop to other formats if needed
- Mobile-friendly display

### Platform-Specific Overrides

| Platform Category | Platform | Format Override |
|-------------------|----------|-----------------|
| **Delivery** | GrabFood | 1:1 (stays square) |
| **Delivery** | Foodpanda | 4:3 |
| **Delivery** | Deliveroo | 1:1 (stays square) |
| **Delivery** | GoFood | 1:1 (stays square) |
| **Delivery** | ShopeeFood | 1:1 (stays square) |
| **Social** | Instagram Feed | 4:5 portrait |
| **Social** | Instagram Stories | 9:16 vertical |
| **Social** | Instagram Reels | 9:16 vertical |
| **Social** | TikTok | 9:16 vertical |
| **Social** | Facebook | 16:9 horizontal |
| **Social** | Xiaohongshu | 3:4 portrait |
| **Social** | WeChat | 1:1 (stays square) |

### Prompt Text

```
Format default: (no text needed - handled by image generation parameters)
```

---

## 3. Lens Element

### Default

```
shot with 100mm macro lens
```

### Why 100mm Macro as Default

- Industry standard for food hero shots
- Creates beautiful background compression
- Intimate, detailed perspective
- Creamy bokeh at wider apertures
- Allows shooting from comfortable distance

### Lens Options by Use Case

| Focal Length | Best For | Characteristics |
|--------------|----------|-----------------|
| **35mm** | Flat lays, environmental, table scenes | Wide perspective, shows context |
| **50mm** | Overhead shots, all-rounder | Natural perspective like human eye |
| **85mm** | Hero shots, 45-degree angles | Beautiful compression, intimate |
| **100mm macro** | Detail shots, hero images | Industry standard, creamy backgrounds |

### Auto-Switch Rules (Based on Angle)

| When Angle Is | Lens Changes To | Why |
|---------------|-----------------|-----|
| 90° (Flat lay) | 50mm lens | Natural overhead perspective |
| 45° (Standard) | 100mm macro lens | Best compression for hero shots |
| 0° (Eye level) | 85mm lens | Flattering for tall subjects |

### Prompt Variations

| Context | Prompt Text |
|---------|-------------|
| **Default/Hero** | `shot with 100mm macro lens` |
| **Flat Lay** | `shot with 50mm lens` |
| **Eye Level** | `shot with 85mm lens` |
| **Environmental** | `shot with 35mm lens` |
| **Premium/Editorial** | `shot with Canon EF 100mm f/2.8L Macro IS` |
| **Artistic** | `shot with Zeiss Milvus 100mm f/2 Makro` |

---

## 4. Aperture / Depth of Field Element

### Default

```
f/4 aperture, shallow depth of field, sharp focus on main subject with soft background blur
```

### Why f/4 as Default

- Sweet spot between sharpness and blur
- Main subject crisp, background softened
- Not too shallow (avoids missed focus)
- Not too deep (maintains separation)
- Works for most food types

### Aperture Guide

| Aperture Range | DoF Effect | Best For |
|----------------|------------|----------|
| **f/1.8 - f/2.8** | Very shallow, dramatic blur | Artistic shots, single items, drinks |
| **f/4** | Shallow, balanced | Hero shots, plated dishes |
| **f/5.6** | Moderate | Individual dishes, most foods |
| **f/8** | Deep, mostly sharp | Flat lays, overhead |
| **f/11 - f/16** | Very deep, all sharp | Commercial, packaging, catalogs |

### Auto-Switch Rules (Based on Angle)

| When Angle Is | Aperture Changes To | Why |
|---------------|---------------------|-----|
| 90° (Flat lay) | f/8, deep DoF | Need everything sharp from above |
| 45° (Standard) | f/4, shallow DoF | Balanced subject/background |
| 0° (Eye level) | f/2.8, very shallow DoF | Dramatic separation for tall items |

### Prompt Variations

| Style | Aperture | Prompt Text |
|-------|----------|-------------|
| **Dramatic/Bokeh** | f/1.8 - f/2.8 | `f/2 aperture, extremely shallow depth of field, dreamy bokeh, creamy background blur` |
| **Hero Shot** | f/2.8 - f/4 | `f/4 aperture, shallow depth of field, sharp focus on main subject with soft background blur` |
| **Balanced** | f/5.6 | `f/5.6 aperture, moderate depth of field, most of dish in sharp focus` |
| **Flat Lay** | f/8 | `f/8 aperture, deep depth of field, everything in sharp focus` |
| **Commercial** | f/11 | `f/11 aperture, maximum sharpness throughout, all details crisp` |
| **Macro Detail** | f/5.6 | `f/5.6 aperture with focus stacking, complete sharpness on subject` |

### Focus Point Guidelines

- Always focus on the closest important element to camera
- For tall foods (burgers, cakes): focus on front edge
- For bowls: focus on front rim or garnish
- For flat foods: center or key ingredient

---

## 5. Angle Element

### Default

```
45-degree camera angle, three-quarter view showing both top and side of the dish
```

### Why 45 Degrees as Default

- Most versatile angle for food
- Shows both top and side of dish
- Creates depth and dimension
- Works for 80% of food types
- Natural viewing angle

### The Three Essential Angles

| Angle | Also Called | Best For | When to Use |
|-------|-------------|----------|-------------|
| **0°** | Eye-level, straight-on, hero | Stacked foods | Burgers, layer cakes, sandwiches, drinks, parfaits |
| **45°** | Three-quarter view, 3/4 | Most foods | Bowls, plated dishes, pasta, curries, salads |
| **90°** | Overhead, flat lay, bird's eye | Flat foods | Pizza, cookies, table scenes, ingredient spreads |

### Decision Tree: Which Angle?

```
Is the food TALL with layers?
  YES → Use 0° (eye-level)
  NO ↓

Is the food FLAT with no height?
  YES → Use 90° (overhead)
  NO ↓

Use 45° (three-quarter view)
```

### Prompt Variations

| Angle | Prompt Text |
|-------|-------------|
| **0° Eye-Level** | `straight-on eye-level shot, emphasizing height and layers, front-facing hero angle` |
| **45° Three-Quarter** | `45-degree camera angle, three-quarter view showing both top and side of the dish, depth and dimension` |
| **90° Overhead** | `90-degree overhead flat lay, perfect bird's eye view, top-down perspective` |
| **30° Low Hero** | `30-degree low angle, slight upward perspective, emphasizing presence` |
| **Dutch Angle** | `slight dutch angle tilt, dynamic asymmetric composition` |

### Food Type → Angle Recommendations

| Food Type | Recommended Angle |
|-----------|-------------------|
| Burgers | 0° (eye-level) |
| Layer cakes | 0° (eye-level) |
| Tall drinks/cocktails | 0° or 30° |
| Sandwiches | 0° or 45° |
| Bowls (soup, pasta, salad) | 45° |
| Plated restaurant dishes | 45° |
| Curries with rice | 45° |
| Pizza | 90° (overhead) |
| Cookies/pastries flat | 90° (overhead) |
| Ingredient spreads | 90° (overhead) |
| Table scenes | 90° (overhead) |
| Sushi platters | 45° or 90° |

---

## 6. Lighting Element

### Default

```
soft diffused natural light from the side, gentle shadows with bright highlights, professional lighting
```

### Why Side Light as Default

- Creates dimension and depth
- Reveals texture
- Natural, appetizing look
- Easy to control shadows
- Industry standard

### Light Position Guide (Clock Method)

| Position | Name | Effect | Best For |
|----------|------|--------|----------|
| **9 o'clock** | Pure side | Strong texture, dramatic | Rustic, moody |
| **10-11 o'clock** | Side-back | Dimension + rim light | Most versatile |
| **12 o'clock** | Backlight | Glowing, luminous | Drinks, soups, translucent |
| **2-3 o'clock** | Front-side | Even, minimal shadow | Commercial, clean |

### Light Quality

| Type | Characteristics | Best For |
|------|-----------------|----------|
| **Soft (diffused)** | Gentle shadows, flattering | Default for most food |
| **Hard (direct)** | Dramatic shadows, texture | Rustic, moody, dramatic |

### Prompt Variations

| Lighting Style | Prompt Text |
|----------------|-------------|
| **Natural Window** (default) | `soft natural window light from the side, diffused daylight, gentle shadows with bright highlights` |
| **Studio Softbox** | `professional studio lighting, large softbox from 45 degrees, soft diffused even illumination` |
| **Backlit/Glowing** | `backlit with rim lighting, glowing luminous edges, soft fill from front, ethereal atmosphere` |
| **Dramatic/Rembrandt** | `single directional side light, deep dramatic shadows, chiaroscuro lighting, moody atmosphere` |
| **Golden Hour** | `warm golden hour sunlight, long soft shadows, rich amber glow, sunset warmth` |
| **Bright & Even** | `bright even studio lighting, minimal shadows, high-key clean illumination` |
| **Soft Overhead** | `soft overhead diffused lighting, minimal shadows, even top-down illumination` |

### Lighting Changes by Angle

| When Angle Is | Lighting Adjusts To |
|---------------|---------------------|
| 90° (Flat lay) | Soft overhead or side, even illumination |
| 45° (Standard) | Side or side-back light |
| 0° (Eye level) | Side-back light for rim/separation |

---

## 7. Color Element

### Default

```
natural color balance at 5000K, slightly warm tones, vibrant but natural saturation
```

### Why 5000K as Default

- Neutral daylight standard
- True-to-life food colors
- Works for all cuisines
- Easy to adjust warmer/cooler
- Professional baseline

### Color Temperature Guide

| Kelvin | Description | Creates | Best For |
|--------|-------------|---------|----------|
| **3500-4000K** | Warm/tungsten | Cozy, inviting | Comfort foods, hot dishes, BBQ |
| **4500-5000K** | Warm neutral | Appetizing, balanced | Most foods (default) |
| **5000-5500K** | Neutral daylight | Clean, accurate | Editorial, fresh ingredients |
| **5500-6500K** | Cool/overcast | Fresh, crisp | Salads, cold desserts, summer |

### Saturation Guidelines

| Adjustment | Value | Note |
|------------|-------|------|
| **Saturation** | +5 to +10 max | Very easy to overdo |
| **Vibrance** | +10 to +15 | Safer, more natural |

> **Key Rule**: Keep saturation subtle. Oversaturated food looks fake.

### Prompt Variations

| Context | Prompt Text |
|---------|-------------|
| **Default** | `natural color balance at 5000K, slightly warm tones, vibrant but natural saturation` |
| **Warm Comfort** | `warm inviting color temperature at 4500K, cozy amber tones, appetizing warmth` |
| **Cool Fresh** | `cool fresh tones at 5500K, crisp clean colors, bright and refreshing` |
| **Editorial Neutral** | `precise color accuracy at 5200K, true-to-life colors, balanced neutral white point` |
| **Vibrant Bold** | `enhanced color vibrancy, rich saturated tones, eye-catching bold palette` |
| **Muted Minimal** | `muted desaturated tones, subtle understated color palette, elegant restraint` |
| **Split-Toned** | `warm shadows with cool highlights, cinematic split-tone color grading` |

### Cuisine-Specific Color Recommendations

| Cuisine | Temperature | Color Mood |
|---------|-------------|------------|
| **Italian** | 4500-5000K | Warm, rustic, earthy reds & greens |
| **Asian (general)** | 5000-5500K | Vibrant, varied, bold contrasts |
| **Japanese** | 5200-5500K | Clean, precise, subtle |
| **Mexican** | 4000-4500K | Warm, vivid oranges/reds/yellows |
| **French** | 5000-5500K | Neutral, elegant, refined |
| **Nordic** | 5500-6500K | Cool, minimal, clean |
| **Indian** | 4000-4500K | Warm, rich, saturated |
| **Mediterranean** | 4500-5000K | Warm, sunny, olive/terracotta |
| **American BBQ** | 4000-4500K | Very warm, smoky, rich |

### Seasonal/Festive Color Overrides

| Season/Festival | Color Override Prompt |
|-----------------|----------------------|
| **Christmas** | `warm festive palette at 4000K, rich red and green tones, cozy golden warmth, holiday glow` |
| **Chinese New Year** | `prosperous red and gold tones at 4500K, rich auspicious colors, celebratory warmth` |
| **Valentine's Day** | `romantic pink and red palette, soft warm glow, love-inspired soft tones` |
| **Hari Raya** | `elegant green and gold palette at 4800K, warm festive celebration tones` |
| **Deepavali** | `vibrant jewel tones at 4500K - rich orange, purple, gold - festival of lights warmth` |
| **Mid-Autumn** | `warm golden autumn tones at 4500K, harvest moon palette, nostalgic warmth` |
| **Easter/Spring** | `fresh pastel spring palette at 5200K, soft pink, yellow, green, renewed brightness` |
| **Summer** | `bright sunny tones at 5500K, vibrant fresh colors, cheerful warmth` |

### Venue-Specific Color Overrides

| Venue Type | Color Override Prompt |
|------------|----------------------|
| **Fine Dining** | `sophisticated neutral tones at 5200K, precise color accuracy, subtle elegant restraint` |
| **Fast Food** | `bold punchy saturated colors, high vibrance, energetic appetite-triggering palette` |
| **Cafe** | `soft dreamy tones at 4800K, warm pastel palette, cozy inviting warmth` |
| **Street Food** | `vibrant authentic colors at 5000K, energetic lively palette, raw genuine tones` |
| **Dark Moody** | `rich deep tones, warm shadows with cool highlights, dramatic color depth` |
| **Bright Airy** | `light fresh tones at 5500K, high-key brightness, airy pastel softness` |
| **Rustic** | `earthy warm tones at 4500K, natural organic colors, farmhouse palette` |
| **Tropical** | `saturated tropical colors at 5200K, vivid greens and bright fruit tones, island vibrancy` |

---

## 8. Style Element

### Default

```
contemporary professional food photography style, clean modern aesthetic
```

### Why Contemporary as Default

- Timeless, doesn't date quickly
- Works for all platforms
- Professional but approachable
- Clean and appetizing
- Industry current standard

### Style Era Characteristics

| Era/Style | Key Characteristics |
|-----------|---------------------|
| **1970s Vintage** | Soft focus, warm sepia, heavy grain, vignette, naturalistic |
| **1980s Bold** | High contrast, saturated colors, sharp, glamorous, power aesthetic |
| **1990s Casual** | Low contrast, pastel tones, minimal retouching, raw authentic |
| **2000s Digital** | Clean, polished, subtle HDR, enhanced clarity |
| **Contemporary** | Minimal, intentional, precise, sophisticated |
| **Film Noir** | High contrast B&W, dramatic shadows, moody atmosphere |

### Prompt Variations

| Style | Prompt Text |
|-------|-------------|
| **Contemporary** (default) | `contemporary professional food photography style, clean modern aesthetic, polished finish` |
| **Editorial Magazine** | `high-end editorial food photography, magazine-worthy finish, sophisticated styling` |
| **Rustic Organic** | `rustic organic style, natural textures, earthy artisanal handcrafted feel` |
| **Dark Moody** | `dark moody food photography, deep shadows, dramatic contrast, rich atmospheric depth` |
| **Bright Airy** | `bright airy style, high-key soft lighting, fresh light aesthetic, dreamy atmosphere` |
| **Minimal Clean** | `minimalist clean aesthetic, negative space, simple elegant composition` |
| **Vintage 1970s** | `1970s photography aesthetic, warm sepia tones, soft focus, visible film grain, nostalgic` |
| **Vintage 1990s** | `1990s casual vintage look, low contrast, muted tones, subtle grain, authentic raw texture` |
| **Film Look** | `shot on Kodak Portra 400, analog film aesthetic, natural film color science, organic grain` |
| **Cinematic** | `cinematic food photography, widescreen feel, dramatic lighting, movie-still quality` |

---

## 9. Realism Element

### Default

```
subtle fine film grain, natural optical vignette, authentic photographic texture
```

### Why Add Imperfections

AI-generated images often look "too perfect" which reads as fake. Adding subtle imperfections:
- Creates authentic photographic character
- Breaks the uncanny valley effect
- Adds tactile, analog quality
- Makes images feel "real" and taken by a camera

### Realism Cue Categories

| Category | Specific Imperfections |
|----------|------------------------|
| **Lens Effects** | Subtle vignette, chromatic aberration, lens flare |
| **Film Artifacts** | Film grain, light leaks, halation glow |
| **Camera Character** | Subtle shake, micro-blur, focus falloff |
| **Environmental** | Dust particles, condensation, steam |
| **Exposure** | Highlight bloom, shadow compression |

### Prompt Variations by Level

| Level | Prompt Text |
|-------|-------------|
| **Minimal** | `hint of fine film grain, minimal optical vignette, nearly perfect capture` |
| **Subtle** (default) | `subtle fine film grain, natural optical vignette, authentic photographic texture` |
| **Natural** | `visible film grain, soft vignette, natural lens character, authentic analog photography feel` |
| **Vintage** | `prominent film grain, light leak on corner, chromatic aberration, analog film warmth` |
| **Heavy Analog** | `heavy film grain, scratches, dust particles, strong vignette, vintage film look` |

### Food-Specific Realism Cues

| Food Type | Realism Cue | Prompt Addition |
|-----------|-------------|-----------------|
| **Cold beverages** | Condensation | `realistic condensation droplets on glass surface` |
| **Iced drinks** | Frost | `frost crystals on glass, cold moisture texture` |
| **Hot food** | Steam | `subtle rising steam, wisps of vapor, heat indication` |
| **Hot drinks** | Steam | `gentle steam rising from cup, warmth visible` |
| **Baked goods** | Crumbs | `authentic crumb scatter, natural imperfection` |
| **Saucy dishes** | Drips | `natural sauce drip on plate edge, appetizing imperfection` |
| **Chocolate** | Melt | `slight chocolate melt, tempting texture` |
| **Ice cream** | Melt | `beginning to melt drip, fresh-served moment` |
| **Cheese** | Pull | `cheese pull stretch, melted texture` |
| **Grilled items** | Char | `authentic grill marks, slight char, smoky essence` |

### Technical Imperfection Prompts

| Imperfection | Prompt Text |
|--------------|-------------|
| **Film Grain** | `subtle fine film grain texture, analog noise` |
| **Vignette** | `natural optical vignette, slight corner darkening` |
| **Lens Flare** | `faint lens flare on edge, subtle light interaction` |
| **Chromatic Aberration** | `subtle chromatic aberration on high-contrast edges` |
| **Focus Falloff** | `natural focus falloff, organic depth blur transition` |
| **Highlight Bloom** | `gentle highlight bloom, soft glow on bright areas` |
| **Handshake Blur** | `subtle handshake micro-blur, authentic handheld capture` |

---

## 10. Complete Default Prompt Template

### Master Default Prompt

```
[FOOD DESCRIPTION],

shot with 100mm macro lens at f/4 aperture,
45-degree camera angle with three-quarter view showing depth and dimension,
soft diffused natural light from the side with gentle shadows and bright highlights,
natural color balance at 5000K with slightly warm tones and vibrant but natural saturation,
contemporary professional food photography style with clean modern aesthetic,
shallow depth of field with sharp focus on main subject and soft background blur,
subtle fine film grain with natural optical vignette for authentic photographic texture
```

### Compact Version

```
[FOOD], 100mm macro lens, f/4, 45-degree angle, soft side lighting, 5000K warm tones, contemporary style, shallow DoF, subtle film grain
```

### Element Breakdown

| Element | Default Prompt Portion |
|---------|----------------------|
| **Lens** | `shot with 100mm macro lens` |
| **Aperture** | `at f/4 aperture` |
| **Angle** | `45-degree camera angle with three-quarter view showing depth and dimension` |
| **Lighting** | `soft diffused natural light from the side with gentle shadows and bright highlights` |
| **Color** | `natural color balance at 5000K with slightly warm tones and vibrant but natural saturation` |
| **Style** | `contemporary professional food photography style with clean modern aesthetic` |
| **DoF** | `shallow depth of field with sharp focus on main subject and soft background blur` |
| **Realism** | `subtle fine film grain with natural optical vignette for authentic photographic texture` |

---

## 11. Element Interaction Rules

### What User Selection Affects

| User Selects | Elements That Change |
|--------------|---------------------|
| **Delivery Platform** | Format only |
| **Social Platform** | Format only |
| **Venue Type** | Color, Style |
| **Seasonal/Festive** | Color (temperature + palette) |
| **Background Style** | (Existing prompts - no element change) |
| **Photography Technique** | Angle, Lens, Aperture, Lighting |

### Automatic Adjustment Matrix

When user selects a **Photography Technique**, these elements auto-adjust:

| Technique Selected | Angle | Lens | Aperture | Lighting |
|--------------------|-------|------|----------|----------|
| **Flat Lay Overhead** | 90° | 50mm | f/8 | Even overhead |
| **Three-Quarter Hero** | 45° | 100mm | f/4 | Side light |
| **Eye-Level Hero** | 0° | 85mm | f/2.8 | Side-back light |
| **Natural Light** | 45° | 100mm | f/4 | Window light |
| **Dramatic Moody** | 45° | 85mm | f/2.8 | Single directional |
| **Bokeh Background** | 45° | 85mm | f/1.8 | Backlit |
| **Macro Detail** | 45° | 100mm macro | f/5.6 | Soft even |

### Priority Order (When Conflicts Occur)

1. **Photography Technique** (highest - user's explicit choice)
2. **Delivery Platform** (format requirements)
3. **Social Platform** (format requirements)
4. **Seasonal/Festive** (color overlay)
5. **Venue Type** (style and color base)
6. **Background Style** (existing system)
7. **Defaults** (lowest - fallback)

---

## 12. Photography Technique Presets

### Recommended Technique Options for UI

| Technique Name | ID | Description |
|----------------|-----|-------------|
| **Flat Lay Overhead** | `flat-lay` | Perfect for pizza, cookies, table scenes |
| **Three-Quarter Hero** | `hero-45` | Versatile angle for most dishes |
| **Eye-Level Hero** | `hero-eye` | Best for burgers, cakes, drinks |
| **Natural Light** | `natural-light` | Soft window light feel |
| **Dramatic Moody** | `dramatic` | Dark, high-contrast, editorial |
| **Bokeh Background** | `bokeh` | Dreamy blurred background |
| **Macro Detail** | `macro` | Extreme close-up, texture focus |

### Technique Preset Configurations

```typescript
const techniquePresets = {
  'flat-lay': {
    angle: '90-degree overhead flat lay, perfect bird\'s eye view',
    lens: 'shot with 50mm lens',
    aperture: 'f/8 aperture, deep depth of field, everything sharp',
    lighting: 'soft even overhead lighting, minimal shadows'
  },
  'hero-45': {
    angle: '45-degree camera angle, three-quarter view',
    lens: 'shot with 100mm macro lens',
    aperture: 'f/4 aperture, shallow depth of field',
    lighting: 'soft diffused side lighting, gentle shadows'
  },
  'hero-eye': {
    angle: 'straight-on eye-level shot, emphasizing height',
    lens: 'shot with 85mm lens',
    aperture: 'f/2.8 aperture, very shallow depth of field',
    lighting: 'side-back lighting with rim highlights'
  },
  'natural-light': {
    angle: '45-degree camera angle',
    lens: 'shot with 100mm macro lens',
    aperture: 'f/4 aperture, shallow depth of field',
    lighting: 'natural window light from the side, authentic daylight'
  },
  'dramatic': {
    angle: '45-degree camera angle',
    lens: 'shot with 85mm lens',
    aperture: 'f/2.8 aperture, shallow depth of field',
    lighting: 'single directional side light, deep dramatic shadows, chiaroscuro'
  },
  'bokeh': {
    angle: '45-degree camera angle',
    lens: 'shot with 85mm lens',
    aperture: 'f/1.8 aperture, extremely shallow depth of field, creamy bokeh',
    lighting: 'backlit with glowing rim light, dreamy atmosphere'
  },
  'macro': {
    angle: '45-degree camera angle, extreme close-up',
    lens: 'shot with 100mm macro lens',
    aperture: 'f/5.6 aperture with focus stacking, maximum detail',
    lighting: 'soft even lighting, texture-revealing illumination'
  }
}
```

---

## 13. Implementation Checklist

### Files to Update

- [ ] `/Users/lexnaweiming/Test/marketing-heymag/lib/style-prompts.ts`
- [ ] `/Users/lexnaweiming/Test/marketing-heymag/lib/multi-style-prompt-builder.ts`
- [ ] `/Users/lexnaweiming/Test/marketing-heymag/lib/styles-data.ts` (if technique options need updating)

### Implementation Tasks

1. **Add Default Elements Object**
   - [ ] Create `defaultElements` object with all 8 elements
   - [ ] Each element has default prompt text

2. **Add Element Variation Functions**
   - [ ] `getLensPrompt(angle: string): string`
   - [ ] `getAperturePrompt(angle: string): string`
   - [ ] `getAnglePrompt(technique: string): string`
   - [ ] `getLightingPrompt(technique: string): string`
   - [ ] `getColorPrompt(venue: string, seasonal: string): string`
   - [ ] `getStylePrompt(venue: string): string`
   - [ ] `getRealismPrompt(level: string, foodType?: string): string`

3. **Update Multi-Style Prompt Builder**
   - [ ] Integrate 8 elements into `buildMultiStylePrompt()`
   - [ ] Add element interaction rules
   - [ ] Add technique preset handling

4. **Add Photography Technique Options**
   - [ ] Update UI with new technique choices
   - [ ] Wire techniques to element adjustments

5. **Add Realism Options**
   - [ ] Add realism level selector (minimal/subtle/natural/vintage)
   - [ ] Add food-specific realism cues based on detected food type

### Testing

- [ ] Test default prompt produces good results
- [ ] Test each technique preset
- [ ] Test seasonal color overrides
- [ ] Test venue color/style overrides
- [ ] Test platform format overrides
- [ ] Test realism levels

---

## Appendix: Research Sources

### Lens Recommendations
- Two Loves Studio - Ultimate Guide to Lenses for Food Photography
- Food Photography Academy - Focal Length Explained
- Splento - Best Lens for Food Photography: What the Pros Recommend

### Aperture & Depth of Field
- Two Loves Studio - Best Aperture for Food Photography
- Digital Photography School - Food Photography Settings
- Fstoppers - How to Choose Aperture for Food Photography

### Lighting
- Food Photography Academy - Artificial Light Lighting Setup
- Expert Photography - Food Photography Lighting
- COLBOR - Food Photography Lighting Setups

### Camera Angles
- Samantha Couzens - 45 Degree Angle in Food Photography
- VFlat World - 3 Food Photography Angles You Must Know
- Food Photography Academy - Best Camera Angles

### Color & White Balance
- Furoore - Food Photography White Balance & Color Temperature
- Two Loves Studio - Color Grading in Food Photography
- Happy Kitchen - Color Theory in Food Photography

### AI Realism Techniques
- DigiBizi - The Art of Imperfection: Hyper-Realistic AI Image Prompts
- OverChat AI Hub - How to Make Realistic AI Photos
- Cinem8 - Photorealistic Food Photography with Midjourney

---

*Document created: 2025-12-20*
*Last updated: 2025-12-20*
*Version: 1.0*
