# Prompt Optimization Implementation Plan

## Overview

This document outlines the current prompt architecture, explains the purpose of each function, and provides an optimized version that reduces token count by ~40% while preserving all critical instructions.

---

## Part 1: Why Two Functions Exist

### Current Architecture

```
User Selection → buildSimplifiedPrompt() → buildSmartPrompt() → AI
                 (Wrapper Layer)           (Core Builder)
```

### Function Purposes

| Function | File | Purpose | Responsibility |
|----------|------|---------|----------------|
| `buildSmartPrompt()` | `smart-defaults.ts` | **Core builder** | Converts photography elements to prompt text |
| `buildSimplifiedPrompt()` | `multi-style-prompt-builder.ts` | **Wrapper** | Adds validation, format, custom instructions |

### Why This Separation?

**1. Single Responsibility Principle**
- `buildSmartPrompt()` focuses ONLY on converting 8 photography elements to text
- `buildSimplifiedPrompt()` handles meta-concerns: validation, warnings, format output

**2. Reusability**
- `buildSmartPrompt()` can be called directly for simple use cases
- `buildSimplifiedPrompt()` wraps it with additional features when needed

**3. Legacy Compatibility**
- The old system (`buildMultiStylePrompt()`) coexists in the same file
- The new simplified system was added without breaking existing code

### Data Flow Diagram

```
SimpleSelection {
  businessType: 'cafe'
  format: 'square'
  mood: 'warm'
  seasonal: 'christmas'
}
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│ buildSimplifiedPrompt() [multi-style-prompt-builder.ts]     │
│                                                             │
│  1. validateSelection() → warnings[]                        │
│  2. getFormatConfig() → {width, height, aspectRatio}        │
│  3. buildSmartPrompt(selection) ──────┐                     │
│  4. Append custom instructions        │                     │
│  5. Append format specs               │                     │
│  6. Append verification checklist     │                     │
│                                       │                     │
│  Returns: SimplifiedPromptResult      │                     │
└───────────────────────────────────────┼─────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────┐
│ buildSmartPrompt() [smart-defaults.ts]                      │
│                                                             │
│  1. getCompleteDefaults(selection)                          │
│     ├─ Get base from businessTypeDefaults[cafe]             │
│     ├─ Apply moodOverrides[warm] (4 elements)               │
│     ├─ Get formatAdditions[square]                          │
│     └─ Get seasonalAdditions[christmas]                     │
│                                                             │
│  2. Build prompt sections:                                  │
│     ├─ Header + Absolute Rules                              │
│     ├─ Style Selection (USER'S CHOICES)                     │
│     ├─ Technical Specifications (8 elements)                │
│     ├─ Output Format                                        │
│     ├─ Seasonal Theme (if present)                          │
│     └─ Verification Checklist                               │
│                                                             │
│  Returns: string (prompt text)                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Part 2: Current Token Analysis

### Token Count by Section (Estimated)

| Section | Current Tokens | Notes |
|---------|----------------|-------|
| Header + Absolute Rules | ~200 | Has "NO HUMANS" rule |
| Style Selection | ~80 | Business type, mood, seasonal, format |
| Technical Specifications | ~150 | 8 photography elements |
| Format Specification | ~60 | Composition, framing |
| Seasonal Theme | ~80 | If present |
| Verification Checklist | ~100 | Duplicated in both functions |
| **TOTAL (Venue Style)** | **~670** | |

### Enhance Route Generation Prompt (Additional)

| Section | Current Tokens | Notes |
|---------|----------------|-------|
| Main instruction | ~400 | Angle detection, physics |
| Custom background (if describe mode) | ~150 | User's description |
| **TOTAL (Generation)** | **~550** | |

### Combined Total: ~1,200 tokens per image

---

## Part 3: Optimization Opportunities

### Issue 1: Duplicated Verification Checklists

**Current**: Both `buildSmartPrompt()` and `buildSimplifiedPrompt()` add verification checklists
- `buildSmartPrompt()` adds one (lines 445-460)
- `buildSimplifiedPrompt()` adds another (lines 582-598)

**Fix**: Remove from `buildSmartPrompt()`, keep only in wrapper

### Issue 2: Verbose Technical Specifications

**Current** (8 lines, ~150 tokens):
```
LENS: 100mm macro lens
APERTURE: f/4
DEPTH OF FIELD: shallow depth of field, sharp focus on main subject...
CAMERA ANGLE: 45-degree camera angle, three-quarter view...
LIGHTING: soft diffused natural light from the side, gentle shadows...
COLOR: natural color balance at 5000K, slightly warm tones...
STYLE: contemporary professional food photography, clean modern...
REALISM: subtle fine film grain, natural optical vignette...
```

**Optimized** (4 lines, ~80 tokens):
```
CAMERA: 100mm f/4, shallow DOF, 45° angle
LIGHTING: Soft diffused side light, gentle shadows, bright highlights
COLOR: 5000K natural, warm tones, vibrant saturation
AESTHETIC: Contemporary professional, clean modern, subtle grain
```

### Issue 3: Redundant Instructions

**Current**: Multiple repetitions of "keep same food/plates/arrangement"
- Header: "KEEP the exact same food items..."
- Seasonal: "DO NOT replace or modify the original food"
- Verification: "Same food items as input image"

**Optimized**: Single clear instruction at top, reference ID in sections

### Issue 4: Verbose Format Specifications

**Current** (lines 418-427, ~60 tokens):
```
═══════════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT: 1:1 (1024x1024px)
═══════════════════════════════════════════════════════════════════════════════

Square 1:1 composition, dish centered with balanced margins
Food fills 80% of frame, leave margins for app UI elements

Note: Optimized for delivery apps and menu displays. Clean, focused presentation.
```

**Optimized** (25 tokens):
```
FORMAT: 1:1 (1024×1024) | Center dish, 80% fill, margins for UI
```

---

## Part 4: Optimized Prompt Structure

### New `buildSmartPrompt()` (Optimized)

```typescript
export function buildSmartPrompt(selection: SimpleSelection): string {
  const defaults = getCompleteDefaults(selection)
  const { elements, format, seasonal } = defaults

  const businessType = selection.businessType || 'restaurant'
  const mood = selection.mood && selection.mood !== 'auto'
    ? selection.mood.toUpperCase()
    : 'AUTO'

  let prompt = `
═══════════════════════════════════════════════════════════════════════════════
FOODSNAP AI PHOTO ENHANCEMENT
═══════════════════════════════════════════════════════════════════════════════

ROLE: Professional food photography retoucher

PRESERVATION RULES [CRITICAL]:
• KEEP original food, plates, dishes, arrangement
• ONLY enhance: lighting, colors, textures, background, polish
• Make food MORE appetizing, not different
• NO HUMANS (remove any visible people/hands/arms)

═══════════════════════════════════════════════════════════════════════════════
CLIENT SELECTIONS (MUST APPLY)
═══════════════════════════════════════════════════════════════════════════════
Business: ${businessType.toUpperCase()} | Mood: ${mood} | Format: ${format.aspectRatio}
${seasonal ? `Seasonal: ${selection.seasonal?.toUpperCase()}` : ''}

═══════════════════════════════════════════════════════════════════════════════
TECHNICAL SPECS
═══════════════════════════════════════════════════════════════════════════════
CAMERA: ${elements.lens}, ${elements.aperture}, ${elements.depthOfField.split(',')[0]}
ANGLE: ${elements.angle.split(',')[0]}
LIGHTING: ${elements.lighting.split(',').slice(0, 2).join(', ')}
COLOR: ${elements.color.split(',').slice(0, 2).join(', ')}
AESTHETIC: ${elements.style.split(',')[0]}, ${elements.realism.split(',')[0]}

FORMAT: ${format.aspectRatio} (${format.width}×${format.height}) | ${format.addition.framing}`

  // Seasonal (condensed)
  if (seasonal) {
    prompt += `

SEASONAL ACCENT [${selection.seasonal?.toUpperCase()}]:
Props: ${seasonal.props.replace('Style with ', '').replace(' accents: ', ': ')}
Color: ${seasonal.colorAccent.replace('Add ', '')}
⚠️ Add as ACCENTS only - preserve original food`
  }

  return prompt
}
```

### Token Comparison

| Section | Before | After | Savings |
|---------|--------|-------|---------|
| Header + Rules | 200 | 100 | 50% |
| Style Selection | 80 | 40 | 50% |
| Technical Specs | 150 | 80 | 47% |
| Format | 60 | 25 | 58% |
| Seasonal | 80 | 50 | 38% |
| **TOTAL** | **570** | **295** | **48%** |

---

## Part 5: Implementation Steps

### Step 1: Update `smart-defaults.ts`

1. Replace verbose `buildSmartPrompt()` with optimized version
2. Remove verification checklist (handled by wrapper)
3. Condense photography element descriptions

### Step 2: Update `multi-style-prompt-builder.ts`

1. Remove duplicate format specification (already in `buildSmartPrompt`)
2. Simplify verification checklist
3. Remove redundant preservation warnings

### Step 3: Update `enhance/route.ts`

1. Condense generation prompt
2. Remove redundant angle detection explanations
3. Use shorthand for physics constraints

### Step 4: Test & Validate

1. Generate images with all business types
2. Verify mood overrides still apply
3. Verify seasonal themes still work
4. Check output quality matches pre-optimization

---

## Part 6: Recommended Optimized Files

### File 1: `/lib/smart-defaults-optimized.ts`

See implementation below.

### File 2: Verification Checklist (Moved to Wrapper Only)

```typescript
// Only in buildSimplifiedPrompt(), NOT in buildSmartPrompt()
const verificationChecklist = `
═══════════════════════════════════════════════════════════════════════════════
VERIFY BEFORE OUTPUT
═══════════════════════════════════════════════════════════════════════════════
✓ Same food/plates/arrangement as input
✓ Enhanced lighting/colors applied
✓ Professional, appetizing appearance
✓ Correct aspect ratio: ${formatConfig.aspectRatio}`
```

---

## Part 7: Risk Assessment

| Risk | Mitigation |
|------|------------|
| AI misunderstands condensed specs | Keep critical terms (aperture, DOF) explicit |
| Style quality degrades | A/B test before/after with same images |
| Seasonal props not applied | Keep seasonal section separate with ⚠️ warning |
| Format dimensions wrong | Keep exact pixel values |

---

## Appendix: Quick Reference

### 8 Photography Elements

1. **Lens**: Focal length (50mm, 85mm, 100mm macro)
2. **Aperture**: f-stop (f/2.8, f/4)
3. **Depth of Field**: Shallow/moderate, bokeh
4. **Angle**: 45°, overhead, eye-level
5. **Lighting**: Natural, studio, mixed
6. **Color**: Color temperature (4500K-5500K), saturation
7. **Style**: Documentary, commercial, lifestyle
8. **Realism**: Grain, texture, vignette

### Business Type Defaults

| Type | Lens | Aperture | Angle | Lighting | Color Temp |
|------|------|----------|-------|----------|------------|
| Restaurant | 100mm | f/4 | 45° | Soft diffused | 5000K |
| Cafe | 85mm | f/2.8 | 45° | Window light | 5200K |
| Hawker | 50mm | f/4 | 45° | Mixed warm | 4500K |
| Fast Food | 85mm | f/4 | 45° | Bright studio | 5000K |
| Dessert | 100mm | f/2.8 | 45° | High-key | 5200K |

### Mood Overrides (4 Elements)

| Mood | Lighting | Color | Style | Realism |
|------|----------|-------|-------|---------|
| Bright | High-key studio | Cool 5500K | Contemporary | Minimal grain |
| Warm | Amber directional | Warm 4500K | Cozy | Subtle grain |
| Elegant | Chiaroscuro side | Rich 4800K | Editorial | Velvety shadows |
| Natural | Window diffused | True 5200K | Organic | Natural grain |

---

*Created: 2025-12-24*
*Author: Claude Code*
