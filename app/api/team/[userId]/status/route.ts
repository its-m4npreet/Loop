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
    return NextResponse.json({ error: "Only admins can change user status" }, { status: 403 })
  }

  const { userId } = await params
  const body = await req.json()
  const { isActive } = body as { isActive?: boolean }

  if (typeof isActive !== "boolean") {
    return NextResponse.json({ error: "isActive must be a boolean" }, { status: 400 })
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { workspaceId: true },
  })

  if (!targetUser || targetUser.workspaceId !== currentUser.workspaceId) {
    return NextResponse.json({ error: "User not found in your workspace" }, { status: 404 })
  }

  if (userId === session.user.id) {
    return NextResponse.json({ error: "Cannot deactivate yourself" }, { status: 400 })
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { isActive },
    select: { id: true, isActive: true },
  })

  return NextResponse.json({ member: updated })
}
