/**
 * Safe Logging Utility
 *
 * Redacts sensitive information from logs to prevent PII/credential exposure.
 * Use this instead of console.log in production code.
 */

// Patterns that indicate sensitive data
const SENSITIVE_KEY_PATTERNS = [
  /password/i,
  /secret/i,
  /token/i,
  /api[_-]?key/i,
  /authorization/i,
  /credential/i,
  /private/i,
  /access[_-]?key/i,
  /stripe/i,
  /supabase/i,
  /anthropic/i,
  /google/i,
  /email/i,
  /phone/i,
  /ssn/i,
  /credit[_-]?card/i,
]

// Values that look like secrets
const SENSITIVE_VALUE_PATTERNS = [
  /^sk_[a-zA-Z0-9]+/, // Stripe secret keys
  /^pk_[a-zA-Z0-9]+/, // Stripe publishable keys
  /^whsec_[a-zA-Z0-9]+/, // Stripe webhook secrets
  /^[a-zA-Z0-9]{32,}$/, // Long alphanumeric strings (likely tokens)
  /^eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+/, // JWTs
]

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  [key: string]: unknown
}

/**
 * Check if a key name suggests sensitive data
 */
function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEY_PATTERNS.some(pattern => pattern.test(key))
}

/**
 * Check if a value looks like a secret
 */
function isSensitiveValue(value: unknown): boolean {
  if (typeof value !== 'string') return false
  return SENSITIVE_VALUE_PATTERNS.some(pattern => pattern.test(value))
}

/**
 * Redact sensitive data from an object
 */
function redactSensitive(data: unknown, depth = 0): unknown {
  // Prevent infinite recursion
  if (depth > 10) return '[MAX_DEPTH]'

  if (data === null || data === undefined) return data

  if (typeof data === 'string') {
    if (isSensitiveValue(data)) {
      return '[REDACTED]'
    }
    // Truncate very long strings
    if (data.length > 500) {
      return data.substring(0, 100) + '...[TRUNCATED]'
    }
    return data
  }

  if (typeof data === 'number' || typeof data === 'boolean') {
    return data
  }

  if (Array.isArray(data)) {
    // Limit array length in logs
    const limited = data.slice(0, 10)
    const result = limited.map(item => redactSensitive(item, depth + 1))
    if (data.length > 10) {
      result.push(`...[${data.length - 10} more items]`)
    }
    return result
  }

  if (typeof data === 'object') {
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      if (isSensitiveKey(key)) {
        result[key] = '[REDACTED]'
      } else {
        result[key] = redactSensitive(value, depth + 1)
      }
    }
    return result
  }

  return '[UNKNOWN_TYPE]'
}

/**
 * Format log message with timestamp and level
 */
function formatMessage(level: LogLevel, prefix: string, message: string): string {
  const timestamp = new Date().toISOString()
  return `[${timestamp}] [${level.toUpperCase()}] [${prefix}] ${message}`
}

/**
 * Create a logger with a specific prefix
 */
export function createLogger(prefix: string) {
  const isProduction = process.env.NODE_ENV === 'production'

  return {
    debug(message: string, context?: LogContext) {
      // Skip debug logs in production
      if (isProduction) return

      const safeContext = context ? redactSensitive(context) : undefined
      console.log(formatMessage('debug', prefix, message), safeContext || '')
    },

    info(message: string, context?: LogContext) {
      const safeContext = context ? redactSensitive(context) : undefined
      console.log(formatMessage('info', prefix, message), safeContext || '')
    },

    warn(message: string, context?: LogContext) {
      const safeContext = context ? redactSensitive(context) : undefined
      console.warn(formatMessage('warn', prefix, message), safeContext || '')
    },

    error(message: string, error?: Error | unknown, context?: LogContext) {
      const safeContext = context ? redactSensitive(context) : undefined

      // In production, don't log stack traces
      if (isProduction && error instanceof Error) {
        console.error(
          formatMessage('error', prefix, message),
          { errorMessage: error.message, errorName: error.name },
          safeContext || ''
        )
      } else {
        console.error(formatMessage('error', prefix, message), error, safeContext || '')
      }
    },

    /**
     * Log API request (sanitized)
     */
    apiRequest(method: string, path: string, context?: LogContext) {
      this.info(`${method} ${path}`, context)
    },

    /**
     * Log API response (sanitized)
     */
    apiResponse(method: string, path: string, status: number, durationMs?: number) {
      this.info(`${method} ${path} -> ${status}${durationMs ? ` (${durationMs}ms)` : ''}`)
    },
  }
}

// Pre-configured loggers for common use cases
export const aiLogger = createLogger('AI')
export const authLogger = createLogger('Auth')
export const billingLogger = createLogger('Billing')
export const uploadLogger = createLogger('Upload')
export const socialLogger = createLogger('Social')
export const apiLogger = createLogger('API')

/**
 * Simple safe log function for quick use
 */
export function safeLog(message: string, data?: unknown) {
  const logger = createLogger('App')
  logger.info(message, data as LogContext)
}

/**
 * Safe error log function
 */
export function safeError(message: string, error?: Error | unknown, context?: LogContext) {
  const logger = createLogger('App')
  logger.error(message, error, context)
}
