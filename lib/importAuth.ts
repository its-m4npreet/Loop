import { hasPermission } from "@/lib/permissions"
import { NextResponse } from "next/server"
import {
  requireWorkspaceUser,
  type WorkspaceUser,
} from "@/lib/workspaceAuth"

export type ImportUser = WorkspaceUser

/**
 * Resolve authenticated importer with workspace + permission checks.
 * Returns either a user context or a NextResponse error.
 */
export async function requireImportUser(): Promise<
  { user: ImportUser } | { error: NextResponse }
> {
  const result = await requireWorkspaceUser()
  if ("error" in result) {
    // Keep import-specific message when the user has no workspace
    if (result.error.status === 400) {
      return {
        error: NextResponse.json(
          { error: "You must belong to a workspace to import feedback." },
          { status: 400 }
        ),
      }
    }
    return result
  }

  const { user } = result
  if (
    !hasPermission(user.role, "feedback:import") &&
    !hasPermission(user.role, "feedback:manual")
  ) {
    return {
      error: NextResponse.json(
        { error: "You do not have permission to import feedback." },
        { status: 403 }
      ),
    }
  }

  return { user }
}
