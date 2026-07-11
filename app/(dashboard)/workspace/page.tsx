import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { FolderOpen, Plus } from 'lucide-react'
import Avatar from '@/app/components/Avatar'

import './page.css'

const workspaceMembers = [
  { id: 1, name: 'Jane Doe', email: 'jane.doe@company.com', role: 'Owner' },
  { id: 2, name: 'John Smith', email: 'john.smith@company.com', role: 'Member' },
  { id: 3, name: 'Alice Johnson', email: 'alice.j@company.com', role: 'Member' },
];

export default async function WorkspacePage() {
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
          <h1 className="page-title">Workspace</h1>
          <p className="page-subtitle">Manage your workspace settings and team access.</p>
        </div>
      </div>

      <div className="workspace-layout">
        <div className="workspace-info-card">
          <div className="workspace-icon">
            <FolderOpen size={24} />
          </div>
          <div className="workspace-details">
            <h3 className="workspace-name">LOOP Workspace</h3>
            <p className="workspace-plan">Pro Plan · Since Jul 2026</p>
          </div>
        </div>

        <div className="settings-section">
          <h3 className="settings-section-title">Workspace Details</h3>
          <div className="settings-card">
            {[
              { label: 'Workspace name', value: 'LOOP Workspace', desc: 'The name of your organization' },
              { label: 'Workspace ID', value: user.id.slice(0, 8) + '…', desc: 'Unique identifier' },
              { label: 'Plan', value: 'Pro', desc: 'Current subscription plan' },
              { label: 'Created', value: 'Jul 2026', desc: 'When this workspace was created' },
            ].map((item, i) => (
              <div key={i} className="settings-item">
                <div>
                  <div className="settings-item-label">{item.label}</div>
                  <div className="settings-item-desc">{item.desc}</div>
                </div>
                <div className="settings-item-right">
                  <span className="settings-item-value">{item.value}</span>
                  <button className="settings-item-btn">Change</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="settings-section">
          <div className="workspace-members-header">
            <h3 className="settings-section-title">Members</h3>
            <button className="btn-primary" style={{ height: 32, fontSize: 12 }}>
              <Plus size={14} />
              Invite
            </button>
          </div>
          <div className="settings-card">
            {workspaceMembers.map((m) => (
              <div key={m.id} className="settings-item">
                <div className="workspace-member-info">
                  <Avatar name={m.name} size="sm" />
                  <div>
                    <div className="settings-item-label">{m.name}</div>
                    <div className="settings-item-desc">{m.email}</div>
                  </div>
                </div>
                <div className="settings-item-right">
                  <span className="settings-item-value">{m.role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
