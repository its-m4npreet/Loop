import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Upload, FileBarChart } from 'lucide-react'

import StatCard, { type Stat } from '../../components/cards/StatCard'
import ThemeCard, { type Theme } from '../../components/cards/ThemeCard'
import FeedbackVolumeChart  from '../../components/chats/FeedbackVolumeChart'
import SentimentDonutChart  from '../../components/chats/SentimentDonutChart'
import TopThemesChart       from '../../components/chats/TopThemesChart'
import FeedbackChannelsChart from '../../components/chats/FeedbackChannelsChart'
import AIInsightsPanel      from '../../components/insights/AIInsightsPanel'
import FeedbackTable        from '../../components/table/FeedbackTable'
import QuickActions         from '../../components/quicksActions/QuickActions'

import { statsData, topThemesCards } from '../../data/dashboardData'
import './Dashboard.css'

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/api/auth")
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  })

  if (!user) {
    redirect("/api/auth")
  }

  return (
    <>
    <div className="dashboard-page-header">
      <div>
        <h1 className="dashboard-title">Customer Intelligence Dashboard</h1>
        <p className="dashboard-subtitle">
          Monitor customer feedback, AI insights, sentiment and trends in real time.
        </p>
      </div>
      <div className="dashboard-header-actions">
        <button className="btn-secondary" id="upload-csv-btn">
          <Upload size={15} />
          Upload CSV
        </button>
        <button className="btn-primary" id="generate-report-btn">
          <FileBarChart size={15} />
          Generate Report
        </button>
      </div>
    </div>

    <div className="stats-grid mb-6">
      {statsData.map((stat) => (
        <StatCard key={stat.id} stat={stat as Stat} />
      ))}
    </div>

    <div className="charts-row charts-row-2-col mb-6">
      <FeedbackVolumeChart />
      <SentimentDonutChart />
    </div>

    <div className="charts-row charts-row-equal mb-6">
      <TopThemesChart />
      <FeedbackChannelsChart />
    </div>

    <div className="mb-6">
      <AIInsightsPanel />
    </div>

    <div className="mb-4">
      <h2 className="section-title">Top Themes</h2>
    </div>
    <div className="themes-grid mb-6">
      {topThemesCards.map((theme) => (
        <ThemeCard key={theme.id} theme={theme as Theme} />
      ))}
    </div>

    <div className="mb-6">
      <FeedbackTable />
    </div>

    <QuickActions />
    </>
  )
}
