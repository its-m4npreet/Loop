import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Upload } from 'lucide-react'

import FeedbackTable from '../../components/table/FeedbackTable'
import { getRecentFeedback } from '@/lib/dashboardQueries'
import './page.css'

export default async function FeedbackInboxPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/api/auth')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, workspaceId: true },
  })
  if (!user) redirect('/api/auth')

  if (!user.workspaceId) {
    return (
      <div className="page-header">
        <div>
          <h1 className="page-title">Feedback Inbox</h1>
          <p className="page-subtitle">
            You are not part of a workspace yet.
          </p>
        </div>
      </div>
    )
  }

  const feedback = await getRecentFeedback(user.workspaceId, 200)

  return (
    <div className="feedback-inbox-page">
      <div className="feedback-inbox-header">
        <div className="feedback-inbox-title-row">
          <h1 className="page-title">Feedback Inbox</h1>
          <Link
            href="/import-feedback"
            className="btn-secondary feedback-import-btn"
            aria-label="Import Feedback"
            title="Import Feedback"
          >
            <Upload size={18} className="feedback-import-icon" />
            <span className="feedback-import-label">Import Feedback</span>
          </Link>
        </div>
        <p className="page-subtitle feedback-inbox-subtitle">
          Browse, search, and manage all incoming customer feedback.
        </p>
      </div>

      <FeedbackTable data={feedback} title="All Feedback" />
    </div>
  )
}
