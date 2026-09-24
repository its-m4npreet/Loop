import { NextResponse } from "next/server"
import { requireWorkspacePermission } from "@/lib/workspaceAuth"
import { prisma } from "@/lib/prisma"

type RouteContext = { params: Promise<{ id: string }> }

export async function DELETE(_req: Request, context: RouteContext) {
  const auth = await requireWorkspacePermission("settings:manage")
  if ("error" in auth) return auth.error

  const { id } = await context.params

  const apiKey = await prisma.apiKey.findFirst({
    where: { id, workspaceId: auth.user.workspaceId },
    select: { id: true, revokedAt: true },
  })

  if (!apiKey) {
    return NextResponse.json({ error: "API key not found" }, { status: 404 })
  }

  if (!apiKey.revokedAt) {
    await prisma.apiKey.update({
      where: { id },
      data: { revokedAt: new Date() },
    })
  }

  return NextResponse.json({ ok: true })
}