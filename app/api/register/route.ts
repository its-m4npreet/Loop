import { NextResponse } from "next/server"
import { randomBytes, createHash } from "crypto"
import { hash } from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { RegisterSchema, parseBody } from "@/lib/validations"
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
  try {
    const limitError = await enforceRateLimit({
      key: `register:ip:${getClientIp(req)}`,
      limit: 5,
      windowSeconds: 3600,
      label: "Account registrations",
    })
    if (limitError) return limitError

    const result = await parseBody(req, RegisterSchema)
    if ("error" in result) return result.error

    const { name, email, password } = result.data

    const existing = await prisma.user.findUnique({ where: { email } })

    if (existing) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 409 }
      )
    }

    const passwordHash = await hash(password, 12)

    const rawToken = randomBytes(32).toString("base64url")
    const tokenHash = hashToken(rawToken)

    let user: Awaited<ReturnType<typeof prisma.user.create>>
    try {
      user = await prisma.user.create({
        data: {
          name: name || null,
          email,
          passwordHash,
          emailVerified: null,
        },
      })
    } catch (err) {
      if (
        typeof err === "object" &&
        err !== null &&
        "code" in err &&
        (err as { code?: string }).code === "P2002"
      ) {
        return NextResponse.json(
          { error: "Email already in use" },
          { status: 409 }
        )
      }
      throw err
    }

    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: tokenHash,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    })

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const verifyUrl = `${baseUrl}/auth/verify-email?token=${rawToken}`

    try {
      await sendVerificationEmail({
        to: email,
        name: name || "",
        verifyUrl,
      })
    } catch (err) {
      console.error("Failed to send verification email:", err)
      // User is created but verification email failed. They can still
      // request a new one or contact support; don't roll back the account.
    }

    return NextResponse.json(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: false,
      },
      { status: 201 }
    )
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}
