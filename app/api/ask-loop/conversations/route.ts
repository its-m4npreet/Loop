import { NextResponse } from "next/server"
import { requireWorkspacePermission } from "@/lib/workspaceAuth"
import { listConversations } from "@/lib/askLoopQueries"

export async function GET() {
  const authResult = await requireWorkspacePermission("ask_loop:use")
  if ("error" in authResult) return authResult.error

  try {
    const conversations = await listConversations(
      authResult.user.workspaceId,
      authResult.user.id
    )
    return NextResponse.json({ conversations })
  } catch (error) {
    console.error("Ask LOOP: failed to list conversations:", error)
    return NextResponse.json({ error: "Failed to load conversations" }, { status: 500 })
  }
}
