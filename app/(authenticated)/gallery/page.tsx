import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Camera,
  Plus,
  Filter,
  Search,
  Download,
  Trash2,
  Share2,
  MoreHorizontal
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'

export default async function GalleryPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Get business
  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()

  // Get all images
  const { data: images } = await supabase
    .from('images')
    .select('*')
    .eq('business_id', business?.id)
    .order('created_at', { ascending: false })

  return (
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

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search images..."
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            All Status
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            All Styles
          </Button>
        </div>
      </div>

      {/* Gallery Grid */}
      {images && images.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {images.map((image) => (
            <Card key={image.id} className="group overflow-hidden">
              <Link href={`/editor/${image.id}`}>
                <div className="relative aspect-square bg-muted">
                  {image.thumbnail_url || image.enhanced_url || image.original_url ? (
                    <img
                      src={image.thumbnail_url || image.enhanced_url || image.original_url}
                      alt={image.original_filename || 'Food photo'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Camera className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}

                  {/* Status Badge */}
                  <div className="absolute top-2 left-2">
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
                  </div>

                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 pointer-events-none">
                    <span className="px-4 py-2 bg-white text-black text-sm font-medium rounded-md shadow-sm">
                      Edit
                    </span>
                  </div>
                </div>
              </Link>

              {/* Image Info */}
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="truncate">
                    <p className="text-sm font-medium truncate">
                      {image.original_filename || 'Untitled'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {image.style_preset || 'No style'}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Camera className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium mb-1">No photos yet</h3>
            <p className="text-sm text-muted-foreground mb-4 text-center max-w-sm">
              Upload your first food photo to start enhancing it with AI
            </p>
            <Button asChild className="bg-orange-500 hover:bg-orange-600">
              <Link href="/editor">
                <Plus className="mr-2 h-4 w-4" />
                Upload Photo
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
