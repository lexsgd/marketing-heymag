/**
 * Rate Limiting Utility
 *
 * Uses in-memory rate limiting for simplicity.
 * Can be upgraded to Redis-based rate limiting later.
 */

// In-memory store for rate limiting
const inMemoryStore = new Map<string, { count: number; resetAt: number }>()

// Rate limit configurations for different endpoints
export const RATE_LIMITS = {
  // AI endpoints (expensive operations)
  'ai-enhance': { requests: 5, window: '1 m' as const },
  'ai-caption': { requests: 10, window: '1 m' as const },
  'ai-generate': { requests: 3, window: '1 m' as const },

  // Upload endpoints
  'image-upload': { requests: 10, window: '1 m' as const },

  // Auth endpoints (prevent brute force)
  'auth': { requests: 5, window: '1 m' as const },

  // Social posting
  'social-post': { requests: 10, window: '1 m' as const },

  // General API (default)
  'default': { requests: 30, window: '1 m' as const },
} as const

export type RateLimitKey = keyof typeof RATE_LIMITS

/**
 * In-memory rate limit implementation
 */
function inMemoryRateLimit(
  identifier: string,
  limitKey: RateLimitKey
): { success: boolean; remaining: number; reset: number } {
  const config = RATE_LIMITS[limitKey]
  const windowMs = 60000 // 1 minute

  const now = Date.now()
  const key = `${limitKey}:${identifier}`
  const entry = inMemoryStore.get(key)

  if (!entry || entry.resetAt < now) {
    // New window
    inMemoryStore.set(key, { count: 1, resetAt: now + windowMs })
    return { success: true, remaining: config.requests - 1, reset: now + windowMs }
  }

  if (entry.count >= config.requests) {
    // Rate limited
    return { success: false, remaining: 0, reset: entry.resetAt }
  }

  // Increment counter
  entry.count++
  return { success: true, remaining: config.requests - entry.count, reset: entry.resetAt }
}

/**
 * Check rate limit for an identifier (usually user ID or IP)
 */
export async function checkRateLimit(
  identifier: string,
  limitKey: RateLimitKey = 'default'
): Promise<{
  success: boolean
  limit: number
  remaining: number
  reset: number
}> {
  const config = RATE_LIMITS[limitKey]
  const result = inMemoryRateLimit(identifier, limitKey)

  return {
    success: result.success,
    limit: config.requests,
    remaining: result.remaining,
    reset: result.reset,
  }
}

/**
 * Get rate limit headers for response
 */
export function getRateLimitHeaders(result: {
  limit: number
  remaining: number
  reset: number
}): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toString(),
  }
}

/**
 * Create rate limited response
 */
export function rateLimitedResponse(result: {
  limit: number
  remaining: number
  reset: number
}): Response {
  const retryAfter = Math.ceil((result.reset - Date.now()) / 1000)

  return new Response(
    JSON.stringify({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': retryAfter.toString(),
        ...getRateLimitHeaders(result),
      },
    }
  )
}
