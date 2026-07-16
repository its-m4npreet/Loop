import { prisma } from "./prisma";

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 86400000);
}

function pctChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

function formatRelativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const SENTIMENT_LABEL: Record<string, string> = {
  POSITIVE: "Positive",
  NEUTRAL: "Neutral",
  NEGATIVE: "Negative",
};

const STATUS_LABEL: Record<string, string> = {
  NEW: "Open",
  REVIEWED: "In Progress",
  ACTIONED: "Resolved",
};

/** Dashboard KPI cards with week-over-week change */
export async function getDashboardStats(workspaceId: string) {
  const thisWeekStart = daysAgo(7);
  const lastWeekStart = daysAgo(14);

  const [
    totalFeedback,
    positive,
    negative,
    neutral,
    themeCount,
    reportCount,
    // this week
    twTotal,
    twPositive,
    twNegative,
    twNeutral,
    // last week
    lwTotal,
    lwPositive,
    lwNegative,
    lwNeutral,
    twThemes,
    lwThemes,
    twReports,
    lwReports,
  ] = await Promise.all([
    prisma.feedback.count({ where: { workspaceId } }),
    prisma.feedback.count({ where: { workspaceId, sentiment: "POSITIVE" } }),
    prisma.feedback.count({ where: { workspaceId, sentiment: "NEGATIVE" } }),
    prisma.feedback.count({ where: { workspaceId, sentiment: "NEUTRAL" } }),
    prisma.theme.count({ where: { workspaceId } }),
    prisma.report.count({ where: { workspaceId } }),

    prisma.feedback.count({
      where: { workspaceId, createdAt: { gte: thisWeekStart } },
    }),
    prisma.feedback.count({
      where: {
        workspaceId,
        sentiment: "POSITIVE",
        createdAt: { gte: thisWeekStart },
      },
    }),
    prisma.feedback.count({
      where: {
        workspaceId,
        sentiment: "NEGATIVE",
        createdAt: { gte: thisWeekStart },
      },
    }),
    prisma.feedback.count({
      where: {
        workspaceId,
        sentiment: "NEUTRAL",
        createdAt: { gte: thisWeekStart },
      },
    }),

    prisma.feedback.count({
      where: {
        workspaceId,
        createdAt: { gte: lastWeekStart, lt: thisWeekStart },
      },
    }),
    prisma.feedback.count({
      where: {
        workspaceId,
        sentiment: "POSITIVE",
        createdAt: { gte: lastWeekStart, lt: thisWeekStart },
      },
    }),
    prisma.feedback.count({
      where: {
        workspaceId,
        sentiment: "NEGATIVE",
        createdAt: { gte: lastWeekStart, lt: thisWeekStart },
      },
    }),
    prisma.feedback.count({
      where: {
        workspaceId,
        sentiment: "NEUTRAL",
        createdAt: { gte: lastWeekStart, lt: thisWeekStart },
      },
    }),

    // themes created this/last week not tracked well — use themes with mentions this week
    prisma.feedbackTheme.count({
      where: {
        feedback: { workspaceId, createdAt: { gte: thisWeekStart } },
      },
    }),
    prisma.feedbackTheme.count({
      where: {
        feedback: {
          workspaceId,
          createdAt: { gte: lastWeekStart, lt: thisWeekStart },
        },
      },
    }),
    prisma.report.count({
      where: { workspaceId, createdAt: { gte: thisWeekStart } },
    }),
    prisma.report.count({
      where: {
        workspaceId,
        createdAt: { gte: lastWeekStart, lt: thisWeekStart },
      },
    }),
  ]);

  const fmtChange = (c: number) =>
    `${c > 0 ? "+" : ""}${c}%`;

  // For themes card show absolute theme count change from mention activity ratio
  const themeChange = pctChange(twThemes, lwThemes);
  const reportChange = pctChange(twReports, lwReports);

  return [
    {
      id: "total-feedback",
      icon: "MessageSquare",
      title: "Total Feedback",
      value: totalFeedback.toLocaleString(),
      change: fmtChange(pctChange(twTotal, lwTotal)),
      changeType: (pctChange(twTotal, lwTotal) >= 0
        ? "positive"
        : "negative") as "positive" | "negative",
      description: "vs last week",
    },
    {
      id: "positive-sentiment",
      icon: "ThumbsUp",
      title: "Positive Sentiment",
      value: positive.toLocaleString(),
      change: fmtChange(pctChange(twPositive, lwPositive)),
      changeType: (pctChange(twPositive, lwPositive) >= 0
        ? "positive"
        : "negative") as "positive" | "negative",
      description: "vs last week",
    },
    {
      id: "negative-sentiment",
      icon: "ThumbsDown",
      title: "Negative Sentiment",
      value: negative.toLocaleString(),
      change: fmtChange(pctChange(twNegative, lwNegative)),
      // For negatives, a drop is good — still show numeric direction
      changeType: (pctChange(twNegative, lwNegative) <= 0
        ? "positive"
        : "negative") as "positive" | "negative",
      description: "vs last week",
    },
    {
      id: "neutral-sentiment",
      icon: "Minus",
      title: "Neutral Sentiment",
      value: neutral.toLocaleString(),
      change: fmtChange(pctChange(twNeutral, lwNeutral)),
      changeType: (pctChange(twNeutral, lwNeutral) >= 0
        ? "positive"
        : "negative") as "positive" | "negative",
      description: "vs last week",
    },
    {
      id: "active-themes",
      icon: "Tag",
      title: "Active Themes",
      value: themeCount.toLocaleString(),
      change: fmtChange(themeChange),
      changeType: (themeChange >= 0 ? "positive" : "negative") as
        | "positive"
        | "negative",
      description: "mentions vs last week",
    },
    {
      id: "reports-generated",
      icon: "FileText",
      title: "Reports Generated",
      value: reportCount.toLocaleString(),
      change: fmtChange(reportChange),
      changeType: (reportChange >= 0 ? "positive" : "negative") as
        | "positive"
        | "negative",
      description: "vs last week",
    },
  ];
}

/** Recent feedback rows for tables */
export async function getRecentFeedback(
  workspaceId: string,
  limit = 100
) {
  const rows = await prisma.feedback.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      themes: {
        include: { theme: { select: { name: true } } },
        take: 1,
      },
    },
  });

  return rows.map((f) => ({
    id: f.id,
    customer: f.customerLabel || "Unknown",
    feedback: f.content,
    channel: f.channel,
    theme: f.themes[0]?.theme.name ?? "—",
    sentiment: SENTIMENT_LABEL[f.sentiment] ?? f.sentiment,
    status: STATUS_LABEL[f.status] ?? f.status,
    time: formatRelativeTime(f.createdAt),
    createdAt: f.createdAt.toISOString(),
  }));
}

/** Rule-based insights from real workspace data (no mock copy) */
export async function getDashboardInsights(workspaceId: string) {
  const thisWeekStart = daysAgo(7);
  const lastWeekStart = daysAgo(14);

  const [
    thisWeekTotal,
    lastWeekTotal,
    thisWeekNeg,
    lastWeekNeg,
    thisWeekPos,
    themes,
  ] = await Promise.all([
    prisma.feedback.count({
      where: { workspaceId, createdAt: { gte: thisWeekStart } },
    }),
    prisma.feedback.count({
      where: {
        workspaceId,
        createdAt: { gte: lastWeekStart, lt: thisWeekStart },
      },
    }),
    prisma.feedback.count({
      where: {
        workspaceId,
        sentiment: "NEGATIVE",
        createdAt: { gte: thisWeekStart },
      },
    }),
    prisma.feedback.count({
      where: {
        workspaceId,
        sentiment: "NEGATIVE",
        createdAt: { gte: lastWeekStart, lt: thisWeekStart },
      },
    }),
    prisma.feedback.count({
      where: {
        workspaceId,
        sentiment: "POSITIVE",
        createdAt: { gte: thisWeekStart },
      },
    }),
    prisma.theme.findMany({
      where: { workspaceId },
      include: {
        feedbacks: {
          include: {
            feedback: {
              select: { createdAt: true, sentiment: true, content: true },
            },
          },
        },
      },
    }),
  ]);

  const volumeChange = pctChange(thisWeekTotal, lastWeekTotal);
  const negChange = pctChange(thisWeekNeg, lastWeekNeg);

  // Theme with most negative feedback this week
  let topIssueTheme = { name: "General", count: 0, neg: 0 };
  let topPositiveTheme = { name: "General", count: 0, pos: 0 };

  for (const theme of themes) {
    const thisWeek = theme.feedbacks.filter(
      (ft) => ft.feedback.createdAt >= thisWeekStart
    );
    const neg = thisWeek.filter((ft) => ft.feedback.sentiment === "NEGATIVE")
      .length;
    const pos = thisWeek.filter((ft) => ft.feedback.sentiment === "POSITIVE")
      .length;
    if (neg > topIssueTheme.neg) {
      topIssueTheme = { name: theme.name, count: thisWeek.length, neg };
    }
    if (pos > topPositiveTheme.pos) {
      topPositiveTheme = { name: theme.name, count: thisWeek.length, pos };
    }
  }

  const risingRiskCount = await prisma.feedback.count({
    where: {
      workspaceId,
      sentiment: "NEGATIVE",
      status: { in: ["NEW", "REVIEWED"] },
      createdAt: { gte: thisWeekStart },
    },
  });

  const weeklySummary =
    thisWeekTotal === 0
      ? "No feedback was recorded in the last 7 days. Import or collect feedback to generate insights."
      : `Customer feedback volume ${
          volumeChange >= 0 ? "increased" : "decreased"
        } ${Math.abs(volumeChange)}% this week (${thisWeekTotal.toLocaleString()} items). Negative feedback ${
          negChange >= 0 ? "rose" : "fell"
        } ${Math.abs(negChange)}% week-over-week.`;

  return {
    weeklySummary,
    topIssue: {
      title:
        topIssueTheme.neg > 0
          ? `${topIssueTheme.name} Issues`
          : "No major issue cluster",
      detail:
        topIssueTheme.neg > 0
          ? `${topIssueTheme.name} led negative feedback this week with ${topIssueTheme.neg} negative mention${
              topIssueTheme.neg === 1 ? "" : "s"
            } out of ${topIssueTheme.count} total for that theme.`
          : "Negative feedback is evenly distributed — no single theme dominates this week.",
    },
    recommendation: {
      title:
        topIssueTheme.neg > 0
          ? `Address ${topIssueTheme.name}`
          : "Keep monitoring",
      detail:
        topIssueTheme.neg > 0
          ? `Prioritize review of open ${topIssueTheme.name} tickets and share findings with the owning team. Reducing friction here should cut negative volume next week.`
          : "Continue tracking theme trends. When a theme spikes negative, route it to the responsible squad quickly.",
    },
    riskAlert: {
      title:
        risingRiskCount > 0
          ? "Open Negative Feedback"
          : "No elevated risk",
      detail:
        risingRiskCount > 0
          ? `${risingRiskCount} unresolved negative feedback item${
              risingRiskCount === 1 ? "" : "s"
            } from the last 7 days still need attention.`
          : "There are no open negative items from the past week. Keep the loop closed on new feedback.",
    },
    positiveHighlight:
      topPositiveTheme.pos > 0
        ? `Customers respond well to ${topPositiveTheme.name} — ${topPositiveTheme.pos} positive mention${
            topPositiveTheme.pos === 1 ? "" : "s"
          } this week out of ${thisWeekPos.toLocaleString()} total positives.`
        : thisWeekPos > 0
          ? `${thisWeekPos.toLocaleString()} positive feedback entries this week. No single theme dominates the praise yet.`
          : "No positive feedback recorded this week yet.",
  };
}
