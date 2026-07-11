import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      workspaceId: true,
      workspace: {
        select: { id: true, name: true },
      },
    },
  })

  if (!me?.workspace) {
    return NextResponse.json({ workspaces: [], activeId: null })
  }

  return NextResponse.json({
    workspaces: [me.workspace],
    activeId: me.workspaceId,
  })
}
