'use client'

import { useState } from 'react'
import { Building2, ArrowRight, Loader2 } from 'lucide-react'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function generateWorkspaceId(companyName: string): string {
  const slug = slugify(companyName).slice(0, 20)
  const suffix = Math.random().toString(36).slice(2, 8)
  return `ws-${slug}-${suffix}`
}

export default function CreateWorkspaceForm() {
  const [companyName, setCompanyName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const trimmed = companyName.trim()
  const previewName = trimmed ? `${trimmed} Workspace` : ''
  const previewId = trimmed ? generateWorkspaceId(trimmed) : ''

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!trimmed || trimmed.length < 2) return

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/workspace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName: trimmed }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to create workspace')
        return
      }

      window.location.reload()
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="workspace-create-wrapper">
      <div className="workspace-create-card">
        <div className="workspace-create-icon">
          <Building2 size={32} />
        </div>
        <h2 className="workspace-create-title">Create Your Workspace</h2>
        <p className="workspace-create-subtitle">
          Set up a workspace for your team to collaborate.
        </p>

        <form onSubmit={handleSubmit} className="workspace-create-form">
          <div className="workspace-create-field">
            <label className="workspace-create-label">Company Name</label>
            <input
              type="text"
              className="workspace-create-input"
              placeholder="e.g. Acme Corporation"
              value={companyName}
              onChange={(e) => { setCompanyName(e.target.value); setError('') }}
              autoFocus
            />
          </div>

          {trimmed && (
            <div className="workspace-create-preview">
              <div className="workspace-preview-row">
                <span className="workspace-preview-label">Workspace Name</span>
                <span className="workspace-preview-value">{previewName}</span>
              </div>
              <div className="workspace-preview-row">
                <span className="workspace-preview-label">Workspace ID</span>
                <span className="workspace-preview-value workspace-preview-id">{previewId}</span>
              </div>
            </div>
          )}

          {error && <p className="workspace-create-error">{error}</p>}

          <button
            type="submit"
            className="workspace-create-btn"
            disabled={loading || trimmed.length < 2}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="spin" />
                Creating...
              </>
            ) : (
              <>
                Create Workspace
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
