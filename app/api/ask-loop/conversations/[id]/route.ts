import { NextResponse } from "next/server"
import { requireWorkspacePermission } from "@/lib/workspaceAuth"
import { getConversationWithMessages, deleteConversation } from "@/lib/askLoopQueries"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireWorkspacePermission("ask_loop:use")
  if ("error" in authResult) return authResult.error

  const { id } = await params
  if (!id) {
    return NextResponse.json({ error: "Missing conversation ID" }, { status: 400 })
  }

  try {
    const conversation = await getConversationWithMessages(
      authResult.user.workspaceId,
      authResult.user.id,
      id
    )
    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }
    return NextResponse.json(conversation)
  } catch (error) {
    console.error("Ask LOOP: failed to load conversation:", error)
    return NextResponse.json({ error: "Failed to load conversation" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireWorkspacePermission("ask_loop:use")
  if ("error" in authResult) return authResult.error

  const { id } = await params
  if (!id) {
    return NextResponse.json({ error: "Missing conversation ID" }, { status: 400 })
  }

  try {
    const deleted = await deleteConversation(
      authResult.user.workspaceId,
      authResult.user.id,
      id
    )
    if (!deleted) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Ask LOOP: failed to delete conversation:", error)
    return NextResponse.json({ error: "Failed to delete conversation" }, { status: 500 })
  }
}
