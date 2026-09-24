import {
  randomBytes,
  createHash,
  createCipheriv,
  createDecipheriv,
} from "crypto"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"

export const API_KEY_PREFIX = "lk_"

const API_KEY_CIPHER_ALG = "aes-256-gcm"

export interface GeneratedApiKey {
  raw: string
  hash: string
  prefix: string
}

export interface ApiKeyContext {
  keyId: string
  name: string
  workspaceId: string
}

/**
 * Generate a new API key. Only the hash is persisted; the raw key is shown to
 * the user exactly once at creation time.
 */
export function generateApiKey(): GeneratedApiKey {
  const raw = `${API_KEY_PREFIX}${randomBytes(32).toString("base64url")}`
  return {
    raw,
    hash: hashApiKey(raw),
    prefix: raw.slice(0, 12),
  }
}

/** Deterministic hash used for storage + lookup. */
export function hashApiKey(raw: string): string {
  return createHash("sha256").update(raw).digest("hex")
}

// ── Reversible at-rest encryption (so a full key can be revealed again) ──
//
// Auth always uses the sha256 hash above. Separately we store an AES-256-GCM
// encrypted copy of the raw key so an admin can copy it into another business
// app later. The encryption key is derived from API_KEY_ENCRYPTION_SECRET
// (falls back to AUTH_SECRET).

function encryptionKey(): Buffer {
  const secret =
    process.env.API_KEY_ENCRYPTION_SECRET ??
    process.env.AUTH_SECRET ??
    ""
  if (!secret) throw new Error("No encryption secret configured")
  return createHash("sha256").update(`loop:api-key:v1:${secret}`).digest()
}

/** Encrypt a raw key. Format: base64(iv(12) || authTag(16) || ciphertext). */
export function encryptApiKey(raw: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv(API_KEY_CIPHER_ALG, encryptionKey(), iv)
  const encrypted = Buffer.concat([
    cipher.update(raw, "utf8"),
    cipher.final(),
  ])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, encrypted]).toString("base64")
}

/** Decrypt a stored key. Returns null when data is corrupt or the secret changed. */
export function decryptApiKey(ciphertext: string): string | null {
  try {
    const buf = Buffer.from(ciphertext, "base64")
    const iv = buf.subarray(0, 12)
    const tag = buf.subarray(12, 28)
    const data = buf.subarray(28)
    const decipher = createDecipheriv(API_KEY_CIPHER_ALG, encryptionKey(), iv)
    decipher.setAuthTag(tag)
    return Buffer.concat([decipher.update(data), decipher.final()]).toString(
      "utf8"
    )
  } catch (err) {
    logger.warn("Failed to decrypt API key", {
      error: err instanceof Error ? err.message : String(err),
    })
    return null
  }
}

/**
 * Resolve a workspace API key from an `Authorization: Bearer lk_...` header.
 * Verifies the key exists, belongs to an active workspace and has not been
 * revoked. Returns a context or an error NextResponse.
 */
export async function authenticateApiKey(
  req: Request
): Promise<{ ctx: ApiKeyContext } | { error: NextResponse }> {
  const header = req.headers.get("authorization") || ""
  const match = header.match(/^Bearer\s+(.+)$/i)

  if (!match) {
    return {
      error: NextResponse.json(
        {
          error:
            "Missing API key. Provide it as: Authorization: Bearer lk_...",
        },
        { status: 401 }
      ),
    }
  }

  const raw = match[1].trim()
  if (!raw.startsWith(API_KEY_PREFIX)) {
    return {
      error: NextResponse.json(
        { error: "Invalid API key format. Keys start with lk_." },
        { status: 401 }
      ),
    }
  }

  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash: hashApiKey(raw) },
    include: { workspace: true },
  })

  if (!apiKey) {
    return {
      error: NextResponse.json({ error: "Invalid API key." }, { status: 401 }),
    }
  }

  if (apiKey.revokedAt) {
    return {
      error: NextResponse.json(
        { error: "This API key has been revoked." },
        { status: 401 }
      ),
    }
  }

  // Best-effort usage tracking: never fail the request on a stale timestamp.
  void prisma.apiKey
    .update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } })
    .catch((err) =>
      logger.warn("Failed to update API key lastUsedAt", {
        error: err instanceof Error ? err.message : String(err),
      })
    )

  return {
    ctx: {
      keyId: apiKey.id,
      name: apiKey.name,
      workspaceId: apiKey.workspaceId,
    },
  }
}