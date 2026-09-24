import { NextResponse } from "next/server"
import { createHash } from "crypto"
import { hash } from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { enforceRateLimit } from "@/lib/rateLimit"

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex")
}

function getClientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for")
  if (fwd) return fwd.split(",")[0].trim()
  return req.headers.get("x-real-ip") || "unknown"
}

export async function POST(req: Request) {
  const limitError = await enforceRateLimit({
    key: `reset-password:ip:${getClientIp(req)}`,
    limit: 10,
    windowSeconds: 3600,
    label: "Password reset attempts",
  })
  if (limitError) return limitError

  const { token, password } = (await req.json().catch(() => ({}))) as {
    token?: string
    password?: string
  }

  if (!token || !password) {
    return NextResponse.json({ error: "Token and password are required" }, { status: 400 })
  }

  if (typeof password !== "string" || password.length < 8 || password.length > 128) {
    return NextResponse.json(
      { error: "Password must be between 8 and 128 characters" },
      { status: 400 }
    )
  }

  const tokenHash = hashToken(token)

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  })

  if (!resetToken) {
    return NextResponse.json({ error: "Invalid or expired reset link" }, { status: 400 })
  }

  if (resetToken.usedAt) {
    return NextResponse.json({ error: "This reset link has already been used" }, { status: 400 })
  }

  if (new Date() > resetToken.expiresAt) {
    return NextResponse.json({ error: "This reset link has expired" }, { status: 400 })
  }

  if (!resetToken.user.isActive) {
    return NextResponse.json({ error: "This account is no longer active" }, { status: 403 })
  }

  const passwordHash = await hash(password, 12)

  await prisma.$transaction([
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    }),
  ])

  return NextResponse.json({ ok: true })
}
