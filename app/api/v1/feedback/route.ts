import { NextResponse } from "next/server"
import { authenticateApiKey } from "@/lib/apiKeys"
import { importSingleFeedback } from "@/lib/feedbackImport"
import { ApiIngestFeedbackSchema, parseBody } from "@/lib/validations"
import { enforceRateLimit } from "@/lib/rateLimit"
import { enforceUsageLimit } from "@/lib/plans"
import { logger } from "@/lib/logger"

const RATE_LIMIT = 120
const RATE_WINDOW_SECONDS = 60

/**
 * Public feedback ingestion endpoint. Authenticates with a workspace API key:
 *
 *   Authorization: Bearer lk_...
 *
 * Payloads are validated with Zod and routed through the same AI analysis
 * pipeline as manual/CSV imports.
 */
export async function POST(req: Request) {
  try {
    const auth = await authenticateApiKey(req)
    if ("error" in auth) return auth.error

    const { ctx } = auth

    const rateLimitError = await enforceRateLimit({
      key: `api-ingest:key:${ctx.keyId}`,
      limit: RATE_LIMIT,
      windowSeconds: RATE_WINDOW_SECONDS,
      label: "API feedback ingestion",
    })
    if (rateLimitError) return rateLimitError

    const result = await parseBody(req, ApiIngestFeedbackSchema)
    if ("error" in result) return result.error

    const { content, channel, customerName, sourceRef, rating, feedbackDate } =
      result.data

    // Consume the workspace's monthly import allowance for this item.
    const usageError = await enforceUsageLimit(ctx.workspaceId, "imports")
    if (usageError) return usageError

    const feedback = await importSingleFeedback(
      {
        content,
        channel,
        customerLabel: customerName,
        sourceRef,
        satisfaction: rating,
        createdAt: feedbackDate,
      },
      { workspaceId: ctx.workspaceId }
    )

    return NextResponse.json(
      {
        success: true,
        message: "Feedback analyzed and saved.",
        feedback: {
          id: feedback.id,
          content: feedback.content,
          channel: feedback.channel,
          sentiment: feedback.sentiment,
          theme: feedback.theme,
          featureArea: feedback.featureArea,
          confidence: feedback.confidence,
        },
      },
      { status: 201 }
    )
  } catch (err) {
    logger.error("API feedback ingestion failed", { error: err })
    return NextResponse.json(
      { error: "Failed to save feedback. Please try again." },
      { status: 500 }
    )
  }
}