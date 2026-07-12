import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function generateWorkspaceId(companyName: string): string {
  const slug = slugify(companyName).slice(0, 20)
  const suffix = Math.random().toString(36).slice(2, 8)
  return `ws-${slug}-${suffix}`
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { workspaceId: true, role: true },
  })

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  if (user.workspaceId) {
    return NextResponse.json({ error: "Already part of a workspace" }, { status: 400 })
  }

  const { companyName } = await req.json()

  if (!companyName || typeof companyName !== "string" || companyName.trim().length < 2) {
    return NextResponse.json({ error: "Company name is required" }, { status: 400 })
  }

  const trimmed = companyName.trim()
  const workspaceName = `${trimmed} Workspace`

  let workspaceId = generateWorkspaceId(trimmed)
  let attempts = 0
  while (attempts < 5) {
    const exists = await prisma.workspace.findUnique({ where: { id: workspaceId } })
    if (!exists) break
    workspaceId = generateWorkspaceId(trimmed)
    attempts++
  }

  const workspace = await prisma.workspace.create({
    data: {
      id: workspaceId,
      name: workspaceName,
    },
  })

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      workspaceId: workspace.id,
      role: "ADMIN",
    },
  })

  return NextResponse.json({
    workspace: { id: workspace.id, name: workspace.name },
  })
}
