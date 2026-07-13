import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
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

  if (!user.workspaceId) {
    return (
      <>
        <div className="page-header">
          <div>
            <h1 className="page-title">Team</h1>
            <p className="page-subtitle">You are not part of a workspace yet.</p>
          </div>
        </div>
      </>
    )
  }

  const [members, invitations] = await Promise.all([
    prisma.user.findMany({
      where: { workspaceId: user.workspaceId },
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
        workspaceId: user.workspaceId,
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

  const serializedMembers = members.map(m => ({
    ...m,
    createdAt: m.createdAt.toISOString(),
  }))

  const serializedInvitations = invitations.map(i => ({
    ...i,
    createdAt: i.createdAt.toISOString(),
    expiresAt: i.expiresAt.toISOString(),
  }))

  return (
    <TeamManager
      isAdmin={user.role === "ADMIN"}
      initialMembers={serializedMembers}
      initialInvitations={serializedInvitations}
    />
  )
}
