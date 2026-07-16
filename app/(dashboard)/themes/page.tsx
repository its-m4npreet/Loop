import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Tag, TrendingUp, TrendingDown, MessageSquare } from 'lucide-react'

import TopThemesChart from '../../components/chats/TopThemesChart'
import ThemeGrowthTracker from '../../components/chats/ThemeGrowthTracker'
import {
  getThemesForWorkspace,
  getTopThemes,
  getThemeGrowthOverTime,
} from '@/lib/analyticsQueries'
import ThemesClient, { type ThemeItem } from './ThemesClient'
import './page.css'

function toThemeItem(
  t: Awaited<ReturnType<typeof getThemesForWorkspace>>[number]
): ThemeItem {
  const growthType: ThemeItem['growthType'] =
    t.weeklyChange > 0 ? 'positive' : t.weeklyChange < 0 ? 'negative' : 'neutral'
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
}

export default async function ThemesPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/api/auth')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, workspaceId: true },
  })
  if (!user) redirect('/api/auth')

  if (!user.workspaceId) {
    return (
      <div className="themes-page">
        <div className="page-header themes-page-header">
          <div className="themes-page-header-text">
            <h1 className="page-title">Themes</h1>
            <p className="page-subtitle">
              You are not part of a workspace yet.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const [themes, topThemes, themeGrowth] = await Promise.all([
    getThemesForWorkspace(user.workspaceId),
    getTopThemes(user.workspaceId, 8),
    getThemeGrowthOverTime(user.workspaceId, 8),
  ])

  const themeItems = themes.map(toThemeItem)
  const totalMentions = themes.reduce((s, t) => s + t.mentions, 0)
  const rising = themes.filter((t) => t.weeklyChange > 0).length
  const falling = themes.filter((t) => t.weeklyChange < 0).length

  const chartData = topThemes.map((t) => ({
    theme: t.theme,
    mentions: t.mentions,
  }))

  return (
    <div className="themes-page">
      <div className="page-header themes-page-header">
        <div className="themes-page-header-text">
          <h1 className="page-title">Themes</h1>
          <p className="page-subtitle">
            Track trending topics and themes across all customer feedback.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="themes-stats-grid">
        <div className="themes-stat-card">
          <div className="themes-stat-icon purple">
            <Tag size={20} />
          </div>
          <div className="themes-stat-content">
            <span className="themes-stat-label">Total Themes</span>
            <span className="themes-stat-value">{themes.length}</span>
          </div>
        </div>
        <div className="themes-stat-card">
          <div className="themes-stat-icon blue">
            <MessageSquare size={20} />
          </div>
          <div className="themes-stat-content">
            <span className="themes-stat-label">Total Mentions</span>
            <span className="themes-stat-value">
              {totalMentions.toLocaleString()}
            </span>
          </div>
        </div>
        <div className="themes-stat-card">
          <div className="themes-stat-icon green">
            <TrendingUp size={20} />
          </div>
          <div className="themes-stat-content">
            <span className="themes-stat-label">Rising</span>
            <span className="themes-stat-value">{rising}</span>
          </div>
        </div>
        <div className="themes-stat-card">
          <div className="themes-stat-icon red">
            <TrendingDown size={20} />
          </div>
          <div className="themes-stat-content">
            <span className="themes-stat-label">Falling</span>
            <span className="themes-stat-value">{falling}</span>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="charts-row charts-row-equal themes-charts-row">
        <TopThemesChart data={chartData} />
        <ThemeGrowthTracker themes={themeGrowth.slice(0, 6)} />
      </div>

      {/* Browse */}
      <div className="themes-section-header">
        <h2 className="section-title">All Themes</h2>
        <p className="themes-section-desc">
          Browse, search, and filter themes by weekly momentum.
        </p>
      </div>

      <ThemesClient themes={themeItems} />
    </div>
  )
}
