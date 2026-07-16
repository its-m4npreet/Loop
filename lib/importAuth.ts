import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { hasPermission, type Role } from "@/lib/permissions"
import { NextResponse } from "next/server"

export type ImportUser = {
  id: string
  role: Role
  workspaceId: string
}

/**
 * Resolve authenticated importer with workspace + permission checks.
 * Returns either a user context or a NextResponse error.
 */
export async function requireImportUser(): Promise<
  { user: ImportUser } | { error: NextResponse }
> {
  const session = await auth()
  if (!session?.user?.id) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    }
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, workspaceId: true },
  })

  if (!user?.workspaceId) {
    return {
      error: NextResponse.json(
        { error: "You must belong to a workspace to import feedback." },
        { status: 400 }
      ),
    }
  }

  const role = user.role as Role
  if (!hasPermission(role, "feedback:import") && !hasPermission(role, "feedback:manual")) {
    return {
      error: NextResponse.json(
        { error: "You do not have permission to import feedback." },
        { status: 403 }
      ),
    }
  }

  return {
    user: {
      id: user.id,
      role,
      workspaceId: user.workspaceId,
    },
  }
}
