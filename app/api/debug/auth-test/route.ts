import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    supabaseUrl: supabaseUrl ? `${supabaseUrl.substring(0, 40)}...` : null,
    anonKeyPrefix: supabaseAnonKey ? supabaseAnonKey.substring(0, 30) + '...' : null,
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({
      ...results,
      error: 'Missing Supabase configuration',
    })
  }

  // Test 1: Check if we can reach Supabase Auth endpoint
  try {
    const authHealthResponse = await fetch(`${supabaseUrl}/auth/v1/health`, {
      headers: {
        'apikey': supabaseAnonKey,
      },
    })
    results.authHealthStatus = authHealthResponse.status
    results.authHealthOk = authHealthResponse.ok

    if (authHealthResponse.ok) {
      const healthData = await authHealthResponse.json()
      results.authHealth = healthData
    } else {
      const errorText = await authHealthResponse.text()
      results.authHealthError = errorText.substring(0, 200)
    }
  } catch (error) {
    results.authHealthError = (error as Error).message
  }

  // Test 2: Try a test signup (will fail with existing email but shows if auth works)
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Use a random test email that won't exist
    const testEmail = `test-${Date.now()}@test-signup-debug.local`

    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: 'TestPassword123!',
      options: {
        emailRedirectTo: 'https://marketing.heymag.app/auth/callback',
      },
    })

    if (error) {
      results.signupTest = {
        success: false,
        errorMessage: error.message,
        errorStatus: error.status,
        // Some errors are expected (rate limit, email not allowed, etc.)
        // But "fetch failed" would indicate a network issue
      }
    } else {
      results.signupTest = {
        success: true,
        userId: data.user?.id,
        // Note: User won't be confirmed since email is fake
      }
    }
  } catch (error) {
    results.signupTest = {
      success: false,
      exception: (error as Error).message,
    }
  }

  // Test 3: Check CORS headers
  try {
    const corsResponse = await fetch(`${supabaseUrl}/auth/v1/settings`, {
      method: 'OPTIONS',
      headers: {
        'apikey': supabaseAnonKey,
        'Origin': 'https://marketing.heymag.app',
        'Access-Control-Request-Method': 'POST',
      },
    })
    results.corsTest = {
      status: corsResponse.status,
      allowOrigin: corsResponse.headers.get('access-control-allow-origin'),
      allowMethods: corsResponse.headers.get('access-control-allow-methods'),
    }
  } catch (error) {
    results.corsTest = {
      error: (error as Error).message,
    }
  }

  return NextResponse.json(results)
}
