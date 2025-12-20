'use client'

import { useState } from 'react'
import { Download, Loader2, AlertCircle, Check, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface DownloadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  imageId: string
  enhancedUrl: string | null
  originalFilename?: string
  creditsRemaining?: number
  onDownload: (url: string, filename: string) => Promise<void>
}

type Resolution = '2K' | '4K'

interface ResolutionOption {
  id: Resolution
  label: string
  description: string
  size: string
  creditCost: number
  recommended?: boolean
}

const RESOLUTION_OPTIONS: ResolutionOption[] = [
  {
    id: '2K',
    label: '2K Resolution',
    description: 'Standard high quality',
    size: '2048 x 2048 px',
    creditCost: 0,
    recommended: true,
  },
  {
    id: '4K',
    label: '4K Resolution',
    description: 'Ultra high quality for print',
    size: '4096 x 4096 px',
    creditCost: 1,
  },
]

export function DownloadDialog({
  open,
  onOpenChange,
  imageId,
  enhancedUrl,
  originalFilename = 'image',
  creditsRemaining = 0,
  onDownload,
}: DownloadDialogProps) {
  const [selectedResolution, setSelectedResolution] = useState<Resolution>('2K')
  const [downloading, setDownloading] = useState(false)
  const [upscaling, setUpscaling] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)

  const selectedOption = RESOLUTION_OPTIONS.find(o => o.id === selectedResolution)!
  const needsCredits = selectedOption.creditCost > 0
  const hasEnoughCredits = creditsRemaining >= selectedOption.creditCost

  const handleResolutionSelect = (resolution: Resolution) => {
    setSelectedResolution(resolution)
    setError(null)
    setShowConfirmation(false)
  }

  const handleDownloadClick = async () => {
    // For 4K, show confirmation first
    if (selectedResolution === '4K' && !showConfirmation) {
      if (!hasEnoughCredits) {
        setError(`Insufficient credits. You need ${selectedOption.creditCost} credit but have ${creditsRemaining}.`)
        return
      }
      setShowConfirmation(true)
      return
    }

    await processDownload()
  }

  const processDownload = async () => {
    if (!enhancedUrl) {
      setError('No enhanced image available')
      return
    }

    setError(null)

    if (selectedResolution === '2K') {
      // For 2K, just download the current enhanced image
      setDownloading(true)
      try {
        await onDownload(enhancedUrl, `zazzles-${selectedResolution.toLowerCase()}-${originalFilename}`)
        onOpenChange(false)
      } catch (err) {
        setError((err as Error).message || 'Download failed')
      } finally {
        setDownloading(false)
      }
    } else {
      // For 4K, call upscale API first
      setUpscaling(true)
      try {
        const response = await fetch('/api/ai/upscale', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageId,
            resolution: selectedResolution,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Upscale failed')
        }

        // Download the upscaled image
        setUpscaling(false)
        setDownloading(true)
        await onDownload(data.upscaledUrl, `zazzles-${selectedResolution.toLowerCase()}-${originalFilename}`)
        onOpenChange(false)
      } catch (err) {
        setError((err as Error).message || 'Upscale failed')
      } finally {
        setUpscaling(false)
        setDownloading(false)
      }
    }
  }

  const handleCancelConfirmation = () => {
    setShowConfirmation(false)
  }

  const isProcessing = downloading || upscaling

  return (
    <Dialog open={open} onOpenChange={isProcessing ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-orange-500" />
            Download Image
          </DialogTitle>
          <DialogDescription>
            Choose your preferred resolution for download
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 4K Confirmation View */}
          {showConfirmation ? (
            <div className="space-y-4">
              <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-950/20">
                <Sparkles className="h-4 w-4 text-orange-500" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">Confirm 4K Generation</p>
                    <p className="text-sm">
                      Generating a 4K image will use <strong>1 credit</strong> from your account.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Credits remaining after: {creditsRemaining - 1}
                    </p>
                  </div>
                </AlertDescription>
              </Alert>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleCancelConfirmation}
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-orange-500 hover:bg-orange-600"
                  onClick={processDownload}
                  disabled={isProcessing}
                >
                  {upscaling ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating 4K...
                    </>
                  ) : downloading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Confirm & Generate
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Resolution Options */}
              <div className="space-y-3">
                {RESOLUTION_OPTIONS.map((option) => {
                  const isSelected = selectedResolution === option.id
                  const canAfford = creditsRemaining >= option.creditCost

                  return (
                    <button
                      key={option.id}
                      onClick={() => handleResolutionSelect(option.id)}
                      disabled={isProcessing}
                      className={cn(
                        'w-full flex items-start gap-4 p-4 rounded-lg border transition-all text-left',
                        isSelected
                          ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20'
                          : 'border-border hover:border-muted-foreground/50',
                        isProcessing && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      {/* Radio indicator */}
                      <div className="flex-shrink-0 mt-0.5">
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

                      {/* Option details */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{option.label}</span>
                          {option.recommended && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                              Recommended
                            </Badge>
                          )}
                          {option.creditCost > 0 && (
                            <Badge
                              variant={canAfford ? "outline" : "destructive"}
                              className="text-[10px] px-1.5 py-0"
                            >
                              +{option.creditCost} credit
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {option.description}
                        </p>
                        <p className="text-xs text-muted-foreground/70 mt-0.5">
                          {option.size}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Credits info */}
              <div className="flex items-center justify-between text-sm text-muted-foreground border-t pt-3">
                <span>Your credits</span>
                <Badge variant="secondary">{creditsRemaining} remaining</Badge>
              </div>

              {/* Error */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </>
          )}
        </div>

        {!showConfirmation && (
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              className="bg-orange-500 hover:bg-orange-600"
              onClick={handleDownloadClick}
              disabled={isProcessing || (needsCredits && !hasEnoughCredits)}
            >
              {downloading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  {selectedResolution === '4K' ? 'Continue' : 'Download'}
                </>
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
