'use client'

import { useCallback } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface PromptSectionProps {
  /** Icon to display (emoji or text) */
  icon: string
  /** Section title */
  title: string
  /** Placeholder text for textarea */
  placeholder: string
  /** Current value */
  value: string
  /** Change handler */
  onChange: (value: string) => void
  /** Maximum character limit */
  maxChars: number
  /** Quick suggestion chips */
  suggestions: string[]
  /** Optional help text below suggestions */
  helpText?: string
  /** Whether the section is disabled */
  disabled?: boolean
  /** Optional className for custom styling */
  className?: string
}

/**
 * PromptSection - Reusable prompt input component for Pro Mode
 *
 * Features:
 * - Character counter with visual feedback
 * - Click-to-append suggestion chips
 * - Help text for guidance
 * - Consistent styling with rest of editor
 */
export function PromptSection({
  icon,
  title,
  placeholder,
  value,
  onChange,
  maxChars,
  suggestions,
  helpText,
  disabled = false,
  className,
}: PromptSectionProps) {
  const charCount = value.length
  const isOverLimit = charCount > maxChars
  const isNearLimit = charCount > maxChars * 0.9

  // Append suggestion to current value with comma separation
  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      if (disabled) return

      // If value is empty, just set the suggestion
      if (!value.trim()) {
        onChange(suggestion)
        return
      }

      // If suggestion already exists in value, don't add again
      if (value.toLowerCase().includes(suggestion.toLowerCase())) {
        return
      }

      // Append with comma and space
      const newValue = `${value.trim()}, ${suggestion}`

      // Only append if within limit
      if (newValue.length <= maxChars + 50) {
        onChange(newValue)
      }
    },
    [value, onChange, disabled, maxChars]
  )

  return (
    <div className={cn('space-y-2', className)}>
      {/* Header with title and character counter */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base">{icon}</span>
          <span className="text-sm font-medium text-foreground">{title}</span>
        </div>
        <span
          className={cn(
            'text-xs tabular-nums transition-colors',
            isOverLimit
              ? 'text-destructive font-medium'
              : isNearLimit
                ? 'text-orange-500'
                : 'text-muted-foreground'
          )}
        >
          {charCount}/{maxChars}
        </span>
      </div>

      {/* Textarea input */}
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          'min-h-[80px] resize-none text-sm',
          isOverLimit && 'border-destructive focus-visible:ring-destructive'
        )}
        maxLength={maxChars + 50} // Allow slight overage for UX
      />

      {/* Quick suggestion chips */}
      {suggestions.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground/70 mr-0.5">
            Quick add:
          </span>
          {suggestions.slice(0, 6).map((suggestion, idx) => {
            const isAlreadyAdded = value
              .toLowerCase()
              .includes(suggestion.toLowerCase())

            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSuggestionClick(suggestion)}
                disabled={disabled || isAlreadyAdded}
                className={cn(
                  'text-xs px-2 py-0.5 rounded-full transition-all',
                  isAlreadyAdded
                    ? 'bg-orange-500/20 text-orange-600 dark:text-orange-400 cursor-default'
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground',
                  disabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                {isAlreadyAdded ? `✓ ${suggestion}` : suggestion}
              </button>
            )
          })}
        </div>
      )}

      {/* Help text */}
      {helpText && (
        <p className="text-xs text-muted-foreground/70 leading-relaxed">
          {helpText}
        </p>
      )}
    </div>
  )
}
