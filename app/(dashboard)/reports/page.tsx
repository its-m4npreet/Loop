import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { FileText, CheckCircle, Clock, Calendar } from 'lucide-react'

import { getReportsList, getReportsStats } from "@/lib/reportsQueries"
import ReportsListClient from "./ReportsListClient"

import './page.css'

export default async function ReportsPage() {
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
          <h1 className="page-title">Reports</h1>
          <p className="page-subtitle">You are not part of a workspace yet.</p>
        </div>
      </div>
    )
  }

  const [initialData, stats] = await Promise.all([
    getReportsList(user.workspaceId, { page: 1, pageSize: 10 }),
    getReportsStats(user.workspaceId)
  ])

  return (
    <>
    <div className="page-header">
      <div>
        <h1 className="page-title">Reports</h1>
        <p className="page-subtitle">Generate and manage AI-powered reports from your data.</p>
      </div>
    </div>

    {/* Reports Stats Grid */}
    <div className="reports-stats-grid mb-6">
      <div className="reports-stat-card">
        <div className="reports-stat-icon-wrapper blue">
          <FileText size={20} />
        </div>
        <div className="reports-stat-content">
          <span className="reports-stat-label">Total Reports</span>
          <span className="reports-stat-value">{stats.total}</span>
        </div>
      </div>
      <div className="reports-stat-card">
        <div className="reports-stat-icon-wrapper green">
          <CheckCircle size={20} />
        </div>
        <div className="reports-stat-content">
          <span className="reports-stat-label">Completed</span>
          <span className="reports-stat-value">{stats.completed}</span>
        </div>
      </div>
      <div className="reports-stat-card">
        <div className="reports-stat-icon-wrapper orange">
          <Clock size={20} />
        </div>
        <div className="reports-stat-content">
          <span className="reports-stat-label">Drafts</span>
          <span className="reports-stat-value">{stats.draft}</span>
        </div>
      </div>
      <div className="reports-stat-card">
        <div className="reports-stat-icon-wrapper purple">
          <Calendar size={20} />
        </div>
        <div className="reports-stat-content">
          <span className="reports-stat-label">Scheduled</span>
          <span className="reports-stat-value">{stats.scheduled}</span>
        </div>
      </div>
    </div>

    <ReportsListClient initialData={initialData} />
    </>
  )
}
