import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { MessageSquare, Smile, Clock, Percent, Frown, CalendarDays } from 'lucide-react'

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

  if (!user.workspaceId) {
    return (
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">You are not part of a workspace yet.</p>
        </div>
      </div>
    )
  }

  const resolvedParams = await searchParams;
  const daysParam = parseInt(resolvedParams.days || "30", 10);
  const days = isNaN(daysParam) || daysParam < 1 ? 30 : daysParam;

  const [
    summary,
    sentimentBreakdown,
    volumeOverTime,
    channelDistribution,
    topThemes,
    themeGrowth,
    periodComparison,
    responseTimeDistribution
  ] = await Promise.all([
    getAnalyticsSummary(user.workspaceId, days),
    getSentimentBreakdown(user.workspaceId, days),
    getFeedbackVolumeOverTime(user.workspaceId, days),
    getChannelDistribution(user.workspaceId, days),
    getTopThemes(user.workspaceId, 6, days),
    getThemeGrowthOverTime(user.workspaceId, 8),
    getPeriodComparison(user.workspaceId, days),
    getResponseTimeDistribution(user.workspaceId, days)
  ])

  // Transform topThemes for the Recharts component if necessary
  const topThemesChartData = topThemes.map(t => ({
    theme: t.theme,
    mentions: t.mentions
  }))

  return (
    <>
    <div className="page-header">
      <div>
        <h1 className="page-title">Analytics</h1>
        <p className="page-subtitle">Deep-dive into trends, channel performance, and theme distribution.</p>
      </div>
      <AnalyticsHeaderClient
        summary={summary}
        sentiment={sentimentBreakdown}
        channels={channelDistribution}
        themes={topThemesChartData}
        activeDays={days}
      />
    </div>

    {/* Stat Cards */}
    <div className="analytics-stats-grid mb-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
      <div className="analytics-stat-card">
        <div className="analytics-stat-icon-wrapper blue">
          <MessageSquare size={20} />
        </div>
        <div className="analytics-stat-content">
          <span className="analytics-stat-label">Total Feedback</span>
          <span className="analytics-stat-value">{summary.totalFeedback.toLocaleString()}</span>
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
          <span className="analytics-stat-value">{summary.newThisWeek.toLocaleString()}</span>
        </div>
      </div>
      <div className="analytics-stat-card">
        <div className="analytics-stat-icon-wrapper green">
          <Smile size={20} />
        </div>
        <div className="analytics-stat-content">
          <span className="analytics-stat-label">Average CSAT</span>
          <span className="analytics-stat-value">{summary.avgSatisfaction} / 5.0</span>
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
    <div className="charts-row charts-row-2-col mb-6">
      <FeedbackVolumeChart data={volumeOverTime} />
      <SentimentDonutChart data={sentimentBreakdown} />
    </div>

    {/* Secondary Charts */}
    <div className="charts-row charts-row-equal mb-6">
      <TopThemesChart data={topThemesChartData} />
      <FeedbackChannelsChart data={channelDistribution} />
    </div>

    {/* Advanced Analytics Row */}
    <div className="charts-row charts-row-2-col mb-6">
      <ThemeGrowthTracker themes={themeGrowth} />
      <PeriodComparisonCard data={periodComparison} />
    </div>

    <div className="charts-row mb-6">
      <ResponseTimeChart data={responseTimeDistribution} />
    </div>
    </>
  )
}
