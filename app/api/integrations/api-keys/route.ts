import { NextResponse } from "next/server"
import { requireWorkspacePermission } from "@/lib/workspaceAuth"
import { prisma } from "@/lib/prisma"
import { generateApiKey, encryptApiKey } from "@/lib/apiKeys"
import { CreateApiKeySchema, parseBody } from "@/lib/validations"

export async function GET() {
  const auth = await requireWorkspacePermission("settings:manage")
  if ("error" in auth) return auth.error

  const keys = await prisma.apiKey.findMany({
    where: { workspaceId: auth.user.workspaceId },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      lastUsedAt: true,
      revokedAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({
    keys: keys.map((k) => ({
      ...k,
      createdAt: k.createdAt.toISOString(),
      lastUsedAt: k.lastUsedAt?.toISOString() ?? null,
      revokedAt: k.revokedAt?.toISOString() ?? null,
    })),
  })
}

export async function POST(req: Request) {
  const auth = await requireWorkspacePermission("settings:manage")
  if ("error" in auth) return auth.error

  const result = await parseBody(req, CreateApiKeySchema)
  if ("error" in result) return result.error

  const generated = generateApiKey()

  const apiKey = await prisma.apiKey.create({
    data: {
      name: result.data.name,
      keyHash: generated.hash,
      keyPrefix: generated.prefix,
      keyCiphertext: encryptApiKey(generated.raw),
      workspaceId: auth.user.workspaceId,
    },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      createdAt: true,
    },
  })

  return NextResponse.json(
    {
      key: {
        ...apiKey,
        createdAt: apiKey.createdAt.toISOString(),
      },
      rawKey: generated.raw,
      message: "Key created. Copy it now, or grab it from the list below.",
    },
    { status: 201 }
  )
}