import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ inviteId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, workspaceId: true },
  })

  if (!currentUser || currentUser.role !== "ADMIN" || !currentUser.workspaceId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { inviteId } = await params

  const invitation = await prisma.invitation.findFirst({
    where: {
      id: inviteId,
      workspaceId: currentUser.workspaceId,
      acceptedAt: null,
    },
  })

  if (!invitation) {
    return NextResponse.json({ error: "Invitation not found" }, { status: 404 })
  }

  await prisma.invitation.delete({
    where: { id: invitation.id },
  })

  return NextResponse.json({ ok: true })
}
