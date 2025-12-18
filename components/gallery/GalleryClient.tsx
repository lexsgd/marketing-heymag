'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Camera,
  Plus,
  Filter,
  Search,
  Grid3X3,
  List,
  Check,
  Download,
  Trash2,
  Loader2,
  X,
  Calendar,
  CheckSquare,
  Square,
  Sparkles,
  Clock,
  AlertCircle,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { ImageActions } from './ImageActions'

interface ImageData {
  id: string
  original_url: string
  enhanced_url: string | null
  thumbnail_url: string | null
  original_filename: string | null
  style_preset: string | null
  status: string
  created_at: string
}

interface GalleryClientProps {
  initialImages: ImageData[]
}

type ViewMode = 'grid' | 'list'

export function GalleryClient({ initialImages }: GalleryClientProps) {
  const [images, setImages] = useState<ImageData[]>(initialImages)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  // Filter images by search query
  const filteredImages = images.filter(image =>
    !searchQuery ||
    (image.original_filename?.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (image.style_preset?.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  // Selection handlers
  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(filteredImages.map(img => img.id)))
  }, [filteredImages])

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  const isAllSelected = filteredImages.length > 0 && selectedIds.size === filteredImages.length

  // Bulk download
  const handleBulkDownload = async () => {
    if (selectedIds.size === 0) return

    setIsDownloading(true)
    try {
      const selectedImages = images.filter(img => selectedIds.has(img.id))

      // Download each image sequentially
      for (const image of selectedImages) {
        const url = image.enhanced_url || image.original_url
        try {
          const response = await fetch(url)
          const blob = await response.blob()
          const blobUrl = URL.createObjectURL(blob)

          const a = document.createElement('a')
          a.href = blobUrl
          a.download = image.original_filename || `foodsnap-${image.id}.jpg`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(blobUrl)

          // Small delay between downloads
          await new Promise(resolve => setTimeout(resolve, 300))
        } catch (err) {
          console.error(`Failed to download ${image.original_filename}:`, err)
        }
      }
    } finally {
      setIsDownloading(false)
    }
  }

  // Bulk delete
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return

    setIsDeleting(true)
    try {
      const idsToDelete = Array.from(selectedIds)

      const { error } = await supabase
        .from('images')
        .delete()
        .in('id', idsToDelete)

      if (error) throw error

      // Update local state
      setImages(prev => prev.filter(img => !selectedIds.has(img.id)))
      setSelectedIds(new Set())

      // Refresh to ensure sync with server
      router.refresh()
    } catch (error) {
      console.error('Bulk delete failed:', error)
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  // Premium icon-only status indicator (Apple Photos style)
  const StatusIndicator = ({ status, showTooltip = true }: { status: string; showTooltip?: boolean }) => {
    const iconClass = "h-3.5 w-3.5"

    const getStatusConfig = () => {
      switch (status) {
        case 'completed':
          return {
            icon: <Sparkles className={cn(iconClass, "text-amber-300")} />,
            bg: "bg-black/50 backdrop-blur-sm",
            tooltip: "AI Enhanced"
          }
        case 'processing':
          return {
            icon: <Loader2 className={cn(iconClass, "text-white animate-spin")} />,
            bg: "bg-black/50 backdrop-blur-sm",
            tooltip: "Processing..."
          }
        case 'pending':
          return {
            icon: <Clock className={cn(iconClass, "text-white/70")} />,
            bg: "bg-black/40 backdrop-blur-sm",
            tooltip: "Pending"
          }
        case 'failed':
          return {
            icon: <AlertCircle className={cn(iconClass, "text-white")} />,
            bg: "bg-red-500/80 backdrop-blur-sm",
            tooltip: "Enhancement Failed"
          }
        default:
          return null
      }
    }

    const config = getStatusConfig()
    if (!config) return null

    const indicator = (
      <div className={cn(
        "p-1.5 rounded-full shadow-lg transition-transform hover:scale-110",
        config.bg
      )}>
        {config.icon}
      </div>
    )

    if (!showTooltip) return indicator

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {indicator}
        </TooltipTrigger>
        <TooltipContent side="right" className="text-xs">
          {config.tooltip}
        </TooltipContent>
      </Tooltip>
    )
  }

  // List view badge (more visible for table context)
  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case 'completed':
        return (
          <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 gap-1">
            <Sparkles className="h-3 w-3" />
            Enhanced
          </Badge>
        )
      case 'processing':
        return (
          <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Processing
          </Badge>
        )
      case 'pending':
        return (
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        )
      case 'failed':
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            Failed
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <TooltipProvider>
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gallery</h1>
          <p className="text-muted-foreground">
            All your uploaded and enhanced food photos
          </p>
        </div>
        <Button asChild className="bg-orange-500 hover:bg-orange-600">
          <Link href="/editor">
            <Plus className="mr-2 h-4 w-4" />
            Upload New Photo
          </Link>
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search images..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* View Toggle */}
          <div className="flex gap-1 border rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="h-8 px-3"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="h-8 px-3"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Select All / Deselect All */}
        {filteredImages.length > 0 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={isAllSelected ? deselectAll : selectAll}
            >
              {isAllSelected ? (
                <>
                  <X className="mr-2 h-4 w-4" />
                  Deselect All
                </>
              ) : (
                <>
                  <CheckSquare className="mr-2 h-4 w-4" />
                  Select All
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
          <span className="text-sm font-medium">
            {selectedIds.size} {selectedIds.size === 1 ? 'image' : 'images'} selected
          </span>
          <div className="flex-1" />
          <Button
            variant="outline"
            size="sm"
            onClick={handleBulkDownload}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Downloading...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Download ({selectedIds.size})
              </>
            )}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
            disabled={isDeleting}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete ({selectedIds.size})
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={deselectAll}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Gallery Content */}
      {filteredImages.length > 0 ? (
        viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredImages.map((image) => {
              const isSelected = selectedIds.has(image.id)
              return (
                <Card
                  key={image.id}
                  className={cn(
                    "group overflow-hidden transition-all duration-200 hover:shadow-lg",
                    isSelected && "ring-2 ring-orange-500"
                  )}
                >
                  <div className="relative aspect-square bg-muted">
                    {/* Status Indicator - Premium icon-only design */}
                    <div className="absolute top-2 left-2 z-10">
                      <StatusIndicator status={image.status} />
                    </div>

                    {/* Selection Checkbox */}
                    <div
                      className={cn(
                        "absolute top-2 right-2 z-10 transition-all duration-200",
                        isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                      )}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelection(image.id)}
                        className="h-5 w-5 bg-white/90 backdrop-blur-sm border-0 shadow-sm data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                      />
                    </div>

                    <Link href={`/editor/${image.id}`}>
                      {image.thumbnail_url || image.enhanced_url || image.original_url ? (
                        <img
                          src={image.thumbnail_url || image.enhanced_url || image.original_url}
                          alt={image.original_filename || 'Food photo'}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Camera className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}

                      {/* Premium gradient overlay on hover */}
                      <div className={cn(
                        "absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent",
                        "opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      )}>
                        {/* Centered Edit Button - Premium pill style */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="px-5 py-2 bg-white/95 text-black text-sm font-medium rounded-full shadow-lg transform scale-95 group-hover:scale-100 transition-transform duration-200">
                            Edit Photo
                          </span>
                        </div>
                      </div>
                    </Link>
                  </div>

                  {/* Image Info */}
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="truncate flex-1 mr-2">
                        <p className="text-sm font-medium truncate">
                          {image.original_filename || 'Untitled'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {image.style_preset || 'No style'}
                        </p>
                      </div>
                      <ImageActions
                        imageId={image.id}
                        imageUrl={image.enhanced_url || image.original_url}
                        filename={image.original_filename || `foodsnap-${image.id}.jpg`}
                      />
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          /* List View */
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={(checked) => checked ? selectAll() : deselectAll()}
                      className="data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                    />
                  </TableHead>
                  <TableHead className="w-20">Preview</TableHead>
                  <TableHead>Filename</TableHead>
                  <TableHead className="w-32">Style</TableHead>
                  <TableHead className="w-32">Status</TableHead>
                  <TableHead className="w-32">Date</TableHead>
                  <TableHead className="w-20 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredImages.map((image) => {
                  const isSelected = selectedIds.has(image.id)
                  return (
                    <TableRow
                      key={image.id}
                      className={cn(isSelected && "bg-orange-50 dark:bg-orange-950/20")}
                    >
                      <TableCell>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelection(image.id)}
                          className="data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                        />
                      </TableCell>
                      <TableCell>
                        <Link href={`/editor/${image.id}`}>
                          <div className="w-14 h-14 rounded-md overflow-hidden bg-muted">
                            {image.thumbnail_url || image.enhanced_url || image.original_url ? (
                              <img
                                src={image.thumbnail_url || image.enhanced_url || image.original_url}
                                alt={image.original_filename || 'Food photo'}
                                className="w-full h-full object-cover hover:scale-110 transition-transform"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Camera className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/editor/${image.id}`}
                          className="font-medium hover:text-orange-500 transition-colors"
                        >
                          {image.original_filename || 'Untitled'}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {image.style_preset || 'No style'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={image.status} />
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(image.created_at)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <ImageActions
                          imageId={image.id}
                          imageUrl={image.enhanced_url || image.original_url}
                          filename={image.original_filename || `foodsnap-${image.id}.jpg`}
                        />
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </Card>
        )
      ) : (
        /* Empty State */
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Camera className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium mb-1">
              {searchQuery ? 'No matching photos' : 'No photos yet'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4 text-center max-w-sm">
              {searchQuery
                ? 'Try a different search term'
                : 'Upload your first food photo to start enhancing it with AI'
              }
            </p>
            {!searchQuery && (
              <Button asChild className="bg-orange-500 hover:bg-orange-600">
                <Link href="/editor">
                  <Plus className="mr-2 h-4 w-4" />
                  Upload Photo
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.size} {selectedIds.size === 1 ? 'Image' : 'Images'}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedIds.size} selected {selectedIds.size === 1 ? 'image' : 'images'}?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete {selectedIds.size} {selectedIds.size === 1 ? 'Image' : 'Images'}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </TooltipProvider>
  )
}
