import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { hasPermission, type Permission, type Role } from "@/lib/permissions"
import { NextResponse } from "next/server"

/**
 * Authenticated user who belongs to a workspace (company).
 * Always load workspaceId from the database — never from the client.
 */
export type WorkspaceUser = {
  id: string
  role: Role
  workspaceId: string
}

type AuthFailure = { error: NextResponse }
type AuthSuccess = { user: WorkspaceUser }

/**
 * Require a logged-in user with a workspace.
 * Use this at the top of every tenant-scoped API route.
 */
export async function requireWorkspaceUser(): Promise<AuthSuccess | AuthFailure> {
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
        { error: "You must belong to a workspace to access this resource." },
        { status: 400 }
      ),
    }
  }

  return {
    user: {
      id: user.id,
      role: user.role as Role,
      workspaceId: user.workspaceId,
    },
  }
}

/**
 * Same as requireWorkspaceUser, plus a permission check.
 */
export async function requireWorkspacePermission(
  permission: Permission
): Promise<AuthSuccess | AuthFailure> {
  const result = await requireWorkspaceUser()
  if ("error" in result) return result

  if (!hasPermission(result.user.role, permission)) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    }
  }

  return result
}

/**
 * Ensure a target user belongs to the same workspace as the actor.
 * Prevents cross-company team mutations.
 */
export async function requireSameWorkspaceMember(
  actor: WorkspaceUser,
  targetUserId: string
): Promise<{ target: { id: string; workspaceId: string } } | AuthFailure> {
  const target = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, workspaceId: true },
  })

  if (!target?.workspaceId || target.workspaceId !== actor.workspaceId) {
    return {
      error: NextResponse.json(
        { error: "User not found in your workspace" },
        { status: 404 }
      ),
    }
  }

  return { target: { id: target.id, workspaceId: target.workspaceId } }
}

/**
 * Build a Prisma where clause that is always scoped to a workspace.
 * Prefer this over raw IDs alone for reads/updates/deletes.
 */
export function workspaceScope(workspaceId: string) {
  return { workspaceId } as const
}
