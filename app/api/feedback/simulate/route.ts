import { NextResponse } from "next/server"
import { readFile } from "fs/promises"
import path from "path"
import { requireImportUser } from "@/lib/importAuth"
import { importFeedbackBatch, type FeedbackInput } from "@/lib/feedbackImport"
import { hasPermission } from "@/lib/permissions"

const SOURCES = {
  "support-tickets": {
    file: "supportTickets.json",
    label: "Support Tickets",
    defaultChannel: "Support Ticket",
  },
  "app-reviews": {
    file: "appReviews.json",
    label: "App Reviews",
    defaultChannel: "App Review",
  },
  surveys: {
    file: "surveys.json",
    label: "Survey Responses",
    defaultChannel: "Survey Response",
  },
} as const

export type SimulateSource = keyof typeof SOURCES

export async function POST(req: Request) {
  try {
    const authResult = await requireImportUser()
    if ("error" in authResult) return authResult.error

    const { user } = authResult
    if (!hasPermission(user.role, "feedback:import")) {
      return NextResponse.json(
        { error: "You do not have permission to import feedback." },
        { status: 403 }
      )
    }

    let body: { source?: string }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }

    const sourceKey = body.source as SimulateSource
    const source = SOURCES[sourceKey]
    if (!source) {
      return NextResponse.json(
        {
          error: `Invalid source. Use one of: ${Object.keys(SOURCES).join(", ")}`,
        },
        { status: 400 }
      )
    }

    const filePath = path.join(process.cwd(), "data", source.file)
    let raw: string
    try {
      raw = await readFile(filePath, "utf-8")
    } catch {
      return NextResponse.json(
        { error: `Sample data file not found: ${source.file}` },
        { status: 500 }
      )
    }

    let records: Array<{
      content?: string
      channel?: string
      customer_name?: string
      customerName?: string
      rating?: number
      created_at?: string
    }>
    try {
      records = JSON.parse(raw)
      if (!Array.isArray(records)) throw new Error("not array")
    } catch {
      return NextResponse.json(
        { error: "Invalid sample data format." },
        { status: 500 }
      )
    }

    const inputs: FeedbackInput[] = records
      .filter((r) => r.content?.trim())
      .map((r) => ({
        content: r.content!.trim(),
        channel: (r.channel?.trim() || source.defaultChannel).slice(0, 100),
        customerLabel:
          r.customer_name?.trim() || r.customerName?.trim() || null,
        satisfaction:
          typeof r.rating === "number" && r.rating >= 1 && r.rating <= 5
            ? r.rating
            : null,
        createdAt: r.created_at ? new Date(r.created_at) : null,
      }))

    if (inputs.length === 0) {
      return NextResponse.json(
        { error: "No feedback records in sample file." },
        { status: 400 }
      )
    }

    const result = await importFeedbackBatch(inputs, {
      workspaceId: user.workspaceId,
      importedById: user.id,
    })

    return NextResponse.json({
      success: true,
      source: sourceKey,
      label: source.label,
      imported: result.imported,
      failed: result.failed,
      analysisComplete: result.analysisComplete,
      message: `${source.label} Imported · ${result.imported} Feedback Records Added · AI Analysis Completed`,
      warnings: result.errors.slice(0, 20),
    })
  } catch (err) {
    console.error("Simulated channel import failed:", err)
    return NextResponse.json(
      { error: "Simulated import failed. Please try again." },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    sources: Object.entries(SOURCES).map(([id, s]) => ({
      id,
      label: s.label,
      file: s.file,
    })),
  })
}
