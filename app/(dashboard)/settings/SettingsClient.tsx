'use client'

import { useState } from 'react'

export default function SettingsClient() {
  const [reportReady, setReportReady] = useState(true)
  const [weeklyDigest, setWeeklyDigest] = useState(true)

  return (
    <section className="settings-section">
      <h2 className="settings-section-title">Notifications</h2>
      <div className="settings-card">
        <div className="settings-item">
          <div className="settings-item-text">
            <div className="settings-item-label">Report ready</div>
            <div className="settings-item-desc">
              When an AI report finishes generating
            </div>
          </div>
          <div className="settings-item-right">
            <button
              type="button"
              className={`toggle ${reportReady ? 'on' : ''}`}
              onClick={() => setReportReady((v) => !v)}
              role="switch"
              aria-checked={reportReady}
              aria-label="Report ready notifications"
            >
              <span className="toggle-knob" />
            </button>
          </div>
        </div>

        <div className="settings-item">
          <div className="settings-item-text">
            <div className="settings-item-label">Weekly digest</div>
            <div className="settings-item-desc">
              A short weekly summary of feedback
            </div>
          </div>
          <div className="settings-item-right">
            <button
              type="button"
              className={`toggle ${weeklyDigest ? 'on' : ''}`}
              onClick={() => setWeeklyDigest((v) => !v)}
              role="switch"
              aria-checked={weeklyDigest}
              aria-label="Weekly digest notifications"
            >
              <span className="toggle-knob" />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
