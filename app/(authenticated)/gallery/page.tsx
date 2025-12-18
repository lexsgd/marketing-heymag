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
    .select('id, subscription_status')
    .eq('auth_user_id', user.id)
    .single()

  // Get credits
  let creditsRemaining = 0
  if (business?.id) {
    const { data: creditsData } = await supabase
      .from('credits')
      .select('credits_remaining')
      .eq('business_id', business.id)
      .single()
    creditsRemaining = creditsData?.credits_remaining || 0
  }

  // Get all images
  const { data: images } = await supabase
    .from('images')
    .select('*')
    .eq('business_id', business?.id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-background">
      <MainNav user={user} credits={creditsRemaining} subscriptionStatus={business?.subscription_status} />
      <div className="pt-16">
        <GalleryClient initialImages={images || []} />
      </div>
    </div>
  )
}
