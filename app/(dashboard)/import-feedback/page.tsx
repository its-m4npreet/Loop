import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { hasPermission, type Role } from '@/lib/permissions'
import ImportFeedbackClient from './ImportFeedbackClient'
import './page.css'

export default async function ImportFeedbackPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/api/auth')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, workspaceId: true },
  })
  if (!user) redirect('/api/auth')

  const hasWorkspace = !!user.workspaceId
  const role = user.role as Role
  const canImport =
    hasPermission(role, 'feedback:import') ||
    hasPermission(role, 'feedback:manual')

  return (
    <Suspense
      fallback={
        <div className="page-header">
          <div>
            <h1 className="page-title">Import Feedback</h1>
            <p className="page-subtitle">Loading…</p>
          </div>
        </div>
      }
    >
      <ImportFeedbackClient
        canImport={hasWorkspace && canImport}
        canManual={
          hasWorkspace &&
          (hasPermission(role, 'feedback:manual') ||
            hasPermission(role, 'feedback:import'))
        }
        canBulk={hasWorkspace && hasPermission(role, 'feedback:import')}
      />
    </Suspense>
  )
}
