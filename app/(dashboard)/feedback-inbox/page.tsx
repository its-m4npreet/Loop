import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Filter, SortDesc } from 'lucide-react'

import FeedbackTable from '../../components/table/FeedbackTable'
import './page.css'

export default async function FeedbackInboxPage() {
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
        <h1 className="page-title">Feedback Inbox</h1>
        <p className="page-subtitle">Browse, search, and manage all incoming customer feedback.</p>
      </div>
      <div className="page-header-actions">
        <button className="btn-secondary" id="filter-btn">
          <Filter size={15} />
          Filter
        </button>
        <button className="btn-secondary" id="sort-btn">
          <SortDesc size={15} />
          Sort
        </button>
      </div>
    </div>

    <FeedbackTable />
    </>
  )
}
