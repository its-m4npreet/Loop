import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Mail, MoreHorizontal, Plus } from 'lucide-react'

import './page.css'

const teamMembers = [
  { id: 1, name: 'Jane Doe', email: 'jane.doe@company.com', role: 'Admin', avatar: 'JD', active: true },
  { id: 2, name: 'John Smith', email: 'john.smith@company.com', role: 'Member', avatar: 'JS', active: true },
  { id: 3, name: 'Alice Johnson', email: 'alice.j@company.com', role: 'Member', avatar: 'AJ', active: true },
  { id: 4, name: 'Bob Williams', email: 'bob.w@company.com', role: 'Viewer', avatar: 'BW', active: false },
  { id: 5, name: 'Carol Davis', email: 'carol.d@company.com', role: 'Member', avatar: 'CD', active: true },
];

export default async function TeamPage() {
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
        <div className="team-stat-value">5</div>
        <div className="team-stat-label">Total Members</div>
      </div>
      <div className="team-stat-card">
        <div className="team-stat-value">4</div>
        <div className="team-stat-label">Active</div>
      </div>
      <div className="team-stat-card">
        <div className="team-stat-value">3</div>
        <div className="team-stat-label">Roles</div>
      </div>
    </div>

    <div className="team-list">
      {teamMembers.map((m) => (
        <div key={m.id} className="team-list-item" id={`team-member-${m.id}`}>
          <div className="team-member-info">
            <div className="team-member-avatar">{m.avatar}</div>
            <div>
              <div className="team-member-name">{m.name}</div>
              <div className="team-member-email">
                <Mail size={11} />
                {m.email}
              </div>
            </div>
          </div>
          <div className="team-member-right">
            <span className={`team-member-status ${m.active ? 'active' : 'inactive'}`}>
              {m.active ? 'Active' : 'Inactive'}
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
