import { NextResponse } from "next/server"
import { requireImportUser } from "@/lib/importAuth"
import { importSingleFeedback } from "@/lib/feedbackImport"
import { IMPORT_CHANNELS } from "@/lib/importConstants"
import { hasPermission } from "@/lib/permissions"
import { ManualFeedbackSchema, parseBody } from "@/lib/validations"

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
    console.error("Manual feedback import failed:", err)
    return NextResponse.json(
      { error: "Failed to save feedback. Please try again." },
      { status: 500 }
    )
  }
}
