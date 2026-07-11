import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"

import './page.css'

export default async function SettingsPage() {
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
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your preferences and account settings.</p>
      </div>
    </div>

    <div className="settings-sections">
      <div className="settings-section">
        <h3 className="settings-section-title">General</h3>
        <div className="settings-card">
          {[
            { label: 'Language', value: 'English', desc: 'Set your preferred language' },
            { label: 'Time zone', value: 'UTC +3', desc: 'Set your time zone' },
            { label: 'Date format', value: 'MM/DD/YYYY', desc: 'Set your preferred date format' },
          ].map((item, i) => (
            <div key={i} className="settings-item" id={`general-${i}`}>
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
        <h3 className="settings-section-title">Notifications</h3>
        <div className="settings-card">
          {[
            { label: 'Report ready', desc: 'Get notified when a report is generated', checked: true },
            { label: 'New feedback', desc: 'Get notified when new feedback arrives', checked: false },
            { label: 'Weekly digest', desc: 'Get a weekly summary of your feedback data', checked: true },
          ].map((item, i) => (
            <div key={i} className="settings-item" id={`notif-${i}`}>
              <div>
                <div className="settings-item-label">{item.label}</div>
                <div className="settings-item-desc">{item.desc}</div>
              </div>
              <div className={`settings-item-right`}>
                <div className={`toggle ${item.checked ? 'on' : ''}`}>
                  <div className="toggle-knob" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="settings-section">
        <h3 className="settings-section-title">Account</h3>
        <div className="settings-card">
          <div className="settings-item">
            <div>
              <div className="settings-item-label">Delete account</div>
              <div className="settings-item-desc">Permanently delete your account and all data</div>
            </div>
            <button className="settings-item-btn danger">Delete</button>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}
