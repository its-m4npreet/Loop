import { Suspense } from "react"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { FileText, CheckCircle, Clock, Calendar } from 'lucide-react'
import Link from 'next/link'

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

  const hasWorkspace = !!user.workspaceId
  const workspaceId = user.workspaceId ?? ''

  let initialData: Awaited<ReturnType<typeof getReportsList>> = { reports: [], total: 0, page: 1, pageSize: 10, totalPages: 0 } as Awaited<ReturnType<typeof getReportsList>>
  let stats: Awaited<ReturnType<typeof getReportsStats>> = { total: 0, completed: 0, draft: 0, scheduled: 0 }

  if (hasWorkspace) {
    ;[initialData, stats] = await Promise.all([
      getReportsList(workspaceId, { page: 1, pageSize: 10 }),
      getReportsStats(workspaceId)
    ])
  }

  return (
    <div className="reports-page">
      <div className="page-header reports-page-header">
        <div className="reports-page-header-text">
          <h1 className="page-title">Reports</h1>
          <p className="page-subtitle">
            Generate and manage AI-powered reports from your data.
          </p>
        </div>
      </div>

      {!hasWorkspace && (
        <div className="workspace-nudge">
          <span>Create or join a workspace to start generating reports.</span>
          <Link href="/workspace">Go to Workspace</Link>
        </div>
      )}

      <div className="reports-stats-grid">
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

      <Suspense fallback={<div className="reports-loader-container">Loading reports…</div>}>
        <ReportsListClient initialData={initialData} />
      </Suspense>
    </div>
  )
}
