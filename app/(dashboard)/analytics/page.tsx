import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Calendar, Download } from 'lucide-react'

import FeedbackVolumeChart from '../../components/chats/FeedbackVolumeChart'
import FeedbackChannelsChart from '../../components/chats/FeedbackChannelsChart'
import TopThemesChart from '../../components/chats/TopThemesChart'
import './page.css'

export default async function AnalyticsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/api/auth")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  })
  if (!user) redirect("/api/auth")

  return (
    <>
    <div className="page-header">
      <div>
        <h1 className="page-title">Analytics</h1>
        <p className="page-subtitle">Deep-dive into trends, channel performance, and theme distribution.</p>
      </div>
      <div className="page-header-actions">
        <button className="btn-secondary" id="date-range-btn">
          <Calendar size={15} />
          Last 30 days
        </button>
        <button className="btn-primary" id="export-btn">
          <Download size={15} />
          Export
        </button>
      </div>
    </div>

    <div className="charts-row charts-row-2-col mb-6">
      <FeedbackVolumeChart />
      <FeedbackChannelsChart />
    </div>

    <div className="charts-row charts-row-equal">
      <TopThemesChart />
      <div className="chart-card">
        <div className="chart-card-header">
          <span className="chart-card-title">Period Comparison</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'var(--color-text-muted)', fontSize: 14 }}>
          Select a date range to compare periods
        </div>
      </div>
    </div>
    </>
  )
}
