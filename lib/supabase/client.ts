import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Provide fallback for build time (will be replaced at runtime)
  if (!supabaseUrl || !supabaseAnonKey) {
    // Return a dummy client that will be replaced at runtime
    return createBrowserClient(
      'https://placeholder.supabase.co',
      'placeholder-key',
      { auth: { persistSession: false } }
    )
  }

  // Use Supabase defaults - no custom storageKey or cookieOptions
  // This ensures browser client and middleware use same cookie names
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
