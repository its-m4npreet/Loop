import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

const MAX_SIZE = 2 * 1024 * 1024

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const { image } = body as { image?: string }

  if (!image || typeof image !== "string") {
    return NextResponse.json({ error: "Image data is required" }, { status: 400 })
  }

  if (image.length > MAX_SIZE * 1.4) {
    return NextResponse.json({ error: "Image too large (max 2MB)" }, { status: 400 })
  }

  if (!image.startsWith("data:image/")) {
    return NextResponse.json({ error: "Invalid image format" }, { status: 400 })
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { image },
  })

  return NextResponse.json({ success: true, image })
}
