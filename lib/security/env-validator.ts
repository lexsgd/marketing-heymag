/**
 * Environment Variable Validator
 *
 * Validates that required environment variables are present.
 * Use this instead of non-null assertions (!) on process.env.
 */

import { createLogger } from './safe-logger'

const logger = createLogger('Env')

/**
 * Check if we're in a build context (Vercel/Next.js build)
 * During build, we shouldn't throw for missing env vars as they may only be available at runtime
 */
function isBuildTime(): boolean {
  // During Next.js build, certain env vars may not be available
  // We check for NEXT_PHASE which is set during build
  return process.env.NEXT_PHASE === 'phase-production-build'
}

/**
 * Get a required environment variable or throw an error
 * During build time, returns empty string to avoid build failures
 */
export function requireEnv(name: string): string {
  const value = process.env[name]

  if (!value) {
    // During build, don't throw - the env vars may only be available at runtime
    if (isBuildTime()) {
      return ''
    }
    const error = `Missing required environment variable: ${name}`
    logger.error(error)
    throw new Error(error)
  }

  return value
}

/**
 * Get an optional environment variable with a default value
 */
export function getEnv(name: string, defaultValue: string): string {
  return process.env[name] || defaultValue
}

/**
 * Get an optional environment variable (may be undefined)
 */
export function optionalEnv(name: string): string | undefined {
  return process.env[name]
}

/**
 * Validate multiple required environment variables
 * Returns an object with the values or throws if any are missing
 */
export function requireEnvs<T extends readonly string[]>(
  names: T
): { [K in T[number]]: string } {
  const missing: string[] = []
  const values: Record<string, string> = {}

  for (const name of names) {
    const value = process.env[name]
    if (!value) {
      missing.push(name)
    } else {
      values[name] = value
    }
  }

  if (missing.length > 0) {
    const error = `Missing required environment variables: ${missing.join(', ')}`
    logger.error(error)
    throw new Error(error)
  }

  return values as { [K in T[number]]: string }
}

/**
 * Check if an environment variable is set (for feature flags)
 */
export function hasEnv(name: string): boolean {
  return !!process.env[name]
}

/**
 * Get environment variable as boolean
 */
export function getBoolEnv(name: string, defaultValue = false): boolean {
  const value = process.env[name]
  if (!value) return defaultValue
  return value.toLowerCase() === 'true' || value === '1'
}

/**
 * Get environment variable as number
 */
export function getNumEnv(name: string, defaultValue: number): number {
  const value = process.env[name]
  if (!value) return defaultValue
  const parsed = parseInt(value, 10)
  return isNaN(parsed) ? defaultValue : parsed
}

// Pre-validated environment configurations for common services
export const supabaseConfig = {
  get url() {
    return requireEnv('NEXT_PUBLIC_SUPABASE_URL')
  },
  get anonKey() {
    return requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  },
  get serviceRoleKey() {
    return requireEnv('SUPABASE_SERVICE_ROLE_KEY')
  },
}

export const stripeConfig = {
  get secretKey() {
    return requireEnv('STRIPE_SECRET_KEY')
  },
  get webhookSecret() {
    return requireEnv('STRIPE_WEBHOOK_SECRET')
  },
  get publishableKey() {
    return optionalEnv('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY')
  },
}

export const aiConfig = {
  get googleApiKey() {
    return requireEnv('GOOGLE_AI_API_KEY')
  },
  get anthropicApiKey() {
    return requireEnv('ANTHROPIC_API_KEY')
  },
  get replicateApiToken() {
    return optionalEnv('REPLICATE_API_TOKEN')
  },
}

export const facebookConfig = {
  get appId() {
    return requireEnv('FACEBOOK_APP_ID')
  },
  get appSecret() {
    return requireEnv('FACEBOOK_APP_SECRET')
  },
}

/**
 * Validate all critical environment variables at startup
 * Call this in middleware or server startup
 */
export function validateCriticalEnvs(): { valid: boolean; missing: string[] } {
  const criticalVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ]

  const missing = criticalVars.filter(name => !process.env[name])

  if (missing.length > 0) {
    logger.warn('Missing critical environment variables', { missing })
  }

  return { valid: missing.length === 0, missing }
}
