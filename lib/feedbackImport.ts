import { prisma } from "./prisma"
import {
  analyzeFeedback,
  analyzeFeedbackBatch,
  themeColorForName,
  type FeedbackAnalysis,
  type SentimentLabel,
} from "./feedbackAnalysis"

export { IMPORT_CHANNELS, type ImportChannel } from "./importConstants"

export interface FeedbackInput {
  content: string
  channel: string
  customerLabel?: string | null
  satisfaction?: number | null
  createdAt?: Date | null
  sourceRef?: string | null
  /** Pre-assigned theme (skips AI theme if provided with analysis override) */
  theme?: string | null
}

export interface ImportContext {
  workspaceId: string
  importedById: string
}

export interface ImportedFeedbackResult {
  id: string
  content: string
  channel: string
  sentiment: SentimentLabel
  theme: string
  featureArea: string
  confidence: number
}

export interface BatchImportResult {
  imported: number
  failed: number
  errors: string[]
  items: ImportedFeedbackResult[]
  analysisComplete: boolean
}

async function resolveThemeId(
  workspaceId: string,
  themeName: string
): Promise<string> {
  const name = themeName.trim().slice(0, 100) || "General"
  const existing = await prisma.theme.findFirst({
    where: {
      workspaceId,
      name: { equals: name, mode: "insensitive" },
    },
  })
  if (existing) return existing.id

  try {
    const created = await prisma.theme.create({
      data: {
        name,
        description: "Auto-tagged from feedback import",
        color: themeColorForName(name),
        workspaceId,
      },
    })
    return created.id
  } catch {
    // Race: another insert won unique constraint
    const again = await prisma.theme.findFirst({
      where: {
        workspaceId,
        name: { equals: name, mode: "insensitive" },
      },
    })
    if (again) return again.id
    throw new Error(`Could not resolve theme "${name}"`)
  }
}

async function applyAnalysis(
  feedbackId: string,
  workspaceId: string,
  analysis: FeedbackAnalysis
) {
  await prisma.feedback.update({
    where: { id: feedbackId },
    data: {
      sentiment: analysis.sentiment,
      sentimentScore: analysis.sentimentScore,
      featureArea: analysis.featureArea,
    },
  })

  const themeId = await resolveThemeId(workspaceId, analysis.theme)
  await prisma.feedbackTheme.upsert({
    where: {
      feedbackId_themeId: { feedbackId, themeId },
    },
    create: {
      feedbackId,
      themeId,
      confidence: analysis.confidence,
    },
    update: {
      confidence: analysis.confidence,
    },
  })
}

/**
 * Create one feedback row, run AI analysis, persist results.
 */
export async function importSingleFeedback(
  input: FeedbackInput,
  ctx: ImportContext
): Promise<ImportedFeedbackResult> {
  const content = input.content.trim()
  if (!content) throw new Error("Feedback content is required")
  const channel = input.channel.trim()
  if (!channel) throw new Error("Channel is required")

  const feedback = await prisma.feedback.create({
    data: {
      content: content.slice(0, 10000),
      channel: channel.slice(0, 100),
      customerLabel: input.customerLabel?.trim().slice(0, 200) || null,
      satisfaction:
        input.satisfaction != null &&
        input.satisfaction >= 0 &&
        input.satisfaction <= 5
          ? input.satisfaction
          : null,
      sourceRef: input.sourceRef?.trim().slice(0, 200) || null,
      createdAt: input.createdAt ?? new Date(),
      status: "NEW",
      sentiment: "NEUTRAL",
      sentimentScore: 0,
      workspaceId: ctx.workspaceId,
      importedById: ctx.importedById,
    },
  })

  const analysis = await analyzeFeedback(content, {
    channel,
    rating: input.satisfaction,
  })

  // Prefer explicit theme from input if provided
  if (input.theme?.trim()) {
    analysis.theme = input.theme.trim()
  }

  await applyAnalysis(feedback.id, ctx.workspaceId, analysis)

  return {
    id: feedback.id,
    content: feedback.content,
    channel: feedback.channel,
    sentiment: analysis.sentiment,
    theme: analysis.theme,
    featureArea: analysis.featureArea,
    confidence: analysis.confidence,
  }
}

/**
 * Bulk-import feedback with analysis. Invalid rows are counted as failed.
 */
export async function importFeedbackBatch(
  inputs: FeedbackInput[],
  ctx: ImportContext,
  options?: { useFastAnalysis?: boolean }
): Promise<BatchImportResult> {
  const errors: string[] = []
  const valid: Array<FeedbackInput & { index: number }> = []

  inputs.forEach((input, index) => {
    const content = input.content?.trim()
    const channel = input.channel?.trim()
    if (!content) {
      errors.push(`Row ${index + 1}: missing content`)
      return
    }
    if (!channel) {
      errors.push(`Row ${index + 1}: missing channel`)
      return
    }
    valid.push({ ...input, content, channel, index })
  })

  if (valid.length === 0) {
    return {
      imported: 0,
      failed: errors.length || inputs.length,
      errors,
      items: [],
      analysisComplete: false,
    }
  }

  // Analyze first (so we can write complete records)
  const analyses = await analyzeFeedbackBatch(
    valid.map((v) => ({
      content: v.content,
      channel: v.channel,
      rating: v.satisfaction,
    })),
    {
      fast: options?.useFastAnalysis ?? valid.length > 25,
      concurrency: 4,
    }
  )

  // Cache themes for this batch
  const themeCache = new Map<string, string>()
  async function themeId(name: string) {
    const key = name.toLowerCase()
    if (themeCache.has(key)) return themeCache.get(key)!
    const id = await resolveThemeId(ctx.workspaceId, name)
    themeCache.set(key, id)
    return id
  }

  const items: ImportedFeedbackResult[] = []
  let imported = 0

  // Insert in smaller transactions for resilience
  const BATCH = 25
  for (let i = 0; i < valid.length; i += BATCH) {
    const slice = valid.slice(i, i + BATCH)
    const sliceAnalyses = analyses.slice(i, i + BATCH)

    try {
      await prisma.$transaction(async (tx) => {
        for (let j = 0; j < slice.length; j++) {
          const row = slice[j]
          const analysis = { ...sliceAnalyses[j] }
          if (row.theme?.trim()) analysis.theme = row.theme.trim()

          const feedback = await tx.feedback.create({
            data: {
              content: row.content.slice(0, 10000),
              channel: row.channel.slice(0, 100),
              customerLabel: row.customerLabel?.trim().slice(0, 200) || null,
              satisfaction:
                row.satisfaction != null &&
                row.satisfaction >= 0 &&
                row.satisfaction <= 5
                  ? row.satisfaction
                  : null,
              sourceRef: row.sourceRef?.trim().slice(0, 200) || null,
              createdAt: row.createdAt ?? new Date(),
              status: "NEW",
              sentiment: analysis.sentiment,
              sentimentScore: analysis.sentimentScore,
              featureArea: analysis.featureArea,
              workspaceId: ctx.workspaceId,
              importedById: ctx.importedById,
            },
          })

          // Theme resolution may need a query outside pure create — do after batch if needed
          items.push({
            id: feedback.id,
            content: feedback.content,
            channel: feedback.channel,
            sentiment: analysis.sentiment,
            theme: analysis.theme,
            featureArea: analysis.featureArea,
            confidence: analysis.confidence,
          })
          imported++
        }
      })
    } catch (err) {
      console.error("Batch insert failed, falling back to row-by-row:", err)
      for (let j = 0; j < slice.length; j++) {
        const row = slice[j]
        const analysis = { ...sliceAnalyses[j] }
        if (row.theme?.trim()) analysis.theme = row.theme.trim()
        try {
          const feedback = await prisma.feedback.create({
            data: {
              content: row.content.slice(0, 10000),
              channel: row.channel.slice(0, 100),
              customerLabel: row.customerLabel?.trim().slice(0, 200) || null,
              satisfaction:
                row.satisfaction != null &&
                row.satisfaction >= 0 &&
                row.satisfaction <= 5
                  ? row.satisfaction
                  : null,
              sourceRef: row.sourceRef?.trim().slice(0, 200) || null,
              createdAt: row.createdAt ?? new Date(),
              status: "NEW",
              sentiment: analysis.sentiment,
              sentimentScore: analysis.sentimentScore,
              featureArea: analysis.featureArea,
              workspaceId: ctx.workspaceId,
              importedById: ctx.importedById,
            },
          })
          items.push({
            id: feedback.id,
            content: feedback.content,
            channel: feedback.channel,
            sentiment: analysis.sentiment,
            theme: analysis.theme,
            featureArea: analysis.featureArea,
            confidence: analysis.confidence,
          })
          imported++
        } catch (rowErr) {
          const msg =
            rowErr instanceof Error
              ? rowErr.message.split("\n")[0].slice(0, 200)
              : "unknown error"
          // Stale Prisma clients after schema changes often surface as "Unknown argument"
          if (/Unknown argument/i.test(msg)) {
            errors.push(
              `Row ${row.index + 1}: failed to save (server schema cache is stale — restart the dev server and try again)`
            )
          } else {
            errors.push(`Row ${row.index + 1}: failed to save (${msg})`)
          }
        }
      }
    }
  }

  // Link themes
  for (const item of items) {
    try {
      const tid = await themeId(item.theme)
      await prisma.feedbackTheme.upsert({
        where: {
          feedbackId_themeId: { feedbackId: item.id, themeId: tid },
        },
        create: {
          feedbackId: item.id,
          themeId: tid,
          confidence: item.confidence,
        },
        update: { confidence: item.confidence },
      })
    } catch (err) {
      console.warn("Theme link failed for", item.id, err)
    }
  }

  return {
    imported,
    failed: errors.length,
    errors,
    items,
    analysisComplete: true,
  }
}
