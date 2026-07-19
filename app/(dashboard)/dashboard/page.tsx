import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { FileBarChart, Upload } from 'lucide-react'
import Link from 'next/link'

import StatCard, { type Stat } from '../../components/cards/StatCard'
import ThemeCard, { type Theme } from '../../components/cards/ThemeCard'
import FeedbackVolumeChart from '../../components/chats/FeedbackVolumeChart'
import SentimentDonutChart from '../../components/chats/SentimentDonutChart'
import TopThemesChart from '../../components/chats/TopThemesChart'
import FeedbackChannelsChart from '../../components/chats/FeedbackChannelsChart'
import AIInsightsPanel from '../../components/insights/AIInsightsPanel'
import FeedbackTable from '../../components/table/FeedbackTable'

import {
  getSentimentBreakdown,
  getFeedbackVolumeOverTime,
  getChannelDistribution,
  getTopThemes,
  getThemesForWorkspace,
} from '@/lib/analyticsQueries'
import {
  getDashboardStats,
  getRecentFeedback,
  getDashboardInsights,
} from '@/lib/dashboardQueries'

import './Dashboard.css'

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/api/auth')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, workspaceId: true },
  })
  if (!user) redirect('/api/auth')

  const hasWorkspace = !!user.workspaceId
  const workspaceId = user.workspaceId ?? ''

  let stats: Stat[] = []
  let volumeOverTime: { date: string; count: number }[] = []
  let sentimentBreakdown: { name: string; value: number; color: string }[] = []
  let channelDistribution: { channel: string; count: number }[] = []
  let topThemes: { theme: string; mentions: number }[] = []
  let allThemes: Awaited<ReturnType<typeof getThemesForWorkspace>> = []
  let recentFeedback: Awaited<ReturnType<typeof getRecentFeedback>> = []
  let insights: Awaited<ReturnType<typeof getDashboardInsights>> = null as unknown as Awaited<ReturnType<typeof getDashboardInsights>>

  if (hasWorkspace) {
    ;[
      stats,
      volumeOverTime,
      sentimentBreakdown,
      channelDistribution,
      topThemes,
      allThemes,
      recentFeedback,
      insights,
    ] = await Promise.all([
      getDashboardStats(workspaceId),
      getFeedbackVolumeOverTime(workspaceId, 30),
      getSentimentBreakdown(workspaceId),
      getChannelDistribution(workspaceId),
      getTopThemes(workspaceId, 6),
      getThemesForWorkspace(workspaceId),
      getRecentFeedback(workspaceId, 50),
      getDashboardInsights(workspaceId),
    ])
  }

  const themeCards: Theme[] = allThemes.slice(0, 4).map((t) => {
    const growthType: Theme['growthType'] =
      t.weeklyChange > 0
        ? 'positive'
        : t.weeklyChange < 0
          ? 'negative'
          : 'neutral'
    const sign = t.weeklyChange > 0 ? '+' : ''
    return {
      id: t.id,
      name: t.name,
      description: t.description,
      color: t.color,
      mentions: t.mentions,
      thisWeek: t.thisWeek,
      positivePct: t.positivePct,
      negativePct: t.negativePct,
      growthType,
      weeklyGrowth: `${sign}${t.weeklyChange}%`,
    }
  })

  const topThemesChartData = topThemes.map((t) => ({
    theme: t.theme,
    mentions: t.mentions,
  }))

  return (
    <>
      <div className="dashboard-page-header">
        <div>
          <h1 className="dashboard-title">Customer Intelligence Dashboard</h1>
          <p className="dashboard-subtitle">
            Monitor customer feedback, AI insights, sentiment and trends in real
            time.
          </p>
        </div>
        <div className="dashboard-header-actions">
          <Link
            href="/import-feedback"
            className="btn-secondary"
            id="upload-csv-btn"
          >
            <Upload size={15} />
            Import Feedback
          </Link>
          <Link
            href="/reports/generate"
            className="btn-primary"
            id="generate-report-btn"
          >
            <FileBarChart size={15} />
            Generate Report
          </Link>
        </div>
      </div>

      {!hasWorkspace && (
        <div className="workspace-nudge">
          <span>Create or join a workspace to start seeing live data.</span>
          <Link href="/workspace">Go to Workspace</Link>
        </div>
      )}

      <div className="stats-grid mb-6">
        {stats.map((stat) => (
          <StatCard key={stat.id} stat={stat as Stat} />
        ))}
      </div>

      <div className="charts-row charts-row-2-col mb-6">
        <FeedbackVolumeChart data={volumeOverTime} />
        <SentimentDonutChart data={sentimentBreakdown} />
      </div>

      <div className="charts-row charts-row-equal mb-6">
        <TopThemesChart data={topThemesChartData} />
        <FeedbackChannelsChart data={channelDistribution} />
      </div>

      <div className="mb-6">
        <AIInsightsPanel insights={insights} />
      </div>

      <div className="mb-4">
        <h2 className="section-title">Top Themes</h2>
      </div>
      <div className="themes-grid mb-6">
        {themeCards.length === 0 ? (
          <p className="dashboard-subtitle">
            No themes yet. Seed or tag feedback to populate this section.
          </p>
        ) : (
          themeCards.map((theme) => <ThemeCard key={theme.id} theme={theme} />)
        )}
      </div>

      <div className="mb-6">
        <FeedbackTable data={recentFeedback} />
      </div>
    </>
  )
}
