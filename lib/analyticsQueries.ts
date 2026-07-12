import { prisma } from "./prisma";

// ── Helper: date N days ago ──
function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 86400000);
}

// ── 1. Summary Stats ──
export async function getAnalyticsSummary(workspaceId: string, days?: number) {
  const where = {
    workspaceId,
    ...(days ? { createdAt: { gte: daysAgo(days) } } : {})
  };

  const oneWeekAgo = new Date(Date.now() - 7 * 86400000);

  const [
    totalFeedback,
    actionedCount,
    feedbackWithResponse,
    feedbackWithSatisfaction,
    newThisWeek,
    negativeCount
  ] = await Promise.all([
    prisma.feedback.count({ where }),
    prisma.feedback.count({ where: { ...where, status: "ACTIONED" } }),
    prisma.feedback.findMany({
      where: { ...where, responseTime: { not: null } },
      select: { responseTime: true },
    }),
    prisma.feedback.findMany({
      where: { ...where, satisfaction: { not: null } },
      select: { satisfaction: true },
    }),
    prisma.feedback.count({
      where: { workspaceId, createdAt: { gte: oneWeekAgo } }
    }),
    prisma.feedback.count({
      where: { ...where, sentiment: "NEGATIVE" }
    })
  ]);

  const avgResponseTime =
    feedbackWithResponse.length > 0
      ? Math.round(
          feedbackWithResponse.reduce((sum, f) => sum + (f.responseTime ?? 0), 0) /
            feedbackWithResponse.length
        )
      : 0;

  const avgSatisfaction =
    feedbackWithSatisfaction.length > 0
      ? parseFloat(
          (
            feedbackWithSatisfaction.reduce((sum, f) => sum + (f.satisfaction ?? 0), 0) /
            feedbackWithSatisfaction.length
          ).toFixed(1)
        )
      : 0;

  const resolutionRate =
    totalFeedback > 0 ? Math.round((actionedCount / totalFeedback) * 100) : 0;

  const negativePct =
    totalFeedback > 0 ? Math.round((negativeCount / totalFeedback) * 100) : 0;

  return { totalFeedback, resolutionRate, avgResponseTime, avgSatisfaction, newThisWeek, negativePct };
}

// ── 2. Sentiment Breakdown ──
export async function getSentimentBreakdown(workspaceId: string, days?: number) {
  const where = {
    workspaceId,
    ...(days ? { createdAt: { gte: daysAgo(days) } } : {})
  };

  const [positive, neutral, negative] = await Promise.all([
    prisma.feedback.count({ where: { ...where, sentiment: "POSITIVE" } }),
    prisma.feedback.count({ where: { ...where, sentiment: "NEUTRAL" } }),
    prisma.feedback.count({ where: { ...where, sentiment: "NEGATIVE" } }),
  ]);
  const total = positive + neutral + negative;
  return [
    { name: "Positive", value: total > 0 ? Math.round((positive / total) * 100) : 0, count: positive, color: "#22C55E" },
    { name: "Neutral", value: total > 0 ? Math.round((neutral / total) * 100) : 0, count: neutral, color: "#94A3B8" },
    { name: "Negative", value: total > 0 ? Math.round((negative / total) * 100) : 0, count: negative, color: "#F87171" },
  ];
}

// ── 3. Feedback Volume Over Time ──
export async function getFeedbackVolumeOverTime(workspaceId: string, days = 30) {
  const since = daysAgo(days);
  const feedback = await prisma.feedback.findMany({
    where: { workspaceId, createdAt: { gte: since } },
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  // Group by date string
  const map = new Map<string, number>();
  for (let d = days; d >= 0; d--) {
    const date = daysAgo(d);
    const key = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    map.set(key, 0);
  }
  for (const f of feedback) {
    const key = f.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    map.set(key, (map.get(key) ?? 0) + 1);
  }

  return Array.from(map.entries()).map(([date, count]) => ({ date, count }));
}

// ── 4. Channel Distribution ──
export async function getChannelDistribution(workspaceId: string, days?: number) {
  const where = {
    workspaceId,
    ...(days ? { createdAt: { gte: daysAgo(days) } } : {})
  };

  const feedback = await prisma.feedback.groupBy({
    by: ["channel"],
    where,
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
  });

  return feedback.map((f) => ({ channel: f.channel, count: f._count.id }));
}

// ── 5. Top Themes ──
export async function getTopThemes(workspaceId: string, limit = 6, days?: number) {
  const now = new Date();
  const oneWeekAgo = daysAgo(7);
  const twoWeeksAgo = daysAgo(14);

  const themes = await prisma.theme.findMany({
    where: { workspaceId },
    include: {
      feedbacks: {
        include: { feedback: { select: { createdAt: true } } },
      },
    },
  });

  const result = themes
    .map((theme) => {
      const filteredFeedbacks = days
        ? theme.feedbacks.filter((ft) => ft.feedback.createdAt >= daysAgo(days))
        : theme.feedbacks;
      const totalMentions = filteredFeedbacks.length;
      const thisWeek = theme.feedbacks.filter(
        (ft) => ft.feedback.createdAt >= oneWeekAgo && ft.feedback.createdAt <= now
      ).length;
      const lastWeek = theme.feedbacks.filter(
        (ft) => ft.feedback.createdAt >= twoWeeksAgo && ft.feedback.createdAt < oneWeekAgo
      ).length;
      const weeklyChange = lastWeek > 0 ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : 0;

      return {
        theme: theme.name,
        mentions: totalMentions,
        color: theme.color,
        thisWeek,
        lastWeek,
        weeklyChange,
      };
    })
    .sort((a, b) => b.mentions - a.mentions)
    .slice(0, limit);

  return result;
}

// ── 6. Theme Growth Over Time (weekly buckets for sparklines) ──
export async function getThemeGrowthOverTime(workspaceId: string, weeks = 8) {
  const themes = await prisma.theme.findMany({
    where: { workspaceId },
    include: {
      feedbacks: {
        include: { feedback: { select: { createdAt: true } } },
      },
    },
  });

  const result = themes.map((theme) => {
    const weeklyData = [];
    for (let w = weeks - 1; w >= 0; w--) {
      const weekStart = daysAgo((w + 1) * 7);
      const weekEnd = daysAgo(w * 7);
      const count = theme.feedbacks.filter(
        (ft) => ft.feedback.createdAt >= weekStart && ft.feedback.createdAt < weekEnd
      ).length;
      weeklyData.push(count);
    }
    return {
      theme: theme.name,
      color: theme.color,
      data: weeklyData,
      total: theme.feedbacks.length,
    };
  });

  return result.sort((a, b) => b.total - a.total);
}

// ── 7. Period Comparison ──
export async function getPeriodComparison(workspaceId: string, periodDays = 30) {
  const currentStart = daysAgo(periodDays);
  const previousStart = daysAgo(periodDays * 2);
  const previousEnd = daysAgo(periodDays);

  const [currentFeedback, previousFeedback, currentNeg, previousNeg] = await Promise.all([
    prisma.feedback.count({ where: { workspaceId, createdAt: { gte: currentStart } } }),
    prisma.feedback.count({ where: { workspaceId, createdAt: { gte: previousStart, lt: previousEnd } } }),
    prisma.feedback.count({ where: { workspaceId, createdAt: { gte: currentStart }, sentiment: "NEGATIVE" } }),
    prisma.feedback.count({ where: { workspaceId, createdAt: { gte: previousStart, lt: previousEnd }, sentiment: "NEGATIVE" } }),
  ]);

  const volumeChange = previousFeedback > 0
    ? Math.round(((currentFeedback - previousFeedback) / previousFeedback) * 100)
    : 0;

  const currentNegPct = currentFeedback > 0 ? Math.round((currentNeg / currentFeedback) * 100) : 0;
  const previousNegPct = previousFeedback > 0 ? Math.round((previousNeg / previousFeedback) * 100) : 0;
  const negChange = previousNegPct > 0
    ? Math.round(((currentNegPct - previousNegPct) / previousNegPct) * 100)
    : 0;

  return {
    current: {
      totalFeedback: currentFeedback,
      negativePct: currentNegPct,
    },
    previous: {
      totalFeedback: previousFeedback,
      negativePct: previousNegPct,
    },
    volumeChange,
    negChange,
    periodLabel: `Last ${periodDays} days`,
  };
}

// ── 8. Response Time Distribution ──
export async function getResponseTimeDistribution(workspaceId: string, days?: number) {
  const where = {
    workspaceId,
    responseTime: { not: null },
    ...(days ? { createdAt: { gte: daysAgo(days) } } : {})
  };

  const feedback = await prisma.feedback.findMany({
    where,
    select: { responseTime: true },
  });

  const buckets = [
    { label: "< 30m", min: 0, max: 30, count: 0 },
    { label: "30m–1h", min: 30, max: 60, count: 0 },
    { label: "1–2h", min: 60, max: 120, count: 0 },
    { label: "2–4h", min: 120, max: 240, count: 0 },
    { label: "4–8h", min: 240, max: 480, count: 0 },
    { label: "8h+", min: 480, max: Infinity, count: 0 },
  ];

  for (const f of feedback) {
    const rt = f.responseTime ?? 0;
    for (const bucket of buckets) {
      if (rt >= bucket.min && rt < bucket.max) {
        bucket.count++;
        break;
      }
    }
  }

  return buckets.map((b) => ({ label: b.label, count: b.count }));
}
