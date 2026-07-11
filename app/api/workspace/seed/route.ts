import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST() {
  const existing = await prisma.user.findFirst({
    where: { workspaceId: { not: null } },
    select: { workspaceId: true, workspace: { select: { id: true, name: true } } },
  })

  if (existing?.workspace) {
    await prisma.user.updateMany({
      where: { workspaceId: null },
      data: { workspaceId: existing.workspaceId },
    })
    return NextResponse.json({
      workspaceId: existing.workspace.id,
      workspaceName: existing.workspace.name,
    })
  }

  return NextResponse.json({ error: "No workspace found. Create one via SQL first." }, { status: 400 })
}
