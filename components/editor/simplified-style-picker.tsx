'use client'

import { useState, useMemo, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronDown, ChevronRight, Check, Sparkles, AlertTriangle, Info, X, Wand2, Upload, ImageIcon } from 'lucide-react'
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
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'
import {
  simpleCategories,
  businessTypes,
  formats,
  moods,
  seasonalThemes,
  countSelections,
  getMoodRecommendationFromBackground,
  defaultBackgroundConfig,
  defaultProModeConfig,
  type SimpleSelection,
  type SimpleStyle,
  type FormatStyle,
  type BackgroundConfig,
  type BackgroundMode,
  type ProModeConfig,
} from '@/lib/simplified-styles'
import { ProModePanel } from './pro-mode-panel'
import { validateSelection, getSmartSuggestions, getSelectionStatus } from '@/lib/conflict-rules'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'

interface SimplifiedStylePickerProps {
  selection: SimpleSelection
  onSelectionChange: (selection: SimpleSelection) => void
  disabled?: boolean
  onClose?: () => void
  /** Background configuration */
  backgroundConfig?: BackgroundConfig
  /** Callback when background config changes */
  onBackgroundConfigChange?: (config: BackgroundConfig) => void
  /** Pro Mode configuration */
  proModeConfig?: ProModeConfig
  /** Callback when Pro Mode config changes */
  onProModeConfigChange?: (config: ProModeConfig) => void
  /** Simple Mode custom prompt (when Pro Mode disabled) */
  customPrompt?: string
  /** Callback when custom prompt changes */
  onCustomPromptChange?: (prompt: string) => void
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
  onClose,
  backgroundConfig = defaultBackgroundConfig,
  onBackgroundConfigChange,
  proModeConfig = defaultProModeConfig,
  onProModeConfigChange,
  customPrompt = '',
  onCustomPromptChange,
}: SimplifiedStylePickerProps) {
  // First two categories expanded by default
  const [expandedCategories, setExpandedCategories] = useState<string[]>([
    'businessType',
    'format',
  ])
  const [backgroundExpanded, setBackgroundExpanded] = useState(false)
  const backgroundInputRef = useRef<HTMLInputElement>(null)

  // Get mood recommendation based on background description
  const moodRecommendation = useMemo(() => {
    if (backgroundConfig.mode === 'describe' && backgroundConfig.description) {
      return getMoodRecommendationFromBackground(backgroundConfig.description)
    }
    return null
  }, [backgroundConfig.mode, backgroundConfig.description])

  // Update background config helper
  const updateBackgroundConfig = (updates: Partial<BackgroundConfig>) => {
    if (onBackgroundConfigChange) {
      onBackgroundConfigChange({ ...backgroundConfig, ...updates })
    }
  }

  // Handle background mode change
  const handleModeChange = (mode: BackgroundMode) => {
    if (onBackgroundConfigChange) {
      onBackgroundConfigChange({
        ...backgroundConfig,
        mode,
        // Clear description if switching away from describe mode
        description: mode === 'describe' ? backgroundConfig.description : undefined,
        // Clear upload if switching away from upload mode
        uploadedUrl: mode === 'upload' ? backgroundConfig.uploadedUrl : undefined,
      })
    }
  }

  // Handle background file upload
  const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    console.log('[StylePicker] Background upload triggered, file:', file?.name, file?.size)
    if (!file || !onBackgroundConfigChange) {
      console.log('[StylePicker] No file or no callback, aborting')
      return
    }

    // Validate file
    if (!file.type.startsWith('image/')) {
      console.log('[StylePicker] Invalid file type:', file.type)
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      console.log('[StylePicker] File too large:', file.size)
      return // Max 10MB
    }

    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      console.log('[StylePicker] Background file read successfully, data URL length:', dataUrl.length)
      console.log('[StylePicker] Setting mode to upload with uploadedUrl')
      onBackgroundConfigChange({
        ...backgroundConfig,
        mode: 'upload',
        uploadedUrl: dataUrl,
      })
    }
    reader.onerror = () => {
      console.error('[StylePicker] FileReader error:', reader.error)
    }
    reader.readAsDataURL(file)

    // Reset input
    e.target.value = ''
  }

  const clearBackground = () => {
    if (onBackgroundConfigChange) {
      onBackgroundConfigChange({
        ...backgroundConfig,
        uploadedUrl: undefined,
      })
    }
  }

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

  // Render a style item with hover card
  const renderStyleItem = (
    categoryKey: keyof SimpleSelection,
    style: SimpleStyle | FormatStyle
  ) => {
    const isSelected = selection[categoryKey] === style.id
    const isRecommended =
      categoryKey === 'mood' && suggestions.suggestedMood === style.id
    const isFormatRecommended =
      categoryKey === 'format' && suggestions.suggestedFormat === style.id
    const isFormat = 'aspectRatio' in style

    return (
      <HoverCard key={style.id} openDelay={300} closeDelay={100}>
        <HoverCardTrigger asChild>
          <button
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
        </HoverCardTrigger>
        <HoverCardContent
          side="right"
          align="start"
          className="w-72 p-0"
          sideOffset={8}
        >
          <div className="p-4 space-y-3">
            {/* Header with emoji and name */}
            <div className="flex items-center gap-3">
              <span className="text-3xl">{style.emoji}</span>
              <div>
                <h4 className="font-semibold">{style.name}</h4>
                {isFormat && (
                  <Badge variant="outline" className="text-[10px] mt-1">
                    {(style as FormatStyle).aspectRatio}
                  </Badge>
                )}
              </div>
            </div>

            {/* Full description */}
            <p className="text-sm text-muted-foreground">
              {style.description}
            </p>

            {/* Detailed help for laymen */}
            {style.detailedHelp && (
              <div className="p-2 bg-muted/50 rounded-md">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {style.detailedHelp}
                </p>
              </div>
            )}

            {/* Format-specific details */}
            {isFormat && (
              <div className="space-y-2 pt-2 border-t border-border">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Resolution</span>
                  <span className="font-mono">
                    {(style as FormatStyle).width} × {(style as FormatStyle).height}
                  </span>
                </div>
                {'examples' in style && style.examples && style.examples.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">Best for:</span>
                    <div className="flex flex-wrap gap-1">
                      {style.examples.map((example, idx) => (
                        <Badge
                          key={idx}
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0.5"
                        >
                          {example}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* AI info for moods */}
            {categoryKey === 'mood' && style.id !== 'auto' && (
              <div className="pt-2 border-t border-border">
                <p className="text-[10px] text-muted-foreground">
                  <Sparkles className="h-3 w-3 inline mr-1 text-orange-500" />
                  AI will apply matching lighting, color grading, and atmosphere
                </p>
              </div>
            )}

            {/* Business type AI info */}
            {categoryKey === 'businessType' && (
              <div className="pt-2 border-t border-border">
                <p className="text-[10px] text-muted-foreground">
                  <Sparkles className="h-3 w-3 inline mr-1 text-orange-500" />
                  AI will optimize styling for this food category
                </p>
              </div>
            )}

            {/* Seasonal theme info */}
            {categoryKey === 'seasonal' && style.id !== 'none' && (
              <div className="pt-2 border-t border-border">
                <p className="text-[10px] text-muted-foreground">
                  <Sparkles className="h-3 w-3 inline mr-1 text-orange-500" />
                  Adds festive props and themed styling
                </p>
              </div>
            )}
          </div>
        </HoverCardContent>
      </HoverCard>
    )
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full">
        {/* Header - Compact Design */}
        <div className="p-3 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm">Custom Style</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Build your own style recipe
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* Status indicator */}
              {status.message && status.isValid && !status.hasWarnings ? (
                <div className="flex items-center gap-1.5 text-xs text-green-600">
                  <Check className="h-3 w-3" />
                  <span>Ready</span>
                </div>
              ) : selectedCount > 0 ? (
                <Badge
                  variant="secondary"
                  className="bg-orange-500/20 text-orange-500 text-xs"
                >
                  {selectedCount}
                </Badge>
              ) : null}
              {/* Close button */}
              {onClose && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-7 w-7 -mr-1"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Warning status if any */}
          {status.hasWarnings && status.message && (
            <div className="flex items-center gap-1.5 mt-2 text-xs text-amber-600">
              <AlertTriangle className="h-3 w-3" />
              <span>{status.message}</span>
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

            {/* Background Section - Only show if onBackgroundConfigChange is provided */}
            {onBackgroundConfigChange && (
              <div className="border-b border-border last:border-0">
                {/* Background Header */}
                <button
                  onClick={() => setBackgroundExpanded(!backgroundExpanded)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
                >
                  {backgroundExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}

                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        Background
                      </span>
                      <span className="text-[10px] text-muted-foreground font-medium">
                        Optional
                      </span>
                      {(backgroundConfig.mode !== 'auto' || backgroundConfig.uploadedUrl || backgroundConfig.description) && (
                        <div className="w-2 h-2 rounded-full bg-orange-500" />
                      )}
                    </div>
                    {!backgroundExpanded && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {backgroundConfig.mode === 'auto' && 'AI Auto (default)'}
                        {backgroundConfig.mode === 'describe' && backgroundConfig.description && `"${backgroundConfig.description.substring(0, 30)}${backgroundConfig.description.length > 30 ? '...' : ''}"`}
                        {backgroundConfig.mode === 'describe' && !backgroundConfig.description && 'Describe your background'}
                        {backgroundConfig.mode === 'upload' && backgroundConfig.uploadedUrl && 'Custom background uploaded'}
                        {backgroundConfig.mode === 'upload' && !backgroundConfig.uploadedUrl && 'Upload your background'}
                      </p>
                    )}
                  </div>

                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                </button>

                {/* Background Content - 3 Modes */}
                {backgroundExpanded && (
                  <div className="px-4 pb-3 space-y-3">
                    {/* Hidden file input */}
                    <input
                      ref={backgroundInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleBackgroundUpload}
                      disabled={disabled}
                    />

                    {/* Mode Selection - Radio Buttons */}
                    <div className="space-y-2">
                      {/* AI Auto Mode */}
                      <button
                        onClick={() => handleModeChange('auto')}
                        disabled={disabled}
                        className={cn(
                          'w-full flex items-start gap-3 p-3 rounded-lg border transition-all text-left',
                          backgroundConfig.mode === 'auto'
                            ? 'border-orange-500 bg-orange-500/10'
                            : 'border-border hover:border-muted-foreground/50 hover:bg-muted/50',
                          disabled && 'opacity-50 cursor-not-allowed'
                        )}
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          <div
                            className={cn(
                              'w-4 h-4 rounded-full border-2 flex items-center justify-center',
                              backgroundConfig.mode === 'auto'
                                ? 'border-orange-500 bg-orange-500'
                                : 'border-muted-foreground/40'
                            )}
                          >
                            {backgroundConfig.mode === 'auto' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-3.5 w-3.5 text-orange-500" />
                            <span className="font-medium text-sm">AI Auto</span>
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                              Recommended
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Let AI choose the perfect background based on your food type and mood
                          </p>
                        </div>
                      </button>

                      {/* Describe Mode */}
                      <button
                        onClick={() => handleModeChange('describe')}
                        disabled={disabled}
                        className={cn(
                          'w-full flex items-start gap-3 p-3 rounded-lg border transition-all text-left',
                          backgroundConfig.mode === 'describe'
                            ? 'border-orange-500 bg-orange-500/10'
                            : 'border-border hover:border-muted-foreground/50 hover:bg-muted/50',
                          disabled && 'opacity-50 cursor-not-allowed'
                        )}
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          <div
                            className={cn(
                              'w-4 h-4 rounded-full border-2 flex items-center justify-center',
                              backgroundConfig.mode === 'describe'
                                ? 'border-orange-500 bg-orange-500'
                                : 'border-muted-foreground/40'
                            )}
                          >
                            {backgroundConfig.mode === 'describe' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Wand2 className="h-3.5 w-3.5 text-purple-500" />
                            <span className="font-medium text-sm">Describe Background</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Tell AI what background you want (e.g., "red Thai-styled wooden table")
                          </p>
                        </div>
                      </button>

                      {/* Upload Mode */}
                      <button
                        onClick={() => handleModeChange('upload')}
                        disabled={disabled}
                        className={cn(
                          'w-full flex items-start gap-3 p-3 rounded-lg border transition-all text-left',
                          backgroundConfig.mode === 'upload'
                            ? 'border-orange-500 bg-orange-500/10'
                            : 'border-border hover:border-muted-foreground/50 hover:bg-muted/50',
                          disabled && 'opacity-50 cursor-not-allowed'
                        )}
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          <div
                            className={cn(
                              'w-4 h-4 rounded-full border-2 flex items-center justify-center',
                              backgroundConfig.mode === 'upload'
                                ? 'border-orange-500 bg-orange-500'
                                : 'border-muted-foreground/40'
                            )}
                          >
                            {backgroundConfig.mode === 'upload' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Upload className="h-3.5 w-3.5 text-blue-500" />
                            <span className="font-medium text-sm">Upload Your Own</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Use your branded background image for consistent branding
                          </p>
                        </div>
                      </button>
                    </div>

                    {/* Describe Mode - Text Input */}
                    {backgroundConfig.mode === 'describe' && (
                      <div className="space-y-2 pt-2 border-t border-border">
                        <Label htmlFor="bg-description" className="text-xs font-medium">
                          Describe your background
                        </Label>
                        <Textarea
                          id="bg-description"
                          placeholder="e.g., Red Thai-styled wooden table with gold accents, or white marble surface with soft shadows"
                          value={backgroundConfig.description || ''}
                          onChange={(e) => updateBackgroundConfig({ description: e.target.value })}
                          disabled={disabled}
                          className="min-h-[80px] text-sm resize-none"
                        />
                        <p className="text-[10px] text-muted-foreground">
                          Be specific about colors, materials, and style. AI will generate the perfect background.
                        </p>

                        {/* Mood Recommendation */}
                        {moodRecommendation && (
                          <div className="flex items-start gap-2 p-2 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                            <Sparkles className="h-3.5 w-3.5 text-purple-500 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-[10px] text-purple-700 dark:text-purple-400 font-medium">
                                Mood suggestion: {moods.find(m => m.id === moodRecommendation.mood)?.name}
                              </p>
                              <p className="text-[10px] text-purple-600 dark:text-purple-500 mt-0.5">
                                {moodRecommendation.reason}
                              </p>
                              {selection.mood !== moodRecommendation.mood && selection.mood !== 'auto' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2 mt-1 text-[10px] text-purple-600 hover:text-purple-700"
                                  onClick={() => onSelectionChange({ ...selection, mood: moodRecommendation.mood })}
                                >
                                  Apply suggestion
                                </Button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Upload Mode - File Upload */}
                    {backgroundConfig.mode === 'upload' && (
                      <div className="space-y-3 pt-2 border-t border-border">
                        {backgroundConfig.uploadedUrl ? (
                          /* Preview uploaded background */
                          <div className="relative aspect-video rounded-lg overflow-hidden border border-border">
                            <Image
                              src={backgroundConfig.uploadedUrl}
                              alt="Custom background"
                              fill
                              className="object-cover"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute top-2 right-2 h-7 w-7 bg-background/80 hover:bg-background"
                              onClick={clearBackground}
                              disabled={disabled}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                            <Badge className="absolute bottom-2 left-2 bg-green-500 text-white border-0 text-[10px]">
                              <Check className="h-3 w-3 mr-1" />
                              Ready
                            </Badge>
                          </div>
                        ) : (
                          /* Upload zone */
                          <label
                            className={cn(
                              'flex flex-col items-center justify-center h-24 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors',
                              disabled && 'opacity-50 cursor-not-allowed'
                            )}
                          >
                            <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                            <span className="text-xs text-muted-foreground">Upload your background</span>
                            <span className="text-[10px] text-muted-foreground mt-0.5">PNG, JPG up to 10MB</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleBackgroundUpload}
                              disabled={disabled}
                            />
                          </label>
                        )}

                        {/* Info text for upload mode */}
                        <div className="flex items-start gap-2 p-2 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                          <Info className="h-3.5 w-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
                          <p className="text-[10px] text-blue-700 dark:text-blue-400">
                            Your food will be automatically extracted and placed on this background
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Save as default checkbox */}
                    {(backgroundConfig.mode !== 'auto' || backgroundConfig.description || backgroundConfig.uploadedUrl) && (
                      <div className="flex items-center gap-2 pt-2 border-t border-border">
                        <Checkbox
                          id="save-default"
                          checked={backgroundConfig.saveAsDefault || false}
                          onCheckedChange={(checked) => updateBackgroundConfig({ saveAsDefault: checked === true })}
                          disabled={disabled}
                        />
                        <Label
                          htmlFor="save-default"
                          className="text-xs text-muted-foreground cursor-pointer"
                        >
                          Save as default for future uploads
                        </Label>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Pro Mode Panel - Prompt Customization */}
          {onProModeConfigChange && onCustomPromptChange && (
            <div className="border-t border-border p-4">
              <ProModePanel
                selection={selection}
                backgroundConfig={backgroundConfig}
                proModeConfig={proModeConfig}
                onProModeChange={onProModeConfigChange}
                customPrompt={customPrompt}
                onCustomPromptChange={onCustomPromptChange}
              />
            </div>
          )}
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

        {/* Footer with info and template link */}
        <div className="p-3 border-t border-border bg-muted/30 space-y-2">
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
          <Button variant="ghost" size="sm" className="w-full text-xs" asChild>
            <Link href="/explore">
              <Wand2 className="h-3.5 w-3.5 mr-2" />
              Or use a template instead
            </Link>
          </Button>
        </div>
      </div>
    </TooltipProvider>
  )
}
