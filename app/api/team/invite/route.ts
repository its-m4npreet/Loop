import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { hash } from "bcryptjs"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, workspaceId: true },
  })

  if (!currentUser || currentUser.role !== "ADMIN") {
    return NextResponse.json({ error: "Only admins can invite members" }, { status: 403 })
  }

  if (!currentUser.workspaceId) {
    return NextResponse.json({ error: "No workspace" }, { status: 400 })
  }

  const body = await req.json()
  const { email, name, role } = body as { email?: string; name?: string; role?: string }

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email is required" }, { status: 400 })
  }

  const trimmedEmail = email.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({
    where: { email: trimmedEmail },
  })
  if (existing) {
    return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 })
  }

  const tempPassword = await hash("ChangeMe123!", 12)
  const userRole = role === "ADMIN" ? "ADMIN" : "USER"

  const newUser = await prisma.user.create({
    data: {
      email: trimmedEmail,
      name: name?.trim() || trimmedEmail.split("@")[0],
      passwordHash: tempPassword,
      role: userRole,
      workspaceId: currentUser.workspaceId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  })

  return NextResponse.json({ member: newUser })
}
