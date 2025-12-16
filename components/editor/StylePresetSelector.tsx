'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet'
import { Code, RotateCcw, Check, Pencil, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { config } from '@/lib/config'
import { stylePrompts, defaultPrompt } from '@/lib/style-prompts'

interface StylePresetSelectorProps {
  selectedStyle: string | null
  onStyleSelect: (styleId: string) => void
  customPrompts?: Record<string, string>
  onCustomPromptChange?: (styleId: string, prompt: string) => void
  disabled?: boolean
}

interface PresetWithPrompt {
  id: string
  name: string
  description: string
  category: string
  prompt: string
  customPrompt?: string
}

export function StylePresetSelector({
  selectedStyle,
  onStyleSelect,
  customPrompts = {},
  onCustomPromptChange,
  disabled = false,
}: StylePresetSelectorProps) {
  const [openSheetId, setOpenSheetId] = useState<string | null>(null)
  const [editingPrompt, setEditingPrompt] = useState<string>('')
  const [isEditing, setIsEditing] = useState(false)

  // Get preset with its prompt
  const getPresetWithPrompt = (presetId: string): PresetWithPrompt | null => {
    const preset = config.stylePresets.find((p) => p.id === presetId)
    if (!preset) return null
    return {
      ...preset,
      prompt: stylePrompts[presetId] || defaultPrompt,
      customPrompt: customPrompts[presetId],
    }
  }

  const handleOpenSheet = (presetId: string, e: React.MouseEvent) => {
    e.stopPropagation() // Don't select the preset when clicking the icon
    const preset = getPresetWithPrompt(presetId)
    if (preset) {
      setEditingPrompt(preset.customPrompt || preset.prompt)
      setOpenSheetId(presetId)
      setIsEditing(false)
    }
  }

  const handleSavePrompt = () => {
    if (openSheetId && onCustomPromptChange) {
      onCustomPromptChange(openSheetId, editingPrompt)
    }
    setIsEditing(false)
  }

  const handleResetPrompt = () => {
    if (openSheetId) {
      const preset = getPresetWithPrompt(openSheetId)
      if (preset) {
        setEditingPrompt(preset.prompt)
        if (onCustomPromptChange) {
          onCustomPromptChange(openSheetId, '')  // Clear custom prompt
        }
      }
    }
    setIsEditing(false)
  }

  const handleCloseSheet = () => {
    setOpenSheetId(null)
    setIsEditing(false)
  }

  const currentPreset = openSheetId ? getPresetWithPrompt(openSheetId) : null

  // Group presets by category
  const categories = config.presetCategories

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {categories.map((category) => {
          const categoryPresets = config.stylePresets.filter(
            (p) => p.category === category.id
          )
          if (categoryPresets.length === 0) return null

          return (
            <div key={category.id}>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">
                {category.name}
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {categoryPresets.map((preset) => {
                  const hasCustomPrompt = !!customPrompts[preset.id]
                  return (
                    <div
                      key={preset.id}
                      className={cn(
                        'relative group p-4 rounded-lg border text-left transition-all cursor-pointer',
                        selectedStyle === preset.id
                          ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20 ring-2 ring-orange-500'
                          : 'border-border hover:border-muted-foreground/50',
                        disabled && 'opacity-50 cursor-not-allowed'
                      )}
                      onClick={() => !disabled && onStyleSelect(preset.id)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm truncate">
                              {preset.name}
                            </span>
                            {hasCustomPrompt && (
                              <Badge variant="secondary" className="text-xs px-1.5 py-0">
                                Custom
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {preset.description}
                          </div>
                        </div>
                        {/* View/Edit Prompt Button */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                              onClick={(e) => handleOpenSheet(preset.id, e)}
                              disabled={disabled}
                            >
                              <Code className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <p>View & customize prompt</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Prompt Viewer/Editor Sheet */}
      <Sheet open={!!openSheetId} onOpenChange={(open) => !open && handleCloseSheet()}>
        <SheetContent className="sm:max-w-lg w-full flex flex-col">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              {currentPreset?.name}
              {currentPreset?.customPrompt && (
                <Badge variant="secondary" className="text-xs">Customized</Badge>
              )}
            </SheetTitle>
            <SheetDescription>
              {currentPreset?.description}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 py-4 space-y-4 overflow-hidden">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">
                AI Enhancement Prompt
              </label>
              {!isEditing ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="h-8"
                >
                  <Pencil className="h-3.5 w-3.5 mr-1.5" />
                  Edit
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsEditing(false)
                    setEditingPrompt(currentPreset?.customPrompt || currentPreset?.prompt || '')
                  }}
                  className="h-8"
                >
                  <X className="h-3.5 w-3.5 mr-1.5" />
                  Cancel
                </Button>
              )}
            </div>

            <Textarea
              value={editingPrompt}
              onChange={(e) => setEditingPrompt(e.target.value)}
              readOnly={!isEditing}
              className={cn(
                'h-[300px] resize-none text-sm',
                !isEditing && 'bg-muted/50 cursor-default'
              )}
              placeholder="Enter your custom prompt..."
            />

            {isEditing && (
              <p className="text-xs text-muted-foreground">
                Customize this prompt to adjust how AI enhances your photos for this style.
                The prompt describes the visual characteristics, lighting, composition, and mood.
              </p>
            )}
          </div>

          <SheetFooter className="flex-shrink-0 gap-2 sm:gap-2">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  onClick={handleResetPrompt}
                  className="flex-1"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset to Default
                </Button>
                <Button
                  onClick={handleSavePrompt}
                  className="flex-1 bg-orange-500 hover:bg-orange-600"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </>
            ) : (
              <SheetClose asChild>
                <Button variant="outline" className="w-full">
                  Close
                </Button>
              </SheetClose>
            )}
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </TooltipProvider>
  )
}
