/**
 * Per-user / per-workspace rate limiting for expensive endpoints (AI calls).
 *
 * Uses Upstash Ratelimit + Redis when `UPSTASH_REDIS_REST_URL` and
 * `UPSTASH_REDIS_REST_TOKEN` are configured (correct for multi-instance and
 * serverless deployments). Falls back to a per-instance in-memory sliding
 * window limiter otherwise — suitable for local dev and single-instance
 * hosts, but NOT a shared limit across many serverless instances.
 */

import { NextResponse } from "next/server"
import { logger } from "@/lib/logger"

export interface RateLimitConfig {
  /** Machine-friendly namespace, e.g. "ask-loop:user:<id>". */
  key: string
  /** Max requests allowed within the window. */
  limit: number
  /** Window length in seconds. */
  windowSeconds: number
  /** Human-readable label for error messages/logs. */
  label: string
}

interface RateLimitResult {
  success: boolean
  remaining: number
  resetSeconds: number
}

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL?.trim()
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
const useUpstash = Boolean(UPSTASH_URL && UPSTASH_TOKEN)

async function limitWithUpstash(
  cfg: RateLimitConfig
): Promise<RateLimitResult> {
  const [{ Ratelimit }, { Redis }] = await Promise.all([
    import("@upstash/ratelimit"),
    import("@upstash/redis"),
  ])

  const redis = new Redis({ url: UPSTASH_URL, token: UPSTASH_TOKEN })
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(cfg.limit, `${cfg.windowSeconds} s`),
    prefix: "loop-rate",
  })

  try {
    const result = await limiter.limit(cfg.key)
    return {
      success: result.success,
      remaining: result.remaining,
      resetSeconds: Math.max(0, Math.round((result.reset - Date.now()) / 1000)),
    }
  } catch (err) {
    // Fail open: a Redis outage must not take down the whole endpoint.
    logger.warn("Rate limiter unavailable, allowing request", {
      key: cfg.key,
      error: err instanceof Error ? err.message : String(err),
    })
    return { success: true, remaining: cfg.limit, resetSeconds: cfg.windowSeconds }
  }
}

// ── In-memory fallback (per process instance) ──

interface WindowState {
  count: number
  resetAt: number
}

const memoryWindows = new Map<string, WindowState>()
let lastSweep = 0

function sweepMemoryWindows(now: number) {
  if (now - lastSweep < 60_000) return
  lastSweep = now
  for (const [key, state] of memoryWindows) {
    if (state.resetAt <= now) memoryWindows.delete(key)
  }
}

function limitInMemory(cfg: RateLimitConfig): RateLimitResult {
  const now = Date.now()
  const windowMs = cfg.windowSeconds * 1000

  sweepMemoryWindows(now)

  let state = memoryWindows.get(cfg.key)
  if (!state || state.resetAt <= now) {
    state = { count: 0, resetAt: now + windowMs }
    memoryWindows.set(cfg.key, state)
  }

  state.count += 1

  if (state.count > cfg.limit) {
    return {
      success: false,
      remaining: 0,
      resetSeconds: Math.max(0, Math.ceil((state.resetAt - now) / 1000)),
    }
  }

  return {
    success: true,
    remaining: Math.max(0, cfg.limit - state.count),
    resetSeconds: Math.max(0, Math.ceil((state.resetAt - now) / 1000)),
  }
}

export async function checkRateLimit(
  cfg: RateLimitConfig
): Promise<RateLimitResult> {
  if (useUpstash) return limitWithUpstash(cfg)
  return limitInMemory(cfg)
}

/**
 * Route-handler helper: returns an error NextResponse when the caller is over
 * the limit, or `null` to allow the request through.
 */
export async function enforceRateLimit(
  cfg: RateLimitConfig
): Promise<NextResponse | null> {
  const result = await checkRateLimit(cfg)
  if (result.success) return null

  logger.warn("Rate limit exceeded", {
    key: cfg.key,
    label: cfg.label,
    limit: cfg.limit,
    windowSeconds: cfg.windowSeconds,
  })

  return NextResponse.json(
    {
      error: `Rate limit exceeded. ${cfg.label} is limited to ${cfg.limit} requests per ${cfg.windowSeconds} second${cfg.windowSeconds === 1 ? "" : "s"}. Try again later.`,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(result.resetSeconds),
        "X-RateLimit-Limit": String(cfg.limit),
        "X-RateLimit-Remaining": String(result.remaining),
      },
    }
  )
}
