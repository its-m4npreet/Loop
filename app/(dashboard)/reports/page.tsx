import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Plus, Download } from 'lucide-react'
import Link from 'next/link'

import './page.css'

const reportHistory = [
  { id: 1, title: 'Weekly Feedback Summary', date: 'Jul 10, 2026', type: 'Summary', status: 'Completed' },
  { id: 2, title: 'Monthly Sentiment Report', date: 'Jul 1, 2026', type: 'Sentiment', status: 'Completed' },
  { id: 3, title: 'Q2 Product Insights', date: 'Jun 30, 2026', type: 'Insights', status: 'Completed' },
  { id: 4, title: 'Customer Pain Points', date: 'Jun 25, 2026', type: 'Themes', status: 'Completed' },
  { id: 5, title: 'Competitive Analysis', date: 'Jun 18, 2026', type: 'Analysis', status: 'Draft' },
];

export default async function ReportsPage() {
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
        <h1 className="page-title">Reports</h1>
        <p className="page-subtitle">Generate and manage AI-powered reports from your data.</p>
      </div>
      <div className="page-header-actions">
        <Link href="/reports/generate" className="btn-primary" id="new-report-btn">
          <Plus size={15} />
          New Report
        </Link>
      </div>
    </div>

      <div className="reports-templates">
        <div className="section-title">Templates</div>
        <div className="reports-grid">
          {[
            { title: 'Weekly Summary', desc: 'Overview of the past week\'s feedback and sentiment.', icon: '📊', type: 'weekly-summary' },
            { title: 'Sentiment Report', desc: 'Deep analysis of sentiment trends over a period.', icon: '😊', type: 'sentiment' },
            { title: 'Theme Analysis', desc: 'Breakdown of trending themes and their impact.', icon: '🏷️', type: 'theme-analysis' },
            { title: 'Executive Summary', desc: 'High-level overview for stakeholders.', icon: '📋', type: 'executive' },
          ].map((t, i) => (
            <Link key={i} href={`/reports/generate?type=${t.type}`} className="reports-template-card" id={`template-${i}`}>
              <div className="reports-template-icon">{t.icon}</div>
              <div className="reports-template-title">{t.title}</div>
              <div className="reports-template-desc">{t.desc}</div>
            </Link>
          ))}
        </div>
      </div>

    <div className="section-title" style={{ marginTop: 40 }}>Recent Reports</div>
    <div className="reports-list">
      {reportHistory.map((r) => (
        <div key={r.id} className="reports-list-item" id={`report-${r.id}`}>
          <div>
            <div className="reports-list-title">{r.title}</div>
            <div className="reports-list-meta">{r.type} · {r.date}</div>
          </div>
          <div className="reports-list-actions">
            <span className={`reports-status status-${r.status.toLowerCase()}`}>{r.status}</span>
            <button className="reports-download-btn" aria-label={`Download ${r.title}`}>
              <Download size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
    </>
  )
}
