import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { GalleryClient } from '@/components/gallery/GalleryClient'
import { MainNav } from '@/components/main-nav'

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
    <div className="min-h-screen bg-background">
      <MainNav />
      <div className="pt-16">
        <GalleryClient initialImages={images || []} />
      </div>
    </div>
  )
}
