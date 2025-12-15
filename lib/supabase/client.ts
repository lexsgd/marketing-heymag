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

  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        // Keep session alive for 30 days
        storageKey: 'foodsnap-auth',
      },
      cookieOptions: {
        // 30 days in seconds
        maxAge: 60 * 60 * 24 * 30,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      },
    }
  )
}
