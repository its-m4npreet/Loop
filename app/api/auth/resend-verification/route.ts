import { NextResponse } from "next/server"
import { randomBytes, createHash } from "crypto"
import { prisma } from "@/lib/prisma"
import { enforceRateLimit } from "@/lib/rateLimit"
import { sendVerificationEmail } from "@/lib/mail"

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
    key: `resend-verification:ip:${getClientIp(req)}`,
    limit: 3,
    windowSeconds: 3600,
    label: "Verification resend requests",
  })
  if (limitError) return limitError

  const { email } = (await req.json().catch(() => ({}))) as { email?: string }

  if (!email || typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json({ error: "A valid email is required" }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } })

  if (!user || user.emailVerified) {
    return NextResponse.json({ ok: true })
  }

  // Replace any outstanding tokens for this identifier.
  await prisma.verificationToken.deleteMany({ where: { identifier: user.email } })

  const rawToken = randomBytes(32).toString("base64url")

  await prisma.verificationToken.create({
    data: {
      identifier: user.email,
      token: hashToken(rawToken),
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  })

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  const verifyUrl = `${baseUrl}/auth/verify-email?token=${rawToken}`

  try {
    await sendVerificationEmail({
      to: user.email,
      name: user.name || "",
      verifyUrl,
    })
  } catch (err) {
    console.error("Failed to resend verification email:", err)
    return NextResponse.json(
      { error: "Failed to send verification email. Please try again." },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true })
}
