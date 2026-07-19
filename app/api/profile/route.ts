import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { ProfileUpdateSchema, parseBody } from "@/lib/validations"

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const result = await parseBody(req, ProfileUpdateSchema)
  if ("error" in result) return result.error

  const { name } = result.data

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: { name },
    select: { name: true },
  })

  return NextResponse.json({ success: true, name: updated.name })
}

export async function DELETE() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.id

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, workspaceId: true, role: true },
  })

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  // If user is the last admin in their workspace, delete the workspace
  if (user.workspaceId && user.role === "ADMIN") {
    const adminCount = await prisma.user.count({
      where: { workspaceId: user.workspaceId, role: "ADMIN" },
    })

    if (adminCount <= 1) {
      // Last admin leaving — delete the entire workspace and its data
      await prisma.workspace.delete({ where: { id: user.workspaceId } })
    } else {
      // Other admins exist — just remove this user from the workspace
      await prisma.user.update({
        where: { id: userId },
        data: { workspaceId: null },
      })
    }
  }

  // Delete the user (cascades to sessions, accounts, conversations, etc.)
  await prisma.user.delete({ where: { id: userId } })

  return NextResponse.json({ success: true })
}
