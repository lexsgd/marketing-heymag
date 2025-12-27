# Pro Mode Implementation Plan

> **Document**: PRO_MODE_IMPLEMENTATION_PLAN.md
> **Created**: 2025-12-27
> **Status**: Ready for Implementation

---

## Executive Summary

**Pro Mode** is an **ADDITIVE** enhancement system that works **on top of** the existing smart defaults. It does NOT replace Simple Mode—it extends it with structured, power-user customizations.

---

## Table of Contents

1. [Architecture Decision](#architecture-decision)
2. [Data Model](#data-model)
3. [Prompt Building Logic](#prompt-building-logic)
4. [UI Components](#ui-components)
5. [Context-Aware Suggestions](#context-aware-suggestions)
6. [File-by-File Implementation](#file-by-file-implementation)
7. [Character Limits](#character-limits)
8. [Migration & Backward Compatibility](#migration--backward-compatibility)
9. [Implementation Order](#implementation-order)

---

## Architecture Decision

### Why Additive (NOT Independent)?

| Approach | Pros | Cons | Decision |
|----------|------|------|----------|
| **Independent** | Full control for power users | Loses professional defaults, users must know photography | ❌ Rejected |
| **Additive** | Best of both worlds—smart defaults + customizations | Slightly more complex prompt building | ✅ Chosen |
| **Override** | Selective control | Complex conflict resolution | ❌ Too complex |

### How It Works

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PROMPT ASSEMBLY FLOW                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ LAYER 1: Smart Defaults (ALWAYS Applied)                            │   │
│  │ ─────────────────────────────────────────────────────────────────── │   │
│  │ • 8 Professional Photography Elements (lens, aperture, DOF, etc.)  │   │
│  │ • Based on Business Type (restaurant/cafe/hawker/fastfood/dessert) │   │
│  │ • Modified by Mood (bright/warm/elegant/natural)                    │   │
│  │ • Format composition rules (1:1, 4:5, 9:16, 16:9, 4:3)             │   │
│  │ • Seasonal accents if selected                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                              ↓ ALWAYS                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ LAYER 2A: Simple Mode (Default)                                     │   │
│  │ ─────────────────────────────────────────────────────────────────── │   │
│  │ • Optional single-blob custom prompt (500 chars)                    │   │
│  │ • Generic suggestions                                               │   │
│  │ • Perfect for casual users                                          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                              OR                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ LAYER 2B: Pro Mode (Power Users)                                    │   │
│  │ ─────────────────────────────────────────────────────────────────── │   │
│  │ • Structured sections with higher limits                            │   │
│  │ • Context-aware suggestions                                         │   │
│  │ • Prompt preview                                                    │   │
│  │ • Same smart defaults underneath                                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                              ↓                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ FINAL PROMPT → Gemini                                               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Model

### New Type: `ProModeConfig`

**File**: `/Users/lexnaweiming/Test/marketing-heymag/lib/simplified-styles.ts`

```typescript
/**
 * Pro Mode Configuration
 * Structured customization inputs for power users
 */
export interface ProModeConfig {
  /** Whether Pro Mode is enabled */
  enabled: boolean

  /** Props & Styling instructions (e.g., "Add chopsticks, soy sauce dish, scattered sesame") */
  propsAndStyling?: string

  /** Photography adjustments (e.g., "45-degree angle, shallow depth of field") */
  photographyNotes?: string

  /** Additional composition notes (e.g., "Leave space on left for text overlay") */
  compositionNotes?: string
}

export const defaultProModeConfig: ProModeConfig = {
  enabled: false,
  propsAndStyling: undefined,
  photographyNotes: undefined,
  compositionNotes: undefined,
}
```

### Updated State in Editor

**File**: `/Users/lexnaweiming/Test/marketing-heymag/app/(public)/editor/page.tsx`

```typescript
// Existing state
const [simpleSelection, setSimpleSelection] = useState<SimpleSelection>(...)
const [backgroundConfig, setBackgroundConfig] = useState<BackgroundConfig>(...)
const [customPrompt, setCustomPrompt] = useState('')  // KEEP for Simple Mode

// NEW: Pro Mode state
const [proModeConfig, setProModeConfig] = useState<ProModeConfig>(defaultProModeConfig)
```

### API Payload Changes

```typescript
// Enhanced payload sent to /api/ai/enhance
interface EnhancePayload {
  imageId: string
  simpleSelection: SimpleSelection
  backgroundConfig: BackgroundConfig

  // Simple Mode (existing)
  customPrompt?: string  // Used when proModeConfig.enabled = false

  // Pro Mode (NEW)
  proModeConfig?: ProModeConfig  // Used when proModeConfig.enabled = true
}
```

---

## Prompt Building Logic

### Updated `buildSimplifiedPrompt` Function

**File**: `/Users/lexnaweiming/Test/marketing-heymag/lib/multi-style-prompt-builder.ts`

```typescript
export function buildSimplifiedPrompt(
  selection: SimpleSelection,
  customInstructions?: string,
  proModeConfig?: ProModeConfig,  // NEW parameter
  backgroundDescription?: string  // From BackgroundConfig.description
): SimplifiedPromptResult {

  // 1. Build base smart prompt (ALWAYS - unchanged)
  let prompt = buildSmartPrompt(selection)

  // 2. Add background description if provided
  if (backgroundDescription) {
    prompt += `

───────────────────────────────────────────────────────────────────────────────
BACKGROUND STYLING
───────────────────────────────────────────────────────────────────────────────
${backgroundDescription}`
  }

  // 3A. If Pro Mode enabled, add structured sections
  if (proModeConfig?.enabled) {
    prompt += buildProModeSection(proModeConfig)
  }
  // 3B. Else if Simple Mode with custom prompt, add as single blob
  else if (customInstructions) {
    prompt += `

───────────────────────────────────────────────────────────────────────────────
CUSTOM INSTRUCTIONS
───────────────────────────────────────────────────────────────────────────────
${customInstructions}`
  }

  // 4. Add verification checklist (unchanged)
  prompt += buildVerificationChecklist(selection)

  return { prompt, ... }
}

/**
 * Build Pro Mode section with structured instructions
 */
function buildProModeSection(config: ProModeConfig): string {
  const sections: string[] = []

  if (config.propsAndStyling?.trim()) {
    sections.push(`PROPS & STYLING:
${config.propsAndStyling.trim()}
• Place props naturally around the food
• Ensure props match the scene's lighting and shadows
• Don't obscure the main food item`)
  }

  if (config.photographyNotes?.trim()) {
    sections.push(`PHOTOGRAPHY ADJUSTMENTS:
${config.photographyNotes.trim()}
• Apply these specific camera/lighting adjustments
• Override default settings where specified`)
  }

  if (config.compositionNotes?.trim()) {
    sections.push(`COMPOSITION NOTES:
${config.compositionNotes.trim()}`)
  }

  if (sections.length === 0) return ''

  return `

═══════════════════════════════════════════════════════════════════════════════
PRO MODE CUSTOMIZATIONS [Apply These Specific Instructions]
═══════════════════════════════════════════════════════════════════════════════

${sections.join('\n\n')}`
}
```

---

## UI Components

### Component 1: Pro Mode Toggle & Container

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Background  Optional  [●]                    🖼️                              │
│ "Can you create a background th..."                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐│
│ │ ✨ Pro Customizations                                    [ Simple | Pro ]││
│ │ ───────────────────────────────────────────────────────────────────────│ │
│ │                                                                         │ │
│ │ When SIMPLE selected:                                                   │ │
│ │ ┌─────────────────────────────────────────────────────────────────────┐│ │
│ │ │ Describe your image (optional)                               45/500 ││ │
│ │ │ ┌─────────────────────────────────────────────────────────────────┐│ │ │
│ │ │ │ Make it look warm and cozy...                                   ││ │ │
│ │ │ └─────────────────────────────────────────────────────────────────┘│ │ │
│ │ │ 💡 warm lighting • appetizing • professional                       │ │ │
│ │ └─────────────────────────────────────────────────────────────────────┘│ │
│ │                                                                         │ │
│ │ When PRO selected:                                                      │ │
│ │ ┌─────────────────────────────────────────────────────────────────────┐│ │
│ │ │ 🍽️ Props & Styling                                         120/500  ││ │
│ │ │ ┌─────────────────────────────────────────────────────────────────┐│ │ │
│ │ │ │ Add chopsticks on the left, small soy sauce dish...            ││ │ │
│ │ │ └─────────────────────────────────────────────────────────────────┘│ │ │
│ │ │ 💡 chopsticks • sauce dish • napkin • utensils                     │ │ │
│ │ └─────────────────────────────────────────────────────────────────────┘│ │
│ │                                                                         │ │
│ │ ┌─────────────────────────────────────────────────────────────────────┐│ │
│ │ │ 📷 Photography Style                                        80/300  ││ │
│ │ │ ┌─────────────────────────────────────────────────────────────────┐│ │ │
│ │ │ │ Shallow depth of field, soft shadows...                        ││ │ │
│ │ │ └─────────────────────────────────────────────────────────────────┘│ │ │
│ │ │ 💡 45° angle • overhead • shallow DOF • bokeh                      │ │ │
│ │ └─────────────────────────────────────────────────────────────────────┘│ │
│ │                                                                         │ │
│ │ ┌─────────────────────────────────────────────────────────────────────┐│ │
│ │ │ 📐 Composition Notes (optional)                              0/200  ││ │
│ │ │ ┌─────────────────────────────────────────────────────────────────┐│ │ │
│ │ │ │ Leave space on the right for text overlay                      ││ │ │
│ │ │ └─────────────────────────────────────────────────────────────────┘│ │ │
│ │ └─────────────────────────────────────────────────────────────────────┘│ │
│ │                                                                         │ │
│ │ ┌─────────────────────────────────────────────────────────────────────┐│ │
│ │ │ 👁️ Preview Final Prompt                                [Expand ▾] ││ │
│ │ │─────────────────────────────────────────────────────────────────────│ │
│ │ │ BUSINESS: RESTAURANT | MOOD: WARM | FORMAT: 1:1                    │ │
│ │ │ + Props: chopsticks, soy sauce dish                                │ │
│ │ │ + Photo: Shallow DOF, soft shadows                                 │ │
│ │ │ ───────────────────────────────────────────────────────────────────│ │
│ │ │ Estimated tokens: ~850                                             │ │
│ │ └─────────────────────────────────────────────────────────────────────┘│ │
│ └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Component 2: PromptSection (Reusable)

**File**: `/Users/lexnaweiming/Test/marketing-heymag/components/editor/prompt-section.tsx`

```tsx
interface PromptSectionProps {
  icon: string
  title: string
  placeholder: string
  value: string
  onChange: (value: string) => void
  maxChars: number
  suggestions: string[]
  helpText?: string
}

export function PromptSection({
  icon,
  title,
  placeholder,
  value,
  onChange,
  maxChars,
  suggestions,
  helpText,
}: PromptSectionProps) {
  const charCount = value.length
  const isOverLimit = charCount > maxChars

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span>{icon}</span>
          <span className="text-sm font-medium">{title}</span>
        </div>
        <span className={cn(
          "text-xs",
          isOverLimit ? "text-destructive" : "text-muted-foreground"
        )}>
          {charCount}/{maxChars}
        </span>
      </div>

      {/* Textarea */}
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-h-[80px] resize-none text-sm"
        maxLength={maxChars + 50}
      />

      {/* Quick Suggestions */}
      <div className="flex flex-wrap gap-1.5">
        <span className="text-xs text-muted-foreground">💡</span>
        {suggestions.map((suggestion, idx) => (
          <button
            key={idx}
            onClick={() => {
              const newValue = value ? `${value}, ${suggestion}` : suggestion
              onChange(newValue)
            }}
            className="text-xs px-2 py-0.5 rounded-full bg-muted hover:bg-muted/80 transition-colors"
          >
            {suggestion}
          </button>
        ))}
      </div>

      {/* Help Text */}
      {helpText && (
        <p className="text-xs text-muted-foreground/70">{helpText}</p>
      )}
    </div>
  )
}
```

### Component 3: PromptPreview

**File**: `/Users/lexnaweiming/Test/marketing-heymag/components/editor/prompt-preview.tsx`

```tsx
interface PromptPreviewProps {
  selection: SimpleSelection
  backgroundConfig: BackgroundConfig
  proModeConfig: ProModeConfig
  expanded?: boolean
  onToggle?: () => void
}

export function PromptPreview({
  selection,
  backgroundConfig,
  proModeConfig,
  expanded = false,
  onToggle,
}: PromptPreviewProps) {
  // Build preview of what will be sent
  const preview = useMemo(() => {
    const parts: string[] = []

    // Base settings
    parts.push(`BUSINESS: ${(selection.businessType || 'restaurant').toUpperCase()}`)
    parts.push(`MOOD: ${(selection.mood || 'auto').toUpperCase()}`)
    parts.push(`FORMAT: ${selection.format || '1:1'}`)
    if (selection.seasonal && selection.seasonal !== 'none') {
      parts.push(`SEASONAL: ${selection.seasonal.toUpperCase()}`)
    }

    // Background
    if (backgroundConfig.mode === 'describe' && backgroundConfig.description) {
      parts.push(`+ Background: ${backgroundConfig.description.substring(0, 50)}...`)
    }

    // Pro Mode sections
    if (proModeConfig.enabled) {
      if (proModeConfig.propsAndStyling) {
        parts.push(`+ Props: ${proModeConfig.propsAndStyling.substring(0, 50)}...`)
      }
      if (proModeConfig.photographyNotes) {
        parts.push(`+ Photo: ${proModeConfig.photographyNotes.substring(0, 50)}...`)
      }
    }

    return parts
  }, [selection, backgroundConfig, proModeConfig])

  // Estimate token count
  const estimatedTokens = useMemo(() => {
    let base = 600 // Smart defaults base
    if (backgroundConfig.description) base += Math.ceil(backgroundConfig.description.length / 4)
    if (proModeConfig.propsAndStyling) base += Math.ceil(proModeConfig.propsAndStyling.length / 4)
    if (proModeConfig.photographyNotes) base += Math.ceil(proModeConfig.photographyNotes.length / 4)
    return base
  }, [backgroundConfig, proModeConfig])

  return (
    <div className="border rounded-lg bg-muted/30">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 text-left"
      >
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Preview Final Prompt</span>
        </div>
        <ChevronDown className={cn(
          "h-4 w-4 transition-transform",
          expanded && "rotate-180"
        )} />
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-2">
          <div className="text-xs font-mono bg-background rounded p-2 space-y-1">
            {preview.map((line, idx) => (
              <div key={idx} className="text-muted-foreground">{line}</div>
            ))}
          </div>
          <div className="text-xs text-muted-foreground">
            Estimated tokens: ~{estimatedTokens}
          </div>
        </div>
      )}
    </div>
  )
}
```

---

## Context-Aware Suggestions

**File**: `/Users/lexnaweiming/Test/marketing-heymag/lib/pro-mode-suggestions.ts`

```typescript
export const proModeSuggestions = {
  propsAndStyling: {
    restaurant: [
      "elegant utensils",
      "wine glass",
      "linen napkin",
      "candle",
      "bread basket",
      "salt & pepper",
    ],
    cafe: [
      "latte art cup",
      "pastry fork",
      "newspaper edge",
      "small flowers",
      "coffee beans",
      "sugar cubes",
    ],
    hawker: [
      "chopsticks",
      "sambal dish",
      "lime wedge",
      "tissue packet",
      "chili padi",
      "soy sauce",
    ],
    fastfood: [
      "branded cup",
      "fries container",
      "sauce packets",
      "paper tray",
      "napkins",
      "cheese pull",
    ],
    dessert: [
      "dessert spoon",
      "mint leaf",
      "chocolate drizzle",
      "fresh berries",
      "powdered sugar",
      "edible flowers",
    ],
  },

  photographyNotes: [
    "45-degree angle",
    "overhead flat lay",
    "eye-level shot",
    "shallow depth of field",
    "soft shadows",
    "dramatic side light",
    "bokeh background",
    "natural window light",
  ],

  compositionNotes: [
    "leave space for text",
    "center the dish",
    "rule of thirds",
    "negative space on left",
    "tight crop on food",
    "show full table setting",
  ],
}

export function getSuggestionsForBusinessType(
  businessType: string | null,
  section: 'propsAndStyling' | 'photographyNotes' | 'compositionNotes'
): string[] {
  if (section === 'propsAndStyling') {
    return proModeSuggestions.propsAndStyling[businessType || 'restaurant'] ||
           proModeSuggestions.propsAndStyling.restaurant
  }
  return proModeSuggestions[section]
}
```

---

## File-by-File Implementation

### Files to CREATE (New)

| File | Purpose |
|------|---------|
| `/Users/lexnaweiming/Test/marketing-heymag/components/editor/prompt-section.tsx` | Reusable prompt input with suggestions |
| `/Users/lexnaweiming/Test/marketing-heymag/components/editor/prompt-preview.tsx` | Shows final prompt preview |
| `/Users/lexnaweiming/Test/marketing-heymag/components/editor/pro-mode-panel.tsx` | Container for Pro Mode sections |
| `/Users/lexnaweiming/Test/marketing-heymag/lib/pro-mode-suggestions.ts` | Context-aware suggestion data |

### Files to MODIFY (Existing)

| File | Changes |
|------|---------|
| `/Users/lexnaweiming/Test/marketing-heymag/lib/simplified-styles.ts` | Add `ProModeConfig` interface and defaults |
| `/Users/lexnaweiming/Test/marketing-heymag/lib/multi-style-prompt-builder.ts` | Add `buildProModeSection()`, update `buildSimplifiedPrompt()` |
| `/Users/lexnaweiming/Test/marketing-heymag/components/editor/simplified-style-picker.tsx` | Add Pro Mode toggle and panel integration |
| `/Users/lexnaweiming/Test/marketing-heymag/app/(public)/editor/page.tsx` | Add `proModeConfig` state, pass to enhance API |
| `/Users/lexnaweiming/Test/marketing-heymag/app/api/ai/enhance/route.ts` | Accept `proModeConfig` in payload, pass to prompt builder |

---

## Character Limits

| Section | Simple Mode | Pro Mode |
|---------|-------------|----------|
| Custom Prompt (blob) | 500 chars | N/A |
| Props & Styling | N/A | 500 chars |
| Photography Notes | N/A | 300 chars |
| Composition Notes | N/A | 200 chars |
| Background Description | 500 chars | 500 chars (shared) |
| **Total User Input** | **1000 chars** | **1500 chars** |

---

## Migration & Backward Compatibility

### Simple Mode Users (Default)
- No changes to their experience
- Toggle defaults to "Simple"
- Existing `customPrompt` field continues to work

### Pro Mode Users
- Opt-in by clicking "Pro" toggle
- Structured sections replace single blob
- More guidance and context-aware suggestions

### API Backward Compatibility

```typescript
// In enhance route - handle both modes
if (proModeConfig?.enabled) {
  // Pro Mode: use structured sections
  simplifiedResult = buildSimplifiedPrompt(
    simpleSelection,
    undefined,  // No blob customInstructions
    proModeConfig,
    backgroundConfig?.description
  )
} else {
  // Simple Mode: use existing blob prompt (backward compatible)
  simplifiedResult = buildSimplifiedPrompt(
    simpleSelection,
    customPrompt,  // Existing behavior
    undefined,
    backgroundConfig?.description
  )
}
```

---

## Implementation Order

### Phase 1: Data Layer (1 hour)
1. Add `ProModeConfig` to `/Users/lexnaweiming/Test/marketing-heymag/lib/simplified-styles.ts`
2. Update `buildSimplifiedPrompt()` in `/Users/lexnaweiming/Test/marketing-heymag/lib/multi-style-prompt-builder.ts`
3. Create `/Users/lexnaweiming/Test/marketing-heymag/lib/pro-mode-suggestions.ts`

### Phase 2: UI Components (2 hours)
1. Create `/Users/lexnaweiming/Test/marketing-heymag/components/editor/prompt-section.tsx`
2. Create `/Users/lexnaweiming/Test/marketing-heymag/components/editor/prompt-preview.tsx`
3. Create `/Users/lexnaweiming/Test/marketing-heymag/components/editor/pro-mode-panel.tsx`

### Phase 3: Integration (1.5 hours)
1. Add Pro Mode toggle to `/Users/lexnaweiming/Test/marketing-heymag/components/editor/simplified-style-picker.tsx`
2. Add `proModeConfig` state to `/Users/lexnaweiming/Test/marketing-heymag/app/(public)/editor/page.tsx`
3. Update enhance payload and API handler

### Phase 4: Testing & Polish (1 hour)
1. Test Simple Mode still works (backward compatibility)
2. Test Pro Mode with various inputs
3. Verify prompt preview accuracy
4. Mobile responsiveness check

---

## Summary Comparison

| Aspect | Simple Mode | Pro Mode |
|--------|-------------|----------|
| **Target User** | Casual F&B owner | Power user, agency |
| **Input Style** | Single text blob | Structured sections |
| **Character Limit** | 500 total | 1500 total (3 sections) |
| **Suggestions** | Generic | Context-aware |
| **Preview** | None | Full prompt preview |
| **Smart Defaults** | ✅ Applied | ✅ Applied |
| **Learning Curve** | Low | Medium |

---

## Key Insight

**Pro Mode is NOT a replacement—it's an upgrade path** for users who want more control while still benefiting from the professional photography defaults built into the system.

The smart defaults (8 professional photography elements based on business type) are ALWAYS applied. Pro Mode simply adds structured customizations ON TOP of these defaults.
