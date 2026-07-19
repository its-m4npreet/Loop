import { NextResponse } from "next/server"
import { requireWorkspacePermission } from "@/lib/workspaceAuth"
import { streamAskLoopAnswer } from "@/lib/askLoop"
import { ensureConversation, getRecentTurns, addMessage } from "@/lib/askLoopQueries"
import { AskLoopSchema, parseBody } from "@/lib/validations"

export async function POST(request: Request) {
  const authResult = await requireWorkspacePermission("ask_loop:use")
  if ("error" in authResult) return authResult.error
  const { workspaceId, id: userId } = authResult.user

  const result = await parseBody(request, AskLoopSchema)
  if ("error" in result) return result.error

  const { message: question, conversationId: rawConversationId } = result.data

  let conversationId: string
  try {
    conversationId = await ensureConversation(
      workspaceId,
      userId,
      rawConversationId,
      question
    )
  } catch (error) {
    console.error("Ask LOOP: failed to resolve conversation:", error)
    return NextResponse.json({ error: "Failed to start conversation" }, { status: 500 })
  }

  // Load history BEFORE saving the new user message, so it isn't duplicated
  // in both the "history" block and the "new question" line of the prompt.
  const history = await getRecentTurns(conversationId)

  try {
    await addMessage(conversationId, "USER", question)
  } catch (error) {
    console.error("Ask LOOP: failed to save user message:", error)
    return NextResponse.json({ error: "Failed to save message" }, { status: 500 })
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let full = ""
      try {
        for await (const piece of streamAskLoopAnswer(workspaceId, question, history)) {
          full += piece
          controller.enqueue(encoder.encode(piece))
        }
      } catch (error) {
        console.error("Ask LOOP: generation failed:", error)
        const fallback =
          "\n\nSomething went wrong while generating a response. Please try again."
        full += fallback
        controller.enqueue(encoder.encode(fallback))
      } finally {
        if (full.trim()) {
          try {
            await addMessage(conversationId, "ASSISTANT", full)
          } catch (dbError) {
            console.error("Ask LOOP: failed to save assistant message:", dbError)
          }
        }
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Conversation-Id": conversationId,
    },
  })
}
