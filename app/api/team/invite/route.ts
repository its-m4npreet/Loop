import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import crypto from "crypto"
import { sendInviteEmail } from "@/lib/mail"
import { Role } from "@/lib/permissions"
import { InviteMemberSchema, parseBody } from "@/lib/validations"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, workspaceId: true, name: true },
  })

  if (!currentUser || currentUser.role !== "ADMIN") {
    return NextResponse.json({ error: "Only admins can invite members" }, { status: 403 })
  }

  if (!currentUser.workspaceId) {
    return NextResponse.json({ error: "No workspace" }, { status: 400 })
  }

  const result = await parseBody(req, InviteMemberSchema)
  if ("error" in result) return result.error

  const { email: trimmedEmail, name, role } = result.data

  const existingUser = await prisma.user.findUnique({
    where: { email: trimmedEmail },
  })
  if (existingUser) {
    return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 })
  }

  const existingInvite = await prisma.invitation.findFirst({
    where: {
      email: trimmedEmail,
      workspaceId: currentUser.workspaceId,
      acceptedAt: null,
      expiresAt: { gt: new Date() },
    },
  })
  if (existingInvite) {
    return NextResponse.json({ error: "An active invitation already exists for this email" }, { status: 409 })
  }

  const assignedRole: Role = role as Role

  const token = crypto.randomBytes(32).toString("hex")
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  const invitation = await prisma.invitation.create({
    data: {
      email: trimmedEmail,
      name,
      role: assignedRole,
      token,
      workspaceId: currentUser.workspaceId,
      invitedById: session.user.id,
      expiresAt,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      expiresAt: true,
      createdAt: true,
    },
  })

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  const inviteUrl = `${baseUrl}/auth/invite?token=${token}`

  try {
    await sendInviteEmail({
      to: trimmedEmail,
      name: name || trimmedEmail.split("@")[0],
      role: assignedRole,
      inviteUrl,
      invitedByName: currentUser.name || "Someone",
    })
  } catch (err) {
    console.error("Failed to send invitation email:", err)
  }

  return NextResponse.json({ invitation })
}
