import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Mail, MoreHorizontal, Plus } from 'lucide-react'
import Avatar from '@/app/components/Avatar'

import './page.css'

export default async function TeamPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/api/auth")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  })
  if (!user) redirect("/api/auth")

  const teamMembers = await prisma.user.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'asc' },
  })

  const activeCount = teamMembers.length

  return (
    <>
    <div className="page-header">
      <div>
        <h1 className="page-title">Team</h1>
        <p className="page-subtitle">Manage your team members and their roles.</p>
      </div>
      <div className="page-header-actions">
        <button className="btn-primary" id="invite-member-btn">
          <Plus size={15} />
          Invite Member
        </button>
      </div>
    </div>

    <div className="team-stats-grid">
      <div className="team-stat-card">
        <div className="team-stat-value">{activeCount}</div>
        <div className="team-stat-label">Total Members</div>
      </div>
      <div className="team-stat-card">
        <div className="team-stat-value">{activeCount}</div>
        <div className="team-stat-label">Active</div>
      </div>
      <div className="team-stat-card">
        <div className="team-stat-value">{activeCount > 0 ? 1 : 0}</div>
        <div className="team-stat-label">Roles</div>
      </div>
    </div>

    <div className="team-list">
      {teamMembers.map((m) => (
        <div key={m.id} className="team-list-item" id={`team-member-${m.id}`}>
          <div className="team-member-info">
            <Avatar name={m.name} src={m.image} size="md" />
            <div>
              <div className="team-member-name">{m.name || 'User'}</div>
              <div className="team-member-email">
                <Mail size={11} />
                {m.email}
              </div>
            </div>
          </div>
          <div className="team-member-right">
            <span className={`team-member-status ${m.isActive ? 'active' : 'inactive'}`}>
              {m.isActive ? 'Active' : 'Inactive'}
            </span>
            <span className="team-member-role">{m.role}</span>
            <button className="team-member-more" aria-label={`More options for ${m.name}`}>
              <MoreHorizontal size={18} />
            </button>
          </div>
        </div>
      ))}
    </div>
    </>
  )
}
