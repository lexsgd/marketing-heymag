'use client'

import { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Camera,
  Plus,
  Search,
  Download,
  Trash2,
  Loader2,
  X,
  Calendar,
  LayoutGrid,
  List,
  MoreHorizontal,
  ExternalLink,
  Share2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

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

type DateFilter = 'all' | 'today' | 'week' | 'month'
type ViewMode = 'grid' | 'list'

export function GalleryClient({ initialImages }: GalleryClientProps) {
  const [images, setImages] = useState<ImageData[]>(initialImages)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')

  const router = useRouter()
  const supabase = createClient()

  // Get date boundaries for filtering
  const getDateBoundary = (filter: DateFilter): Date | null => {
    const now = new Date()
    switch (filter) {
      case 'today':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate())
      case 'week':
        const weekAgo = new Date(now)
        weekAgo.setDate(weekAgo.getDate() - 7)
        return weekAgo
      case 'month':
        const monthAgo = new Date(now)
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        return monthAgo
      default:
        return null
    }
  }

  // Filter images
  const filteredImages = useMemo(() => {
    return images.filter(image => {
      // Search filter
      const matchesSearch = !searchQuery ||
        (image.original_filename?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (image.style_preset?.toLowerCase().includes(searchQuery.toLowerCase()))

      // Date filter
      const dateBoundary = getDateBoundary(dateFilter)
      const matchesDate = !dateBoundary || new Date(image.created_at) >= dateBoundary

      return matchesSearch && matchesDate
    })
  }, [images, searchQuery, dateFilter])

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

      setImages(prev => prev.filter(img => !selectedIds.has(img.id)))
      setSelectedIds(new Set())
      router.refresh()
    } catch (error) {
      console.error('Bulk delete failed:', error)
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  // Single image download
  const handleDownload = async (image: ImageData) => {
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
    } catch (err) {
      console.error('Download failed:', err)
    }
  }

  // Share - navigates to editor page with share dialog trigger
  const handleShare = () => {
    if (selectedIds.size === 0) return

    // Get the first selected image (share works best for single images)
    const firstSelectedId = Array.from(selectedIds)[0]
    const selectedImage = images.find(img => img.id === firstSelectedId)

    if (selectedImage) {
      // Navigate to editor with share query param to auto-open share dialog
      router.push(`/editor/${selectedImage.id}?share=true`)
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    })
  }

  return (
    <TooltipProvider>
    <div className="min-h-[calc(100vh-64px)] flex">
      {/* Left Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 border-r border-border h-[calc(100vh-64px)] sticky top-16 overflow-y-auto p-6">
        {/* Library Section */}
        <div className="mb-8">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            LIBRARY
          </h3>
          <nav className="space-y-1">
            <button
              onClick={() => setDateFilter('all')}
              className={cn(
                'w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-between',
                dateFilter === 'all'
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              <span>All Photos</span>
              <Badge variant="secondary" className="text-xs">{images.length}</Badge>
            </button>
          </nav>
        </div>

        {/* Date Section */}
        <div className="mb-8">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            DATE
          </h3>
          <nav className="space-y-1">
            <button
              onClick={() => setDateFilter('today')}
              className={cn(
                'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2',
                dateFilter === 'today'
                  ? 'bg-muted text-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>Today</span>
            </button>
            <button
              onClick={() => setDateFilter('week')}
              className={cn(
                'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2',
                dateFilter === 'week'
                  ? 'bg-muted text-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>This Week</span>
            </button>
            <button
              onClick={() => setDateFilter('month')}
              className={cn(
                'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2',
                dateFilter === 'month'
                  ? 'bg-muted text-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>This Month</span>
            </button>
          </nav>
        </div>

        {/* Actions Section */}
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            ACTIONS
          </h3>
          <div className="space-y-2">
            <Button
              asChild
              size="sm"
              className="w-full justify-start bg-orange-500 hover:bg-orange-600"
            >
              <Link href="/editor">
                <Plus className="h-4 w-4 mr-2" />
                Upload Photo
              </Link>
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">
              {dateFilter === 'all' && 'All Photos'}
              {dateFilter === 'today' && 'Today'}
              {dateFilter === 'week' && 'This Week'}
              {dateFilter === 'month' && 'This Month'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {filteredImages.length} {filteredImages.length === 1 ? 'photo' : 'photos'}
            </p>
          </div>

          {/* Search, View Toggle & Select All */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search photos..."
                className="pl-10 h-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* View Toggle */}
            <div className="flex items-center border rounded-lg p-1 bg-muted/50">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setViewMode('grid')}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Grid view</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>List view</TooltipContent>
              </Tooltip>
            </div>

            {filteredImages.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={isAllSelected ? deselectAll : selectAll}
              >
                {isAllSelected ? 'Deselect All' : 'Select All'}
              </Button>
            )}
          </div>
        </div>

        {/* Gallery Content */}
        {filteredImages.length > 0 ? (
          viewMode === 'grid' ? (
            /* Grid View - Masonry */
            <div className="columns-2 md:columns-3 lg:columns-4 gap-4">
              {filteredImages.map((image) => {
                const isSelected = selectedIds.has(image.id)
                return (
                  <div
                    key={image.id}
                    className="break-inside-avoid mb-4 group"
                  >
                    <div className={cn(
                      "relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 transition-all duration-200",
                      isSelected && "ring-2 ring-orange-500 ring-offset-2 ring-offset-background"
                    )}>
                      {/* Selection Checkbox */}
                      <div
                        className={cn(
                          "absolute top-3 right-3 z-10 transition-all duration-200",
                          isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                        )}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelection(image.id)}
                          className="h-5 w-5 bg-white/90 backdrop-blur-sm border-0 shadow-lg data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                        />
                      </div>

                      <Link href={`/editor/${image.id}`}>
                        {/* Image - Natural aspect ratio */}
                        <div className="relative">
                          {image.thumbnail_url || image.enhanced_url || image.original_url ? (
                            <img
                              src={image.thumbnail_url || image.enhanced_url || image.original_url}
                              alt={image.original_filename || 'Food photo'}
                              className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="aspect-square w-full flex items-center justify-center">
                              <Camera className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}

                          {/* Hover Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="absolute bottom-0 left-0 right-0 p-4">
                              <h3 className="text-white font-medium text-sm mb-1 line-clamp-1">
                                {image.original_filename || 'Untitled'}
                              </h3>
                              <p className="text-white/70 text-xs">
                                {image.style_preset || 'No style applied'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            /* List View */
            <div className="space-y-2">
              {/* List Header */}
              <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider border-b">
                <div className="col-span-1"></div>
                <div className="col-span-5">Name</div>
                <div className="col-span-3">Style</div>
                <div className="col-span-2">Date</div>
                <div className="col-span-1"></div>
              </div>

              {/* List Items */}
              {filteredImages.map((image) => {
                const isSelected = selectedIds.has(image.id)
                return (
                  <div
                    key={image.id}
                    className={cn(
                      "grid grid-cols-12 gap-4 items-center p-4 rounded-2xl bg-card border border-border hover:bg-muted/50 transition-colors group",
                      isSelected && "ring-2 ring-orange-500 bg-orange-500/5"
                    )}
                  >
                    {/* Checkbox + Thumbnail */}
                    <div className="col-span-1 flex items-center gap-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelection(image.id)}
                        className="data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                      />
                      <Link href={`/editor/${image.id}`} className="shrink-0">
                        <div className="h-12 w-12 rounded-lg overflow-hidden bg-muted">
                          {image.thumbnail_url || image.enhanced_url || image.original_url ? (
                            <img
                              src={image.thumbnail_url || image.enhanced_url || image.original_url}
                              alt={image.original_filename || 'Food photo'}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Camera className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      </Link>
                    </div>

                    {/* Name */}
                    <div className="col-span-5">
                      <Link href={`/editor/${image.id}`} className="hover:underline">
                        <p className="font-medium truncate">
                          {image.original_filename || 'Untitled'}
                        </p>
                      </Link>
                    </div>

                    {/* Style */}
                    <div className="col-span-3">
                      <span className="text-sm text-muted-foreground">
                        {image.style_preset || '—'}
                      </span>
                    </div>

                    {/* Date */}
                    <div className="col-span-2">
                      <span className="text-sm text-muted-foreground">
                        {formatDate(image.created_at)}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="col-span-1 flex justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/editor/${image.id}`} className="flex items-center">
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Open
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownload(image)}>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        ) : (
          /* Empty State */
          <div className="text-center py-20">
            <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
              <Camera className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {searchQuery ? 'No matching photos' : 'No photos yet'}
            </h3>
            <p className="text-muted-foreground max-w-sm mx-auto mb-6">
              {searchQuery
                ? 'Try a different search term or filter'
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
            {searchQuery && (
              <Button
                onClick={() => { setSearchQuery(''); setDateFilter('all'); }}
                variant="link"
                className="text-orange-500"
              >
                Clear filters
              </Button>
            )}
          </div>
        )}
      </main>

      {/* Fixed Bottom Bulk Action Bar - Slides up when items selected */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ease-out",
          selectedIds.size > 0 ? "translate-y-0" : "translate-y-full"
        )}
      >
        <div className="bg-background/95 backdrop-blur-lg border-t border-border shadow-2xl">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-orange-500 flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">{selectedIds.size}</span>
                </div>
                <span className="text-sm font-medium">
                  {selectedIds.size === 1 ? 'photo' : 'photos'} selected
                </span>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  onClick={handleShare}
                  className="h-9 bg-orange-500 hover:bg-orange-600"
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  {selectedIds.size === 1 ? 'Share' : `Share (${selectedIds.size > 1 ? '1st' : ''})`}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkDownload}
                  disabled={isDownloading}
                  className="h-9"
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </>
                  )}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={isDeleting}
                  className="h-9"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 ml-2"
                  onClick={deselectAll}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.size} {selectedIds.size === 1 ? 'Photo' : 'Photos'}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedIds.size} selected {selectedIds.size === 1 ? 'photo' : 'photos'}?
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
                  Delete
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
