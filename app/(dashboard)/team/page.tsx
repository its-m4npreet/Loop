import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import TeamManager from "./TeamManager"

import './page.css'

export default async function TeamPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/api/auth")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, workspaceId: true },
  })
  if (!user) redirect("/api/auth")

  const hasWorkspace = !!user.workspaceId
  const workspaceId = user.workspaceId ?? ''

  let serializedMembers: { id: string; name: string | null; email: string; image: string | null; role: string; isActive: boolean; createdAt: string }[] = []
  let serializedInvitations: { id: string; email: string; name: string | null; role: string; createdAt: string; expiresAt: string }[] = []

  if (hasWorkspace) {
    const [members, invitations] = await Promise.all([
      prisma.user.findMany({
        where: { workspaceId },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.invitation.findMany({
        where: {
          workspaceId,
          acceptedAt: null,
          expiresAt: { gt: new Date() },
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          expiresAt: true,
        },
        orderBy: { createdAt: "desc" },
      }),
    ])

    serializedMembers = members.map(m => ({
      ...m,
      createdAt: m.createdAt.toISOString(),
    }))

    serializedInvitations = invitations.map(i => ({
      ...i,
      createdAt: i.createdAt.toISOString(),
      expiresAt: i.expiresAt.toISOString(),
    }))
  }

  return (
    <>
      {!hasWorkspace && (
        <div className="workspace-nudge">
          <span>Create or join a workspace to start managing your team.</span>
          <Link href="/workspace">Go to Workspace</Link>
        </div>
      )}
      <TeamManager
        isAdmin={user.role === "ADMIN"}
        initialMembers={serializedMembers}
        initialInvitations={serializedInvitations}
      />
    </>
  )
}
