'use client'

import { useState, useCallback, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  Upload,
  Loader2,
  X,
  Sparkles,
  ImageIcon,
  Plus,
  ArrowRight,
  Palette,
  Wand2,
  Check,
  Settings2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { MainNavAuth } from '@/components/main-nav-auth'
import { getTemplateById, type TemplateImage } from '@/lib/template-images'
import { VariationsPicker } from '@/components/editor/variations-picker'
import { SimplifiedStylePicker } from '@/components/editor/simplified-style-picker'
import { MobileToolbar } from '@/components/editor/mobile-toolbar'
import { StyleBottomSheet } from '@/components/editor/style-bottom-sheet'
import { PromptBottomSheet } from '@/components/editor/prompt-bottom-sheet'
import {
  type SimpleSelection,
  type BackgroundConfig,
  emptySimpleSelection,
  defaultBackgroundConfig,
  getFormatConfig,
} from '@/lib/simplified-styles'
import { replaceBackgroundImage } from '@/lib/background-removal'

function EditorContent() {
  const searchParams = useSearchParams()
  const templateId = searchParams.get('template')

  const [template, setTemplate] = useState<TemplateImage | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [selectedStyles, setSelectedStyles] = useState<SimpleSelection>(emptySimpleSelection)
  const [enhancing, setEnhancing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [variations, setVariations] = useState(1)
  // Guard to prevent multiple file dialogs from opening
  const [isFileDialogOpen, setIsFileDialogOpen] = useState(false)
  // Sidebar visibility state - closed by default on mobile
  const [sidebarOpen, setSidebarOpen] = useState(false)
  // Mobile bottom sheet states
  const [styleSheetOpen, setStyleSheetOpen] = useState(false)
  const [promptSheetOpen, setPromptSheetOpen] = useState(false)
  // Prompt text for AI enhancement
  const [prompt, setPrompt] = useState('')
  // Background configuration for branded backgrounds
  const [backgroundConfig, setBackgroundConfig] = useState<BackgroundConfig>(defaultBackgroundConfig)
  // Background processing state
  const [applyingBackground, setApplyingBackground] = useState(false)
  // Background replacement error - for showing retry option
  const [backgroundError, setBackgroundError] = useState<string | null>(null)
  // Preferences loading state
  const [preferencesLoaded, setPreferencesLoaded] = useState(false)

  // Load user preferences on mount
  useEffect(() => {
    async function loadPreferences() {
      try {
        const response = await fetch('/api/preferences')
        if (response.ok) {
          const data = await response.json()
          if (data.preferences) {
            // Apply saved background preferences
            if (data.preferences.default_background_mode) {
              setBackgroundConfig({
                mode: data.preferences.default_background_mode,
                description: data.preferences.default_background_description || undefined,
                uploadedUrl: data.preferences.default_background_url || undefined,
                saveAsDefault: false,
              })
            }
            // Apply other saved preferences if available
            if (data.preferences.default_business_type) {
              setSelectedStyles(prev => ({
                ...prev,
                businessType: data.preferences.default_business_type,
              }))
            }
          }
        }
      } catch (error) {
        console.error('Failed to load preferences:', error)
      } finally {
        setPreferencesLoaded(true)
      }
    }
    loadPreferences()
  }, [])

  // Save preferences when saveAsDefault is checked
  useEffect(() => {
    if (!preferencesLoaded) return
    if (!backgroundConfig.saveAsDefault) return

    async function savePreferences() {
      try {
        await fetch('/api/preferences', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            default_background_mode: backgroundConfig.mode,
            default_background_description: backgroundConfig.description,
            default_background_url: backgroundConfig.uploadedUrl,
          }),
        })
        console.log('Preferences saved as default')
      } catch (error) {
        console.error('Failed to save preferences:', error)
      }
    }
    savePreferences()
  }, [backgroundConfig.saveAsDefault, backgroundConfig.mode, backgroundConfig.description, backgroundConfig.uploadedUrl, preferencesLoaded])

  // Initialize sidebar state based on screen size (lg = 1024px)
  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1024px)')
    setSidebarOpen(mediaQuery.matches)

    const handler = (e: MediaQueryListEvent) => setSidebarOpen(e.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  const router = useRouter()

  // Load template from URL parameter
  useEffect(() => {
    if (templateId) {
      const loadedTemplate = getTemplateById(templateId)
      if (loadedTemplate) {
        setTemplate(loadedTemplate)
        // When template is loaded, we don't need to pre-select styles
        // The template itself defines the style
      }
    }
  }, [templateId])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = e.dataTransfer.files
    if (files && files[0]) {
      handleFile(files[0])
    }
  }, [])

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPEG, PNG, WebP)')
      return
    }

    if (file.size > 50 * 1024 * 1024) {
      setError('File size must be less than 50MB')
      return
    }

    setError(null)
    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files[0]) {
      handleFile(files[0])
    }
    // Reset the input value so selecting the same file triggers onChange again
    e.target.value = ''
    // Reset the dialog guard
    setIsFileDialogOpen(false)
  }

  // Safe function to trigger file input - prevents multiple dialogs
  const triggerFileInput = useCallback((inputId: string) => {
    if (isFileDialogOpen) return
    setIsFileDialogOpen(true)
    const input = document.getElementById(inputId) as HTMLInputElement
    if (input) {
      input.click()
      // Reset guard after a delay in case user cancels the dialog
      setTimeout(() => setIsFileDialogOpen(false), 1000)
    } else {
      setIsFileDialogOpen(false)
    }
  }, [isFileDialogOpen])

  const handleUploadAndEnhance = async () => {
    if (!selectedFile) return
    // When template is selected, use template-based style
    // Otherwise use the simplified selection (businessType is required)
    if (!template && !selectedStyles.businessType) return

    // Get format config for the selected format
    const formatConfig = getFormatConfig(selectedStyles.format)

    setUploading(true)
    setUploadProgress(0)

    try {
      setUploadProgress(10)

      const formData = new FormData()
      formData.append('file', selectedFile)
      // Send simplified selection as JSON for the new system
      formData.append('simpleSelection', JSON.stringify(selectedStyles))
      formData.append('stylePreset', selectedStyles.businessType || 'restaurant')
      formData.append('aspectRatio', formatConfig.aspectRatio)
      if (template) {
        formData.append('templateId', template.id)
        formData.append('templateUrl', template.webUrl)
      }

      const uploadResponse = await fetch('/api/images/upload', {
        method: 'POST',
        body: formData,
      })

      setUploadProgress(50)

      const responseText = await uploadResponse.text()

      if (!responseText) {
        throw new Error('Server returned empty response. Please try again.')
      }

      let uploadData
      try {
        uploadData = JSON.parse(responseText)
      } catch {
        throw new Error('Invalid server response. Please try again.')
      }

      if (!uploadResponse.ok) {
        throw new Error(uploadData.error || 'Upload failed')
      }

      const imageRecord = uploadData.image

      setUploadProgress(70)
      setUploading(false)
      setEnhancing(true)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000)

      try {
        const enhanceResponse = await fetch('/api/ai/enhance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageId: imageRecord.id,
            simpleSelection: selectedStyles,
            stylePreset: selectedStyles.businessType || 'restaurant',
            aspectRatio: formatConfig.aspectRatio,
            templateId: template?.id,
            templateUrl: template?.webUrl,
            // Background configuration for custom backgrounds
            backgroundConfig: backgroundConfig.mode !== 'auto' ? backgroundConfig : undefined,
            // Tell AI to use simple background when custom background will be uploaded
            hasCustomBackground: backgroundConfig.mode === 'upload' && !!backgroundConfig.uploadedUrl,
          }),
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        const enhanceText = await enhanceResponse.text()

        if (!enhanceText) {
          throw new Error('Enhancement server returned empty response.')
        }

        let enhanceData
        try {
          enhanceData = JSON.parse(enhanceText)
        } catch {
          throw new Error('Enhancement failed: Invalid server response')
        }

        if (!enhanceResponse.ok) {
          throw new Error(enhanceData.error || 'Enhancement failed')
        }

        setUploadProgress(90)

        // If custom background was uploaded, apply it now
        let backgroundApplied = false
        if (backgroundConfig.mode === 'upload' && backgroundConfig.uploadedUrl && enhanceData.enhancedUrl) {
          setApplyingBackground(true)
          try {
            console.log('[Editor] Starting background replacement...')
            console.log('[Editor] Enhanced URL:', enhanceData.enhancedUrl.substring(0, 50) + '...')
            console.log('[Editor] Background URL:', backgroundConfig.uploadedUrl.substring(0, 50) + '...')

            // Apply custom background using client-side processing
            const compositedUrl = await replaceBackgroundImage(
              enhanceData.enhancedUrl,
              backgroundConfig.uploadedUrl,
              {
                quality: 'medium',
                onProgress: (progress: number) => console.log(`[Editor] Background removal: ${progress}%`)
              }
            )

            console.log('[Editor] Background replacement successful, uploading result...')

            // Upload the composited result back to the server
            const blob = await fetch(compositedUrl).then(r => r.blob())
            const compositedFile = new File([blob], 'composited.jpg', { type: 'image/jpeg' })

            const updateFormData = new FormData()
            updateFormData.append('file', compositedFile)
            updateFormData.append('imageId', imageRecord.id)

            const updateResponse = await fetch('/api/images/update-enhanced', {
              method: 'POST',
              body: updateFormData,
            })

            if (!updateResponse.ok) {
              const errorData = await updateResponse.json().catch(() => ({}))
              throw new Error(errorData.error || 'Failed to save composited image')
            }

            console.log('[Editor] Composited image saved successfully')
            backgroundApplied = true
          } catch (bgError) {
            console.error('[Editor] Background replacement failed:', bgError)
            setBackgroundError((bgError as Error).message || 'Failed to apply custom background')
            // Don't fail the whole process - user can retry from the result page
          } finally {
            setApplyingBackground(false)
          }
        }

        setUploadProgress(100)

        // Navigate to result, with flag if background replacement failed
        if (backgroundConfig.mode === 'upload' && backgroundConfig.uploadedUrl && !backgroundApplied) {
          // Pass the uploaded background URL as a query param so user can retry
          const bgParam = encodeURIComponent(backgroundConfig.uploadedUrl)
          router.push(`/editor/${imageRecord.id}?pendingBackground=true&bgUrl=${bgParam}`)
        } else {
          router.push(`/editor/${imageRecord.id}`)
        }
      } catch (fetchError: unknown) {
        clearTimeout(timeoutId)
        if ((fetchError as Error).name === 'AbortError') {
          throw new Error('Enhancement timed out. Please try again from the gallery.')
        }
        throw fetchError
      }
    } catch (err: unknown) {
      console.error('Upload error:', err)
      setError((err as Error).message || 'Upload failed. Please try again.')
      setUploading(false)
      setEnhancing(false)
      setApplyingBackground(false)
    }
  }

  const clearSelection = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setError(null)
    setUploadProgress(0)
  }

  const clearTemplate = () => {
    setTemplate(null)
    // Update URL without the template param
    router.replace('/editor', { scroll: false })
  }

  // Determine if the transform button should be enabled
  // Need either a template OR businessType selected (required for new system)
  const hasStylesSelected = selectedStyles.businessType !== null
  const canTransform = selectedFile && (template || hasStylesSelected)

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Navigation */}
      <MainNavAuth />

      <div className="flex-1 flex pt-16 relative">
        {/* Desktop Sidebar - Only visible on lg screens */}
        {sidebarOpen && (
          <aside className="hidden lg:flex lg:flex-col lg:w-80 lg:border-r lg:border-border bg-card">
            {template ? (
              /* Template Mode - Show template info */
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="p-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <Wand2 className="h-4 w-4 text-orange-500" />
                    <h3 className="font-semibold text-sm">Using Template</h3>
                  </div>
                </div>

                {/* Template Info */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {/* Template Preview */}
                  <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                    <Image
                      src={template.thumbUrl}
                      alt={template.name}
                      fill
                      className="object-cover"
                    />
                    <Badge className="absolute top-2 left-2 bg-orange-500 text-white border-0">
                      <Palette className="h-3 w-3 mr-1" />
                      Style Target
                    </Badge>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm">{template.name}</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {template.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 capitalize">
                      {template.category.replace('-', ' ')} style
                    </p>
                  </div>

                  {/* Auto-styling Explanation */}
                  <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/50 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-green-800 dark:text-green-400">
                          Styles applied automatically
                        </p>
                        <p className="text-xs text-green-700 dark:text-green-500 mt-1">
                          Your photo will be transformed to match this template's lighting, colors, and atmosphere.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Change Template Link */}
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link href="/explore">
                      <Sparkles className="h-3.5 w-3.5 mr-2" />
                      Browse Other Templates
                    </Link>
                  </Button>
                </div>

                {/* Switch to Custom Mode */}
                <div className="p-3 border-t border-border bg-muted/30">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs text-muted-foreground"
                    onClick={clearTemplate}
                  >
                    <Settings2 className="h-3.5 w-3.5 mr-2" />
                    Switch to Custom Style
                  </Button>
                </div>
              </div>
            ) : (
              /* Custom Mode - Show SimplifiedStylePicker */
              <SimplifiedStylePicker
                selection={selectedStyles}
                onSelectionChange={setSelectedStyles}
                backgroundConfig={backgroundConfig}
                onBackgroundConfigChange={setBackgroundConfig}
              />
            )}
          </aside>
        )}

        {/* Collapsed sidebar toggle button - only on desktop */}
        {!sidebarOpen && (
          <div className="hidden lg:flex border-r border-border bg-card items-start p-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="h-9 w-9"
              title={template ? "Show Template Info" : "Open Style Settings"}
            >
              {template ? <Wand2 className="h-5 w-5" /> : <Palette className="h-5 w-5" />}
            </Button>
          </div>
        )}

        {/* Main Canvas Area */}
        <main className="flex-1 flex flex-col overflow-auto">
          {/* Canvas - reduced padding on mobile, extra bottom padding for mobile toolbar */}
          <div className="flex-1 flex items-center justify-center p-4 pb-20 lg:pb-4 lg:p-8 relative">
            {/* Two-Panel Layout when template is selected */}
            {template ? (
              <div className="w-full max-w-5xl flex flex-col lg:flex-row gap-8 items-stretch">
                {/* Style Target Panel - Template Reference */}
                <div className="flex-1 flex flex-col">
                  <div className="relative bg-card rounded-2xl border-2 border-orange-500/50 overflow-hidden">
                    {/* Style Target Badge */}
                    <Badge className="absolute top-4 left-4 z-10 bg-orange-500 text-white border-0 shadow-lg">
                      <Palette className="h-3 w-3 mr-1" />
                      Style Target
                    </Badge>

                    {/* Change Template Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-4 right-4 z-10 h-8 w-8 bg-black/50 hover:bg-black/70 text-white"
                      onClick={clearTemplate}
                    >
                      <X className="h-4 w-4" />
                    </Button>

                    {/* Template Image */}
                    <div className="aspect-square relative">
                      <Image
                        src={template.webUrl}
                        alt={template.name}
                        fill
                        className="object-cover"
                        priority
                      />
                      {/* Gradient overlay at bottom */}
                      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/80 to-transparent" />
                    </div>

                    {/* Template Info */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                      <p className="font-semibold text-lg">{template.name}</p>
                      <p className="text-sm text-white/80">{template.description}</p>
                      <p className="text-xs text-white/60 mt-1 capitalize">
                        {template.category.replace('-', ' ')} style
                      </p>
                    </div>
                  </div>

                  {/* Helper text */}
                  <p className="text-xs text-muted-foreground text-center mt-3">
                    Your photo will be styled like this
                  </p>
                </div>

                {/* Arrow indicator */}
                <div className="hidden lg:flex items-center justify-center">
                  <div className="flex flex-col items-center gap-2">
                    <ArrowRight className="h-8 w-8 text-orange-500" />
                    <span className="text-xs text-muted-foreground">Transform</span>
                  </div>
                </div>

                {/* Your Photo Panel - Upload Zone */}
                <div className="flex-1 flex flex-col">
                  <div
                    className={cn(
                      'relative bg-card rounded-2xl border-2 border-dashed overflow-hidden aspect-square flex flex-col items-center justify-center cursor-pointer transition-all',
                      dragActive
                        ? 'border-orange-500 bg-orange-500/10'
                        : previewUrl
                          ? 'border-green-500/50'
                          : 'border-muted-foreground/30 hover:border-muted-foreground/50'
                    )}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => !previewUrl && triggerFileInput('file-input')}
                  >
                    <input
                      id="file-input"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileInput}
                    />

                    {/* Your Photo Badge */}
                    <Badge
                      variant="secondary"
                      className={cn(
                        "absolute top-4 left-4 z-10 shadow-lg",
                        previewUrl && "bg-green-500 text-white border-0"
                      )}
                    >
                      <ImageIcon className="h-3 w-3 mr-1" />
                      Your Photo
                    </Badge>

                    {previewUrl ? (
                      <>
                        <Image
                          src={previewUrl}
                          alt="Your uploaded photo"
                          fill
                          className="object-cover"
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-4 right-4 z-10 h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation()
                            clearSelection()
                          }}
                          disabled={uploading || enhancing}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                          <Upload className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-medium mb-1">Upload Your Food Photo</h3>
                        <p className="text-sm text-muted-foreground text-center max-w-xs mb-4">
                          Drop your image here or click to browse
                        </p>
                        <Button
                          className="bg-foreground text-background hover:bg-foreground/90"
                          onClick={(e) => {
                            e.stopPropagation()
                            triggerFileInput('file-input')
                          }}
                        >
                          Select Image
                        </Button>
                      </>
                    )}
                  </div>

                  {/* Helper text */}
                  <p className="text-xs text-muted-foreground text-center mt-3">
                    {previewUrl ? 'Ready to transform!' : 'Upload your food photo to transform'}
                  </p>
                </div>
              </div>
            ) : (
              /* Original single-panel upload zone when no template */
              <>
                {!selectedFile ? (
                  <div
                    className={cn(
                      'w-full max-w-md aspect-square border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-colors cursor-pointer',
                      dragActive
                        ? 'border-orange-500 bg-orange-500/10'
                        : 'border-border hover:border-muted-foreground/50'
                    )}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => triggerFileInput('file-input-single')}
                  >
                    <input
                      id="file-input-single"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileInput}
                    />
                    <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium mb-1">Food Photography</h3>
                    <p className="text-sm text-muted-foreground text-center max-w-xs mb-4">
                      Transform your food photos with AI-powered styling
                    </p>
                    <Button
                      className="bg-foreground text-background hover:bg-foreground/90"
                      onClick={(e) => {
                        e.stopPropagation()
                        triggerFileInput('file-input-single')
                      }}
                    >
                      Upload Image
                    </Button>

                    {/* Browse templates CTA */}
                    <div
                      className="mt-6 pt-6 border-t border-border w-full text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <p className="text-xs text-muted-foreground mb-2">
                        Or choose from our template gallery
                      </p>
                      <Button variant="outline" size="sm" asChild>
                        <Link href="/explore">
                          <Sparkles className="h-4 w-4 mr-2" />
                          Browse Templates
                        </Link>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="relative max-w-2xl w-full aspect-square">
                    <img
                      src={previewUrl!}
                      alt="Preview"
                      className="w-full h-full object-contain rounded-xl"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8"
                      onClick={clearSelection}
                      disabled={uploading || enhancing}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            )}

            {error && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm max-w-md">
                {error}
              </div>
            )}
          </div>

          {/* Desktop Bottom Toolbar - Hidden on mobile */}
          <div className="hidden lg:block border-t border-border p-4">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-6">
                {/* Add Image */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-12 w-12 border border-border"
                  onClick={() => triggerFileInput(template ? 'file-input' : 'file-input-single')}
                >
                  <Plus className="h-5 w-5" />
                </Button>

                {/* Prompt Input */}
                <div className="flex-1 min-w-[200px] max-w-[400px]">
                  <input
                    type="text"
                    placeholder="Describe your image..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="w-full bg-transparent border-0 text-sm placeholder:text-muted-foreground focus:outline-none"
                  />
                </div>

                {/* Template Reference Display */}
                {template ? (
                  <div className="h-12 w-12 rounded-lg overflow-hidden border-2 border-orange-500 relative">
                    <Image
                      src={template.thumbUrl}
                      alt={template.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <Link href="/explore" className="h-12 w-12 border border-dashed border-border rounded-lg flex items-center justify-center hover:border-muted-foreground/50 transition-colors">
                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  </Link>
                )}
              </div>

              <div className="flex items-center gap-4">
                {/* Variations Picker */}
                <VariationsPicker
                  value={variations}
                  onChange={setVariations}
                />

                {/* Enhance Button */}
                <Button
                  onClick={handleUploadAndEnhance}
                  disabled={!canTransform || uploading || enhancing || applyingBackground}
                  className="bg-orange-500 hover:bg-orange-600 px-6"
                >
                  {uploading || enhancing || applyingBackground ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {applyingBackground ? 'Applying background...' : enhancing ? 'Transforming...' : 'Uploading...'}
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      {template ? 'Transform' : 'Upgrade'}
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Progress Bar */}
            {(uploading || enhancing || applyingBackground) && (
              <div className="max-w-4xl mx-auto mt-4">
                <Progress value={uploadProgress} className="h-1" />
              </div>
            )}
          </div>
        </main>

        {/* Mobile Fixed Bottom Toolbar */}
        <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden">
          <MobileToolbar
            onStyleClick={() => setStyleSheetOpen(true)}
            onPromptClick={() => setPromptSheetOpen(true)}
            onTransformClick={handleUploadAndEnhance}
            hasImage={!!selectedFile}
            hasStyleSelected={hasStylesSelected || !!template}
            isProcessing={uploading || enhancing || applyingBackground}
            disabled={false}
            variations={variations}
            onVariationsChange={setVariations}
          />
          {/* Progress Bar for mobile */}
          {(uploading || enhancing || applyingBackground) && (
            <div className="absolute top-0 left-0 right-0">
              <Progress value={uploadProgress} className="h-1 rounded-none" />
            </div>
          )}
        </div>
      </div>

      {/* Mobile Bottom Sheets */}
      <StyleBottomSheet
        isOpen={styleSheetOpen}
        onClose={() => setStyleSheetOpen(false)}
        selection={selectedStyles}
        onSelectionChange={setSelectedStyles}
      />

      <PromptBottomSheet
        isOpen={promptSheetOpen}
        onClose={() => setPromptSheetOpen(false)}
        prompt={prompt}
        onPromptChange={setPrompt}
      />
    </div>
  )
}

// Loading skeleton for Suspense
function EditorSkeleton() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MainNavAuth />
      <div className="flex-1 flex pt-16">
        <aside className="w-80 border-r border-border bg-card animate-pulse" />
        <main className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-md aspect-square bg-muted rounded-2xl animate-pulse" />
        </main>
      </div>
    </div>
  )
}

export default function EditorPage() {
  return (
    <Suspense fallback={<EditorSkeleton />}>
      <EditorContent />
    </Suspense>
  )
}
