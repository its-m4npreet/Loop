import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, workspaceId: true },
  })

  if (!currentUser || currentUser.role !== "ADMIN") {
    return NextResponse.json({ error: "Only admins can change roles" }, { status: 403 })
  }

  const { userId } = await params
  const body = await req.json()
  const { role } = body as { role?: string }

  if (role !== "ADMIN" && role !== "ANALYST" && role !== "VIEWER") {
    return NextResponse.json({ error: "Role must be ADMIN, ANALYST, or VIEWER" }, { status: 400 })
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { workspaceId: true },
  })

  if (!targetUser || targetUser.workspaceId !== currentUser.workspaceId) {
    return NextResponse.json({ error: "User not found in your workspace" }, { status: 404 })
  }

  if (userId === session.user.id) {
    return NextResponse.json({ error: "Cannot change your own role" }, { status: 400 })
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { role },
    select: { id: true, role: true },
  })

  return NextResponse.json({ member: updated })
}
