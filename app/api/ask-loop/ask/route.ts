import { NextResponse } from "next/server"
import { requireWorkspacePermission } from "@/lib/workspaceAuth"
import { streamAskLoopAnswer } from "@/lib/askLoop"
import { ensureConversation, getRecentTurns, addMessage } from "@/lib/askLoopQueries"
import { AskLoopSchema, parseBody } from "@/lib/validations"
import { enforceRateLimit } from "@/lib/rateLimit"
import { enforceUsageLimit } from "@/lib/plans"
import { logger } from "@/lib/logger"

export async function POST(request: Request) {
  const authResult = await requireWorkspacePermission("ask_loop:use")
  if ("error" in authResult) return authResult.error
  const { workspaceId, id: userId } = authResult.user

  const rateLimitError = await enforceRateLimit({
    key: `ask-loop:user:${userId}`,
    limit: 20,
    windowSeconds: 60,
    label: "Ask LOOP",
  })
  if (rateLimitError) return rateLimitError

  // Consume the monthly plan allowance before doing heavy AI work.
  const usageError = await enforceUsageLimit(workspaceId, "askLoop")
  if (usageError) return usageError

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
    logger.error("Ask LOOP: failed to resolve conversation", { error })
    return NextResponse.json({ error: "Failed to start conversation" }, { status: 500 })
  }

  // Load history BEFORE saving the new user message, so it isn't duplicated
  // in both the "history" block and the "new question" line of the prompt.
  const history = await getRecentTurns(conversationId)

  try {
    await addMessage(conversationId, "USER", question)
  } catch (error) {
    logger.error("Ask LOOP: failed to save user message", { error })
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
        logger.error("Ask LOOP: generation failed", { error, workspaceId, userId })
        const fallback =
          "\n\nSomething went wrong while generating a response. Please try again."
        full += fallback
        controller.enqueue(encoder.encode(fallback))
      } finally {
        if (full.trim()) {
          try {
            await addMessage(conversationId, "ASSISTANT", full)
          } catch (dbError) {
            logger.error("Ask LOOP: failed to save assistant message", { error: dbError })
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
