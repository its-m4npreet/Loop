import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { hash } from "bcryptjs"

export async function POST(req: Request) {
  const body = await req.json()
  const { token, name, password } = body as {
    token?: string
    name?: string
    password?: string
  }

  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "Invalid invitation link" }, { status: 400 })
  }

  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 })
  }

  if (!password || typeof password !== "string" || password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
  }

  const invitation = await prisma.invitation.findUnique({
    where: { token },
  })

  if (!invitation) {
    return NextResponse.json({ error: "Invalid invitation link" }, { status: 400 })
  }

  if (invitation.acceptedAt) {
    return NextResponse.json({ error: "This invitation has already been accepted" }, { status: 400 })
  }

  if (new Date() > invitation.expiresAt) {
    return NextResponse.json({ error: "This invitation has expired" }, { status: 400 })
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: invitation.email },
  })
  if (existingUser) {
    return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 })
  }

  const passwordHash = await hash(password, 12)

  const [, newUser] = await prisma.$transaction([
    prisma.user.create({
      data: {
        email: invitation.email,
        name: name.trim(),
        passwordHash,
        role: invitation.role,
        workspaceId: invitation.workspaceId,
      },
    }),
    prisma.invitation.update({
      where: { id: invitation.id },
      data: { acceptedAt: new Date() },
    }),
  ])

  return NextResponse.json({
    user: {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
    },
  })
}
