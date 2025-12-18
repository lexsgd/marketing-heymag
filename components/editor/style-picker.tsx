'use client'

import { useState, useMemo } from 'react'
import { Search, X, ChevronDown, ChevronRight, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  styleCategories,
  searchStyles,
  getSelectedCount,
  type SelectedStyles,
  type StyleCategory,
  type Style,
} from '@/lib/styles-data'

interface StylePickerProps {
  selection: SelectedStyles
  onSelectionChange: (selection: SelectedStyles) => void
}

export function StylePicker({ selection, onSelectionChange }: StylePickerProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['venue'])

  const selectedCount = getSelectedCount(selection)

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null
    return searchStyles(searchQuery)
  }, [searchQuery])

  // Toggle category expansion
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  // Handle style selection based on category type
  const handleStyleSelect = (category: StyleCategory, styleId: string) => {
    const newSelection = { ...selection }

    if (category.selectionType === 'single') {
      // For single-select, toggle or set
      const key = category.id as keyof SelectedStyles
      if (newSelection[key] === styleId) {
        // Deselect if clicking same one (unless required)
        if (!category.required) {
          (newSelection[key] as string | undefined) = undefined
        }
      } else {
        (newSelection[key] as string | undefined) = styleId
      }
    } else {
      // For multi-select, toggle in array
      const key = category.id as 'social' | 'technique'
      const arr = newSelection[key] || []
      if (arr.includes(styleId)) {
        newSelection[key] = arr.filter(id => id !== styleId)
      } else {
        newSelection[key] = [...arr, styleId]
      }
    }

    onSelectionChange(newSelection)
  }

  // Check if style is selected
  const isStyleSelected = (category: StyleCategory, styleId: string): boolean => {
    if (category.selectionType === 'single') {
      const key = category.id as keyof SelectedStyles
      return selection[key] === styleId
    } else {
      const key = category.id as 'social' | 'technique'
      return (selection[key] || []).includes(styleId)
    }
  }

  // Remove a selected style
  const removeStyle = (categoryId: string, styleId: string) => {
    const category = styleCategories.find(c => c.id === categoryId)
    if (!category) return

    const newSelection = { ...selection }

    if (category.selectionType === 'single') {
      const key = categoryId as keyof SelectedStyles
      if (!category.required) {
        (newSelection[key] as string | undefined) = undefined
      }
    } else {
      const key = categoryId as 'social' | 'technique'
      newSelection[key] = (newSelection[key] || []).filter(id => id !== styleId)
    }

    onSelectionChange(newSelection)
  }

  // Get all selected styles as chips
  const selectedChips: { categoryId: string; styleId: string; styleName: string; emoji: string }[] = []
  for (const category of styleCategories) {
    if (category.selectionType === 'single') {
      const key = category.id as keyof SelectedStyles
      const styleId = selection[key] as string | undefined
      if (styleId) {
        const style = category.styles.find(s => s.id === styleId)
        if (style) {
          selectedChips.push({
            categoryId: category.id,
            styleId,
            styleName: style.name,
            emoji: category.emoji,
          })
        }
      }
    } else {
      const key = category.id as 'social' | 'technique'
      const styleIds = selection[key] || []
      for (const styleId of styleIds) {
        const style = category.styles.find(s => s.id === styleId)
        if (style) {
          selectedChips.push({
            categoryId: category.id,
            styleId,
            styleName: style.name,
            emoji: category.emoji,
          })
        }
      }
    }
  }

  // Render a style item
  const renderStyleItem = (category: StyleCategory, style: Style) => {
    const isSelected = isStyleSelected(category, style.id)

    return (
      <button
        key={style.id}
        onClick={() => handleStyleSelect(category, style.id)}
        className={cn(
          'w-full flex items-start gap-3 p-2.5 rounded-lg border transition-all text-left',
          isSelected
            ? 'border-orange-500 bg-orange-500/10'
            : 'border-transparent hover:bg-muted/50'
        )}
      >
        {/* Thumbnail */}
        <div className="w-11 h-11 rounded-lg overflow-hidden bg-muted flex-shrink-0">
          <img
            src={style.thumbnail}
            alt={style.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-sm">{style.name}</p>
            {isSelected && (
              <Check className="h-3.5 w-3.5 text-orange-500 flex-shrink-0" />
            )}
          </div>
          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
            {style.description}
          </p>
        </div>

        {/* Selection indicator */}
        <div className="flex-shrink-0 mt-1">
          {category.selectionType === 'single' ? (
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
          ) : (
            <div
              className={cn(
                'w-4 h-4 rounded border-2 flex items-center justify-center',
                isSelected
                  ? 'border-orange-500 bg-orange-500'
                  : 'border-muted-foreground/40'
              )}
            >
              {isSelected && <Check className="h-2.5 w-2.5 text-white" />}
            </div>
          )}
        </div>
      </button>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with selected count */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Style Recipe</h3>
          {selectedCount > 0 && (
            <Badge variant="secondary" className="bg-orange-500/20 text-orange-500">
              {selectedCount} selected
            </Badge>
          )}
        </div>

        {/* Selected chips */}
        {selectedChips.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {selectedChips.map(chip => (
              <Badge
                key={`${chip.categoryId}-${chip.styleId}`}
                variant="secondary"
                className="pl-2 pr-1 py-1 gap-1 bg-muted"
              >
                <span className="text-xs">{chip.emoji}</span>
                <span className="text-xs">{chip.styleName}</span>
                <button
                  onClick={() => removeStyle(chip.categoryId, chip.styleId)}
                  className="ml-0.5 hover:bg-muted-foreground/20 rounded p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search styles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-muted rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Search Results */}
        {searchResults ? (
          <div className="p-4">
            <p className="text-xs text-muted-foreground mb-3">
              {searchResults.length} results for &quot;{searchQuery}&quot;
            </p>
            {searchResults.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No styles found. Try a different search term.
              </p>
            ) : (
              <div className="space-y-1">
                {searchResults.map(({ category, style }) => (
                  <div key={`${category.id}-${style.id}`}>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 mt-2 first:mt-0">
                      {category.emoji} {category.name}
                    </p>
                    {renderStyleItem(category, style)}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Category Accordions */
          <div className="py-2">
            {styleCategories.map(category => {
              const isExpanded = expandedCategories.includes(category.id)
              const hasSelection = category.selectionType === 'single'
                ? !!(selection[category.id as keyof SelectedStyles])
                : ((selection[category.id as 'social' | 'technique'] || []).length > 0)

              return (
                <div key={category.id} className="border-b border-border last:border-0">
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
                    <span className="text-base">{category.emoji}</span>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{category.name}</span>
                        {category.required && (
                          <span className="text-[10px] text-orange-500">Required</span>
                        )}
                        {hasSelection && (
                          <div className="w-2 h-2 rounded-full bg-orange-500" />
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {category.description}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {category.styles.length}
                    </span>
                  </button>

                  {/* Category Styles */}
                  {isExpanded && (
                    <div className="px-4 pb-3 space-y-1">
                      {category.styles.map(style => renderStyleItem(category, style))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer with style count */}
      <div className="p-4 border-t border-border bg-muted/30">
        <p className="text-xs text-muted-foreground text-center">
          {styleCategories.reduce((acc, cat) => acc + cat.styles.length, 0)} styles across {styleCategories.length} categories
        </p>
      </div>
    </div>
  )
}
