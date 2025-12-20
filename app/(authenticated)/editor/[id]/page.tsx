'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
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
  ExternalLink
} from 'lucide-react'
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

  const router = useRouter()
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

  // Open social posting dialog
  const handleOpenSocialDialog = () => {
    if (!image?.enhanced_url) {
      setPostError('Please enhance the image first before posting to social media.')
      return
    }
    setSocialPostCaption('')
    setSelectedSocialPlatforms([])
    setPostError(null)
    setPostSuccess(null)
    setSocialDialogOpen(true)
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
                <Badge className="bg-orange-500 text-white">
                  <svg className="h-3 w-3 mr-1" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2Z" />
                  </svg>
                  AI Enhanced
                </Badge>
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

      {/* Image Editor */}
      <ImageEditor
        imageId={image.id}
        originalUrl={image.original_url}
        enhancedUrl={image.enhanced_url || undefined}
        originalFilename={image.original_filename}
        creditsRemaining={creditsBalance}
        onDownloadComplete={handleCreditsRefresh}
      />

      {/* Social Posting Dialog */}
      <Dialog open={socialDialogOpen} onOpenChange={setSocialDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5 text-orange-500" />
              Post to Social Media
            </DialogTitle>
            <DialogDescription>
              Share your enhanced food photo to your connected social accounts.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Image Preview */}
            {image?.enhanced_url && (
              <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-muted">
                <img
                  src={image.enhanced_url}
                  alt="Preview"
                  className="w-full h-full object-contain"
                />
              </div>
            )}

            {/* Platform Selection */}
            <div className="space-y-3">
              <Label>Select Platforms</Label>
              <div className="flex flex-col gap-3">
                <div
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all',
                    selectedSocialPlatforms.includes('instagram')
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20'
                      : 'border-border hover:border-muted-foreground/50'
                  )}
                  onClick={() => handleTogglePlatform('instagram')}
                >
                  <Checkbox
                    checked={selectedSocialPlatforms.includes('instagram')}
                    onCheckedChange={() => handleTogglePlatform('instagram')}
                  />
                  <Instagram className="h-5 w-5 text-pink-500" />
                  <span className="font-medium">Instagram</span>
                </div>
                <div
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all',
                    selectedSocialPlatforms.includes('facebook')
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20'
                      : 'border-border hover:border-muted-foreground/50'
                  )}
                  onClick={() => handleTogglePlatform('facebook')}
                >
                  <Checkbox
                    checked={selectedSocialPlatforms.includes('facebook')}
                    onCheckedChange={() => handleTogglePlatform('facebook')}
                  />
                  <Facebook className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">Facebook</span>
                </div>
              </div>
            </div>

            {/* Caption */}
            <div className="space-y-2">
              <Label>Caption</Label>
              <Textarea
                value={socialPostCaption}
                onChange={(e) => setSocialPostCaption(e.target.value)}
                placeholder="Write a caption for your post..."
                rows={4}
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
                          {result.success ? '- Posted successfully!' : '- Failed to post'}
                        </span>
                      </div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Connect accounts hint */}
            <p className="text-xs text-muted-foreground">
              Need to connect your accounts?{' '}
              <Link href="/social" className="text-orange-500 hover:underline inline-flex items-center gap-1">
                Manage connected accounts
                <ExternalLink className="h-3 w-3" />
              </Link>
            </p>
          </div>

          <DialogFooter>
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
