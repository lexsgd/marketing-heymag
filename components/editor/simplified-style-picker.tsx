'use client'

import { useState, useMemo } from 'react'
import { ChevronDown, ChevronRight, Check, Sparkles, AlertTriangle, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip'
import {
  simpleCategories,
  businessTypes,
  formats,
  moods,
  seasonalThemes,
  getSelectionSummary,
  countSelections,
  type SimpleSelection,
  type SimpleStyle,
  type FormatStyle,
} from '@/lib/simplified-styles'
import { validateSelection, getSmartSuggestions, getSelectionStatus } from '@/lib/conflict-rules'

interface SimplifiedStylePickerProps {
  selection: SimpleSelection
  onSelectionChange: (selection: SimpleSelection) => void
  disabled?: boolean
}

// Category data mapping
const categoryData: Record<
  string,
  { styles: (SimpleStyle | FormatStyle)[]; key: keyof SimpleSelection }
> = {
  businessType: { styles: businessTypes, key: 'businessType' },
  format: { styles: formats, key: 'format' },
  mood: { styles: moods, key: 'mood' },
  seasonal: { styles: seasonalThemes, key: 'seasonal' },
}

export function SimplifiedStylePicker({
  selection,
  onSelectionChange,
  disabled = false,
}: SimplifiedStylePickerProps) {
  // First two categories expanded by default
  const [expandedCategories, setExpandedCategories] = useState<string[]>([
    'businessType',
    'format',
  ])

  const selectedCount = countSelections(selection)
  const status = getSelectionStatus(selection)
  const warnings = validateSelection(selection)
  const suggestions = useMemo(() => getSmartSuggestions(selection), [selection])

  // Toggle category expansion
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  // Handle style selection (single-select for all categories)
  const handleStyleSelect = (categoryKey: keyof SimpleSelection, styleId: string) => {
    if (disabled) return

    const newSelection = { ...selection }

    // Toggle: if same value, clear it (unless it's businessType which is required)
    if (newSelection[categoryKey] === styleId) {
      if (categoryKey !== 'businessType') {
        newSelection[categoryKey] = null
      }
    } else {
      newSelection[categoryKey] = styleId
    }

    onSelectionChange(newSelection)
  }

  // Apply smart suggestion
  const applySuggestion = (
    categoryKey: keyof SimpleSelection,
    value: string | null
  ) => {
    if (!value || disabled) return
    const newSelection = { ...selection }
    newSelection[categoryKey] = value
    onSelectionChange(newSelection)
  }

  // Render a style item
  const renderStyleItem = (
    categoryKey: keyof SimpleSelection,
    style: SimpleStyle | FormatStyle
  ) => {
    const isSelected = selection[categoryKey] === style.id
    const isRecommended =
      categoryKey === 'mood' && suggestions.suggestedMood === style.id
    const isFormatRecommended =
      categoryKey === 'format' && suggestions.suggestedFormat === style.id

    return (
      <button
        key={style.id}
        onClick={() => handleStyleSelect(categoryKey, style.id)}
        disabled={disabled}
        className={cn(
          'w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left group',
          isSelected
            ? 'border-orange-500 bg-orange-500/10'
            : 'border-border hover:border-muted-foreground/50 hover:bg-muted/50',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        {/* Emoji */}
        <span className="text-xl flex-shrink-0">{style.emoji}</span>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{style.name}</span>
            {(isRecommended || isFormatRecommended) && (
              <Badge
                variant="secondary"
                className="text-[10px] px-1.5 py-0 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
              >
                <Sparkles className="h-2.5 w-2.5 mr-0.5" />
                Suggested
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
            {style.description}
          </p>
          {/* Show platform examples for formats */}
          {'examples' in style && style.examples && style.examples.length > 0 && (
            <p className="text-[10px] text-muted-foreground/70 mt-0.5 truncate">
              {style.examples.join(' • ')}
            </p>
          )}
        </div>

        {/* Selection indicator (radio style) */}
        <div className="flex-shrink-0">
          <div
            className={cn(
              'w-4 h-4 rounded-full border-2 flex items-center justify-center',
              isSelected
                ? 'border-orange-500 bg-orange-500'
                : 'border-muted-foreground/40'
            )}
          >
            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
          </div>
        </div>
      </button>
    )
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Style Settings</h3>
            {selectedCount > 0 && (
              <Badge
                variant="secondary"
                className="bg-orange-500/20 text-orange-500"
              >
                {selectedCount} selected
              </Badge>
            )}
          </div>

          {/* Selection summary */}
          {selectedCount > 0 && (
            <p className="text-sm text-muted-foreground">
              {getSelectionSummary(selection)}
            </p>
          )}

          {/* Status message */}
          {status.message && (
            <div
              className={cn(
                'flex items-center gap-2 mt-2 text-xs',
                status.isValid && !status.hasWarnings && 'text-green-600',
                status.hasWarnings && 'text-amber-600',
                !status.isValid && 'text-red-600'
              )}
            >
              {status.isValid && !status.hasWarnings && (
                <Check className="h-3.5 w-3.5" />
              )}
              {status.hasWarnings && <AlertTriangle className="h-3.5 w-3.5" />}
              {status.message}
            </div>
          )}
        </div>

        {/* Content - Categories */}
        <div className="flex-1 overflow-y-auto">
          <div className="py-2">
            {simpleCategories.map((category) => {
              const isExpanded = expandedCategories.includes(category.id)
              const data = categoryData[category.id]
              const hasSelection = selection[data.key] !== null

              // Count for optional categories showing "none" selected
              const isNoneSelected =
                !category.required &&
                (selection[data.key] === 'none' || selection[data.key] === 'auto')

              return (
                <div
                  key={category.id}
                  className="border-b border-border last:border-0"
                >
                  {/* Category Header */}
                  <button
                    onClick={() => toggleCategory(category.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}

                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {category.question}
                        </span>
                        {category.required && (
                          <span className="text-[10px] text-orange-500 font-medium">
                            Required
                          </span>
                        )}
                        {hasSelection && !isNoneSelected && (
                          <div className="w-2 h-2 rounded-full bg-orange-500" />
                        )}
                      </div>
                      {!isExpanded && hasSelection && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {
                            data.styles.find((s) => s.id === selection[data.key])
                              ?.name
                          }
                        </p>
                      )}
                    </div>

                    <span className="text-xs text-muted-foreground">
                      {data.styles.length}
                    </span>
                  </button>

                  {/* Category Styles */}
                  {isExpanded && (
                    <div className="px-4 pb-3 space-y-1.5">
                      {data.styles.map((style) =>
                        renderStyleItem(data.key, style)
                      )}

                      {/* Show smart suggestion if available and not yet selected */}
                      {category.id === 'mood' &&
                        suggestions.suggestedMood &&
                        selection.mood !== suggestions.suggestedMood && (
                          <button
                            onClick={() =>
                              applySuggestion('mood', suggestions.suggestedMood)
                            }
                            className="w-full flex items-center gap-2 p-2 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 text-xs text-orange-700 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-950/30 transition-colors"
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                            <span className="flex-1 text-left">
                              {suggestions.explanation}
                            </span>
                            <span className="font-medium">Apply</span>
                          </button>
                        )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Warnings section */}
        {warnings.length > 0 && (
          <div className="p-3 border-t border-border bg-amber-50 dark:bg-amber-950/20">
            <div className="space-y-1">
              {warnings.map((warning, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400"
                >
                  <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p>{warning.message}</p>
                    {warning.suggestion && (
                      <p className="text-amber-600 dark:text-amber-500 mt-0.5">
                        Tip: {warning.suggestion}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer with info */}
        <div className="p-3 border-t border-border bg-muted/30">
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <Info className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <p className="text-xs">
                  Select your business type and format. The AI will
                  automatically apply professional photography settings
                  including optimal lens, lighting, and color grading.
                </p>
              </TooltipContent>
            </Tooltip>
            <span>Smart defaults applied automatically</span>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
