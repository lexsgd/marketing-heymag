'use client'

import { useCallback, useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { PromptSection } from './prompt-section'
import { PromptPreview } from './prompt-preview'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip'
import {
  getSuggestionsForSection,
  getSimpleModeSuggestions,
} from '@/lib/pro-mode-suggestions'
import type {
  SimpleSelection,
  BackgroundConfig,
  ProModeConfig,
} from '@/lib/simplified-styles'
import { proModeCharLimits } from '@/lib/simplified-styles'

interface ProModePanelProps {
  /** Current style selection from the sidebar */
  selection: SimpleSelection
  /** Background configuration */
  backgroundConfig: BackgroundConfig
  /** Pro Mode configuration */
  proModeConfig: ProModeConfig
  /** Update Pro Mode configuration */
  onProModeChange: (config: ProModeConfig) => void
  /** Simple Mode custom prompt (when Pro Mode disabled) */
  customPrompt: string
  /** Update Simple Mode custom prompt */
  onCustomPromptChange: (prompt: string) => void
  /** Optional className */
  className?: string
}

/**
 * ProModePanel - Main container for the prompt customization system
 *
 * Features:
 * - Toggle between Simple Mode and Pro Mode
 * - Simple Mode: Single textarea with contextual suggestions
 * - Pro Mode: Structured sections for props, photography, composition
 * - Live preview of what will be sent to AI
 *
 * Architecture:
 * Pro Mode is ADDITIVE - it adds structured instructions ON TOP of the
 * smart defaults, it doesn't replace them.
 */
export function ProModePanel({
  selection,
  backgroundConfig,
  proModeConfig,
  onProModeChange,
  customPrompt,
  onCustomPromptChange,
  className,
}: ProModePanelProps) {
  // Section expanded state
  const [isExpanded, setIsExpanded] = useState(true)

  // Check if there's any custom content added
  const hasCustomContent = proModeConfig.enabled
    ? !!(proModeConfig.propsAndStyling || proModeConfig.photographyNotes || proModeConfig.compositionNotes)
    : !!customPrompt.trim()

  // Toggle Pro Mode on/off
  const handleToggle = useCallback(
    (enabled: boolean) => {
      onProModeChange({
        ...proModeConfig,
        enabled,
      })
    },
    [proModeConfig, onProModeChange]
  )

  // Update a specific Pro Mode field
  const updateProModeField = useCallback(
    (field: keyof ProModeConfig, value: string) => {
      onProModeChange({
        ...proModeConfig,
        [field]: value || undefined, // Convert empty string to undefined
      })
    },
    [proModeConfig, onProModeChange]
  )

  // Handle Simple Mode suggestion click
  const handleSimpleSuggestionClick = useCallback(
    (suggestion: string) => {
      if (!customPrompt.trim()) {
        onCustomPromptChange(suggestion)
        return
      }
      // Don't add if already present
      if (customPrompt.toLowerCase().includes(suggestion.toLowerCase())) {
        return
      }
      const newValue = `${customPrompt.trim()}. ${suggestion}`
      if (newValue.length <= 600) {
        onCustomPromptChange(newValue)
      }
    },
    [customPrompt, onCustomPromptChange]
  )

  // Get context-aware suggestions
  const simpleSuggestions = getSimpleModeSuggestions(selection.businessType)
  const propsSuggestions = getSuggestionsForSection(
    selection.businessType,
    'propsAndStyling'
  )
  const photoSuggestions = getSuggestionsForSection(
    selection.businessType,
    'photographyNotes'
  )
  const compositionSuggestions = getSuggestionsForSection(
    selection.businessType,
    'compositionNotes'
  )

  return (
    <TooltipProvider>
      <div className={cn(className)}>
        {/* Collapsible Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
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
                {proModeConfig.enabled ? 'Pro Mode' : 'Simple'}
              </span>
              <span className="text-[10px] text-muted-foreground font-medium">
                Optional
              </span>
              {hasCustomContent && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="w-2 h-2 rounded-full bg-orange-500 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    Customized
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
            {!isExpanded && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {proModeConfig.enabled
                  ? hasCustomContent
                    ? 'Custom instructions added'
                    : 'Structured prompt sections'
                  : hasCustomContent
                    ? `"${customPrompt.substring(0, 30)}${customPrompt.length > 30 ? '...' : ''}"`
                    : 'Add extra instructions'}
              </p>
            )}
          </div>

          {/* Toggle switch - stop propagation to allow independent clicking */}
          <div onClick={(e) => e.stopPropagation()}>
            <Switch
              id="pro-mode-toggle"
              checked={proModeConfig.enabled}
              onCheckedChange={handleToggle}
            />
          </div>
        </button>

        {/* Expandable Content */}
        {isExpanded && (
          <div className="px-4 pb-3 space-y-3">
            {/* Content area with min-height to prevent layout shift */}
            <div className="min-h-[280px] transition-all duration-200 ease-in-out">
              {/* Simple Mode Content */}
              {!proModeConfig.enabled && (
                <div className="space-y-2">
                  {/* Custom Prompt Textarea */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-muted-foreground">
                        Additional instructions (optional)
                      </Label>
                      <span
                        className={cn(
                          'text-[10px] tabular-nums',
                          customPrompt.length > 500
                            ? 'text-destructive font-medium'
                            : customPrompt.length > 450
                              ? 'text-orange-500'
                              : 'text-muted-foreground/60'
                        )}
                      >
                        {customPrompt.length}/500
                      </span>
                    </div>
                    <Textarea
                      value={customPrompt}
                      onChange={(e) => onCustomPromptChange(e.target.value)}
                      placeholder="e.g. add steam, warm lighting..."
                      className="min-h-[60px] resize-none text-sm"
                      maxLength={550}
                    />
                  </div>

                  {/* Quick Suggestions - more compact */}
                  <div className="flex flex-wrap gap-1">
                    {simpleSuggestions.slice(0, 3).map((suggestion, idx) => {
                      const isAdded = customPrompt
                        .toLowerCase()
                        .includes(suggestion.toLowerCase().substring(0, 15))

                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSimpleSuggestionClick(suggestion)}
                          disabled={isAdded}
                          className={cn(
                            'text-[11px] px-2 py-0.5 rounded transition-colors',
                            isAdded
                              ? 'bg-orange-500/15 text-orange-600 dark:text-orange-400'
                              : 'bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground'
                          )}
                        >
                          {suggestion.length > 25
                            ? suggestion.substring(0, 25) + '...'
                            : suggestion}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Pro Mode Content */}
              {proModeConfig.enabled && (
                <div className="space-y-3">
                  {/* Props & Styling Section */}
                  <PromptSection
                    icon="🎨"
                    title="Props & Styling"
                    placeholder="chopsticks, sauce dish, steam..."
                    value={proModeConfig.propsAndStyling || ''}
                    onChange={(value) => updateProModeField('propsAndStyling', value)}
                    maxChars={proModeCharLimits.propsAndStyling}
                    suggestions={propsSuggestions}
                  />

                  {/* Photography Notes Section */}
                  <PromptSection
                    icon="📷"
                    title="Photography"
                    placeholder="45° angle, shallow DOF..."
                    value={proModeConfig.photographyNotes || ''}
                    onChange={(value) => updateProModeField('photographyNotes', value)}
                    maxChars={proModeCharLimits.photographyNotes}
                    suggestions={photoSuggestions}
                  />

                  {/* Composition Notes Section */}
                  <PromptSection
                    icon="📐"
                    title="Composition"
                    placeholder="space for text, centered..."
                    value={proModeConfig.compositionNotes || ''}
                    onChange={(value) => updateProModeField('compositionNotes', value)}
                    maxChars={proModeCharLimits.compositionNotes}
                    suggestions={compositionSuggestions}
                  />
                </div>
              )}
            </div>

            {/* Preview */}
            <PromptPreview
              selection={selection}
              backgroundConfig={backgroundConfig}
              proModeConfig={proModeConfig}
              customPrompt={customPrompt}
            />
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}
