'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import {
  ArrowLeft,
  Download,
  Share2,
  Copy,
  Check,
  Loader2,
  Instagram,
  Facebook,
  MessageCircle,
  Sparkles,
  Image as ImageIcon,
  Type,
  Sliders
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { config } from '@/lib/config'
import { ImageEditor } from '@/components/editor'
import type { EnhancementSettings } from '@/lib/image-processing'

interface ImageData {
  id: string
  original_url: string
  enhanced_url: string | null
  thumbnail_url: string | null
  original_filename: string
  style_preset: string
  status: string
  enhancement_settings: EnhancementSettings | null
  metadata: Record<string, unknown> | null
  created_at: string
  processed_at: string | null
  caption_count: number | null
}

const MAX_CAPTIONS_PER_IMAGE = 10

export default function ImageEditorPage({ params }: { params: { id: string } }) {
  const [image, setImage] = useState<ImageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [caption, setCaption] = useState('')
  const [hashtags, setHashtags] = useState<string[]>([])
  const [alternates, setAlternates] = useState<string[]>([])
  const [copied, setCopied] = useState(false)
  const [selectedPlatform, setSelectedPlatform] = useState('instagram')
  const [selectedLanguage, setSelectedLanguage] = useState('en')
  const [selectedTone, setSelectedTone] = useState('engaging')
  const [selectedStyle, setSelectedStyle] = useState<string>('')
  const [activeMainTab, setActiveMainTab] = useState<'edit' | 'caption'>('edit')
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [enhancing, setEnhancing] = useState(false)
  const [enhanceError, setEnhanceError] = useState<string | null>(null)
  const [captionError, setCaptionError] = useState<string | null>(null)
  const [captionsRemaining, setCaptionsRemaining] = useState<number | null>(null)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadImage()
  }, [params.id])

  const loadImage = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: business } = await supabase
        .from('businesses')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()

      if (!business) {
        router.push('/dashboard')
        return
      }

      setBusinessId(business.id)

      const { data: imageData, error } = await supabase
        .from('images')
        .select('*')
        .eq('id', params.id)
        .eq('business_id', business.id)
        .single()

      if (error || !imageData) {
        router.push('/gallery')
        return
      }

      setImage(imageData)
      setSelectedStyle(imageData.style_preset || 'delivery')
      // Initialize caption remaining count
      const currentCount = imageData.caption_count || 0
      setCaptionsRemaining(MAX_CAPTIONS_PER_IMAGE - currentCount)
    } catch (err) {
      console.error('Error loading image:', err)
      router.push('/gallery')
    } finally {
      setLoading(false)
    }
  }

  // Trigger AI enhancement for pending/failed images
  const handleEnhanceWithAI = async () => {
    if (!image) return

    setEnhancing(true)
    setEnhanceError(null)

    try {
      // Update status to processing first
      await supabase
        .from('images')
        .update({ status: 'processing' })
        .eq('id', image.id)

      // Call enhance API
      const response = await fetch('/api/ai/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageId: image.id,
          stylePreset: image.style_preset || 'delivery',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Enhancement failed')
      }

      // Reload image to get updated data
      await loadImage()
    } catch (err) {
      console.error('Enhancement error:', err)
      setEnhanceError((err as Error).message || 'Enhancement failed. Please try again.')
      // Reload to get actual status
      await loadImage()
    } finally {
      setEnhancing(false)
    }
  }

  // Save enhanced image to Supabase Storage
  const handleSaveEnhancedImage = useCallback(async (imageBlob: Blob) => {
    if (!image || !businessId) return

    try {
      // Create unique filename for enhanced image
      const fileName = `${businessId}/enhanced/${image.id}-${Date.now()}.jpg`

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('images')
        .upload(fileName, imageBlob, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(fileName)

      // Update image record with enhanced URL
      const { error: updateError } = await supabase
        .from('images')
        .update({
          enhanced_url: publicUrl,
          status: 'completed',
          processed_at: new Date().toISOString()
        })
        .eq('id', image.id)

      if (updateError) throw updateError

      // Reload image to get updated data
      await loadImage()
    } catch (err) {
      console.error('Error saving enhanced image:', err)
      throw err
    }
  }, [image, businessId, supabase])

  const handleGenerateCaption = async () => {
    if (!image) return

    setGenerating(true)
    setCaptionError(null)
    try {
      const response = await fetch('/api/ai/caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageId: image.id,
          platform: selectedPlatform,
          language: selectedLanguage,
          tone: selectedTone,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle specific error codes
        if (response.status === 402) {
          setCaptionError('Please enhance this image first to unlock caption generation.')
        } else if (response.status === 429) {
          setCaptionError(`Caption limit reached. You've used all ${MAX_CAPTIONS_PER_IMAGE} captions for this image.`)
          setCaptionsRemaining(0)
        } else {
          setCaptionError(data.error || 'Caption generation failed')
        }
        return
      }

      setCaption(data.caption || '')
      setHashtags(data.hashtags || [])
      setAlternates(data.alternateVersions || [])
      // Update remaining captions from API response
      if (data.captionsRemaining !== undefined) {
        setCaptionsRemaining(data.captionsRemaining)
      }
    } catch (err) {
      console.error('Error generating caption:', err)
      setCaptionError('Failed to generate caption. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  const handleCopyCaption = () => {
    const fullCaption = caption + '\n\n' + hashtags.map(h => `#${h}`).join(' ')
    navigator.clipboard.writeText(fullCaption)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = async () => {
    if (!image) return

    const url = image.enhanced_url || image.original_url
    const response = await fetch(url)
    const blob = await response.blob()
    const blobUrl = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = blobUrl
    a.download = `foodsnap-${image.original_filename || 'image.jpg'}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(blobUrl)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    )
  }

  if (!image) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-medium mb-2">Image not found</h3>
            <Button asChild>
              <Link href="/gallery">Back to Gallery</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="h-9 w-9">
            <Link href="/gallery">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{image.original_filename || 'Untitled'}</h1>
            <div className="flex items-center gap-2 mt-1">
              {image.status === 'completed' && (
                <Badge className="bg-green-500">Enhanced</Badge>
              )}
              {image.status === 'processing' && (
                <Badge className="bg-orange-500">Processing</Badge>
              )}
              {image.status === 'pending' && (
                <Badge variant="outline">Pending</Badge>
              )}
              {image.status === 'failed' && (
                <Badge variant="destructive">Failed</Badge>
              )}
              <span className="text-sm text-muted-foreground">
                {image.style_preset && config.stylePresets.find(p => p.id === image.style_preset)?.name}
              </span>
            </div>
            {/* Show enhance button for pending/failed images */}
            {(image.status === 'pending' || image.status === 'failed') && (
              <div className="mt-2">
                <Button
                  onClick={handleEnhanceWithAI}
                  disabled={enhancing}
                  className="bg-orange-500 hover:bg-orange-600"
                  size="sm"
                >
                  {enhancing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enhancing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Enhance with AI (1 credit)
                    </>
                  )}
                </Button>
                {enhanceError && (
                  <p className="text-sm text-destructive mt-1">{enhanceError}</p>
                )}
              </div>
            )}
            {/* Show processing indicator */}
            {image.status === 'processing' && (
              <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                AI enhancement in progress...
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
          <Button className="bg-orange-500 hover:bg-orange-600">
            <Share2 className="mr-2 h-4 w-4" />
            Post to Social
          </Button>
        </div>
      </div>

      {/* Main Tabs: Edit vs Caption */}
      <Tabs value={activeMainTab} onValueChange={(v) => setActiveMainTab(v as typeof activeMainTab)} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="edit">
            <Sliders className="mr-2 h-4 w-4" />
            Edit Image
          </TabsTrigger>
          <TabsTrigger value="caption">
            <Type className="mr-2 h-4 w-4" />
            Caption
          </TabsTrigger>
        </TabsList>

        {/* Edit Image Tab - Real-time Image Editor */}
        <TabsContent value="edit" className="mt-6">
          <ImageEditor
            originalUrl={image.original_url}
            enhancedUrl={image.enhanced_url || undefined}
            aiSettings={image.enhancement_settings || undefined}
            stylePreset={image.style_preset}
            onSave={handleSaveEnhancedImage}
          />
        </TabsContent>

        {/* Caption Tab */}
        <TabsContent value="caption" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Image Preview */}
            <Card>
              <CardContent className="p-4">
                <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                  <img
                    src={image.enhanced_url || image.original_url}
                    alt={image.original_filename || 'Food photo'}
                    className="w-full h-full object-contain"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Caption Generator Panel */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">AI Caption Generator</CardTitle>
                      <CardDescription>
                        Generate engaging captions for your food photo
                      </CardDescription>
                    </div>
                    {/* Caption remaining badge */}
                    {image.enhanced_url && captionsRemaining !== null && (
                      <Badge
                        variant={captionsRemaining > 3 ? "secondary" : captionsRemaining > 0 ? "outline" : "destructive"}
                        className="text-xs"
                      >
                        {captionsRemaining}/{MAX_CAPTIONS_PER_IMAGE} remaining
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Platform Selection */}
                  <div className="space-y-2">
                    <Label>Platform</Label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { id: 'instagram', icon: Instagram, label: 'Instagram' },
                        { id: 'facebook', icon: Facebook, label: 'Facebook' },
                        { id: 'tiktok', icon: MessageCircle, label: 'TikTok' },
                        { id: 'xiaohongshu', icon: Sparkles, label: 'Xiaohongshu' },
                      ].map((platform) => (
                        <button
                          key={platform.id}
                          onClick={() => setSelectedPlatform(platform.id)}
                          className={cn(
                            'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all',
                            selectedPlatform === platform.id
                              ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20'
                              : 'border-border hover:border-muted-foreground/50'
                          )}
                        >
                          <platform.icon className="h-4 w-4" />
                          {platform.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Language Selection */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Language</Label>
                      <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="zh">简体中文</SelectItem>
                          <SelectItem value="zh-tw">繁體中文</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Tone</Label>
                      <Select value={selectedTone} onValueChange={setSelectedTone}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="engaging">Engaging</SelectItem>
                          <SelectItem value="professional">Professional</SelectItem>
                          <SelectItem value="casual">Casual</SelectItem>
                          <SelectItem value="playful">Playful</SelectItem>
                          <SelectItem value="informative">Informative</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Error message */}
                  {captionError && (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                      {captionError}
                    </div>
                  )}

                  {/* Generate button */}
                  <Button
                    onClick={handleGenerateCaption}
                    disabled={generating || captionsRemaining === 0 || !image.enhanced_url}
                    className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : captionsRemaining === 0 ? (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Limit Reached
                      </>
                    ) : !image.enhanced_url ? (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Enhance Image First
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate Caption
                      </>
                    )}
                  </Button>

                  {/* Info text for non-enhanced images */}
                  {!image.enhanced_url && (
                    <p className="text-xs text-muted-foreground text-center">
                      Enhance your image first to unlock {MAX_CAPTIONS_PER_IMAGE} free caption generations.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Generated Caption */}
              {caption && (
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Generated Caption</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopyCaption}
                      >
                        {copied ? (
                          <>
                            <Check className="mr-2 h-4 w-4" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="mr-2 h-4 w-4" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      rows={4}
                      className="resize-none"
                    />

                    {hashtags.length > 0 && (
                      <div>
                        <Label className="text-sm">Hashtags</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {hashtags.map((tag, index) => (
                            <Badge key={index} variant="secondary">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {alternates.length > 0 && (
                      <div>
                        <Label className="text-sm">Alternative Versions</Label>
                        <div className="space-y-2 mt-2">
                          {alternates.map((alt, index) => (
                            <button
                              key={index}
                              onClick={() => setCaption(alt)}
                              className="w-full p-3 text-left text-sm border rounded-lg hover:bg-muted transition-colors"
                            >
                              {alt}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
