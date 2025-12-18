# Style Picker UX Enhancement - Implementation Plan

## Overview

This document outlines the implementation of enhanced UX features for the Zazzles Style Picker:
1. **Hover Preview** - Desktop hover effect showing enlarged thumbnails and full descriptions
2. **Selected Styles Summary** - Display selected styles in main content area
3. **Mobile Detail View** - Bottom sheet for mobile devices (touch-friendly alternative to hover)

---

## Architecture

### Component Structure

```
components/
├── editor/
│   ├── style-picker.tsx          # Updated with hover wrapper
│   ├── style-hover-card.tsx      # NEW: Hover preview component
│   ├── selected-styles-summary.tsx # NEW: Main area selected styles display
│   ├── style-detail-sheet.tsx    # NEW: Mobile bottom sheet
│   └── index.ts                  # Updated exports
```

### Data Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Editor Page                                  │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    selectedStyles state                      │   │
│  └─────────────────────────────────────────────────────────────┘   │
│           │                                    │                    │
│           ▼                                    ▼                    │
│  ┌─────────────────┐                ┌────────────────────────┐     │
│  │  StylePicker    │                │ SelectedStylesSummary  │     │
│  │  (Left Sidebar) │                │    (Main Content)      │     │
│  │                 │                │                        │     │
│  │ ┌─────────────┐ │                │  Shows: Large cards    │     │
│  │ │StyleHoverCard│ │                │  with thumbnails,      │     │
│  │ │ (Desktop)   │ │                │  descriptions, remove  │     │
│  │ └─────────────┘ │                │  buttons               │     │
│  │                 │                └────────────────────────┘     │
│  │ ┌─────────────┐ │                                               │
│  │ │StyleDetail  │ │                                               │
│  │ │Sheet(Mobile)│ │                                               │
│  │ └─────────────┘ │                                               │
│  └─────────────────┘                                               │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Component 1: StyleHoverCard

### Purpose
Show enlarged preview (200x200) and full description when hovering over a style option on desktop.

### Props Interface

```typescript
interface StyleHoverCardProps {
  style: Style                    // Style data from styles-data.ts
  category: StyleCategory         // Parent category
  children: React.ReactNode       // The style item to wrap
  isSelected: boolean             // Whether this style is selected
  side?: 'right' | 'left' | 'top' | 'bottom'  // Position preference
}
```

### Behavior

| Trigger | Action |
|---------|--------|
| Mouse enter | Start 200ms timer |
| Timer complete | Show hover card with animation |
| Mouse leave trigger | Start 100ms close timer |
| Mouse enter card | Cancel close timer |
| Mouse leave card | Close immediately |
| Click on trigger | Select style (don't open card) |

### Visual Design

```
┌────────────────────────────────────┐
│                                    │
│      ┌──────────────────────┐      │
│      │                      │      │
│      │   200x200 thumbnail  │      │
│      │                      │      │
│      └──────────────────────┘      │
│                                    │
│   Fine Dining                      │
│   ─────────────────────────        │
│   Elegant, sophisticated           │
│   presentation with dramatic       │
│   lighting. Perfect for upscale    │
│   restaurants and premium menu     │
│   photography.                     │
│                                    │
│   🏷️ Venue Type                    │
│   ✓ Selected                       │
└────────────────────────────────────┘
```

### Implementation Notes

- Use `@radix-ui/react-hover-card` for proper hover behavior
- Install: `npx shadcn@latest add hover-card`
- Open delay: 200ms (prevents accidental triggers)
- Close delay: 100ms (allows moving to card)
- Position: Prefer right side, auto-flip if needed
- Animation: Fade in + subtle scale (95% → 100%)

---

## Component 2: SelectedStylesSummary

### Purpose
Display all selected styles in the main content area above the upload zone.

### Props Interface

```typescript
interface SelectedStylesSummaryProps {
  selection: SelectedStyles           // Current selection state
  onRemoveStyle: (categoryId: string, styleId: string) => void
  onStyleClick?: (categoryId: string, styleId: string) => void  // Optional: scroll to in sidebar
  className?: string
}
```

### Layout States

#### Empty State (No Selections)
```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│    💡 Select styles from the sidebar to create your    │
│       perfect food photography recipe                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### With Selections (1-3 styles)
```
┌─────────────────────────────────────────────────────────┐
│  Your Style Recipe                         3 styles     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ │
│  │   [100x100]   │ │   [100x100]   │ │   [100x100]   │ │
│  │   thumbnail   │ │   thumbnail   │ │   thumbnail   │ │
│  ├───────────────┤ ├───────────────┤ ├───────────────┤ │
│  │ 🍽️ Fine Dining │ │ 🖼️ Dark Moody │ │ 🎄 Christmas  │ │
│  │ Venue Type    │ │ Background    │ │ Seasonal      │ │
│  │           [×] │ │           [×] │ │           [×] │ │
│  └───────────────┘ └───────────────┘ └───────────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### With Many Selections (4+)
```
┌─────────────────────────────────────────────────────────┐
│  Your Style Recipe                         6 styles     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐           │
│  │[80x80] │ │[80x80] │ │[80x80] │ │[80x80] │           │
│  ├────────┤ ├────────┤ ├────────┤ ├────────┤           │
│  │Fine    │ │Dark    │ │Christ- │ │Insta-  │  +2 more  │
│  │Dining×│ │Moody ×│ │mas   ×│ │gram  ×│           │
│  └────────┘ └────────┘ └────────┘ └────────┘           │
│                                                         │
│  [Show all ▼]                                          │
└─────────────────────────────────────────────────────────┘
```

### Visual Design Tokens

```css
/* Card dimensions */
--card-width: 140px;
--card-thumbnail-size: 100px;
--card-gap: 16px;

/* Compact mode (4+ styles) */
--card-compact-width: 100px;
--card-compact-thumbnail-size: 80px;
```

### Responsive Behavior

| Breakpoint | Cards per row | Card size |
|------------|---------------|-----------|
| Desktop (≥1024px) | 4-5 | Full (140px) |
| Tablet (768-1023px) | 3-4 | Full (140px) |
| Mobile (< 768px) | 2-3 | Compact (100px) |

---

## Component 3: StyleDetailSheet

### Purpose
Mobile-friendly bottom sheet for viewing style details (since hover doesn't work on touch).

### Props Interface

```typescript
interface StyleDetailSheetProps {
  style: Style | null             // Style to display (null = closed)
  category: StyleCategory | null  // Parent category
  isSelected: boolean
  onSelect: () => void           // Toggle selection
  onClose: () => void            // Close sheet
}
```

### Trigger Mechanism

- **Desktop**: Use HoverCard (mouse hover)
- **Mobile**: Use info icon button (tap to open sheet)

```typescript
// Detect touch device
const isTouchDevice = typeof window !== 'undefined' &&
  ('ontouchstart' in window || navigator.maxTouchPoints > 0)
```

### Layout

```
┌─────────────────────────────────────────┐
│  ═══════════════  (drag handle)         │
├─────────────────────────────────────────┤
│                                         │
│        ┌───────────────────┐            │
│        │                   │            │
│        │  280x280 image    │            │
│        │                   │            │
│        └───────────────────┘            │
│                                         │
│  Fine Dining                            │
│  ─────────────────────────────          │
│  Elegant, sophisticated presentation    │
│  with dramatic lighting. Perfect for    │
│  upscale restaurants and premium        │
│  menu photography.                      │
│                                         │
│  🏷️ Venue Type                          │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │    ✓ Select This Style          │    │
│  └─────────────────────────────────┘    │
│                                         │
└─────────────────────────────────────────┘
```

---

## Implementation Steps

### Phase 1: Install Dependencies

```bash
# Add HoverCard component from shadcn
npx shadcn@latest add hover-card
```

### Phase 2: Create StyleHoverCard Component

**File**: `/components/editor/style-hover-card.tsx`

```typescript
'use client'

import * as React from 'react'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'
import { Badge } from '@/components/ui/badge'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Style, StyleCategory } from '@/lib/styles-data'

interface StyleHoverCardProps {
  style: Style
  category: StyleCategory
  children: React.ReactNode
  isSelected: boolean
  side?: 'right' | 'left' | 'top' | 'bottom'
}

export function StyleHoverCard({
  style,
  category,
  children,
  isSelected,
  side = 'right',
}: StyleHoverCardProps) {
  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        {children}
      </HoverCardTrigger>
      <HoverCardContent
        side={side}
        align="start"
        className="w-72 p-0 overflow-hidden"
      >
        {/* Large thumbnail */}
        <div className="w-full aspect-square relative bg-muted">
          <img
            src={style.thumbnail.replace('w=100&h=100', 'w=400&h=400')}
            alt={style.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-semibold text-sm">{style.name}</h4>
              <p className="text-xs text-muted-foreground mt-1">
                {style.description}
              </p>
            </div>
            {isSelected && (
              <div className="h-5 w-5 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
                <Check className="h-3 w-3 text-white" />
              </div>
            )}
          </div>

          {/* Category badge */}
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
            <Badge variant="secondary" className="text-xs">
              {category.emoji} {category.name}
            </Badge>
            {isSelected && (
              <span className="text-xs text-orange-500 font-medium">
                Selected
              </span>
            )}
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}
```

### Phase 3: Create SelectedStylesSummary Component

**File**: `/components/editor/selected-styles-summary.tsx`

```typescript
'use client'

import { X, Lightbulb } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  styleCategories,
  type SelectedStyles,
  type Style,
  type StyleCategory,
} from '@/lib/styles-data'

interface SelectedStylesSummaryProps {
  selection: SelectedStyles
  onRemoveStyle: (categoryId: string, styleId: string) => void
  className?: string
}

interface SelectedStyleInfo {
  category: StyleCategory
  style: Style
}

export function SelectedStylesSummary({
  selection,
  onRemoveStyle,
  className,
}: SelectedStylesSummaryProps) {
  // Gather all selected styles with their category info
  const selectedStyles: SelectedStyleInfo[] = []

  for (const category of styleCategories) {
    if (category.selectionType === 'single') {
      const key = category.id as keyof SelectedStyles
      const styleId = selection[key] as string | undefined
      if (styleId) {
        const style = category.styles.find(s => s.id === styleId)
        if (style) {
          selectedStyles.push({ category, style })
        }
      }
    } else {
      const key = category.id as 'social' | 'technique'
      const styleIds = selection[key] || []
      for (const styleId of styleIds) {
        const style = category.styles.find(s => s.id === styleId)
        if (style) {
          selectedStyles.push({ category, style })
        }
      }
    }
  }

  // Empty state
  if (selectedStyles.length === 0) {
    return (
      <div className={cn(
        'flex items-center gap-3 p-4 rounded-xl bg-muted/50 border border-dashed border-muted-foreground/30',
        className
      )}>
        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
          <Lightbulb className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">
            Select styles from the sidebar to create your perfect food photography recipe
          </p>
        </div>
      </div>
    )
  }

  const isCompact = selectedStyles.length > 3

  return (
    <div className={cn('space-y-3', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-sm">Your Style Recipe</h3>
        <Badge variant="secondary" className="text-xs">
          {selectedStyles.length} style{selectedStyles.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Style cards grid */}
      <div className={cn(
        'grid gap-3',
        isCompact
          ? 'grid-cols-4 lg:grid-cols-5'
          : 'grid-cols-3 lg:grid-cols-4'
      )}>
        {selectedStyles.map(({ category, style }) => (
          <div
            key={`${category.id}-${style.id}`}
            className="group relative bg-card rounded-lg border border-border overflow-hidden"
          >
            {/* Thumbnail */}
            <div className={cn(
              'relative bg-muted',
              isCompact ? 'aspect-square' : 'aspect-square'
            )}>
              <img
                src={style.thumbnail.replace('w=100&h=100', 'w=200&h=200')}
                alt={style.name}
                className="w-full h-full object-cover"
              />

              {/* Remove button */}
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => onRemoveStyle(category.id, style.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>

            {/* Info */}
            <div className="p-2">
              <p className={cn(
                'font-medium truncate',
                isCompact ? 'text-xs' : 'text-sm'
              )}>
                {style.name}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">
                {category.emoji} {category.name}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

### Phase 4: Create StyleDetailSheet Component (Mobile)

**File**: `/components/editor/style-detail-sheet.tsx`

```typescript
'use client'

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Style, StyleCategory } from '@/lib/styles-data'

interface StyleDetailSheetProps {
  style: Style | null
  category: StyleCategory | null
  isSelected: boolean
  onSelect: () => void
  onClose: () => void
}

export function StyleDetailSheet({
  style,
  category,
  isSelected,
  onSelect,
  onClose,
}: StyleDetailSheetProps) {
  if (!style || !category) return null

  return (
    <Sheet open={!!style} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="h-auto max-h-[85vh] rounded-t-2xl">
        {/* Drag handle */}
        <div className="w-12 h-1.5 rounded-full bg-muted mx-auto mb-4" />

        <SheetHeader className="sr-only">
          <SheetTitle>{style.name}</SheetTitle>
        </SheetHeader>

        {/* Large image */}
        <div className="w-full max-w-sm mx-auto aspect-square rounded-xl overflow-hidden bg-muted mb-4">
          <img
            src={style.thumbnail.replace('w=100&h=100', 'w=600&h=600')}
            alt={style.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Style info */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold">{style.name}</h2>
          <p className="text-sm text-muted-foreground mt-2">
            {style.description}
          </p>
          <Badge variant="secondary" className="mt-3">
            {category.emoji} {category.name}
          </Badge>
        </div>

        {/* Select button */}
        <Button
          onClick={() => {
            onSelect()
            onClose()
          }}
          className={cn(
            'w-full',
            isSelected
              ? 'bg-orange-500 hover:bg-orange-600'
              : 'bg-foreground text-background hover:bg-foreground/90'
          )}
        >
          {isSelected ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Selected
            </>
          ) : (
            'Select This Style'
          )}
        </Button>
      </SheetContent>
    </Sheet>
  )
}
```

### Phase 5: Update StylePicker Component

Add hover cards to each style item:

```typescript
// In style-picker.tsx

import { StyleHoverCard } from './style-hover-card'
import { StyleDetailSheet } from './style-detail-sheet'
import { Info } from 'lucide-react'

// Add state for mobile detail sheet
const [detailStyle, setDetailStyle] = useState<{
  style: Style
  category: StyleCategory
} | null>(null)

// Check if touch device
const isTouchDevice = typeof window !== 'undefined' &&
  ('ontouchstart' in window || navigator.maxTouchPoints > 0)

// Update renderStyleItem to wrap with HoverCard
const renderStyleItem = (category: StyleCategory, style: Style) => {
  const isSelected = isStyleSelected(category, style.id)

  const styleButton = (
    <button
      onClick={() => handleStyleSelect(category, style.id)}
      className={cn(
        'w-full flex items-start gap-3 p-2.5 rounded-lg border transition-all text-left',
        isSelected
          ? 'border-orange-500 bg-orange-500/10'
          : 'border-transparent hover:bg-muted/50'
      )}
    >
      {/* ... existing button content ... */}

      {/* Add info button for mobile */}
      {isTouchDevice && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            setDetailStyle({ style, category })
          }}
          className="p-1.5 rounded-md hover:bg-muted"
        >
          <Info className="h-4 w-4 text-muted-foreground" />
        </button>
      )}
    </button>
  )

  // Wrap with HoverCard on desktop only
  if (!isTouchDevice) {
    return (
      <StyleHoverCard
        key={style.id}
        style={style}
        category={category}
        isSelected={isSelected}
      >
        {styleButton}
      </StyleHoverCard>
    )
  }

  return styleButton
}

// Add StyleDetailSheet at the end of the component
return (
  <div className="flex flex-col h-full">
    {/* ... existing content ... */}

    {/* Mobile detail sheet */}
    <StyleDetailSheet
      style={detailStyle?.style ?? null}
      category={detailStyle?.category ?? null}
      isSelected={detailStyle ? isStyleSelected(detailStyle.category, detailStyle.style.id) : false}
      onSelect={() => {
        if (detailStyle) {
          handleStyleSelect(detailStyle.category, detailStyle.style.id)
        }
      }}
      onClose={() => setDetailStyle(null)}
    />
  </div>
)
```

### Phase 6: Update Editor Page

Add SelectedStylesSummary to main content area:

```typescript
// In app/(authenticated)/editor/page.tsx

import { SelectedStylesSummary } from '@/components/editor/selected-styles-summary'

// In the main content area, before the upload zone:
<main className="flex-1 flex flex-col">
  {/* Selected Styles Summary - shows above canvas when styles selected */}
  {!template && getSelectedCount(selectedStyles) > 0 && (
    <div className="px-8 pt-6">
      <SelectedStylesSummary
        selection={selectedStyles}
        onRemoveStyle={(categoryId, styleId) => {
          // Remove style using existing logic
          const category = styleCategories.find(c => c.id === categoryId)
          if (!category) return
          // ... removal logic
        }}
        className="max-w-2xl mx-auto"
      />
    </div>
  )}

  {/* Canvas */}
  <div className="flex-1 flex items-center justify-center p-8 relative">
    {/* ... existing canvas content ... */}
  </div>
</main>
```

---

## Testing Checklist

### Desktop Testing
- [ ] Hover over style item → card appears after 200ms
- [ ] Move mouse to card → card stays open
- [ ] Move mouse away → card closes
- [ ] Click style → selects without showing card
- [ ] Card shows correct large image
- [ ] Card shows full description
- [ ] Card shows category badge
- [ ] Card shows selected state

### Mobile Testing
- [ ] Tap style → selects style (no hover)
- [ ] Tap info icon → opens bottom sheet
- [ ] Sheet shows large image
- [ ] Sheet shows full description
- [ ] Select button works
- [ ] Swipe down to close works

### Selected Styles Summary
- [ ] Empty state shows hint message
- [ ] 1-3 styles show full cards
- [ ] 4+ styles show compact cards
- [ ] Remove button works
- [ ] Cards show correct thumbnails
- [ ] Cards show category info

### Responsive
- [ ] Desktop (≥1024px): HoverCard + 4 cards per row
- [ ] Tablet (768-1023px): HoverCard + 3 cards per row
- [ ] Mobile (<768px): Info icon + Sheet + 2 cards per row

---

## Performance Considerations

1. **Image Loading**
   - Use lazy loading for hover card images
   - Preload images on hover intent (50ms before showing)
   - Use smaller thumbnails for summary cards (200x200)

2. **Animation Performance**
   - Use CSS transforms for animations (GPU accelerated)
   - Avoid layout thrashing during hover transitions

3. **Touch Detection**
   - Detect touch device once on mount
   - Cache result to avoid repeated checks

---

## Version Tracking

- Version: 0.11.0
- Internal Build: 1.36
- Feature: Style Picker UX Enhancement

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `components/ui/hover-card.tsx` | CREATE | shadcn HoverCard component |
| `components/editor/style-hover-card.tsx` | CREATE | Desktop hover preview |
| `components/editor/selected-styles-summary.tsx` | CREATE | Main area style cards |
| `components/editor/style-detail-sheet.tsx` | CREATE | Mobile bottom sheet |
| `components/editor/style-picker.tsx` | MODIFY | Add hover wrapping |
| `components/editor/index.ts` | MODIFY | Export new components |
| `app/(authenticated)/editor/page.tsx` | MODIFY | Add summary to main area |
| `lib/config.ts` | MODIFY | Update version |

---

## Estimated Implementation Order

1. Install HoverCard dependency (2 min)
2. Create StyleHoverCard component (15 min)
3. Create SelectedStylesSummary component (20 min)
4. Create StyleDetailSheet component (15 min)
5. Update StylePicker with hover/mobile support (20 min)
6. Update Editor page with summary display (10 min)
7. Testing and polish (15 min)
8. Deploy and verify (5 min)

**Total: ~1.5 hours**
