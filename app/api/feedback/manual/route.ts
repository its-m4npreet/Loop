import { NextResponse } from "next/server"
import { requireImportUser } from "@/lib/importAuth"
import { importSingleFeedback } from "@/lib/feedbackImport"
import { IMPORT_CHANNELS } from "@/lib/importConstants"
import { hasPermission } from "@/lib/permissions"
import { ManualFeedbackSchema, parseBody } from "@/lib/validations"
import { enforceRateLimit } from "@/lib/rateLimit"
import { enforceUsageLimit } from "@/lib/plans"
import { logger } from "@/lib/logger"

export async function POST(req: Request) {
  try {
    const authResult = await requireImportUser()
    if ("error" in authResult) return authResult.error

    const { user } = authResult
    if (
      !hasPermission(user.role, "feedback:manual") &&
      !hasPermission(user.role, "feedback:import")
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const rateLimitError = await enforceRateLimit({
      key: `feedback-manual:user:${user.id}`,
      limit: 30,
      windowSeconds: 60,
      label: "Manual feedback entry",
    })
    if (rateLimitError) return rateLimitError

    const result = await parseBody(req, ManualFeedbackSchema)
    if ("error" in result) return result.error

    const { content, channel, customerName, rating, feedbackDate } = result.data

    const allowed = new Set<string>(IMPORT_CHANNELS)
    if (!allowed.has(channel)) {
      return NextResponse.json(
        {
          error: `Invalid channel. Allowed: ${IMPORT_CHANNELS.join(", ")}`,
        },
        { status: 400 }
      )
    }

    const usageError = await enforceUsageLimit(user.workspaceId, "imports")
    if (usageError) return usageError

    const result2 = await importSingleFeedback(
      {
        content: content.trim(),
        channel: channel.trim(),
        customerLabel: customerName?.trim() || null,
        satisfaction: rating,
        createdAt: feedbackDate,
      },
      { workspaceId: user.workspaceId, importedById: user.id }
    )

    return NextResponse.json({
      success: true,
      message: "Feedback analyzed and saved.",
      feedback: result2,
    })
  } catch (err) {
    logger.error("Manual feedback import failed", { error: err })
    return NextResponse.json(
      { error: "Failed to save feedback. Please try again." },
      { status: 500 }
    )
  }
}
