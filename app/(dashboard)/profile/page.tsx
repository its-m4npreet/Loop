import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Shield, Calendar, Clock, FolderOpen } from 'lucide-react'
import ProfileAvatar from "./ProfileAvatar"
import ProfileEditor from "./ProfileEditor"

import './page.css'

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatRelative(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`
  if (days < 365) return `${Math.floor(days / 30)} months ago`
  return `${Math.floor(days / 365)} years ago`
}

export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/api/auth")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { workspace: true },
  })
  if (!user) redirect("/api/auth")

  const roleDisplay = user.role === 'ADMIN' ? 'Admin' : user.role === 'ANALYST' ? 'Analyst' : 'Viewer'

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">Manage your personal information and preferences.</p>
        </div>
      </div>

      <div className="profile-layout">
        <div className="profile-sidebar">
          <div className="profile-card">
            <ProfileAvatar userName={user.name} userImage={user.image} />
            <ProfileEditor initialName={user.name || ''} />
            <div className="profile-info-email">{user.email}</div>
            <div className="profile-role-badge">
              <Shield size={12} />
              {roleDisplay}
            </div>
          </div>

          <div className="profile-meta-card">
            <h4 className="profile-meta-title">Workspace</h4>
            <div className="profile-meta-row">
              <FolderOpen size={14} className="profile-meta-icon" />
              <div>
                <div className="profile-meta-label">Current workspace</div>
                <div className="profile-meta-value">{user.workspace?.name || 'No workspace'}</div>
              </div>
            </div>
            {user.workspace && (
              <div className="profile-meta-row">
                <Calendar size={14} className="profile-meta-icon" />
                <div>
                  <div className="profile-meta-label">Workspace created</div>
                  <div className="profile-meta-value">{formatDate(user.workspace.createdAt)}</div>
                </div>
              </div>
            )}
          </div>

          <div className="profile-meta-card">
            <h4 className="profile-meta-title">Account</h4>
            <div className="profile-meta-row">
              <Calendar size={14} className="profile-meta-icon" />
              <div>
                <div className="profile-meta-label">Joined</div>
                <div className="profile-meta-value">{formatDate(user.createdAt)}</div>
              </div>
            </div>
            <div className="profile-meta-row">
              <Clock size={14} className="profile-meta-icon" />
              <div>
                <div className="profile-meta-label">Last updated</div>
                <div className="profile-meta-value">{formatRelative(user.updatedAt)}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="profile-sections">
          <div className="settings-section">
            {/* <h3 className="settings-section-title">Personal Information</h3> */}
            <div className="settings-card">
              <div className="settings-item">
                <div>
                  <div className="settings-item-label">Full name</div>
                  <div className="settings-item-desc">Your display name across the platform</div>
                </div>
                <div className="settings-item-right">
                  <span className="settings-item-value">{user.name || 'Not set'}</span>
                </div>
              </div>
              <div className="settings-item">
                <div>
                  <div className="settings-item-label">Email address</div>
                  <div className="settings-item-desc">Used for sign-in and notifications</div>
                </div>
                <div className="settings-item-right">
                  <span className="settings-item-value">{user.email}</span>
                </div>
              </div>
              <div className="settings-item">
                <div>
                  <div className="settings-item-label">Role</div>
                  <div className="settings-item-desc">Your workspace permission level</div>
                </div>
                <div className="settings-item-right">
                  <span className="settings-item-value">{roleDisplay}</span>
                </div>
              </div>
              <div className="settings-item">
                <div>
                  <div className="settings-item-label">User ID</div>
                  <div className="settings-item-desc">Your unique identifier</div>
                </div>
                <div className="settings-item-right">
                  <span className="settings-item-value settings-item-mono">{user.id.slice(0, 12)}…</span>
                </div>
              </div>
            </div>
          </div>

          {/* <div className="settings-section">
            <h3 className="settings-section-title">Security</h3>
            <div className="settings-card">
              <div className="settings-item">
                <div>
                  <div className="settings-item-label">Password</div>
                  <div className="settings-item-desc">
                    {user.passwordHash ? 'Your account is secured with a password' : 'No password set (OAuth account)'}
                  </div>
                </div>
                <div className="settings-item-right">
                  {user.passwordHash && (
                    <span className="settings-item-value">••••••••</span>
                  )}
                  {user.passwordHash && (
                    <button className="settings-item-btn">Change</button>
                  )}
                </div>
              </div>
              <div className="settings-item">
                <div>
                  <div className="settings-item-label">Two-factor authentication</div>
                  <div className="settings-item-desc">Add an extra layer of security to your account</div>
                </div>
                <div className="settings-item-right">
                  <span className="settings-item-value">Off</span>
                  <button className="settings-item-btn">Enable</button>
                </div>
              </div>
            </div>
          </div> */}

          <div className="settings-section">
            {/* <h3 className="settings-section-title">Danger Zone</h3> */}
            <div className="settings-card">
              <div className="settings-item">
                <div>
                  <div className="settings-item-label">Delete account</div>
                  <div className="settings-item-desc">Permanently delete your account and all associated data</div>
                </div>
                <button className="settings-item-btn danger">Delete</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
