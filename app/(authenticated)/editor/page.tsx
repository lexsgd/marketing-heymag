'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
  ChevronLeft,
  ChevronRight,
  Crown,
  Square,
  Grid3X3,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { MainNav } from '@/components/main-nav'

// Style categories with scrollable tabs
const styleCategories = [
  { id: 'delivery', name: 'Delivery Apps', emoji: '🚀' },
  { id: 'restaurant', name: 'Restaurant', emoji: '🍽️' },
  { id: 'fine-dining', name: 'Fine Dining', emoji: '✨' },
  { id: 'cafe', name: 'Cafe', emoji: '☕' },
  { id: 'social', name: 'Social Media', emoji: '📱' },
]

// Style presets with thumbnails
const stylePresets = {
  delivery: [
    { id: 'simple-overhead', name: 'Simple Overhead', description: 'Clean overhead shots with minimal styling for menus.', thumbnail: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=100&h=100&fit=crop' },
    { id: 'delivery-hero', name: 'Delivery Hero', description: 'App-ready photography with vibrant colors for small screens.', thumbnail: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=100&h=100&fit=crop' },
    { id: 'pure-shot', name: 'Pure Shot', description: 'Clean honest food photography optimized for delivery apps.', thumbnail: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=100&h=100&fit=crop' },
  ],
  restaurant: [
    { id: 'warm-ambient', name: 'Warm Ambient', description: 'Cozy restaurant atmosphere with warm lighting.', thumbnail: 'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=100&h=100&fit=crop' },
    { id: 'classic-plating', name: 'Classic Plating', description: 'Traditional restaurant presentation style.', thumbnail: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&h=100&fit=crop' },
  ],
  'fine-dining': [
    { id: 'michelin-style', name: 'Michelin Style', description: 'Elegant fine dining presentation.', thumbnail: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=100&h=100&fit=crop' },
    { id: 'dark-moody', name: 'Dark Moody', description: 'Dramatic dark backgrounds with accent lighting.', thumbnail: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=100&h=100&fit=crop' },
  ],
  cafe: [
    { id: 'latte-art', name: 'Latte Art', description: 'Perfect for coffee and cafe drinks.', thumbnail: 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=100&h=100&fit=crop' },
    { id: 'brunch-vibes', name: 'Brunch Vibes', description: 'Bright, airy cafe aesthetic.', thumbnail: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=100&h=100&fit=crop' },
  ],
  social: [
    { id: 'instagram-feed', name: 'Instagram Feed', description: 'Optimized for square Instagram posts.', thumbnail: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=100&h=100&fit=crop' },
    { id: 'tiktok-style', name: 'TikTok Style', description: 'Eye-catching vertical format.', thumbnail: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=100&h=100&fit=crop' },
  ],
}

export default function EditorPage() {
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState('delivery')
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null)
  const [enhancing, setEnhancing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [aspectRatio, setAspectRatio] = useState('1:1')
  const [variations, setVariations] = useState(1)
  const [ultraRealistic, setUltraRealistic] = useState(false)

  const router = useRouter()

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
  }

  const handleUploadAndEnhance = async () => {
    if (!selectedFile || !selectedStyle) return

    setUploading(true)
    setUploadProgress(0)

    try {
      setUploadProgress(10)

      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('stylePreset', selectedStyle)

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
            stylePreset: selectedStyle,
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

  const currentPresets = stylePresets[selectedCategory as keyof typeof stylePresets] || []

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Navigation */}
      <MainNav />

      <div className="flex-1 flex pt-16">
        {/* Left Sidebar - Styles */}
        <aside className="w-80 border-r border-border flex flex-col bg-card">
          {/* Style Tabs */}
          <div className="p-4 border-b border-border">
            <div className="flex gap-4 mb-4">
              <button className="text-sm font-medium text-foreground">Styles</button>
              <button className="text-sm text-muted-foreground hover:text-foreground">
                Reference
                <Badge className="ml-1 text-[10px] bg-pink-500 text-white px-1.5 py-0">BETA</Badge>
              </button>
              <button className="text-sm text-muted-foreground hover:text-foreground">Composition</button>
            </div>

            {/* Category Tabs */}
            <div className="relative">
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <button className="p-1 hover:bg-muted rounded">
                  <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                </button>
                {styleCategories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors',
                      selectedCategory === cat.id
                        ? 'bg-foreground text-background'
                        : 'bg-muted text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <span>{cat.emoji}</span>
                    <span>{cat.name}</span>
                  </button>
                ))}
                <button className="p-1 hover:bg-muted rounded">
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            </div>
          </div>

          {/* Styles Section */}
          <div className="flex-1 overflow-y-auto p-4">
            <h3 className="text-sm font-medium mb-4">Styles</h3>
            <div className="space-y-3">
              {currentPresets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => setSelectedStyle(preset.id)}
                  className={cn(
                    'w-full flex items-start gap-3 p-3 rounded-lg border transition-all text-left',
                    selectedStyle === preset.id
                      ? 'border-orange-500 bg-orange-500/10'
                      : 'border-border hover:border-muted-foreground/50 hover:bg-muted/50'
                  )}
                >
                  <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    <img
                      src={preset.thumbnail}
                      alt={preset.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{preset.name}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                      {preset.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Canvas Area */}
        <main className="flex-1 flex flex-col">
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

            {/* Add Image Button (Side) */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <Button variant="ghost" size="icon" className="h-12 w-12 bg-card border border-border">
                <Plus className="h-5 w-5" />
              </Button>
            </div>

            {/* Upload Zone */}
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
                onClick={() => document.getElementById('file-input')?.click()}
              >
                <input
                  id="file-input"
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
                <Button className="bg-foreground text-background hover:bg-foreground/90">
                  Upload Image
                </Button>
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
                  onClick={() => document.getElementById('file-input')?.click()}
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

                {/* Reference Image Slot */}
                <div className="h-12 w-12 border border-dashed border-border rounded-lg flex items-center justify-center">
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>

              <div className="flex items-center gap-6">
                {/* Aspect Ratio */}
                <div className="flex items-center gap-2">
                  <Square className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{aspectRatio}</span>
                </div>

                {/* Variations */}
                <div className="flex items-center gap-2">
                  <Grid3X3 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{variations} variation</span>
                </div>

                {/* Ultra-Realistic Toggle */}
                <div className="flex items-center gap-2">
                  <Crown className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm">Ultra-Realistic</span>
                  <Switch
                    checked={ultraRealistic}
                    onCheckedChange={setUltraRealistic}
                  />
                </div>

                {/* Enhance Button */}
                <Button
                  onClick={handleUploadAndEnhance}
                  disabled={!selectedFile || !selectedStyle || uploading || enhancing}
                  className="bg-orange-500 hover:bg-orange-600 px-6"
                >
                  {uploading || enhancing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {enhancing ? 'Enhancing...' : 'Uploading...'}
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Upgrade
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
