/**
 * Shared retry wrapper for Gemini API calls.
 * Handles 429 (rate limit) and 5xx (server) errors with exponential backoff.
 */

interface RetryOptions {
  maxRetries?: number
  baseDelayMs?: number
  maxDelayMs?: number
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  baseDelayMs: 5_000,
  maxDelayMs: 30_000,
}

function isRetryable(error: unknown): boolean {
  if (!error || typeof error !== "object") return false
  const status = (error as { status?: number }).status
  return status === 429 || (status !== undefined && status >= 500)
}

function getRetryDelay(error: unknown, attempt: number, opts: Required<RetryOptions>): number {
  // Try to extract retryDelay from Gemini error details
  const errorDetails = (error as { errorDetails?: Array<{ retryDelay?: string }> }).errorDetails
  if (errorDetails) {
    for (const detail of errorDetails) {
      if (detail.retryDelay) {
        const match = detail.retryDelay.match(/(\d+)s/)
        if (match) return Math.min(parseInt(match[1], 10) * 1000, opts.maxDelayMs)
      }
    }
  }

  // Exponential backoff: baseDelay * 2^attempt, capped
  return Math.min(opts.baseDelayMs * Math.pow(2, attempt), opts.maxDelayMs)
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Wraps a Gemini generateContent (non-streaming) call with retry.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: RetryOptions
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  let lastError: unknown

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      if (attempt === opts.maxRetries || !isRetryable(error)) {
        throw error
      }
      const delay = getRetryDelay(error, attempt, opts)
      console.warn(
        `[Gemini] Retryable error (attempt ${attempt + 1}/${opts.maxRetries}), waiting ${Math.round(delay / 1000)}s...`
      )
      await sleep(delay)
    }
  }

  throw lastError
}

/**
 * Wraps a Gemini generateContentStream call with retry.
 * The retry wraps the initial stream creation; iteration errors are not retried.
 */
export async function withStreamRetry<T>(
  fn: () => Promise<T>,
  options?: RetryOptions
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  let lastError: unknown

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      if (attempt === opts.maxRetries || !isRetryable(error)) {
        throw error
      }
      const delay = getRetryDelay(error, attempt, opts)
      console.warn(
        `[Gemini Stream] Retryable error (attempt ${attempt + 1}/${opts.maxRetries}), waiting ${Math.round(delay / 1000)}s...`
      )
      await sleep(delay)
    }
  }

  throw lastError
}
