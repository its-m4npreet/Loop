import { NextResponse } from "next/server"
import { requireImportUser } from "@/lib/importAuth"
import { parseFeedbackCsv } from "@/lib/csvParse"
import { importFeedbackBatch, type FeedbackInput } from "@/lib/feedbackImport"
import { hasPermission } from "@/lib/permissions"

const MAX_FILE_BYTES = 5 * 1024 * 1024
const MAX_ROWS = 5000

export async function POST(req: Request) {
  try {
    const authResult = await requireImportUser()
    if ("error" in authResult) return authResult.error

    const { user } = authResult
    if (!hasPermission(user.role, "feedback:import")) {
      return NextResponse.json(
        { error: "You do not have permission to import CSV feedback." },
        { status: 403 }
      )
    }

    const contentType = req.headers.get("content-type") || ""
    let csvText: string

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData()
      const file = form.get("file")
      if (!file || !(file instanceof File)) {
        return NextResponse.json(
          { error: 'Missing file. Upload a CSV with field name "file".' },
          { status: 400 }
        )
      }
      if (file.size > MAX_FILE_BYTES) {
        return NextResponse.json(
          { error: "File too large. Maximum size is 5 MB." },
          { status: 400 }
        )
      }
      const name = file.name.toLowerCase()
      if (
        name &&
        !name.endsWith(".csv") &&
        file.type &&
        !file.type.includes("csv") &&
        !file.type.includes("text")
      ) {
        return NextResponse.json(
          { error: "Please upload a .csv file." },
          { status: 400 }
        )
      }
      csvText = await file.text()
    } else {
      csvText = await req.text()
      if (!csvText?.trim()) {
        return NextResponse.json({ error: "Empty request body." }, { status: 400 })
      }
      if (csvText.length > MAX_FILE_BYTES) {
        return NextResponse.json(
          { error: "Payload too large. Maximum size is 5 MB." },
          { status: 400 }
        )
      }
    }

    const parsed = parseFeedbackCsv(csvText, {
      maxRows: MAX_ROWS,
      requireChannel: true,
    })

    if (parsed.rows.length === 0) {
      return NextResponse.json(
        {
          error: "No valid feedback rows found in the CSV.",
          details: parsed.errors,
          failed: parsed.skipped + parsed.errors.length,
          imported: 0,
          successful: 0,
        },
        { status: 400 }
      )
    }

    const inputs: FeedbackInput[] = parsed.rows.map((r) => ({
      content: r.content,
      channel: r.channel,
      customerLabel: r.customerLabel,
      satisfaction: r.satisfaction,
      createdAt: r.createdAt,
      sourceRef: r.sourceRef,
      theme: r.theme,
    }))

    const result = await importFeedbackBatch(inputs, {
      workspaceId: user.workspaceId,
      importedById: user.id,
    })

    const failed = result.failed + parsed.skipped
    const allErrors = [...parsed.errors, ...result.errors]

    return NextResponse.json({
      success: true,
      total: inputs.length + parsed.skipped,
      imported: result.imported,
      successful: result.imported,
      failed,
      analysisComplete: result.analysisComplete,
      warnings: allErrors.slice(0, 50),
      message: `${result.imported} Records Imported · ${result.imported} Successful · ${failed} Failed · Analyze Complete`,
    })
  } catch (err) {
    console.error("CSV import failed:", err)
    return NextResponse.json(
      { error: "Import failed. Please check the file format and try again." },
      { status: 500 }
    )
  }
}
