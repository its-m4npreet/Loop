import { NextResponse } from "next/server"
import { createHash } from "crypto"
import { prisma } from "@/lib/prisma"

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex")
}

export async function POST(req: Request) {
  const { token } = (await req.json().catch(() => ({}))) as { token?: string }

  if (!token) {
    return NextResponse.json({ error: "Token is required" }, { status: 400 })
  }

  const tokenHash = hashToken(token)

  const verificationToken = await prisma.verificationToken.findUnique({
    where: { token: tokenHash },
  })

  if (!verificationToken) {
    return NextResponse.json({ error: "Invalid or expired verification link" }, { status: 400 })
  }

  if (new Date() > verificationToken.expires) {
    return NextResponse.json({ error: "This verification link has expired" }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { email: verificationToken.identifier },
  })

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 400 })
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    }),
    prisma.verificationToken.deleteMany({
      where: { identifier: verificationToken.identifier, token: tokenHash },
    }),
  ])

  return NextResponse.json({ ok: true })
}
