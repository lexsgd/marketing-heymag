'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import {
  ArrowLeft,
  Share2,
  Check,
  Loader2,
  Instagram,
  Facebook,
  Sparkles,
  Image as ImageIcon,
  AlertCircle,
  ExternalLink,
  Wand2,
  ImagePlus,
  Pencil,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { config } from '@/lib/config'
import { ImageEditor } from '@/components/editor'
import { replaceBackgroundImage } from '@/lib/background-removal'

interface ImageData {
  id: string
  original_url: string
  enhanced_url: string | null
  thumbnail_url: string | null
  original_filename: string
  style_preset: string
  status: string
  metadata: Record<string, unknown> | null
  created_at: string
  processed_at: string | null
  caption_count: number | null
}

export default function ImageEditorPage({ params }: { params: { id: string } }) {
  const [image, setImage] = useState<ImageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [enhancing, setEnhancing] = useState(false)
  const [enhanceError, setEnhanceError] = useState<string | null>(null)
  // Credits balance for download options
  const [creditsBalance, setCreditsBalance] = useState<number>(0)
  // Social posting state
  const [socialDialogOpen, setSocialDialogOpen] = useState(false)
  const [selectedSocialPlatforms, setSelectedSocialPlatforms] = useState<('facebook' | 'instagram')[]>([])
  const [socialPostCaption, setSocialPostCaption] = useState('')
  const [posting, setPosting] = useState(false)
  const [postError, setPostError] = useState<string | null>(null)
  const [postSuccess, setPostSuccess] = useState<{ platform: string; success: boolean }[] | null>(null)
  // AI Caption generation state
  const [generatingCaption, setGeneratingCaption] = useState(false)
  const [captionHighlight, setCaptionHighlight] = useState(false)
  const captionRef = useRef<HTMLDivElement>(null)
  // Social account connection status
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([])
  const [loadingConnections, setLoadingConnections] = useState(false)
  // Caption generation with user instructions
  const [captionInstructions, setCaptionInstructions] = useState('')
  const [captionsRemaining, setCaptionsRemaining] = useState<number | null>(null)
  // Pending background replacement (when upload mode failed)
  const [pendingBackgroundUrl, setPendingBackgroundUrl] = useState<string | null>(null)
  const [applyingBackground, setApplyingBackground] = useState(false)
  // AI Edit feature - make additional edits to enhanced image
  const [editPrompt, setEditPrompt] = useState('')
  const [isEditingWithAI, setIsEditingWithAI] = useState(false)
  const [showEditPanel, setShowEditPanel] = useState(false)
  const [preserveOriginal, setPreserveOriginal] = useState(true) // Default: only add elements, don't change existing

  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const loadImage = useCallback(async () => {
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

      // Fetch credits balance
      const { data: credits } = await supabase
        .from('credits')
        .select('credits_remaining')
        .eq('business_id', business.id)
        .single()

      if (credits) {
        setCreditsBalance(credits.credits_remaining)
      }

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
    } catch (err) {
      console.error('Error loading image:', err)
      router.push('/gallery')
    } finally {
      setLoading(false)
    }
  }, [params.id, router, supabase])

  useEffect(() => {
    loadImage()
  }, [loadImage])

  // Check for pending background replacement from sessionStorage
  // (Using sessionStorage instead of query params to avoid URI_TOO_LONG errors with data URLs)
  useEffect(() => {
    const pendingBackground = searchParams.get('pendingBackground')
    if (pendingBackground === 'true') {
      // Read from sessionStorage (supports data URLs of any size)
      const storedBgUrl = sessionStorage.getItem(`pendingBackground_${params.id}`)
      if (storedBgUrl) {
        setPendingBackgroundUrl(storedBgUrl)
        // Clear from sessionStorage after reading
        sessionStorage.removeItem(`pendingBackground_${params.id}`)
        // Show toast notification
        toast.warning('Custom background could not be applied automatically', {
          description: 'Click "Apply Custom Background" to try again.',
          duration: 10000,
        })
      }
    }
  }, [searchParams, params.id])

  // Check for share query param to auto-open social dialog
  useEffect(() => {
    const shouldShare = searchParams.get('share')
    if (shouldShare === 'true' && image?.enhanced_url && !loading) {
      // Auto-open the social posting dialog
      handleOpenSocialDialog()
      // Remove the query param to prevent re-opening on refresh
      router.replace(`/editor/${params.id}`, { scroll: false })
    }
  }, [searchParams, image?.enhanced_url, loading, params.id, router])

  // Handle background replacement retry
  const handleApplyBackground = async () => {
    if (!pendingBackgroundUrl || !image?.enhanced_url) return

    setApplyingBackground(true)
    try {
      console.log('[Editor] Retrying background replacement...')

      // CRITICAL: Fetch enhanced image as Blob FIRST
      // This avoids CORS issues when @imgly library tries to fetch external URLs
      console.log('[Editor] Fetching enhanced image as blob...')
      const enhancedResponse = await fetch(image.enhanced_url)
      if (!enhancedResponse.ok) {
        throw new Error(`Failed to fetch enhanced image: ${enhancedResponse.status}`)
      }
      const enhancedBlob = await enhancedResponse.blob()
      console.log('[Editor] Enhanced image blob ready:', enhancedBlob.size, 'bytes')

      // Apply custom background using client-side processing
      // Pass Blob instead of URL to avoid @imgly CORS issues
      const compositedUrl = await replaceBackgroundImage(
        enhancedBlob,  // Use blob, not URL
        pendingBackgroundUrl,
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
      updateFormData.append('imageId', image.id)

      const updateResponse = await fetch('/api/images/update-enhanced', {
        method: 'POST',
        body: updateFormData,
      })

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to save composited image')
      }

      // Reload image and clear pending state
      await loadImage()
      setPendingBackgroundUrl(null)
      // Clear query params
      router.replace(`/editor/${params.id}`, { scroll: false })

      toast.success('Custom background applied successfully!')
    } catch (err) {
      console.error('[Editor] Background replacement failed:', err)
      toast.error('Failed to apply custom background', {
        description: (err as Error).message || 'Please try again.',
      })
    } finally {
      setApplyingBackground(false)
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

  // Refresh credits after download (called by ImageEditor)
  const handleCreditsRefresh = useCallback(async () => {
    if (!businessId) return
    const { data: credits } = await supabase
      .from('credits')
      .select('credits_remaining')
      .eq('business_id', businessId)
      .single()
    if (credits) {
      setCreditsBalance(credits.credits_remaining)
    }
  }, [businessId, supabase])

  // Fetch connected social accounts
  const fetchConnectedAccounts = useCallback(async () => {
    setLoadingConnections(true)
    try {
      const response = await fetch('/api/social/accounts')
      if (response.ok) {
        const data = await response.json()
        setConnectedPlatforms(data.connected || [])
      }
    } catch (err) {
      console.error('Error fetching social accounts:', err)
    } finally {
      setLoadingConnections(false)
    }
  }, [])

  // Open social posting dialog
  const handleOpenSocialDialog = () => {
    if (!image?.enhanced_url) {
      setPostError('Please enhance the image first before posting to social media.')
      return
    }
    setSocialPostCaption('')
    setCaptionInstructions('')
    setSelectedSocialPlatforms([])
    setPostError(null)
    setPostSuccess(null)
    // Calculate remaining captions (10 max per enhanced image)
    const captionCount = image.caption_count || 0
    setCaptionsRemaining(Math.max(0, 10 - captionCount))
    setSocialDialogOpen(true)
    // Fetch connection status when dialog opens
    fetchConnectedAccounts()
  }

  // Toggle platform selection
  const handleTogglePlatform = (platform: 'facebook' | 'instagram') => {
    setSelectedSocialPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    )
  }

  // Post to social media
  const handlePostToSocial = async () => {
    if (!image?.enhanced_url) {
      setPostError('Image must be enhanced before posting.')
      return
    }

    if (selectedSocialPlatforms.length === 0) {
      setPostError('Please select at least one platform.')
      return
    }

    if (!socialPostCaption.trim()) {
      setPostError('Please enter a caption for your post.')
      return
    }

    setPosting(true)
    setPostError(null)
    setPostSuccess(null)

    try {
      const response = await fetch('/api/social/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caption: socialPostCaption,
          imageUrl: image.enhanced_url,
          platforms: selectedSocialPlatforms,
          imageId: image.id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to post to social media')
      }

      // Show results
      const results = Object.entries(data.results || {}).map(([platform, result]) => ({
        platform,
        success: (result as { success: boolean }).success,
      }))
      setPostSuccess(results)

      // Close dialog after 2 seconds if all successful
      if (data.status === 'posted') {
        setTimeout(() => {
          setSocialDialogOpen(false)
        }, 2000)
      }
    } catch (err) {
      console.error('Social posting error:', err)
      setPostError((err as Error).message || 'Failed to post. Please try again.')
    } finally {
      setPosting(false)
    }
  }

  // Generate AI caption
  const handleGenerateCaption = async () => {
    if (!image?.id || !image?.enhanced_url) return

    // Check if captions remaining
    if (captionsRemaining !== null && captionsRemaining <= 0) {
      setPostError('No AI caption generations remaining for this image. Upload a new image to get 10 more.')
      return
    }

    setGeneratingCaption(true)
    setPostError(null)

    try {
      // Determine platform for caption style (use first selected or default to instagram)
      const platform = selectedSocialPlatforms[0] || 'instagram'

      const response = await fetch('/api/ai/caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageId: image.id,
          language: 'en',
          platform,
          tone: 'engaging',
          // Send user instructions to combine with AI image analysis
          userInstructions: captionInstructions.trim() || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Caption generation failed')
      }

      // Set the generated caption
      const fullCaption = data.caption + (data.hashtags?.length > 0 ? '\n\n' + data.hashtags.map((h: string) => `#${h}`).join(' ') : '')
      setSocialPostCaption(fullCaption)

      // Update remaining captions counter
      setCaptionsRemaining(data.captionsRemaining)

      // Show success toast
      toast.success('Caption generated!', {
        description: `${data.captionsRemaining} generation${data.captionsRemaining === 1 ? '' : 's'} remaining`,
      })

      // Highlight caption section and scroll to it
      setCaptionHighlight(true)
      setTimeout(() => {
        captionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 100)
      setTimeout(() => setCaptionHighlight(false), 2000)

    } catch (err) {
      console.error('Caption generation error:', err)
      setPostError((err as Error).message || 'Failed to generate caption.')
    } finally {
      setGeneratingCaption(false)
    }
  }

  // Edit enhanced image with AI - apply additional changes
  const handleEditWithAI = async () => {
    console.log('[EditWithAI] Function called', {
      hasImage: !!image,
      editPrompt: editPrompt.trim().substring(0, 50),
      preserveOriginal
    })

    if (!image || !editPrompt.trim()) {
      console.log('[EditWithAI] Early return - missing image or prompt')
      toast.error('Please enter a description of your edits')
      return
    }

    setIsEditingWithAI(true)
    toast.info('Starting AI edit...', { duration: 2000 })

    try {
      let response: Response
      let data: Record<string, unknown>

      if (preserveOriginal) {
        // Use Gemini with PRESERVE MODE - uses "Anchor & Add" prompting
        // Tells AI to edit the image locally while keeping original elements intact
        console.log('[EditWithAI] Calling /api/ai/enhance with preserveMode:', {
          imageId: image.id,
          prompt: editPrompt.trim().substring(0, 50),
          preserveMode: true
        })

        response = await fetch('/api/ai/enhance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageId: image.id,
            stylePreset: image.style_preset || 'delivery',
            customPrompt: editPrompt.trim(),
            editMode: true,
            preserveMode: true, // This uses the "Anchor & Add" prompt strategy
          }),
        })

        console.log('[EditWithAI] API response status:', response.status)
        data = await response.json()
        console.log('[EditWithAI] API response data:', data)

        if (!response.ok) {
          throw new Error((data.error as string) || 'Edit failed')
        }

        // Preserve mode creates a new image record
        toast.success('Props added successfully!', {
          description: 'New version created with your requested props.',
        })
        setEditPrompt('')
        setShowEditPanel(false)
        // Navigate to the new edited image
        router.push(`/editor/${data.imageId}`)

      } else {
        // Use Gemini regeneration - reimagines the entire image
        response = await fetch('/api/ai/enhance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageId: image.id,
            stylePreset: image.style_preset || 'delivery',
            customPrompt: editPrompt.trim(),
            editMode: true,
            preserveMode: false,
          }),
        })
        data = await response.json()

        if (!response.ok) {
          throw new Error((data.error as string) || 'Edit failed')
        }

        // Check if a new image was created (edit mode creates a new record)
        if (data.isNewImage && data.imageId !== image.id) {
          toast.success('New version created!', {
            description: 'Your original image is still available in the gallery.',
          })
          setEditPrompt('')
          setShowEditPanel(false)
          router.push(`/editor/${data.imageId as string}`)
        } else {
          await loadImage()
          setEditPrompt('')
          setShowEditPanel(false)
          toast.success('Image updated successfully!', {
            description: 'Your AI edits have been applied.',
          })
        }
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      console.error('[EditWithAI] Error:', {
        error: err,
        message: errorMessage,
        stack: err instanceof Error ? err.stack : undefined
      })
      toast.error('Failed to apply edits', {
        description: errorMessage || 'Please try again.',
        duration: 10000, // Keep error visible longer
      })
    } finally {
      console.log('[EditWithAI] Finally block - resetting state')
      setIsEditingWithAI(false)
    }
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
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 pb-24 md:pb-6">
      {/* Header - Mobile Responsive */}
      <div className="space-y-3 md:space-y-0 md:flex md:items-center md:justify-between">
        {/* Top row: Back button + Title */}
        <div className="flex items-start gap-3 md:gap-4">
          <Button variant="ghost" size="icon" asChild className="h-8 w-8 md:h-9 md:w-9 flex-shrink-0 mt-0.5">
            <Link href="/gallery">
              <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
            </Link>
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg md:text-2xl font-bold truncate">{image.original_filename || 'Untitled'}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              {image.enhanced_url && (
                <Badge className="bg-orange-500 text-white text-xs">
                  <svg className="h-3 w-3 mr-1" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2Z" />
                  </svg>
                  AI Enhanced
                </Badge>
              )}
              {image.status === 'processing' && !image.enhanced_url && (
                <Badge className="bg-orange-500 text-xs">Processing</Badge>
              )}
              {image.status === 'pending' && (
                <Badge variant="outline" className="text-xs">Pending</Badge>
              )}
              {image.status === 'failed' && (
                <Badge variant="destructive" className="text-xs">Failed</Badge>
              )}
              <span className="text-xs md:text-sm text-muted-foreground">
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
            {/* Show processing indicator only if no enhanced_url yet */}
            {image.status === 'processing' && !image.enhanced_url && (
              <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                AI enhancement in progress...
              </div>
            )}
            {/* Show Apply Custom Background button when background replacement failed */}
            {pendingBackgroundUrl && image.enhanced_url && (
              <div className="mt-2">
                <Button
                  onClick={handleApplyBackground}
                  disabled={applyingBackground}
                  className="bg-orange-500 hover:bg-orange-600"
                  size="sm"
                >
                  {applyingBackground ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Applying Background...
                    </>
                  ) : (
                    <>
                      <ImagePlus className="mr-2 h-4 w-4" />
                      Apply Custom Background
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground mt-1">
                  Your custom background was not applied. Click to try again.
                </p>
              </div>
            )}
          </div>
        </div>
        {/* Desktop: Post button in header */}
        <div className="hidden md:flex gap-2 flex-shrink-0">
          <Button
            className="bg-orange-500 hover:bg-orange-600"
            onClick={handleOpenSocialDialog}
            disabled={!image?.enhanced_url}
          >
            <Share2 className="mr-2 h-4 w-4" />
            Post to Social
          </Button>
        </div>
      </div>

      {/* Image Editor - includes Share dropdown with Post to Social + Download options */}
      <ImageEditor
        imageId={image.id}
        originalUrl={image.original_url}
        enhancedUrl={image.enhanced_url || undefined}
        originalFilename={image.original_filename}
        creditsRemaining={creditsBalance}
        onDownloadComplete={handleCreditsRefresh}
        onPostToSocial={handleOpenSocialDialog}
      />

      {/* Edit with AI Section - Make additional edits to the enhanced image */}
      {image.enhanced_url && (
        <Card className="border-dashed">
          <CardContent className="p-4">
            {/* Toggle Button */}
            <button
              onClick={() => setShowEditPanel(!showEditPanel)}
              className="w-full flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                  <Pencil className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h3 className="font-medium text-sm">Reimagine with AI</h3>
                  <p className="text-xs text-muted-foreground">
                    Generate a new version with your requested changes
                  </p>
                </div>
              </div>
              {showEditPanel ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>

            {/* Expandable Edit Panel */}
            {showEditPanel && (
              <div className="mt-4 space-y-3 pt-4 border-t">
                {/* Preserve Mode Toggle */}
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border">
                  <Checkbox
                    id="preserveOriginal"
                    checked={preserveOriginal}
                    onCheckedChange={(checked) => setPreserveOriginal(checked === true)}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <Label htmlFor="preserveOriginal" className="text-sm font-medium cursor-pointer">
                      Preserve Original (True Inpainting)
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {preserveOriginal
                        ? 'Add props to the exact positions around your food - original pixels stay untouched'
                        : 'Regenerate the entire image with your changes - may alter background and composition'}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">
                    {preserveOriginal ? 'What props to add?' : 'Describe your edits'}
                  </Label>
                  <Textarea
                    value={editPrompt}
                    onChange={(e) => setEditPrompt(e.target.value)}
                    placeholder={preserveOriginal
                      ? "E.g., 'Add wooden chopsticks and a small white saucer with red chili slices'"
                      : "E.g., 'Make the colors more vibrant and add steam rising from the food'"}
                    rows={3}
                    className="resize-none text-sm"
                    maxLength={500}
                  />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{preserveOriginal ? 'Props will be placed naturally around the food' : 'Describe what you want to change'}</span>
                    <span>{editPrompt.length}/500</span>
                  </div>
                </div>

                {/* Quick suggestions - different for each mode */}
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs text-muted-foreground">Try:</span>
                  {(preserveOriginal
                    ? [
                        'Add wooden chopsticks',
                        'Add a small saucer with soy sauce',
                        'Add fresh chili slices',
                        'Add a cloth napkin',
                      ]
                    : [
                        'Make colors more vibrant',
                        'Add steam rising',
                        'Darker moody background',
                        'Brighter lighting',
                      ]
                  ).map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => setEditPrompt(suggestion)}
                      className="text-xs px-2 py-1 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>

                {/* Mode-specific explanation */}
                {preserveOriginal ? (
                  <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                    <div className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-green-800 dark:text-green-200">
                        <span className="font-medium">True Preservation:</span> Uses advanced AI inpainting to add props
                        to the background areas while keeping your food exactly as it appears now.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-amber-800 dark:text-amber-200">
                        <span className="font-medium">Full Regeneration:</span> AI will create a new version of the image.
                        The background, composition, and styling may change. Original is preserved separately.
                      </p>
                    </div>
                  </div>
                )}

                {/* Apply Button */}
                <Button
                  onClick={handleEditWithAI}
                  disabled={isEditingWithAI || !editPrompt.trim()}
                  className="w-full bg-orange-500 hover:bg-orange-600"
                >
                  {isEditingWithAI ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {preserveOriginal ? 'Adding props...' : 'Generating new version...'}
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      {preserveOriginal ? 'Add Props (1 credit)' : 'Reimagine (1 credit)'}
                    </>
                  )}
                </Button>

                <p className="text-[11px] text-muted-foreground text-center">
                  {preserveOriginal
                    ? 'Props will be added to the background areas. Your food stays exactly the same.'
                    : 'AI will regenerate the image with your requested changes.'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Social Posting Dialog - Redesigned for lower friction */}
      <Dialog open={socialDialogOpen} onOpenChange={setSocialDialogOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5 text-orange-500" />
              Post to Social Media
            </DialogTitle>
            <DialogDescription>
              Generate AI captions and share to your connected accounts.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4">
            {/* Top Row: Image Preview + Platform Selection */}
            <div className="flex gap-4">
              {/* Image Preview - Compact */}
              {image?.enhanced_url && (
                <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                  <img
                    src={image.enhanced_url}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Platform Selection - Compact horizontal */}
              <div className="flex-1 space-y-2">
                <Label className="text-sm">Post to</Label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-lg border transition-all',
                      selectedSocialPlatforms.includes('instagram')
                        ? 'border-pink-500 bg-pink-50 dark:bg-pink-950/20'
                        : 'border-border hover:border-muted-foreground/50',
                      !connectedPlatforms.includes('instagram') && 'opacity-50'
                    )}
                    onClick={() => handleTogglePlatform('instagram')}
                  >
                    <Instagram className="h-4 w-4 text-pink-500" />
                    <span className="text-sm font-medium">Instagram</span>
                    {loadingConnections ? (
                      <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                    ) : !connectedPlatforms.includes('instagram') ? (
                      <span className="text-[10px] text-muted-foreground">(Not connected)</span>
                    ) : selectedSocialPlatforms.includes('instagram') && (
                      <Check className="h-3 w-3 text-pink-500" />
                    )}
                  </button>
                  <button
                    type="button"
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-lg border transition-all',
                      selectedSocialPlatforms.includes('facebook')
                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20'
                        : 'border-border hover:border-muted-foreground/50',
                      !connectedPlatforms.includes('facebook') && 'opacity-50'
                    )}
                    onClick={() => handleTogglePlatform('facebook')}
                  >
                    <Facebook className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">Facebook</span>
                    {loadingConnections ? (
                      <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                    ) : !connectedPlatforms.includes('facebook') ? (
                      <span className="text-[10px] text-muted-foreground">(Not connected)</span>
                    ) : selectedSocialPlatforms.includes('facebook') && (
                      <Check className="h-3 w-3 text-orange-500" />
                    )}
                  </button>
                </div>
                {/* Connect link */}
                {(!connectedPlatforms.includes('instagram') || !connectedPlatforms.includes('facebook')) && (
                  <Link href="/social" className="text-xs text-orange-500 hover:underline inline-flex items-center gap-1">
                    Connect accounts
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                )}
              </div>
            </div>

            {/* AI Caption Generator - Main Section */}
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg border">
              {/* Header with counter */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wand2 className="h-4 w-4 text-orange-500" />
                  <Label className="text-sm font-medium">AI Caption Generator</Label>
                </div>
                {captionsRemaining !== null && (
                  <Badge
                    variant={captionsRemaining > 3 ? 'secondary' : captionsRemaining > 0 ? 'outline' : 'destructive'}
                    className="text-xs"
                  >
                    {captionsRemaining}/10 remaining
                  </Badge>
                )}
              </div>

              {/* User Instructions Input */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Add context or instructions (optional)
                </Label>
                <Textarea
                  value={captionInstructions}
                  onChange={(e) => setCaptionInstructions(e.target.value)}
                  placeholder="E.g., 'Mention our weekend brunch special' or 'Use playful tone with food puns'"
                  rows={2}
                  className="resize-none text-sm"
                />
              </div>

              {/* Generate Button */}
              <Button
                onClick={handleGenerateCaption}
                disabled={generatingCaption || !image?.enhanced_url || (captionsRemaining !== null && captionsRemaining <= 0)}
                className="w-full bg-orange-500 hover:bg-orange-600"
              >
                {generatingCaption ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing image & generating caption...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Caption & Hashtags
                  </>
                )}
              </Button>

              <p className="text-[11px] text-muted-foreground text-center">
                AI analyzes your enhanced photo and combines it with your instructions for the perfect caption.
              </p>
            </div>

            {/* Generated Caption - Editable */}
            <div
              ref={captionRef}
              className={cn(
                "space-y-2 transition-all duration-500",
                captionHighlight && "ring-2 ring-orange-500 rounded-lg p-2 -m-2 bg-orange-50 dark:bg-orange-950/20"
              )}
            >
              <div className="flex items-center justify-between">
                <Label className="text-sm">Caption & Hashtags</Label>
                {socialPostCaption && (
                  <span className="text-xs text-muted-foreground">
                    {socialPostCaption.length} characters
                  </span>
                )}
              </div>
              <Textarea
                value={socialPostCaption}
                onChange={(e) => setSocialPostCaption(e.target.value)}
                placeholder="Your caption will appear here after generation, or write your own..."
                rows={5}
                className="resize-none"
              />
            </div>

            {/* Error */}
            {postError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{postError}</AlertDescription>
              </Alert>
            )}

            {/* Success */}
            {postSuccess && (
              <Alert className="border-green-500 bg-green-50 dark:bg-green-950/20">
                <Check className="h-4 w-4 text-green-500" />
                <AlertDescription>
                  <div className="space-y-1">
                    {postSuccess.map((result) => (
                      <div key={result.platform} className="flex items-center gap-2">
                        {result.success ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className="capitalize">{result.platform}</span>
                        <span className="text-muted-foreground">
                          {result.success ? '- Posted!' : '- Failed'}
                        </span>
                      </div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setSocialDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-orange-500 hover:bg-orange-600"
              onClick={handlePostToSocial}
              disabled={posting || selectedSocialPlatforms.length === 0 || !socialPostCaption.trim()}
            >
              {posting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <Share2 className="mr-2 h-4 w-4" />
                  Post Now
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
