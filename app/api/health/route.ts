import { NextResponse } from 'next/server'
import { config } from '@/lib/config'
import { createClient } from '@supabase/supabase-js'

// Use Node.js runtime for consistency with other API routes
export const runtime = 'nodejs'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const debug = searchParams.get('debug') === 'true'

  const response: Record<string, unknown> = {
    status: 'healthy',
    version: config.version,
    internalBuild: config.internalBuild,
    appName: config.appName,
    timestamp: new Date().toISOString(),
  }

  // Add Supabase connection check in debug mode
  if (debug) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    response.supabase = {
      urlConfigured: !!supabaseUrl,
      urlPrefix: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : null,
      anonKeyConfigured: !!supabaseAnonKey,
      anonKeyPrefix: supabaseAnonKey ? supabaseAnonKey.substring(0, 20) + '...' : null,
    }

    // Test actual connection
    if (supabaseUrl && supabaseAnonKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseAnonKey)
        const { data, error } = await supabase.from('templates').select('id').limit(1)

        response.supabase = {
          ...response.supabase as object,
          connectionTest: error ? `Error: ${error.message}` : 'OK',
          templatesCount: data?.length ?? 0,
        }
      } catch (err) {
        response.supabase = {
          ...response.supabase as object,
          connectionTest: `Exception: ${(err as Error).message}`,
        }
      }
    }
  }

  return NextResponse.json(response)
}
