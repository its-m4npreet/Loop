import { NextResponse } from "next/server"
import { requireImportUser } from "@/lib/importAuth"
import { importSingleFeedback } from "@/lib/feedbackImport"
import { IMPORT_CHANNELS } from "@/lib/importConstants"
import { hasPermission } from "@/lib/permissions"

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

    let body: {
      content?: string
      channel?: string
      customerName?: string
      rating?: number | string | null
      feedbackDate?: string | null
    }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }

    const content = body.content?.trim()
    const channel = body.channel?.trim()

    if (!content) {
      return NextResponse.json(
        { error: "Feedback content is required." },
        { status: 400 }
      )
    }
    if (!channel) {
      return NextResponse.json({ error: "Channel is required." }, { status: 400 })
    }

    const allowed = new Set<string>(IMPORT_CHANNELS)
    if (!allowed.has(channel)) {
      return NextResponse.json(
        {
          error: `Invalid channel. Allowed: ${IMPORT_CHANNELS.join(", ")}`,
        },
        { status: 400 }
      )
    }

    let rating: number | null = null
    if (body.rating !== undefined && body.rating !== null && body.rating !== "") {
      const n = Number(body.rating)
      if (Number.isNaN(n) || n < 1 || n > 5) {
        return NextResponse.json(
          { error: "Rating must be a number between 1 and 5." },
          { status: 400 }
        )
      }
      rating = n
    }

    let createdAt: Date | null = null
    if (body.feedbackDate) {
      const d = new Date(body.feedbackDate)
      if (Number.isNaN(d.getTime())) {
        return NextResponse.json(
          { error: "Invalid feedback date." },
          { status: 400 }
        )
      }
      createdAt = d
    }

    const result = await importSingleFeedback(
      {
        content,
        channel,
        customerLabel: body.customerName?.trim() || null,
        satisfaction: rating,
        createdAt,
      },
      { workspaceId: user.workspaceId, importedById: user.id }
    )

    return NextResponse.json({
      success: true,
      message: "Feedback analyzed and saved.",
      feedback: result,
    })
  } catch (err) {
    console.error("Manual feedback import failed:", err)
    return NextResponse.json(
      { error: "Failed to save feedback. Please try again." },
      { status: 500 }
    )
  }
}
