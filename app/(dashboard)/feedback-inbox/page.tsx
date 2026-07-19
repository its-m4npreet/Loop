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

  const hasWorkspace = !!user.workspaceId
  const workspaceId = user.workspaceId ?? ''

  let feedback: Awaited<ReturnType<typeof getRecentFeedback>> = []

  if (hasWorkspace) {
    feedback = await getRecentFeedback(workspaceId, 10)
  }

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

      {!hasWorkspace && (
        <div className="workspace-nudge">
          <span>Create or join a workspace to start importing feedback.</span>
          <Link href="/workspace">Go to Workspace</Link>
        </div>
      )}

      <FeedbackTable
        data={feedback}
        title="All Feedback"
        enableInfiniteScroll
        workspaceId={workspaceId}
      />
    </div>
  )
}
