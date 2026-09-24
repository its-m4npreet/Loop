import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { hasPermission, type Role } from '@/lib/permissions'
import { getWorkspaceUsage, planLabel } from '@/lib/plans'
import BillingClient from './BillingClient'

export default async function BillingPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/api/auth')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, workspaceId: true },
  })
  if (!user) redirect('/api/auth')
  if (!user.workspaceId) redirect('/workspace')

  const usage = await getWorkspaceUsage(user.workspaceId)
  if (!usage) redirect('/workspace')

  const workspace = await prisma.workspace.findUnique({
    where: { id: user.workspaceId },
    select: { razorpaySubscriptionId: true, razorpayCustomerId: true },
  })

  const canManage = hasPermission(user.role as Role, 'settings:manage')

  return (
    <BillingClient
      plan={usage.plan}
      planLabel={planLabel(usage.plan)}
      limits={usage.limits}
      used={usage.used}
      subscribed={Boolean(workspace?.razorpaySubscriptionId)}
      canManage={canManage}
    />
  )
}