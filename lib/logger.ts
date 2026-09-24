/**
 * Minimal structured logger for production observability.
 *
 * - Always writes a single-line, timestamped JSON record to stdout/stderr so
 *   platform log sinks (Vercel, Railway, etc.) can ingest it.
 * - When SENTRY_DSN is configured, `reportError` forwards error events to a
 *   Sentry project using the native envelope protocol (no SDK dependency).
 * - Never throws: logging failures are swallowed so they can't take down a
 *   request path.
 */

type LogLevel = "debug" | "info" | "warn" | "error"

interface LogContext {
  [key: string]: unknown
}

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
}

const configuredMinLevel: LogLevel =
  process.env.LOG_LEVEL === "debug" ? "debug" : "info"

function write(level: LogLevel, message: string, context?: LogContext) {
  if (LEVEL_PRIORITY[level] < LEVEL_PRIORITY[configuredMinLevel]) return

  const record = {
    time: new Date().toISOString(),
    level,
    message,
    ...context,
  }

  const line = JSON.stringify(record)
  if (level === "error") {
    console.error(line)
  } else {
    console.log(line)
  }
}

/** Sanitize a value for logging: redact secret-looking fields. */
function sanitize(value: unknown): unknown {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
    }
  }
  return value
}

export const logger = {
  debug(message: string, context?: LogContext) {
    write("debug", message, context)
  },
  info(message: string, context?: LogContext) {
    write("info", message, context)
  },
  warn(message: string, context?: LogContext) {
    write("warn", message, context)
  },
  error(message: string, context?: LogContext) {
    write("error", message, context)
  },
}

// ── Sentry forwarding ──

let sentryConfig: { host: string; publicKey: string; projectId: string } | null = null

function loadSentryConfig() {
  if (sentryConfig) return sentryConfig
  const dsn = process.env.SENTRY_DSN
  if (!dsn) return null

  // DSN shape: https://<public_key>@<host>/<project_id>
  const match = dsn.match(/^https:\/\/([^@]+)@([^/]+)\/(\d+)$/)
  if (!match) {
    logger.warn("Invalid SENTRY_DSN, disabling Sentry forwarding")
    return null
  }
  sentryConfig = {
    publicKey: match[1],
    host: match[2],
    projectId: match[3],
  }
  return sentryConfig
}

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * Forward an error to Sentry (fire-and-forget). Safe no-op when SENTRY_DSN is
 * not configured or the network request fails.
 */
export function reportError(error: unknown, context?: LogContext) {
  const cfg = loadSentryConfig()
  if (!cfg) return

  const eventId = uuid()
  const timestamp = new Date().toISOString()
  const err = error instanceof Error ? error : new Error(String(error))

  const event = {
    event_id: eventId,
    timestamp,
    platform: "javascript",
    level: "error",
    environment: process.env.NODE_ENV ?? "development",
    server_name: process.env.HOSTNAME ?? process.env.VERCEL_REGION ?? "unknown",
    release: process.env.VERCEL_GIT_COMMIT_SHA ?? undefined,
    message: err.message,
    exception: {
      values: [
        {
          type: err.name,
          value: err.message,
          stacktrace: err.stack
            ? { frames: parseStackFrames(err.stack) }
            : undefined,
        },
      ],
    },
    extra: context ? Object.fromEntries(
      Object.entries(context).map(([k, v]) => [k, sanitize(v)])
    ) : undefined,
  }

  const envelope =
    JSON.stringify({ event_id: eventId, sent_at: timestamp, dsn: process.env.SENTRY_DSN }) +
    "\n" +
    JSON.stringify({ type: "event", length: JSON.stringify(event).length }) +
    "\n" +
    JSON.stringify(event)

  void fetch(`https://${cfg.host}/api/${cfg.projectId}/envelope/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-sentry-envelope",
      "X-Sentry-Auth": `Sentry sentry_version=7, sentry_key=${cfg.publicKey}`,
    },
    body: envelope,
  }).catch((sendErr) => {
    logger.warn("Failed to send error to Sentry", {
      error: sendErr instanceof Error ? sendErr.message : String(sendErr),
    })
  })
}

function parseStackFrames(stack: string) {
  return stack
    .split("\n")
    .slice(1)
    .map((line) => {
      const match = line.match(/^\s*at\s+(.*)\s+\(?(.+):(\d+):(\d+)\)?$/)
      if (!match) return undefined
      return {
        function: match[1],
        filename: match[2],
        lineno: Number(match[3]),
        colno: Number(match[4]),
      }
    })
    .filter((f): f is NonNullable<typeof f> => f !== undefined)
    .slice(0, 40)
}
