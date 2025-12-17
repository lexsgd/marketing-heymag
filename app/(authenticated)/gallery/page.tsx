import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { GalleryClient } from '@/components/gallery/GalleryClient'

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

  return <GalleryClient initialImages={images || []} />
}
