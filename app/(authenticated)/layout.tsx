import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Pages now handle their own navigation via MainNav component
  return <>{children}</>
}
