import { NextResponse } from "next/server"
import { randomBytes, createHash } from "crypto"
import { prisma } from "@/lib/prisma"
import { enforceRateLimit } from "@/lib/rateLimit"
import { sendPasswordResetEmail } from "@/lib/mail"

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
    key: `forgot-password:ip:${getClientIp(req)}`,
    limit: 5,
    windowSeconds: 3600,
    label: "Password reset requests",
  })
  if (limitError) return limitError

  let email: string
  try {
    const body = await req.json()
    email = String(body?.email || "").trim().toLowerCase()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "A valid email is required" }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { email } })

  // Always respond 200 regardless of whether the user exists to avoid
  // leaking which emails are registered.
  if (!user || !user.passwordHash) {
    return NextResponse.json({ ok: true })
  }

  const rawToken = randomBytes(32).toString("base64url")

  await prisma.$transaction([
    // Invalidate any prior outstanding reset tokens for this user.
    prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    }),
    prisma.passwordResetToken.create({
      data: {
        tokenHash: hashToken(rawToken),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        userId: user.id,
      },
    }),
  ])

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  const resetUrl = `${baseUrl}/auth/reset-password?token=${rawToken}`

  try {
    await sendPasswordResetEmail({
      to: user.email,
      name: user.name || "",
      resetUrl,
    })
  } catch (err) {
    console.error("Failed to send password reset email:", err)
    return NextResponse.json(
      { error: "Failed to send reset email. Please try again." },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true })
}
