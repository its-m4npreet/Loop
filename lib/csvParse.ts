/**
 * Lightweight CSV parser (RFC 4180-ish).
 * Handles quoted fields, escaped quotes, and CRLF/LF line endings.
 */

export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ""
  let inQuotes = false

  // Strip BOM
  const input = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text

  for (let i = 0; i < input.length; i++) {
    const ch = input[i]
    const next = input[i + 1]

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"'
        i++
      } else if (ch === '"') {
        inQuotes = false
      } else {
        field += ch
      }
      continue
    }

    if (ch === '"') {
      inQuotes = true
    } else if (ch === ",") {
      row.push(field.trim())
      field = ""
    } else if (ch === "\n" || (ch === "\r" && next === "\n")) {
      if (ch === "\r") i++
      row.push(field.trim())
      field = ""
      // Skip completely empty trailing lines
      if (row.some((c) => c.length > 0)) rows.push(row)
      row = []
    } else if (ch === "\r") {
      row.push(field.trim())
      field = ""
      if (row.some((c) => c.length > 0)) rows.push(row)
      row = []
    } else {
      field += ch
    }
  }

  // Last field / row
  row.push(field.trim())
  if (row.some((c) => c.length > 0)) rows.push(row)

  return rows
}

/** Normalize header names for flexible column matching */
export function normalizeHeader(h: string): string {
  return h
    .trim()
    .toLowerCase()
    .replace(/[\s_\-]+/g, "")
    .replace(/[^a-z0-9]/g, "")
}

/** Map common CSV header aliases → canonical field keys */
const HEADER_ALIASES: Record<string, string> = {
  content: "content",
  feedback: "content",
  message: "content",
  text: "content",
  body: "content",
  comment: "content",
  comments: "content",

  channel: "channel",
  source: "channel",
  platform: "channel",

  customer: "customerLabel",
  customerlabel: "customerLabel",
  customername: "customerLabel",
  name: "customerLabel",
  user: "customerLabel",
  username: "customerLabel",

  sentiment: "sentiment",
  polarity: "sentiment",

  status: "status",

  theme: "theme",
  themes: "theme",
  category: "theme",
  tag: "theme",
  tags: "theme",

  satisfaction: "satisfaction",
  csat: "satisfaction",
  rating: "satisfaction",
  score: "satisfaction",

  responsetime: "responseTime",
  response: "responseTime",
  responsetimemins: "responseTime",
  responsetimeminutes: "responseTime",

  createdat: "createdAt",
  date: "createdAt",
  timestamp: "createdAt",
  submittedat: "createdAt",
  created: "createdAt",

  sourceref: "sourceRef",
  externalid: "sourceRef",
  ref: "sourceRef",
  reference: "sourceRef",
  ticketid: "sourceRef",
  id: "sourceRef",
}

export type CanonicalField =
  | "content"
  | "channel"
  | "customerLabel"
  | "sentiment"
  | "status"
  | "theme"
  | "satisfaction"
  | "responseTime"
  | "createdAt"
  | "sourceRef"

export function mapHeaders(headers: string[]): Map<number, CanonicalField> {
  const map = new Map<number, CanonicalField>()
  headers.forEach((h, i) => {
    const key = HEADER_ALIASES[normalizeHeader(h)]
    if (key) map.set(i, key as CanonicalField)
  })
  return map
}

export interface ParsedFeedbackRow {
  content: string
  channel: string
  customerLabel?: string
  sentiment: "POSITIVE" | "NEUTRAL" | "NEGATIVE"
  status: "NEW" | "REVIEWED" | "ACTIONED"
  theme?: string
  satisfaction?: number
  responseTime?: number
  createdAt?: Date
  sourceRef?: string
}

export interface ParseResult {
  rows: ParsedFeedbackRow[]
  errors: string[]
  skipped: number
}

function parseSentiment(raw: string | undefined): "POSITIVE" | "NEUTRAL" | "NEGATIVE" {
  if (!raw) return "NEUTRAL"
  const v = raw.trim().toLowerCase()
  if (["positive", "pos", "good", "happy", "+", "1", "p"].includes(v)) return "POSITIVE"
  if (["negative", "neg", "bad", "unhappy", "-", "0", "n"].includes(v)) return "NEGATIVE"
  if (["neutral", "neu", "mixed", "ok", "m"].includes(v)) return "NEUTRAL"
  // Try numeric scores (1–5 CSAT style, or -1/0/1)
  const num = Number(v)
  if (!Number.isNaN(num)) {
    if (num >= 4) return "POSITIVE"
    if (num <= 2 && num >= 1) return "NEGATIVE"
    if (num === 3) return "NEUTRAL"
    if (num > 0) return "POSITIVE"
    if (num < 0) return "NEGATIVE"
  }
  return "NEUTRAL"
}

function parseStatus(raw: string | undefined): "NEW" | "REVIEWED" | "ACTIONED" {
  if (!raw) return "NEW"
  const v = raw.trim().toLowerCase().replace(/[\s_\-]+/g, "")
  if (["new", "open", "pending", "unread"].includes(v)) return "NEW"
  if (["reviewed", "inprogress", "inreview", "processing"].includes(v)) return "REVIEWED"
  if (["actioned", "resolved", "closed", "done", "completed"].includes(v)) return "ACTIONED"
  return "NEW"
}

function parseOptionalFloat(raw: string | undefined): number | undefined {
  if (raw == null || raw === "") return undefined
  const n = Number(raw)
  if (Number.isNaN(n)) return undefined
  return n
}

function parseOptionalInt(raw: string | undefined): number | undefined {
  if (raw == null || raw === "") return undefined
  const n = parseInt(raw, 10)
  if (Number.isNaN(n)) return undefined
  return n
}

function parseOptionalDate(raw: string | undefined): Date | undefined {
  if (raw == null || raw === "") return undefined
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return undefined
  return d
}

/**
 * Convert raw CSV text into structured feedback rows.
 * Expects a header row. Rows missing content (or channel when required) are skipped.
 */
export function parseFeedbackCsv(
  text: string,
  options?: { maxRows?: number; requireChannel?: boolean }
): ParseResult {
  const maxRows = options?.maxRows ?? 5000
  const requireChannel = options?.requireChannel ?? false
  const table = parseCsv(text)

  if (table.length < 2) {
    return {
      rows: [],
      errors: ["CSV must include a header row and at least one data row."],
      skipped: 0,
    }
  }

  const headers = table[0]
  const colMap = mapHeaders(headers)

  const hasContent = [...colMap.values()].includes("content")
  if (!hasContent) {
    return {
      rows: [],
      errors: [
        "CSV must include a content column. Recognized headers: content, feedback, message, text, body, comment.",
      ],
      skipped: 0,
    }
  }

  const hasChannel = [...colMap.values()].includes("channel")
  if (requireChannel && !hasChannel) {
    return {
      rows: [],
      errors: [
        "CSV must include a channel column. Recognized headers: channel, source, platform.",
      ],
      skipped: 0,
    }
  }

  const rows: ParsedFeedbackRow[] = []
  const errors: string[] = []
  let skipped = 0

  const dataRows = table.slice(1)
  if (dataRows.length > maxRows) {
    errors.push(
      `File has ${dataRows.length} rows; only the first ${maxRows} will be imported.`
    )
  }

  dataRows.slice(0, maxRows).forEach((cells, idx) => {
    const lineNum = idx + 2 // 1-based + header
    const record: Partial<Record<CanonicalField, string>> = {}

    colMap.forEach((field, colIdx) => {
      const val = cells[colIdx] ?? ""
      if (val !== "") record[field] = val
    })

    const content = record.content?.trim()
    if (!content) {
      skipped++
      errors.push(`Row ${lineNum}: missing content`)
      return
    }

    const channelRaw = record.channel?.trim()
    if (requireChannel && !channelRaw) {
      skipped++
      errors.push(`Row ${lineNum}: missing channel`)
      return
    }

    const channel = (channelRaw || "CSV Import").slice(0, 100)
    const satisfaction = parseOptionalFloat(record.satisfaction)
    if (satisfaction != null && (satisfaction < 0 || satisfaction > 5)) {
      errors.push(`Row ${lineNum}: rating out of range (0–5), ignored.`)
    }

    rows.push({
      content: content.slice(0, 10000),
      channel,
      customerLabel: record.customerLabel?.trim().slice(0, 200) || undefined,
      sentiment: parseSentiment(record.sentiment),
      status: parseStatus(record.status),
      theme: record.theme?.trim().slice(0, 100) || undefined,
      satisfaction:
        satisfaction != null && satisfaction >= 0 && satisfaction <= 5
          ? satisfaction
          : undefined,
      responseTime: parseOptionalInt(record.responseTime),
      createdAt: parseOptionalDate(record.createdAt),
      sourceRef: record.sourceRef?.trim().slice(0, 200) || undefined,
    })
  })

  return { rows, errors, skipped }
}
