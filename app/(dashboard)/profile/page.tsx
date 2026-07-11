import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Camera } from 'lucide-react'

import './page.css'

export default async function ProfilePage() {
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
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">Manage your personal information and preferences.</p>
        </div>
      </div>

      <div className="profile-layout">
        <div className="profile-card">
          <div className="profile-avatar-section">
            <div className="profile-avatar-large">
              {user.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <button className="profile-avatar-edit-btn">
              <Camera size={14} />
              Change Photo
            </button>
          </div>
          <div className="profile-info">
            <div className="profile-info-name">{user.name || 'User'}</div>
            <div className="profile-info-email">{user.email}</div>
          </div>
        </div>

        <div className="profile-sections">
          <div className="settings-section">
            <h3 className="settings-section-title">Personal Information</h3>
            <div className="settings-card">
              {[
                { label: 'Full name', value: user.name || 'Not set', desc: 'Your display name' },
                { label: 'Email', value: user.email || 'Not set', desc: 'Your email address' },
                { label: 'Role', value: 'Admin', desc: 'Your workspace role' },
              ].map((item, i) => (
                <div key={i} className="settings-item">
                  <div>
                    <div className="settings-item-label">{item.label}</div>
                    <div className="settings-item-desc">{item.desc}</div>
                  </div>
                  <div className="settings-item-right">
                    <span className="settings-item-value">{item.value}</span>
                    <button className="settings-item-btn">Edit</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="settings-section">
            <h3 className="settings-section-title">Security</h3>
            <div className="settings-card">
              {[
                { label: 'Password', value: '••••••••', desc: 'Last changed 30 days ago' },
                { label: 'Two-factor auth', value: 'Off', desc: 'Add an extra layer of security' },
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
        </div>
      </div>
    </>
  )
}
