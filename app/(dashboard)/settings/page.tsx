import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import SettingsClient from './SettingsClient'
import DeleteAccount from '../profile/DeleteAccount'
import './page.css'

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/api/auth')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      workspace: { select: { name: true } },
    },
  })
  if (!user) redirect('/api/auth')

  const roleLabel =
    user.role === 'ADMIN'
      ? 'Admin'
      : user.role === 'ANALYST'
        ? 'Analyst'
        : 'Viewer'

  return (
    <div className="settings-page">
      <div className="page-header settings-page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">
            A few essentials for your account and alerts.
          </p>
        </div>
      </div>

      <div className="settings-sections">
        {/* Account */}
        <section className="settings-section">
          <h2 className="settings-section-title">Account</h2>
          <div className="settings-card">
            <div className="settings-item">
              <div className="settings-item-text">
                <div className="settings-item-label">Email</div>
                <div className="settings-item-desc">Signed-in address</div>
              </div>
              <div className="settings-item-right">
                <span className="settings-item-value">{user.email}</span>
              </div>
            </div>

            <div className="settings-item">
              <div className="settings-item-text">
                <div className="settings-item-label">Role</div>
                <div className="settings-item-desc">
                  {user.workspace?.name
                    ? `In ${user.workspace.name}`
                    : 'Workspace role'}
                </div>
              </div>
              <div className="settings-item-right">
                <span className="settings-role-badge">{roleLabel}</span>
              </div>
            </div>

            <div className="settings-item">
              <div className="settings-item-text">
                <div className="settings-item-label">Profile</div>
                <div className="settings-item-desc">
                  Name, photo, and personal details
                </div>
              </div>
              <div className="settings-item-right">
                <Link href="/profile" className="settings-item-btn">
                  Edit profile
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Notifications — only two toggles */}
        <SettingsClient />

        {/* Danger */}
        <section className="settings-section">
          <h2 className="settings-section-title">Danger zone</h2>
          <div className="settings-card settings-card-danger">
            <div className="settings-item">
              <div className="settings-item-text">
                <div className="settings-item-label">Delete account</div>
                <div className="settings-item-desc">
                  Permanently remove your account and data
                </div>
              </div>
              <div className="settings-item-right">
                <DeleteAccount />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
