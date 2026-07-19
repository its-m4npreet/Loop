import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { MessageSquare, Smile, Clock, Percent, Frown, CalendarDays } from 'lucide-react'
import Link from 'next/link'

import FeedbackVolumeChart from '../../components/chats/FeedbackVolumeChart'
import FeedbackChannelsChart from '../../components/chats/FeedbackChannelsChart'
import TopThemesChart from '../../components/chats/TopThemesChart'
import SentimentDonutChart from '../../components/chats/SentimentDonutChart'
import ResponseTimeChart from '../../components/chats/ResponseTimeChart'
import ThemeGrowthTracker from '../../components/chats/ThemeGrowthTracker'
import PeriodComparisonCard from '../../components/chats/PeriodComparisonCard'
import AnalyticsHeaderClient from './AnalyticsHeaderClient'

import {
  getAnalyticsSummary,
  getSentimentBreakdown,
  getFeedbackVolumeOverTime,
  getChannelDistribution,
  getTopThemes,
  getThemeGrowthOverTime,
  getPeriodComparison,
  getResponseTimeDistribution
} from "@/lib/analyticsQueries"

import './page.css'

interface PageProps {
  searchParams: Promise<{ days?: string }>;
}

export default async function AnalyticsPage({ searchParams }: PageProps) {
  const session = await auth()
  if (!session?.user?.id) redirect("/api/auth")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, workspaceId: true },
  })
  if (!user) redirect("/api/auth")

  const hasWorkspace = !!user.workspaceId
  const workspaceId = user.workspaceId ?? ''

  const resolvedParams = await searchParams;
  const daysParam = parseInt(resolvedParams.days || "30", 10);
  const days = isNaN(daysParam) || daysParam < 1 ? 30 : daysParam;

  let summary: Awaited<ReturnType<typeof getAnalyticsSummary>> = { totalFeedback: 0, negativePct: 0, newThisWeek: 0, avgSatisfaction: 0, avgResponseTime: 0, resolutionRate: 0 } as Awaited<ReturnType<typeof getAnalyticsSummary>>
  let sentimentBreakdown: Awaited<ReturnType<typeof getSentimentBreakdown>> = []
  let volumeOverTime: Awaited<ReturnType<typeof getFeedbackVolumeOverTime>> = []
  let channelDistribution: Awaited<ReturnType<typeof getChannelDistribution>> = []
  let topThemes: Awaited<ReturnType<typeof getTopThemes>> = []
  let themeGrowth: Awaited<ReturnType<typeof getThemeGrowthOverTime>> = []
  let periodComparison: Awaited<ReturnType<typeof getPeriodComparison>> = { current: { totalFeedback: 0, positivePct: 0, negativePct: 0, resolutionRate: 0, avgResponseTime: 0, avgSatisfaction: 0 }, previous: { totalFeedback: 0, positivePct: 0, negativePct: 0, resolutionRate: 0, avgResponseTime: 0, avgSatisfaction: 0 }, volumeChange: 0, posChange: 0, negChange: 0, resolutionChange: 0, responseChange: 0, csatChange: 0, periodLabel: '' } as Awaited<ReturnType<typeof getPeriodComparison>>
  let responseTimeDistribution: Awaited<ReturnType<typeof getResponseTimeDistribution>> = []

  if (hasWorkspace) {
    ;[
      summary,
      sentimentBreakdown,
      volumeOverTime,
      channelDistribution,
      topThemes,
      themeGrowth,
      periodComparison,
      responseTimeDistribution
    ] = await Promise.all([
      getAnalyticsSummary(workspaceId, days),
      getSentimentBreakdown(workspaceId, days),
      getFeedbackVolumeOverTime(workspaceId, days),
      getChannelDistribution(workspaceId, days),
      getTopThemes(workspaceId, 6, days),
      getThemeGrowthOverTime(workspaceId, 8),
      getPeriodComparison(workspaceId, days),
      getResponseTimeDistribution(workspaceId, days)
    ])
  }

  const topThemesChartData = topThemes.map(t => ({
    theme: t.theme,
    mentions: t.mentions
  }))

  return (
    <div className="analytics-page">
      <div className="page-header analytics-page-header">
        <div className="analytics-page-header-text">
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">
            Deep-dive into trends, channel performance, and theme distribution.
          </p>
        </div>
        <AnalyticsHeaderClient
          summary={summary}
          sentiment={sentimentBreakdown}
          channels={channelDistribution}
          themes={topThemesChartData}
          activeDays={days}
        />
      </div>

      {!hasWorkspace && (
        <div className="workspace-nudge">
          <span>Create or join a workspace to start seeing analytics.</span>
          <Link href="/workspace">Go to Workspace</Link>
        </div>
      )}

      {/* Stat Cards */}
      <div className="analytics-stats-grid">
        <div className="analytics-stat-card">
          <div className="analytics-stat-icon-wrapper blue">
            <MessageSquare size={20} />
          </div>
          <div className="analytics-stat-content">
            <span className="analytics-stat-label">Total Feedback</span>
            <span className="analytics-stat-value">
              {summary.totalFeedback.toLocaleString()}
            </span>
          </div>
        </div>
        <div className="analytics-stat-card">
          <div className="analytics-stat-icon-wrapper red">
            <Frown size={20} />
          </div>
          <div className="analytics-stat-content">
            <span className="analytics-stat-label">% Negative</span>
            <span className="analytics-stat-value">{summary.negativePct}%</span>
          </div>
        </div>
        <div className="analytics-stat-card">
          <div className="analytics-stat-icon-wrapper teal">
            <CalendarDays size={20} />
          </div>
          <div className="analytics-stat-content">
            <span className="analytics-stat-label">New This Week</span>
            <span className="analytics-stat-value">
              {summary.newThisWeek.toLocaleString()}
            </span>
          </div>
        </div>
        <div className="analytics-stat-card">
          <div className="analytics-stat-icon-wrapper green">
            <Smile size={20} />
          </div>
          <div className="analytics-stat-content">
            <span className="analytics-stat-label">Average CSAT</span>
            <span className="analytics-stat-value">
              {summary.avgSatisfaction} / 5.0
            </span>
          </div>
        </div>
        <div className="analytics-stat-card">
          <div className="analytics-stat-icon-wrapper orange">
            <Clock size={20} />
          </div>
          <div className="analytics-stat-content">
            <span className="analytics-stat-label">Avg Response Time</span>
            <span className="analytics-stat-value">
              {summary.avgResponseTime > 60
                ? `${Math.floor(summary.avgResponseTime / 60)}h ${summary.avgResponseTime % 60}m`
                : `${summary.avgResponseTime}m`}
            </span>
          </div>
        </div>
        <div className="analytics-stat-card">
          <div className="analytics-stat-icon-wrapper purple">
            <Percent size={20} />
          </div>
          <div className="analytics-stat-content">
            <span className="analytics-stat-label">Resolution Rate</span>
            <span className="analytics-stat-value">{summary.resolutionRate}%</span>
          </div>
        </div>
      </div>

      {/* Primary Charts */}
      <div className="charts-row charts-row-2-col">
        <FeedbackVolumeChart data={volumeOverTime} />
        <SentimentDonutChart data={sentimentBreakdown} />
      </div>

      {/* Secondary Charts */}
      <div className="charts-row charts-row-equal">
        <TopThemesChart data={topThemesChartData} />
        <FeedbackChannelsChart data={channelDistribution} />
      </div>

      {/* Advanced Analytics Row */}
      <div className="charts-row charts-row-2-col">
        <ThemeGrowthTracker themes={themeGrowth} />
        <PeriodComparisonCard data={periodComparison} />
      </div>

      <div className="charts-row">
        <ResponseTimeChart data={responseTimeDistribution} />
      </div>
    </div>
  )
}
