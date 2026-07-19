import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"

import { listConversations } from "@/lib/askLoopQueries"
import AskLoopClient from "./AskLoopClient"

import './page.css'

export default async function AskLoopPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/api/auth")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, workspaceId: true },
  })
  if (!user) redirect("/api/auth")

  const hasWorkspace = !!user.workspaceId
  const workspaceId = user.workspaceId ?? ''

  let conversations: Awaited<ReturnType<typeof listConversations>> = []

  if (hasWorkspace) {
    conversations = await listConversations(workspaceId, user.id)
  }

  return (
    <>
      {!hasWorkspace && (
        <div className="workspace-nudge" style={{ margin: '0 0 var(--space-4)' }}>
          <span>Create or join a workspace to start chatting with Loop.</span>
          <Link href="/workspace">Go to Workspace</Link>
        </div>
      )}
      <AskLoopClient initialConversations={conversations} />
    </>
  )
}
