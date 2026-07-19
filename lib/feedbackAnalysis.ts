import { GoogleGenerativeAI } from "@google/generative-ai"
import { withRetry } from "@/lib/geminiRetry"

export type SentimentLabel = "POSITIVE" | "NEUTRAL" | "NEGATIVE"

export interface FeedbackAnalysis {
  sentiment: SentimentLabel
  sentimentScore: number // -1 .. 1
  theme: string
  featureArea: string
  confidence: number // 0 .. 1
}

const THEME_COLORS = [
  "#22C55E",
  "#F87171",
  "#60A5FA",
  "#A78BFA",
  "#FB923C",
  "#FBBF24",
  "#F472B6",
  "#2DD4BF",
]

export function themeColorForName(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  }
  return THEME_COLORS[hash % THEME_COLORS.length]
}

// ── Keyword heuristic (always available fallback) ──

const THEME_KEYWORDS: Array<{ theme: string; featureArea: string; words: string[] }> = [
  { theme: "Billing", featureArea: "Payments", words: ["bill", "billing", "invoice", "charge", "payment", "refund", "pricing", "subscription", "checkout"] },
  { theme: "Login & Auth", featureArea: "Authentication", words: ["login", "log in", "sign in", "password", "auth", "sso", "2fa", "otp", "account lock"] },
  { theme: "Performance", featureArea: "Infrastructure", words: ["slow", "lag", "crash", "crashes", "loading", "timeout", "performance", "freeze", "down"] },
  { theme: "Onboarding", featureArea: "Getting Started", words: ["onboard", "setup", "invite", "getting started", "tutorial", "first time"] },
  { theme: "Support Quality", featureArea: "Customer Support", words: ["support", "agent", "response time", "ticket", "help desk", "customer service"] },
  { theme: "UI/UX", featureArea: "Interface", words: ["ui", "ux", "design", "dark mode", "layout", "confusing", "mobile", "button", "screen"] },
  { theme: "Feature Requests", featureArea: "Product", words: ["would love", "please add", "feature request", "wish", "missing", "need dark", "integration"] },
  { theme: "Security", featureArea: "Security", words: ["security", "privacy", "breach", "leak", "permission", "gdpr", "data"] },
  { theme: "Export & Reporting", featureArea: "Reports", words: ["export", "csv", "pdf", "report", "download"] },
  { theme: "Notifications", featureArea: "Messaging", words: ["notification", "email alert", "push", "reminder"] },
]

const POSITIVE_WORDS = [
  "love", "great", "amazing", "excellent", "fantastic", "awesome", "perfect",
  "helpful", "fast", "smooth", "easy", "impressed", "thank", "best", "wonderful",
]
const NEGATIVE_WORDS = [
  "hate", "terrible", "awful", "broken", "crash", "bug", "slow", "confusing",
  "frustrating", "unacceptable", "worst", "fail", "cannot", "can't", "issue",
  "problem", "error", "refund", "disappointed", "useless",
]

export function heuristicAnalyze(content: string, rating?: number | null): FeedbackAnalysis {
  const text = content.toLowerCase()

  let theme = "General"
  let featureArea = "Product"
  let bestHits = 0
  for (const entry of THEME_KEYWORDS) {
    const hits = entry.words.filter((w) => text.includes(w)).length
    if (hits > bestHits) {
      bestHits = hits
      theme = entry.theme
      featureArea = entry.featureArea
    }
  }

  let pos = POSITIVE_WORDS.filter((w) => text.includes(w)).length
  let neg = NEGATIVE_WORDS.filter((w) => text.includes(w)).length

  if (rating != null && !Number.isNaN(rating)) {
    if (rating >= 4) pos += 2
    else if (rating <= 2) neg += 2
  }

  let sentiment: SentimentLabel = "NEUTRAL"
  let sentimentScore = 0
  if (pos > neg) {
    sentiment = "POSITIVE"
    sentimentScore = Math.min(0.95, 0.45 + pos * 0.12)
  } else if (neg > pos) {
    sentiment = "NEGATIVE"
    sentimentScore = -Math.min(0.95, 0.45 + neg * 0.12)
  } else if (rating != null) {
    if (rating >= 4) {
      sentiment = "POSITIVE"
      sentimentScore = 0.6
    } else if (rating <= 2) {
      sentiment = "NEGATIVE"
      sentimentScore = -0.6
    }
  }

  const confidence = Math.min(0.92, 0.55 + bestHits * 0.1 + Math.abs(pos - neg) * 0.05)

  return { sentiment, sentimentScore, theme, featureArea, confidence }
}

function getGeminiModel() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.ANTHROPIC_API_KEY
  if (!apiKey) return null
  const genAI = new GoogleGenerativeAI(apiKey)
  return genAI.getGenerativeModel({ model: "gemini-3.5-flash" })
}

function parseSentimentLabel(raw: string): SentimentLabel {
  const v = raw.trim().toUpperCase()
  if (v.startsWith("POS")) return "POSITIVE"
  if (v.startsWith("NEG")) return "NEGATIVE"
  return "NEUTRAL"
}

/**
 * Analyze a single feedback item with Gemini, falling back to heuristics.
 */
export async function analyzeFeedback(
  content: string,
  options?: { channel?: string; rating?: number | null }
): Promise<FeedbackAnalysis> {
  const fallback = heuristicAnalyze(content, options?.rating)
  const model = getGeminiModel()
  if (!model) return fallback

  const prompt = `You are a customer feedback analyst for a SaaS product called LOOP.
Analyze this feedback and return ONLY valid JSON (no markdown):

{
  "sentiment": "POSITIVE" | "NEUTRAL" | "NEGATIVE",
  "sentimentScore": number between -1 and 1,
  "theme": "short theme name e.g. Billing, Login, Performance, UI/UX",
  "featureArea": "product area e.g. Payments, Authentication, Dashboard",
  "confidence": number between 0 and 1
}

Channel: ${options?.channel ?? "Unknown"}
${options?.rating != null ? `Rating: ${options.rating}/5` : ""}
Feedback: """${content.slice(0, 2000)}"""`

  try {
    const result = await withRetry(() => model.generateContent(prompt))
    const text = result.response.text()
    const cleaned = text.replace(/```json\n?/gi, "").replace(/```\n?/g, "").trim()
    const parsed = JSON.parse(cleaned) as {
      sentiment?: string
      sentimentScore?: number
      theme?: string
      featureArea?: string
      confidence?: number
    }

    const sentiment = parseSentimentLabel(parsed.sentiment ?? fallback.sentiment)
    let score =
      typeof parsed.sentimentScore === "number" && !Number.isNaN(parsed.sentimentScore)
        ? Math.max(-1, Math.min(1, parsed.sentimentScore))
        : fallback.sentimentScore

    // Align score sign with sentiment if model contradicts itself
    if (sentiment === "POSITIVE" && score < 0) score = Math.abs(score) || 0.6
    if (sentiment === "NEGATIVE" && score > 0) score = -Math.abs(score) || -0.6
    if (sentiment === "NEUTRAL") score = Math.max(-0.25, Math.min(0.25, score))

    return {
      sentiment,
      sentimentScore: score,
      theme: (parsed.theme || fallback.theme).trim().slice(0, 80) || fallback.theme,
      featureArea:
        (parsed.featureArea || fallback.featureArea).trim().slice(0, 80) ||
        fallback.featureArea,
      confidence:
        typeof parsed.confidence === "number"
          ? Math.max(0, Math.min(1, parsed.confidence))
          : fallback.confidence,
    }
  } catch (err) {
    console.warn("AI feedback analysis failed, using heuristic:", err)
    return fallback
  }
}

/**
 * Analyze many items with limited concurrency.
 * Uses heuristic-only mode when `fast` is true (bulk safety for large imports).
 */
export async function analyzeFeedbackBatch(
  items: Array<{ content: string; channel?: string; rating?: number | null }>,
  options?: { concurrency?: number; fast?: boolean }
): Promise<FeedbackAnalysis[]> {
  if (options?.fast || items.length > 40) {
    // Large bulk: heuristic is reliable + fast; still consistent for dashboards
    return items.map((i) => heuristicAnalyze(i.content, i.rating))
  }

  const concurrency = options?.concurrency ?? 4
  const results: FeedbackAnalysis[] = new Array(items.length)
  let idx = 0

  async function worker() {
    while (idx < items.length) {
      const current = idx++
      const item = items[current]
      results[current] = await analyzeFeedback(item.content, {
        channel: item.channel,
        rating: item.rating,
      })
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    () => worker()
  )
  await Promise.all(workers)
  return results
}
