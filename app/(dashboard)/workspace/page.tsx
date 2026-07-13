import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { FolderOpen } from 'lucide-react'
import Avatar from '@/app/components/Avatar'
import CreateWorkspaceForm from './CreateWorkspaceForm'

import './page.css'

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default async function WorkspacePage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/api/auth")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      workspace: {
        include: {
          users: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              role: true,
              createdAt: true,
            },
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
  })
  if (!user) redirect("/api/auth")

  const workspace = user.workspace

  if (!workspace) {
    return (
      <>
        <div className="page-header">
          <div>
            <h1 className="page-title">Workspace</h1>
            <p className="page-subtitle">Set up your workspace to get started.</p>
          </div>
        </div>
        <CreateWorkspaceForm />
      </>
    )
  }

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
            <h3 className="workspace-name">{workspace.name}</h3>
            <p className="workspace-plan">{workspace.users.length} members</p>
          </div>
        </div>

        <div className="settings-section">
          <h3 className="settings-section-title">Workspace Details</h3>
          <div className="settings-card">
            {[
              { label: 'Workspace name', value: workspace.name, desc: 'The name of your organization' },
              { label: 'Workspace ID', value: workspace.id, desc: 'Unique identifier' },
              { label: 'Members', value: `${workspace.users.length}`, desc: 'Total team members' },
              { label: 'Created', value: formatDate(workspace.createdAt), desc: 'When this workspace was created' },
            ].map((item, i) => (
              <div key={i} className="settings-item">
                <div>
                  <div className="settings-item-label">{item.label}</div>
                  <div className="settings-item-desc">{item.desc}</div>
                </div>
                <div className="settings-item-right">
                  <span className="settings-item-value">{item.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="settings-section">
          <h3 className="settings-section-title">Members</h3>
          <div className="settings-card">
            {workspace.users.map((m) => (
              <div key={m.id} className="settings-item">
                <div className="workspace-member-info">
                  <Avatar name={m.name} src={m.image} size="sm" />
                  <div>
                    <div className="settings-item-label">{m.name || 'User'}</div>
                    <div className="settings-item-desc">{m.email}</div>
                  </div>
                </div>
                <div className="settings-item-right">
                  <span className="settings-item-value">
                    {m.role === 'ADMIN' ? 'Admin' : m.role === 'ANALYST' ? 'Analyst' : 'Viewer'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
