import { NextResponse } from "next/server"
import { prisma, type Plan } from "@/lib/prisma"
import { logger } from "@/lib/logger"

export interface PlanLimits {
  askLoop: number
  reports: number
  imports: number
  seats: number
}

export interface PlanMeta {
  label: string
  monthlyPriceCents: number | null
  blurb: string
  features: string[]
  limits: PlanLimits
}

export const PLANS: Record<Plan, PlanMeta> = {
  FREE: {
    label: "Free",
    monthlyPriceCents: 0,
    blurb: "Everything you need to get started with feedback analysis.",
    limits: { askLoop: 20, reports: 3, imports: 200, seats: 3 },
    features: [
      "20 Ask LOOP messages / month",
      "3 reports / month",
      "200 feedback imports / month",
      "3 team seats",
      "Community support",
    ],
  },
  PRO: {
    label: "Professional",
    monthlyPriceCents: 4900,
    blurb: "For growing teams that need more volume and collaboration.",
    limits: { askLoop: 500, reports: 50, imports: 5_000, seats: 20 },
    features: [
      "500 Ask LOOP messages / month",
      "50 reports / month",
      "5,000 feedback imports / month",
      "20 team seats",
      "Priority support",
    ],
  },
  BUSINESS: {
    label: "Business",
    monthlyPriceCents: null,
    blurb: "For teams that need scale and a custom plan.",
    limits: { askLoop: 1_000_000, reports: 1_000_000, imports: 1_000_000, seats: 1_000 },
    features: [
      "Unlimited Ask LOOP messages",
      "Unlimited reports",
      "Unlimited feedback imports",
      "Unlimited team seats",
      "Custom onboarding & support",
    ],
  },
}

export const DEFAULT_PLAN: Plan = "FREE"

export type UsageMetric = "askLoop" | "reports" | "imports"

const USAGE_FIELD: Record<UsageMetric, "askLoopUsed" | "reportsUsed" | "importsUsed"> = {
  askLoop: "askLoopUsed",
  reports: "reportsUsed",
  imports: "importsUsed",
}

function monthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`
}

export interface WorkspaceUsage {
  plan: Plan
  usagePeriodStart: Date | null
  limits: PlanLimits
  used: { askLoop: number; reports: number; imports: number; seats: number }
}

/**
 * Reads a workspace's plan and current monthly usage. Usage counters belong to
 * the month that opened when they were first touched; when that month has
 * rolled over, effective usage is 0 (the counters reset lazily on the next
 * consume).
 */
export async function getWorkspaceUsage(workspaceId: string): Promise<WorkspaceUsage | null> {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: {
      plan: true,
      usagePeriodStart: true,
      askLoopUsed: true,
      reportsUsed: true,
      importsUsed: true,
    },
  })
  if (!workspace) return null

  const inMonth = workspace.usagePeriodStart
    ? monthKey(workspace.usagePeriodStart) === monthKey(new Date())
    : false

  const seats = await prisma.user.count({
    where: { workspaceId, isActive: true },
  })

  return {
    plan: workspace.plan,
    usagePeriodStart: workspace.usagePeriodStart,
    limits: PLANS[workspace.plan].limits,
    used: {
      askLoop: inMonth ? workspace.askLoopUsed : 0,
      reports: inMonth ? workspace.reportsUsed : 0,
      imports: inMonth ? workspace.importsUsed : 0,
      seats,
    },
  }
}

const USAGE_LABEL: Record<UsageMetric, string> = {
  askLoop: "Ask LOOP messages",
  reports: "Report generations",
  imports: "Feedback imports",
}

/**
 * Enforces a monthly usage limit and, when allowed, atomically increments the
 * counter for the current window (rolling it over if a new month started).
 * Returns an error response the caller should short-circuit with when the
 * limit is exceeded; otherwise null. Increments happen BEFORE heavy work so a
 * failed generation still counts toward the budget.
 */
export async function enforceUsageLimit(
  workspaceId: string,
  metric: UsageMetric,
  amount = 1
): Promise<NextResponse | null> {
  const usage = await getWorkspaceUsage(workspaceId)
  if (!usage) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
  }

  const used = usage.used[metric]
  const limit = usage.limits[metric]

  if (used + amount > limit) {
    return NextResponse.json(
      {
        error: `${USAGE_LABEL[metric]} limit reached this billing period (${used}/${limit}). Upgrade your plan to lift the limit.`,
      },
      { status: 402 }
    )
  }

  const now = new Date()
  const inMonth = usage.usagePeriodStart ? monthKey(usage.usagePeriodStart) === monthKey(now) : false
  const next = inMonth ? used + amount : amount

  try {
    await prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        usagePeriodStart: now,
        [USAGE_FIELD[metric]]: next,
      },
    })
  } catch (error) {
    logger.warn("Failed to record usage", { workspaceId, metric, error })
  }

  return null
}

/**
 * Enforces the seat limit for a plan. Counts active members plus still-open
 * invitations against the plan's seat cap.
 */
export async function enforceSeatLimit(workspaceId: string): Promise<NextResponse | null> {
  const usage = await getWorkspaceUsage(workspaceId)
  if (!usage) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
  }

  const pending = await prisma.invitation.count({
    where: { workspaceId, acceptedAt: null, expiresAt: { gt: new Date() } },
  })
  const seats = usage.used.seats + pending
  const limit = usage.limits.seats

  if (seats >= limit) {
    return NextResponse.json(
      {
        error: `Seat limit reached for this plan (${limit} seats in use). Remove a member or upgrade your plan to add more.`,
      },
      { status: 402 }
    )
  }

  return null
}

export function planLabel(plan: Plan): string {
  return PLANS[plan]?.label ?? "Free"
}