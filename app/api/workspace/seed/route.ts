import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

/**
 * DEV-ONLY bootstrap: attach the *current* user to their own missing workspace link.
 * Previously this route had no auth and assigned ALL users without a workspace
 * to the first workspace found — that would mix companies. That behavior is gone.
 */
export async function POST() {
  // Never expose bootstrap helpers in production
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      workspaceId: true,
      workspace: { select: { id: true, name: true } },
    },
  })

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  // Already has a workspace — never reassign
  if (user.workspaceId && user.workspace) {
    return NextResponse.json({
      workspaceId: user.workspace.id,
      workspaceName: user.workspace.name,
      alreadyLinked: true,
    })
  }

  return NextResponse.json(
    {
      error:
        "No workspace linked. Create one via the workspace page (/workspace).",
    },
    { status: 400 }
  )
}
