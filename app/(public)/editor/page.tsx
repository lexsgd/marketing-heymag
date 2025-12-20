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
  ZoomIn,
  ZoomOut,
  Maximize2,
  Plus,
  ArrowRight,
  Palette,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { MainNavAuth } from '@/components/main-nav-auth'
import { getTemplateById, type TemplateImage } from '@/lib/template-images'
import { VariationsPicker } from '@/components/editor/variations-picker'
import { SimplifiedStylePicker } from '@/components/editor/simplified-style-picker'
import {
  type SimpleSelection,
  emptySimpleSelection,
  getFormatConfig,
} from '@/lib/simplified-styles'

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

        setUploadProgress(100)
        router.push(`/editor/${imageRecord.id}`)
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

      <div className="flex-1 flex pt-16">
        {/* Left Sidebar - Simplified Style Picker */}
        <aside className="w-80 border-r border-border flex flex-col bg-card">
          <SimplifiedStylePicker
            selection={selectedStyles}
            onSelectionChange={setSelectedStyles}
          />
        </aside>

        {/* Main Canvas Area */}
        <main className="flex-1 flex flex-col overflow-auto">
          {/* Canvas */}
          <div className="flex-1 flex items-center justify-center p-8 relative">
            {/* Zoom Controls */}
            <div className="absolute right-4 top-4 flex flex-col gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8 bg-card border border-border">
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 bg-card border border-border">
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 bg-card border border-border">
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>

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

          {/* Bottom Toolbar */}
          <div className="border-t border-border p-4">
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
                  disabled={!canTransform || uploading || enhancing}
                  className="bg-orange-500 hover:bg-orange-600 px-6"
                >
                  {uploading || enhancing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {enhancing ? 'Transforming...' : 'Uploading...'}
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
            {(uploading || enhancing) && (
              <div className="max-w-4xl mx-auto mt-4">
                <Progress value={uploadProgress} className="h-1" />
              </div>
            )}
          </div>
        </main>
      </div>
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
