import { GoogleGenerativeAI } from "@google/generative-ai"
import { prisma } from "@/lib/prisma"
import {
  getAnalyticsSummary,
  getSentimentBreakdown,
  getTopThemes,
} from "@/lib/analyticsQueries"

// ── Types ──

export interface ChatTurn {
  role: "USER" | "ASSISTANT"
  content: string
}

interface MatchedFeedback {
  content: string
  sentiment: string
  channel: string
  createdAt: string
  theme: string | null
}

export interface RetrievedContext {
  windowDays: number
  matchedByKeyword: boolean
  summary: Awaited<ReturnType<typeof getAnalyticsSummary>>
  sentiment: Awaited<ReturnType<typeof getSentimentBreakdown>>
  topThemes: Awaited<ReturnType<typeof getTopThemes>>
  matchedFeedback: MatchedFeedback[]
}

// ── Gemini model ──

function getGeminiModel() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set")
  }
  const genAI = new GoogleGenerativeAI(apiKey)
  return genAI.getGenerativeModel({ model: "gemini-3.5-flash" })
}

// ── Lightweight NL -> filter extraction ──
// No embeddings/vector DB yet, so we derive a retrieval window, an optional
// sentiment filter, and keyword terms straight from the question, then use
// those to pull the most relevant rows straight out of Postgres via Prisma.

const DAY_MS = 86_400_000

function extractWindowDays(question: string): number {
  const q = question.toLowerCase()
  if (/\btoday\b/.test(q)) return 1
  if (/\byesterday\b/.test(q)) return 2
  if (/\bthis week\b|\bpast week\b|\blast 7 days\b/.test(q)) return 7
  if (/\blast week\b/.test(q)) return 14
  if (/\bthis month\b|\bpast month\b|\blast 30 days\b/.test(q)) return 30
  if (/\blast quarter\b|\blast 3 months\b/.test(q)) return 90
  if (/\ball time\b|\beverything\b|\bever\b/.test(q)) return 365
  return 30
}

const SENTIMENT_HINTS: Array<{ pattern: RegExp; sentiment: "POSITIVE" | "NEGATIVE" }> = [
  {
    pattern: /\b(negative|complain\w*|angry|upset|frustrat\w*|worst|hate\w*|issues?|problems?|bugs?)\b/,
    sentiment: "NEGATIVE",
  },
  {
    pattern: /\b(positive|praise\w*|love\w*|great|happy|best|delight\w*)\b/,
    sentiment: "POSITIVE",
  },
]

function extractSentimentFilter(question: string): "POSITIVE" | "NEGATIVE" | null {
  const q = question.toLowerCase()
  for (const hint of SENTIMENT_HINTS) {
    if (hint.pattern.test(q)) return hint.sentiment
  }
  return null
}

const STOPWORDS = new Set([
  "the", "a", "an", "is", "are", "was", "were", "what", "which", "who",
  "how", "why", "do", "does", "did", "for", "of", "in", "on", "at", "to",
  "and", "or", "about", "me", "my", "our", "us", "loop", "feedback", "data",
  "this", "that", "have", "has", "any", "there", "been", "show", "tell",
  "give", "summarize", "recent", "most", "please", "can", "you", "with",
])

function extractKeywords(question: string): string[] {
  return Array.from(
    new Set(
      question
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((word) => word.length > 2 && !STOPWORDS.has(word))
    )
  ).slice(0, 8)
}

// ── Retrieval ──

/**
 * Pull the pieces of workspace feedback data most relevant to a question.
 * This is retrieval-augmented generation without a vector store: we use the
 * question itself to derive SQL filters (date window, sentiment, keywords)
 * instead of embedding similarity. Falls back to "most recent" when no
 * keyword matches, so the model always gets grounded, real data.
 */
export async function retrieveContext(
  workspaceId: string,
  question: string
): Promise<RetrievedContext> {
  const windowDays = extractWindowDays(question)
  const sentimentFilter = extractSentimentFilter(question)
  const keywords = extractKeywords(question)
  const since = new Date(Date.now() - windowDays * DAY_MS)

  const [summary, sentiment, topThemes] = await Promise.all([
    getAnalyticsSummary(workspaceId, windowDays),
    getSentimentBreakdown(workspaceId, windowDays),
    getTopThemes(workspaceId, 6, windowDays),
  ])

  const whereBase = {
    workspaceId,
    createdAt: { gte: since },
    ...(sentimentFilter ? { sentiment: sentimentFilter } : {}),
  }

  let rows = keywords.length
    ? await prisma.feedback.findMany({
        where: {
          ...whereBase,
          OR: keywords.map((kw) => ({
            content: { contains: kw, mode: "insensitive" as const },
          })),
        },
        include: { themes: { include: { theme: { select: { name: true } } } } },
        orderBy: { createdAt: "desc" },
        take: 25,
      })
    : []

  const matchedByKeyword = rows.length > 0

  if (!matchedByKeyword) {
    // No keyword hits (or a broad/summary-style question) — ground the
    // answer in the most recent feedback within the window instead.
    rows = await prisma.feedback.findMany({
      where: whereBase,
      include: { themes: { include: { theme: { select: { name: true } } } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    })
  }

  return {
    windowDays,
    matchedByKeyword,
    summary,
    sentiment,
    topThemes,
    matchedFeedback: rows.map((f) => ({
      content: f.content,
      sentiment: f.sentiment,
      channel: f.channel,
      createdAt: f.createdAt.toISOString(),
      theme: f.themes[0]?.theme.name ?? null,
    })),
  }
}

// ── Prompt building ──

function formatContext(ctx: RetrievedContext, periodLabel: string): string {
  const sentimentLines = ctx.sentiment
    .map((s) => `- ${s.name}: ${s.count} (${s.value}%)`)
    .join("\n")

  const themeLines = ctx.topThemes.length
    ? ctx.topThemes
        .map((t) => `- ${t.theme}: ${t.mentions} mentions (${t.weeklyChange >= 0 ? "+" : ""}${t.weeklyChange}% vs last week)`)
        .join("\n")
    : "- No themes recorded in this window."

  const feedbackLines = ctx.matchedFeedback.length
    ? ctx.matchedFeedback
        .slice(0, 20)
        .map((f) => {
          const date = new Date(f.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })
          return `- [${f.sentiment}${f.theme ? `, ${f.theme}` : ""}, ${f.channel}, ${date}] "${f.content.slice(0, 220)}"`
        })
        .join("\n")
    : "- No matching feedback found in this window."

  return `WORKSPACE DATA SNAPSHOT (${periodLabel})

SUMMARY STATS:
- Total feedback: ${ctx.summary.totalFeedback}
- Resolution rate: ${ctx.summary.resolutionRate}%
- Avg response time: ${ctx.summary.avgResponseTime} min
- Avg satisfaction: ${ctx.summary.avgSatisfaction}/5
- Negative share: ${ctx.summary.negativePct}%

SENTIMENT BREAKDOWN:
${sentimentLines}

TOP THEMES:
${themeLines}

${ctx.matchedByKeyword ? "FEEDBACK MATCHING THE QUESTION" : "MOST RECENT FEEDBACK IN THIS WINDOW"} (up to 20 shown, quotes truncated):
${feedbackLines}`
}

function periodLabelFor(days: number): string {
  if (days <= 1) return "today"
  if (days <= 2) return "yesterday"
  if (days <= 7) return "the last 7 days"
  if (days <= 14) return "the last 14 days"
  if (days <= 30) return "the last 30 days"
  if (days <= 90) return "the last quarter"
  return "all time"
}

const SYSTEM_PREAMBLE = `You are LOOP AI, an assistant embedded in a Voice-of-Customer analytics product called LOOP. You answer questions about a company's own customer feedback using only the workspace data snapshot provided below plus the conversation so far.

Rules:
- Ground every claim in the provided data. Never invent statistics, quotes, or feedback that isn't shown.
- If the snapshot doesn't have enough to answer confidently, say so plainly and suggest what data or filter would help.
- Be concise and conversational. Use short paragraphs, markdown headings (## / ###), and tight bullet (- ) or numbered (1. ) lists — not long reports.
- When citing a specific piece of feedback, paraphrase it briefly rather than quoting it at length.
- Do not repeat the raw data dump back verbatim — synthesize it into an answer.`

/**
 * Build the full prompt sent to Gemini: system rules + retrieved data +
 * recent conversation history + the new question.
 */
export function buildPrompt(
  ctx: RetrievedContext,
  history: ChatTurn[],
  question: string
): string {
  const periodLabel = periodLabelFor(ctx.windowDays)
  const dataBlock = formatContext(ctx, periodLabel)

  const historyBlock = history.length
    ? history
        .slice(-8)
        .map((turn) => `${turn.role === "USER" ? "User" : "LOOP AI"}: ${turn.content}`)
        .join("\n")
    : "(no earlier messages)"

  return `${SYSTEM_PREAMBLE}

${dataBlock}

CONVERSATION SO FAR:
${historyBlock}

New question from the user: """${question}"""

Answer as LOOP AI:`
}

import { withStreamRetry } from "@/lib/geminiRetry"

/**
 * Stream a Gemini response for a user question, grounded in retrieved
 * workspace feedback data. Returns an async generator of text chunks.
 */
export async function* streamAskLoopAnswer(
  workspaceId: string,
  question: string,
  history: ChatTurn[]
): AsyncGenerator<string> {
  const ctx = await retrieveContext(workspaceId, question)
  const prompt = buildPrompt(ctx, history, question)

  const model = getGeminiModel()
  const result = await withStreamRetry(() => model.generateContentStream(prompt))

  for await (const chunk of result.stream) {
    const text = chunk.text()
    if (text) yield text
  }
}
