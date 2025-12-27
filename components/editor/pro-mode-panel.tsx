'use client'

import { useCallback } from 'react'
import { Sparkles, Wand2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { PromptSection } from './prompt-section'
import { PromptPreview } from './prompt-preview'
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
    <div className={cn('space-y-4', className)}>
      {/* Mode Toggle */}
      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
        <div className="flex items-center gap-2">
          {proModeConfig.enabled ? (
            <Sparkles className="h-4 w-4 text-orange-500" />
          ) : (
            <Wand2 className="h-4 w-4 text-muted-foreground" />
          )}
          <div>
            <Label htmlFor="pro-mode-toggle" className="font-medium cursor-pointer">
              {proModeConfig.enabled ? 'Pro Mode' : 'Simple Mode'}
            </Label>
            <p className="text-xs text-muted-foreground">
              {proModeConfig.enabled
                ? 'Structured sections for detailed control'
                : 'Quick customization with single prompt'}
            </p>
          </div>
        </div>
        <Switch
          id="pro-mode-toggle"
          checked={proModeConfig.enabled}
          onCheckedChange={handleToggle}
        />
      </div>

      {/* Simple Mode Content */}
      {!proModeConfig.enabled && (
        <div className="space-y-3">
          {/* Custom Prompt Textarea */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                Describe your image (optional)
              </Label>
              <span
                className={cn(
                  'text-xs tabular-nums',
                  customPrompt.length > 500
                    ? 'text-destructive font-medium'
                    : customPrompt.length > 450
                      ? 'text-orange-500'
                      : 'text-muted-foreground'
                )}
              >
                {customPrompt.length}/500
              </span>
            </div>
            <Textarea
              value={customPrompt}
              onChange={(e) => onCustomPromptChange(e.target.value)}
              placeholder="Add any special requests... or leave blank for AI to decide"
              className="min-h-[80px] resize-none text-sm"
              maxLength={550}
            />
          </div>

          {/* Quick Suggestions */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-muted-foreground/70 mr-0.5">
              Quick add:
            </span>
            {simpleSuggestions.slice(0, 4).map((suggestion, idx) => {
              const isAdded = customPrompt
                .toLowerCase()
                .includes(suggestion.toLowerCase().substring(0, 20))

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSimpleSuggestionClick(suggestion)}
                  disabled={isAdded}
                  className={cn(
                    'text-xs px-2 py-0.5 rounded-full transition-all text-left',
                    isAdded
                      ? 'bg-orange-500/20 text-orange-600 dark:text-orange-400 cursor-default'
                      : 'bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground'
                  )}
                >
                  {isAdded ? '✓' : ''}{' '}
                  {suggestion.length > 30
                    ? suggestion.substring(0, 30) + '...'
                    : suggestion}
                </button>
              )
            })}
          </div>

          {/* Tip */}
          <p className="text-xs text-muted-foreground/70">
            Tip: Switch to Pro Mode for detailed control over props, camera
            angles, and composition.
          </p>
        </div>
      )}

      {/* Pro Mode Content */}
      {proModeConfig.enabled && (
        <div className="space-y-4">
          {/* Props & Styling Section */}
          <PromptSection
            icon="🎨"
            title="Props & Styling"
            placeholder="Add chopsticks, small soy sauce dish, scattered sesame seeds, steam rising..."
            value={proModeConfig.propsAndStyling || ''}
            onChange={(value) => updateProModeField('propsAndStyling', value)}
            maxChars={proModeCharLimits.propsAndStyling}
            suggestions={propsSuggestions}
            helpText="Describe physical items to add or styling preferences. The AI will place these naturally."
          />

          {/* Photography Notes Section */}
          <PromptSection
            icon="📷"
            title="Photography Notes"
            placeholder="45-degree angle, shallow depth of field, soft shadows on the left..."
            value={proModeConfig.photographyNotes || ''}
            onChange={(value) => updateProModeField('photographyNotes', value)}
            maxChars={proModeCharLimits.photographyNotes}
            suggestions={photoSuggestions}
            helpText="Adjust camera angle, lighting, and lens effects. Overrides smart defaults."
          />

          {/* Composition Notes Section */}
          <PromptSection
            icon="📐"
            title="Composition Notes"
            placeholder="Leave space on the right for text overlay, center the main dish..."
            value={proModeConfig.compositionNotes || ''}
            onChange={(value) => updateProModeField('compositionNotes', value)}
            maxChars={proModeCharLimits.compositionNotes}
            suggestions={compositionSuggestions}
            helpText="Control framing and layout for your marketing needs."
          />
        </div>
      )}

      {/* Preview (always visible) */}
      <PromptPreview
        selection={selection}
        backgroundConfig={backgroundConfig}
        proModeConfig={proModeConfig}
        customPrompt={customPrompt}
      />
    </div>
  )
}
