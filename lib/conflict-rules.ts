/**
 * Conflict Rules for FoodSnap AI Style System
 *
 * Prevents users from selecting incompatible style combinations.
 * With the simplified single-select system, most conflicts are prevented
 * by design. This file handles edge cases and provides validation.
 *
 * Reference: /docs/FOOD_PHOTOGRAPHY_IMPLEMENTATION.md
 */

import type { SimpleSelection } from './simplified-styles'

// ═══════════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

export interface ConflictWarning {
  type: 'error' | 'warning' | 'suggestion'
  category1: keyof SimpleSelection
  value1: string
  category2: keyof SimpleSelection
  value2: string
  message: string
  suggestion?: string
}

// ═══════════════════════════════════════════════════════════════════════════════
// BUSINESS TYPE + MOOD COMPATIBILITY
// Some business types work better with certain moods
// ═══════════════════════════════════════════════════════════════════════════════

interface MoodCompatibility {
  recommended: string[]
  compatible: string[]
  notRecommended: string[]
}

export const businessMoodCompatibility: Record<string, MoodCompatibility> = {
  restaurant: {
    recommended: ['warm', 'auto'],
    compatible: ['bright', 'natural', 'elegant'],
    notRecommended: [], // All moods work for restaurant
  },
  cafe: {
    recommended: ['bright', 'natural', 'auto'],
    compatible: ['warm'],
    notRecommended: ['elegant'], // Dark moody doesn't fit cafe aesthetic
  },
  hawker: {
    recommended: ['warm', 'natural', 'auto'],
    compatible: ['bright'],
    notRecommended: ['elegant'], // Dark moody doesn't fit hawker vibe
  },
  fastfood: {
    recommended: ['bright', 'auto'],
    compatible: ['warm'],
    notRecommended: ['elegant', 'natural'], // Fast food needs energy, not elegance
  },
  dessert: {
    recommended: ['bright', 'auto'],
    compatible: ['warm', 'natural'],
    notRecommended: ['elegant'], // Desserts are usually bright and cheerful
  },
}

// ═══════════════════════════════════════════════════════════════════════════════
// BUSINESS TYPE + SEASONAL COMPATIBILITY
// Some seasonal themes make more sense for certain business types
// ═══════════════════════════════════════════════════════════════════════════════

export const businessSeasonalCompatibility: Record<string, {
  perfect: string[]
  good: string[]
  unusual: string[]
}> = {
  restaurant: {
    perfect: ['christmas', 'cny', 'valentines', 'hari-raya', 'deepavali', 'mid-autumn'],
    good: [],
    unusual: [],
  },
  cafe: {
    perfect: ['christmas', 'valentines'],
    good: ['cny', 'mid-autumn'],
    unusual: ['hari-raya', 'deepavali'], // Less common for cafes
  },
  hawker: {
    perfect: ['cny', 'hari-raya', 'deepavali'],
    good: ['mid-autumn'],
    unusual: ['christmas', 'valentines'], // Western holidays less common
  },
  fastfood: {
    perfect: ['christmas', 'cny'],
    good: ['valentines'],
    unusual: ['hari-raya', 'deepavali', 'mid-autumn'], // Less typical
  },
  dessert: {
    perfect: ['christmas', 'valentines', 'mid-autumn'],
    good: ['cny', 'deepavali'],
    unusual: ['hari-raya'], // Desserts less central to Hari Raya
  },
}

// ═══════════════════════════════════════════════════════════════════════════════
// LEGACY STYLE CONFLICTS (for advanced mode / backward compatibility)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Legacy conflicts from the old multi-select system
 * Kept for reference and for advanced mode if we add it later
 */
export const legacyConflicts: Record<string, { blocks: string[]; reason: string }> = {
  // Photography technique conflicts
  'flat-lay': {
    blocks: ['bokeh', 'macro', 'neon-night'],
    reason: 'Flat lay uses 90° overhead angle which is incompatible with bokeh/macro depth effects',
  },
  bokeh: {
    blocks: ['flat-lay', 'hdr'],
    reason: 'Bokeh requires shallow DoF which conflicts with flat-lay sharpness and HDR detail',
  },
  hdr: {
    blocks: ['vintage', 'bokeh'],
    reason: 'HDR maximizes detail everywhere, opposite of vintage softness and bokeh blur',
  },
  vintage: {
    blocks: ['hdr', 'neon-night'],
    reason: 'Vintage desaturates and softens, opposite of HDR sharpness and neon vibrancy',
  },
  'neon-night': {
    blocks: ['natural-light', 'vintage', 'flat-lay'],
    reason: 'Neon is artificial night lighting, incompatible with natural/vintage/overhead',
  },
  'natural-light': {
    blocks: ['neon-night'],
    reason: 'Natural daylight conflicts with artificial neon aesthetic',
  },

  // Background/mood conflicts
  'dark-moody': {
    blocks: ['bright-airy', 'tropical'],
    reason: 'Dark moody and bright airy are opposite lighting moods',
  },
  'bright-airy': {
    blocks: ['dark-moody', 'neon-night'],
    reason: 'Bright airy and dark/neon are opposite lighting moods',
  },
}

// ═══════════════════════════════════════════════════════════════════════════════
// VALIDATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Check selection for any conflicts or warnings
 */
export function validateSelection(selection: SimpleSelection): ConflictWarning[] {
  const warnings: ConflictWarning[] = []

  // 1. Check business type + mood compatibility
  if (selection.businessType && selection.mood && selection.mood !== 'auto') {
    const compat = businessMoodCompatibility[selection.businessType]
    if (compat) {
      if (compat.notRecommended.includes(selection.mood)) {
        warnings.push({
          type: 'warning',
          category1: 'businessType',
          value1: selection.businessType,
          category2: 'mood',
          value2: selection.mood,
          message: `"${selection.mood}" mood is unusual for ${selection.businessType} style`,
          suggestion: `Consider using "${compat.recommended[0]}" for better results`,
        })
      }
    }
  }

  // 2. Check business type + seasonal compatibility
  if (selection.businessType && selection.seasonal && selection.seasonal !== 'none') {
    const compat = businessSeasonalCompatibility[selection.businessType]
    if (compat) {
      if (compat.unusual.includes(selection.seasonal)) {
        warnings.push({
          type: 'suggestion',
          category1: 'businessType',
          value1: selection.businessType,
          category2: 'seasonal',
          value2: selection.seasonal,
          message: `${selection.seasonal} theme is uncommon for ${selection.businessType}`,
          suggestion: 'This may produce unexpected results, but can still work',
        })
      }
    }
  }

  return warnings
}

/**
 * Check if a specific style can be selected given current selection
 */
export function canSelectStyle(
  category: keyof SimpleSelection,
  styleId: string,
  currentSelection: SimpleSelection
): { allowed: boolean; warning?: string } {
  // With single-select categories, most conflicts are prevented by design
  // This function is for additional validation

  // Check mood compatibility with business type
  if (category === 'mood' && currentSelection.businessType) {
    const compat = businessMoodCompatibility[currentSelection.businessType]
    if (compat && compat.notRecommended.includes(styleId)) {
      return {
        allowed: true, // Still allow, but warn
        warning: `"${styleId}" mood may not be ideal for ${currentSelection.businessType}`,
      }
    }
  }

  return { allowed: true }
}

/**
 * Get recommended styles for a category based on current selection
 */
export function getRecommendedStyles(
  category: keyof SimpleSelection,
  currentSelection: SimpleSelection
): string[] {
  if (category === 'mood' && currentSelection.businessType) {
    const compat = businessMoodCompatibility[currentSelection.businessType]
    if (compat) {
      return compat.recommended
    }
  }

  if (category === 'seasonal' && currentSelection.businessType) {
    const compat = businessSeasonalCompatibility[currentSelection.businessType]
    if (compat) {
      return compat.perfect
    }
  }

  return []
}

// ═══════════════════════════════════════════════════════════════════════════════
// SMART SUGGESTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get smart suggestions based on partial selection
 */
export function getSmartSuggestions(selection: SimpleSelection): {
  suggestedMood: string | null
  suggestedFormat: string | null
  explanation: string
} {
  let suggestedMood: string | null = null
  let suggestedFormat: string | null = null
  let explanation = ''

  if (selection.businessType) {
    const compat = businessMoodCompatibility[selection.businessType]
    if (compat && compat.recommended.length > 0) {
      suggestedMood = compat.recommended[0]
      explanation = `"${suggestedMood}" works great with ${selection.businessType} style`
    }
  }

  // Suggest format based on business type
  if (selection.businessType && !selection.format) {
    switch (selection.businessType) {
      case 'hawker':
      case 'fastfood':
        suggestedFormat = 'square'
        explanation += '. Square format is perfect for delivery apps.'
        break
      case 'cafe':
      case 'dessert':
        suggestedFormat = 'portrait'
        explanation += '. Portrait format is ideal for Instagram.'
        break
      default:
        suggestedFormat = 'square'
        explanation += '. Square format is the most versatile.'
    }
  }

  return { suggestedMood, suggestedFormat, explanation }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONFLICT SUMMARY FOR UI
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get a simple summary of selection validity for UI display
 */
export function getSelectionStatus(selection: SimpleSelection): {
  isValid: boolean
  hasWarnings: boolean
  message: string
} {
  const warnings = validateSelection(selection)

  if (!selection.businessType) {
    return {
      isValid: false,
      hasWarnings: false,
      message: 'Please select a business type',
    }
  }

  if (warnings.length === 0) {
    return {
      isValid: true,
      hasWarnings: false,
      message: 'Great choices! Ready to enhance.',
    }
  }

  const errorCount = warnings.filter((w) => w.type === 'error').length
  const warningCount = warnings.filter((w) => w.type === 'warning').length

  if (errorCount > 0) {
    return {
      isValid: false,
      hasWarnings: true,
      message: 'Some selections conflict. Please review.',
    }
  }

  if (warningCount > 0) {
    return {
      isValid: true,
      hasWarnings: true,
      message: 'Ready, but some choices are unusual.',
    }
  }

  return {
    isValid: true,
    hasWarnings: true,
    message: 'Ready with suggestions.',
  }
}
