'use client'

import React, { useState } from 'react'
import { AlertTriangle, X, Loader2 } from 'lucide-react'
import { logout } from '../../utils/logout'

export default function DeleteAccount() {
  const [isOpen, setIsOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState('')

  const handleDelete = async () => {
    if (confirmText !== 'DELETE') return
    setIsDeleting(true)
    setError('')
    try {
      const res = await fetch('/api/profile', { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Failed to delete account.')
        setIsDeleting(false)
        return
      }
      void logout()
    } catch {
      setError('A network error occurred. Please try again.')
      setIsDeleting(false)
    }
  }

  return (
    <>
      <button
        type="button"
        className="settings-item-btn danger"
        onClick={() => setIsOpen(true)}
      >
        Delete
      </button>

      {isOpen && (
        <div className="delete-modal-backdrop" onClick={() => { if (!isDeleting) setIsOpen(false) }}>
          <div
            className="delete-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-account-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="delete-modal-header">
              <div className="delete-modal-icon">
                <AlertTriangle size={22} />
              </div>
              <h3 id="delete-account-title" className="delete-modal-title">Delete account</h3>
              <button
                type="button"
                className="delete-modal-close"
                onClick={() => setIsOpen(false)}
                disabled={isDeleting}
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <div className="delete-modal-body">
              <p className="delete-modal-warning">
                This action is <strong>permanent and cannot be undone</strong>. It will:
              </p>
              <ul className="delete-modal-list">
                <li>Delete your account and profile</li>
                <li>Remove all your sessions and sign you out</li>
                <li>Delete all Ask Loop conversations</li>
                <li>If you are the last admin, the entire workspace and its data will be deleted</li>
              </ul>

              <label className="delete-modal-label" htmlFor="delete-confirm">
                Type <strong>DELETE</strong> to confirm:
              </label>
              <input
                id="delete-confirm"
                type="text"
                className="delete-modal-input"
                placeholder="DELETE"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                disabled={isDeleting}
                autoFocus
              />

              {error && <p className="delete-modal-error">{error}</p>}
            </div>

            <div className="delete-modal-footer">
              <button
                type="button"
                className="delete-modal-btn cancel"
                onClick={() => setIsOpen(false)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="delete-modal-btn confirm"
                onClick={handleDelete}
                disabled={isDeleting || confirmText !== 'DELETE'}
              >
                {isDeleting ? (
                  <>
                    <Loader2 size={14} className="ask-loop-spin" />
                    Deleting…
                  </>
                ) : (
                  'Delete account'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
