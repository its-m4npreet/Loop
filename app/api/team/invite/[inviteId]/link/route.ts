import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(
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
    },
    select: { token: true },
  })

  if (!invitation) {
    return NextResponse.json({ error: "Invitation not found" }, { status: 404 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  const url = `${baseUrl}/auth/invite?token=${invitation.token}`

  return NextResponse.json({ url })
}
