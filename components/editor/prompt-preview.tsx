'use client'

import { useMemo, useState } from 'react'
import { ChevronDown, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SimpleSelection, ProModeConfig, BackgroundConfig } from '@/lib/simplified-styles'

interface PromptPreviewProps {
  /** Current style selection */
  selection: SimpleSelection
  /** Background configuration */
  backgroundConfig: BackgroundConfig
  /** Pro Mode configuration */
  proModeConfig: ProModeConfig
  /** Simple Mode custom prompt (when Pro Mode disabled) */
  customPrompt?: string
  /** Optional className */
  className?: string
}

/**
 * PromptPreview - Shows a preview of what will be sent to the AI
 *
 * Features:
 * - Collapsible preview panel
 * - Shows all active settings at a glance
 * - Estimates token count
 * - Helps users understand what the AI will receive
 */
export function PromptPreview({
  selection,
  backgroundConfig,
  proModeConfig,
  customPrompt,
  className,
}: PromptPreviewProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Build preview lines showing active configuration
  const previewLines = useMemo(() => {
    const lines: { label: string; value: string; type: 'base' | 'custom' }[] = []

    // Base settings (always present)
    lines.push({
      label: 'Business',
      value: (selection.businessType || 'restaurant').toUpperCase(),
      type: 'base',
    })

    lines.push({
      label: 'Mood',
      value: (selection.mood || 'auto').toUpperCase(),
      type: 'base',
    })

    lines.push({
      label: 'Format',
      value: selection.format || '1:1',
      type: 'base',
    })

    if (selection.seasonal && selection.seasonal !== 'none') {
      lines.push({
        label: 'Seasonal',
        value: selection.seasonal.toUpperCase(),
        type: 'base',
      })
    }

    // Background description
    if (backgroundConfig.mode === 'describe' && backgroundConfig.description?.trim()) {
      lines.push({
        label: 'Background',
        value: truncate(backgroundConfig.description, 50),
        type: 'custom',
      })
    } else if (backgroundConfig.mode === 'upload' && backgroundConfig.uploadedUrl) {
      lines.push({
        label: 'Background',
        value: 'Custom uploaded image',
        type: 'custom',
      })
    }

    // Pro Mode sections or Simple Mode custom prompt
    if (proModeConfig.enabled) {
      if (proModeConfig.propsAndStyling?.trim()) {
        lines.push({
          label: 'Props',
          value: truncate(proModeConfig.propsAndStyling, 50),
          type: 'custom',
        })
      }

      if (proModeConfig.photographyNotes?.trim()) {
        lines.push({
          label: 'Photo',
          value: truncate(proModeConfig.photographyNotes, 50),
          type: 'custom',
        })
      }

      if (proModeConfig.compositionNotes?.trim()) {
        lines.push({
          label: 'Composition',
          value: truncate(proModeConfig.compositionNotes, 50),
          type: 'custom',
        })
      }
    } else if (customPrompt?.trim()) {
      lines.push({
        label: 'Custom',
        value: truncate(customPrompt, 50),
        type: 'custom',
      })
    }

    return lines
  }, [selection, backgroundConfig, proModeConfig, customPrompt])

  // Estimate token count (rough approximation: ~4 chars per token)
  const estimatedTokens = useMemo(() => {
    let totalChars = 600 * 4 // Base smart defaults (~600 tokens)

    if (backgroundConfig.description) {
      totalChars += backgroundConfig.description.length
    }

    if (proModeConfig.enabled) {
      if (proModeConfig.propsAndStyling) {
        totalChars += proModeConfig.propsAndStyling.length
      }
      if (proModeConfig.photographyNotes) {
        totalChars += proModeConfig.photographyNotes.length
      }
      if (proModeConfig.compositionNotes) {
        totalChars += proModeConfig.compositionNotes.length
      }
    } else if (customPrompt) {
      totalChars += customPrompt.length
    }

    return Math.ceil(totalChars / 4)
  }, [backgroundConfig, proModeConfig, customPrompt])

  // Count custom additions
  const customCount = previewLines.filter((l) => l.type === 'custom').length

  return (
    <div className={cn('border border-border/50 rounded-lg', className)}>
      {/* Header - always visible */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-2.5 py-2 text-left hover:bg-muted/30 transition-colors rounded-lg"
      >
        <div className="flex items-center gap-1.5">
          <Eye className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Preview</span>
          {customCount > 0 && (
            <span className="text-[10px] px-1 py-0.5 rounded bg-orange-500/15 text-orange-600 dark:text-orange-400">
              +{customCount}
            </span>
          )}
        </div>
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 text-muted-foreground transition-transform',
            isExpanded && 'rotate-180'
          )}
        />
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-2.5 pb-2.5">
          <div className="bg-muted/30 rounded p-2 space-y-1">
            {previewLines.map((line, idx) => (
              <div
                key={idx}
                className="flex items-start gap-1.5 text-[11px] font-mono"
              >
                <span
                  className={cn(
                    'font-medium min-w-[55px]',
                    line.type === 'custom'
                      ? 'text-orange-600 dark:text-orange-400'
                      : 'text-muted-foreground'
                  )}
                >
                  {line.label}:
                </span>
                <span className="text-foreground/70">{line.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Truncate string with ellipsis
 */
function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.substring(0, maxLength).trim() + '...'
}
