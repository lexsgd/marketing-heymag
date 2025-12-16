'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Upload,
  Loader2,
  X,
  Sparkles
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { StylePresetSelector } from '@/components/editor'

export default function EditorPage() {
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null)
  const [customPrompts, setCustomPrompts] = useState<Record<string, string>>({})
  const [enhancing, setEnhancing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()

  // Handle custom prompt changes
  const handleCustomPromptChange = (styleId: string, prompt: string) => {
    if (prompt) {
      setCustomPrompts((prev) => ({ ...prev, [styleId]: prompt }))
    } else {
      setCustomPrompts((prev) => {
        const newPrompts = { ...prev }
        delete newPrompts[styleId]
        return newPrompts
      })
    }
  }

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
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPEG, PNG, WebP)')
      return
    }

    // Validate file size (max 50MB)
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

      // Upload via API route (uses service role for storage)
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('stylePreset', selectedStyle)
      // Include custom prompt if one exists for this style
      if (customPrompts[selectedStyle]) {
        formData.append('customPrompt', customPrompts[selectedStyle])
      }

      const uploadResponse = await fetch('/api/images/upload', {
        method: 'POST',
        body: formData,
      })

      setUploadProgress(50)

      // Get response text first to handle empty responses
      const responseText = await uploadResponse.text()

      if (!responseText) {
        throw new Error('Server returned empty response. Please try again.')
      }

      let uploadData
      try {
        uploadData = JSON.parse(responseText)
      } catch {
        console.error('Failed to parse response:', responseText)
        throw new Error('Invalid server response. Please try again.')
      }

      if (!uploadResponse.ok) {
        throw new Error(uploadData.error || 'Upload failed')
      }

      const imageRecord = uploadData.image

      setUploadProgress(70)
      setUploading(false)
      setEnhancing(true)

      // Call AI enhancement API with timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000) // 60s timeout

      try {
        const enhanceResponse = await fetch('/api/ai/enhance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageId: imageRecord.id,
            stylePreset: selectedStyle,
            // Include custom prompt if user has customized this style
            customPrompt: customPrompts[selectedStyle] || undefined,
          }),
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        // Get response text first to handle empty responses
        const enhanceText = await enhanceResponse.text()

        if (!enhanceText) {
          console.error('Empty response from enhance API')
          throw new Error('Enhancement server returned empty response. The image was uploaded - please try enhancing from the gallery.')
        }

        let enhanceData
        try {
          enhanceData = JSON.parse(enhanceText)
        } catch {
          console.error('Invalid JSON from enhance API:', enhanceText.substring(0, 200))
          throw new Error('Enhancement failed: Invalid server response')
        }

        if (!enhanceResponse.ok) {
          throw new Error(enhanceData.error || 'Enhancement failed')
        }

        setUploadProgress(100)

        // Redirect to editor with image
        router.push(`/editor/${imageRecord.id}`)
      } catch (fetchError: unknown) {
        clearTimeout(timeoutId)
        if ((fetchError as Error).name === 'AbortError') {
          throw new Error('Enhancement timed out. The image was uploaded - please try enhancing from the gallery.')
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
    setSelectedStyle(null)
    setError(null)
    setUploadProgress(0)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Photo Editor</h1>
        <p className="text-muted-foreground">
          Upload a food photo and enhance it with AI
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle>Upload Photo</CardTitle>
            <CardDescription>
              Drag and drop or click to upload your food photo
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedFile ? (
              <div
                className={cn(
                  'border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer',
                  dragActive
                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20'
                    : 'border-muted-foreground/25 hover:border-muted-foreground/50'
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
                <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="font-medium mb-1">Drop your image here</p>
                <p className="text-sm text-muted-foreground">
                  or click to browse (JPEG, PNG, WebP up to 50MB)
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                  <img
                    src={previewUrl!}
                    alt="Preview"
                    className="w-full h-full object-contain"
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
                <div className="flex items-center justify-between text-sm">
                  <span className="truncate font-medium">{selectedFile.name}</span>
                  <span className="text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
              </div>
            )}

            {error && (
              <div className="mt-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Style Selection */}
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Choose Style</CardTitle>
            <CardDescription>
              Select a preset style for your enhanced photo. Hover over any preset and click the code icon to view or customize its AI prompt.
            </CardDescription>
          </CardHeader>
          <CardContent className="max-h-[500px] overflow-y-auto">
            <StylePresetSelector
              selectedStyle={selectedStyle}
              onStyleSelect={setSelectedStyle}
              customPrompts={customPrompts}
              onCustomPromptChange={handleCustomPromptChange}
              disabled={uploading || enhancing}
            />
          </CardContent>
        </Card>
      </div>

      {/* Enhancement Button */}
      <Card>
        <CardContent className="p-6">
          {(uploading || enhancing) && (
            <div className="mb-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>{enhancing ? 'Enhancing with AI...' : 'Uploading...'}</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          <Button
            onClick={handleUploadAndEnhance}
            disabled={!selectedFile || !selectedStyle || uploading || enhancing}
            className="w-full h-12 bg-orange-500 hover:bg-orange-600"
          >
            {uploading || enhancing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {enhancing ? 'Enhancing...' : 'Uploading...'}
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                Enhance with AI (1 credit)
              </>
            )}
          </Button>

          <p className="text-center text-sm text-muted-foreground mt-3">
            This will use 1 credit from your account
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
