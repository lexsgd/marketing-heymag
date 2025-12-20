'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MoreHorizontal, Pencil, Download, Trash2, Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface ImageActionsProps {
  imageId: string
  imageUrl: string
  filename: string
}

export function ImageActions({ imageId, imageUrl, filename }: ImageActionsProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [show4KDialog, setShow4KDialog] = useState(false)
  const [isUpgrading4K, setIsUpgrading4K] = useState(false)
  const [creditsRemaining, setCreditsRemaining] = useState<number | null>(null)
  const [isLoadingCredits, setIsLoadingCredits] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Fetch credits when 4K dialog opens
  const fetchCredits = async () => {
    setIsLoadingCredits(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setCreditsRemaining(0)
        return
      }

      const { data: business } = await supabase
        .from('businesses')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()

      if (!business) {
        setCreditsRemaining(0)
        return
      }

      const { data: credits } = await supabase
        .from('credits')
        .select('credits_remaining')
        .eq('business_id', business.id)
        .single()

      setCreditsRemaining(credits?.credits_remaining ?? 0)
    } catch (error) {
      console.error('Failed to fetch credits:', error)
      setCreditsRemaining(0)
    } finally {
      setIsLoadingCredits(false)
    }
  }

  const handleOpen4KDialog = () => {
    setShow4KDialog(true)
    fetchCredits()
  }

  const handleEdit = () => {
    router.push(`/editor/${imageId}`)
  }

  const handleDownload = async () => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)

      const a = document.createElement('a')
      a.href = blobUrl
      a.download = filename || `zazzles-${imageId}.jpg`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(blobUrl)
    } catch (error) {
      console.error('Download failed:', error)
    }
  }

  const handle4KUpgrade = async () => {
    setIsUpgrading4K(true)
    try {
      const response = await fetch('/api/ai/upgrade-4k', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl,
          imageId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 402) {
          toast.error('Insufficient credits', {
            description: 'You need at least 1 credit to upgrade to 4K.',
          })
        } else {
          toast.error('Upgrade failed', {
            description: data.error || 'Failed to upgrade image to 4K',
          })
        }
        return
      }

      // Success - download the 4K image
      toast.success('4K upgrade complete!', {
        description: `Your high-resolution image (${data.sizeFormatted}) is ready.`,
      })

      // Trigger download of the 4K image
      const downloadResponse = await fetch(data.url)
      const blob = await downloadResponse.blob()
      const blobUrl = URL.createObjectURL(blob)

      const a = document.createElement('a')
      a.href = blobUrl
      a.download = `zazzles-4k-${imageId}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(blobUrl)

      // Refresh to update credits display
      router.refresh()
    } catch (error) {
      console.error('4K upgrade failed:', error)
      toast.error('Upgrade failed', {
        description: 'An unexpected error occurred. Please try again.',
      })
    } finally {
      setIsUpgrading4K(false)
      setShow4KDialog(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const { error } = await supabase
        .from('images')
        .delete()
        .eq('id', imageId)

      if (error) throw error

      // Refresh the page to update the gallery
      router.refresh()
    } catch (error) {
      console.error('Delete failed:', error)
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleEdit}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Download 2K
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleOpen4KDialog}
            className="text-amber-600 focus:text-amber-600"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Download 4K
            <Badge variant="outline" className="ml-2 text-xs">1 credit</Badge>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Image</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this image? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 4K Upgrade Confirmation Dialog */}
      <AlertDialog open={show4KDialog} onOpenChange={setShow4KDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              Upgrade to 4K Resolution
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3" asChild>
              <div>
                <p>
                  Upgrade this image to ultra-high resolution (4096×4096 pixels) for print-quality results.
                </p>
                <div className="rounded-lg bg-muted p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Cost:</span>
                    <Badge variant="secondary">1 credit</Badge>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-medium">Your balance:</span>
                    {isLoadingCredits ? (
                      <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                    ) : (
                      <span className={creditsRemaining !== null && creditsRemaining < 1 ? 'text-destructive' : 'text-muted-foreground'}>
                        {creditsRemaining ?? 0} credit{creditsRemaining !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
                {creditsRemaining !== null && creditsRemaining < 1 && !isLoadingCredits && (
                  <p className="text-destructive text-sm">
                    You don&apos;t have enough credits. Please purchase more credits to continue.
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpgrading4K}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handle4KUpgrade}
              disabled={isUpgrading4K || isLoadingCredits || (creditsRemaining !== null && creditsRemaining < 1)}
              className="bg-amber-500 hover:bg-amber-600"
            >
              {isUpgrading4K ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Upgrading...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Upgrade & Download
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
