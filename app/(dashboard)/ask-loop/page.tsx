import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"

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

  if (!user.workspaceId) {
    return (
      <div className="page-header">
        <div>
          <h1 className="page-title">Ask LOOP</h1>
          <p className="page-subtitle">You are not part of a workspace yet.</p>
        </div>
      </div>
    )
  }

  const conversations = await listConversations(user.workspaceId, user.id)

  return (
    <>
      <AskLoopClient initialConversations={conversations} />
    </>
  )
}
