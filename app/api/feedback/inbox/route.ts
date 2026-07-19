import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireWorkspaceUser } from "@/lib/workspaceAuth"

const SENTIMENT_LABEL: Record<string, string> = {
  POSITIVE: "Positive",
  NEUTRAL: "Neutral",
  NEGATIVE: "Negative",
}

const STATUS_LABEL: Record<string, string> = {
  NEW: "Open",
  REVIEWED: "In Progress",
  ACTIONED: "Resolved",
}

function formatRelativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return "Just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export async function GET(request: NextRequest) {
  const authResult = await requireWorkspaceUser()
  if ("error" in authResult) return authResult.error

  const { workspaceId } = authResult.user
  const { searchParams } = new URL(request.url)
  const skip = Math.max(0, parseInt(searchParams.get("skip") || "0", 10))
  const take = Math.min(100, Math.max(1, parseInt(searchParams.get("take") || "10", 10)))

  const [rows, total] = await Promise.all([
    prisma.feedback.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
      skip,
      take,
      include: {
        themes: {
          include: { theme: { select: { name: true } } },
          take: 1,
        },
      },
    }),
    prisma.feedback.count({ where: { workspaceId } }),
  ])

  const data = rows.map((f) => ({
    id: f.id,
    customer: f.customerLabel || "Unknown",
    feedback: f.content,
    channel: f.channel,
    theme: f.themes[0]?.theme.name ?? "—",
    sentiment: SENTIMENT_LABEL[f.sentiment] ?? f.sentiment,
    status: STATUS_LABEL[f.status] ?? f.status,
    time: formatRelativeTime(f.createdAt),
  }))

  return NextResponse.json({ data, total })
}
