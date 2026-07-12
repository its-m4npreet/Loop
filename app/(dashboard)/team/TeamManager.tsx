'use client'

import { useState, useEffect, useCallback } from 'react'
import { Mail, MoreHorizontal, Plus, Search, UserX, Trash2, ChevronDown, X, Clock, Copy, CheckCircle, ArrowUpCircle, ArrowDownCircle } from 'lucide-react'
import Avatar from '@/app/components/Avatar'

interface TeamMember {
  id: string
  name: string | null
  email: string
  image: string | null
  role: string
  isActive: boolean
  createdAt: string
}

interface PendingInvitation {
  id: string
  email: string
  name: string | null
  role: string
  createdAt: string
  expiresAt: string
}

interface TeamManagerProps {
  isAdmin: boolean
  initialMembers: TeamMember[]
  initialInvitations: PendingInvitation[]
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin',
  ANALYST: 'Analyst',
  VIEWER: 'Viewer',
}

const ROLE_ORDER = ['VIEWER', 'ANALYST', 'ADMIN']

function getRoleChangeOptions(currentRole: string) {
  return ROLE_ORDER.filter(r => r !== currentRole).map(r => ({
    value: r,
    label: ROLE_LABELS[r],
    direction: ROLE_ORDER.indexOf(r) > ROLE_ORDER.indexOf(currentRole) ? 'up' as const : 'down' as const,
  }))
}

export default function TeamManager({ isAdmin, initialMembers, initialInvitations }: TeamManagerProps) {
  const [members, setMembers] = useState<TeamMember[]>(initialMembers)
  const [invitations, setInvitations] = useState<PendingInvitation[]>(initialInvitations)
  const [search, setSearch] = useState('')
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [inviteRole, setInviteRole] = useState('VIEWER')
  const [inviteError, setInviteError] = useState('')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [confirmAction, setConfirmAction] = useState<{ type: string; memberId: string; memberName: string } | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const activeCount = members.filter(m => m.isActive).length
  const roleCount = new Set(members.map(m => m.role)).size

  const filtered = members.filter(m => {
    const q = search.toLowerCase()
    return (
      m.name?.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q)
    )
  })

  const filteredInvitations = invitations.filter(i => {
    const q = search.toLowerCase()
    return (
      i.email.toLowerCase().includes(q) ||
      i.name?.toLowerCase().includes(q)
    )
  })

  const fetchMembers = useCallback(async () => {
    const res = await fetch('/api/team')
    if (res.ok) {
      const data = await res.json()
      setMembers(data.members)
    }
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement
      if (!target.closest('.team-member-more') && !target.closest('.team-dropdown')) {
        setOpenMenuId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setInviteError('')
    setInviteLoading(true)

    try {
      const res = await fetch('/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, name: inviteName, role: inviteRole }),
      })
      const data = await res.json()
      if (!res.ok) {
        setInviteError(data.error || 'Failed to send invitation')
        return
      }
      setInvitations(prev => [...prev, data.invitation])
      setShowInvite(false)
      setInviteEmail('')
      setInviteName('')
      setInviteRole('VIEWER')
    } catch {
      setInviteError('Network error')
    } finally {
      setInviteLoading(false)
    }
  }

  async function handleCopyInviteLink(inviteId: string) {
    const baseUrl = window.location.origin
    const invitation = invitations.find(i => i.id === inviteId)
    if (!invitation) return

    try {
      const res = await fetch(`/api/team/invite/${inviteId}/link`)
      const data = await res.json()
      if (data.url) {
        await navigator.clipboard.writeText(data.url)
        setCopiedId(inviteId)
        setTimeout(() => setCopiedId(null), 2000)
      }
    } catch {
      const url = `${baseUrl}/auth/invite?token=${inviteId}`
      await navigator.clipboard.writeText(url)
      setCopiedId(inviteId)
      setTimeout(() => setCopiedId(null), 2000)
    }
  }

  async function handleCancelInvitation(inviteId: string) {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/team/invite/${inviteId}/cancel`, { method: 'DELETE' })
      if (res.ok) {
        setInvitations(prev => prev.filter(i => i.id !== inviteId))
      }
    } finally {
      setActionLoading(false)
      setOpenMenuId(null)
    }
  }

  async function handleChangeRole(memberId: string, newRole: string) {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/team/${memberId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })
      if (res.ok) {
        setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: newRole } : m))
      }
    } finally {
      setActionLoading(false)
      setOpenMenuId(null)
    }
  }

  async function handleToggleStatus(memberId: string, currentActive: boolean) {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/team/${memberId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentActive }),
      })
      if (res.ok) {
        setMembers(prev => prev.map(m => m.id === memberId ? { ...m, isActive: !currentActive } : m))
      }
    } finally {
      setActionLoading(false)
      setOpenMenuId(null)
    }
  }

  async function handleRemove(memberId: string) {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/team/${memberId}/remove`, { method: 'DELETE' })
      if (res.ok) {
        setMembers(prev => prev.filter(m => m.id !== memberId))
      }
    } finally {
      setActionLoading(false)
      setConfirmAction(null)
      setOpenMenuId(null)
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Team</h1>
          <p className="page-subtitle">Manage your team members and their roles.</p>
        </div>
        <div className="page-header-actions">
          {isAdmin && (
            <button className="btn-primary" onClick={() => setShowInvite(true)}>
              <Plus size={15} />
              Invite Member
            </button>
          )}
        </div>
      </div>

      <div className="team-stats-grid">
        <div className="team-stat-card">
          <div className="team-stat-value">{members.length}</div>
          <div className="team-stat-label">Total Members</div>
        </div>
        <div className="team-stat-card">
          <div className="team-stat-value">{activeCount}</div>
          <div className="team-stat-label">Active</div>
        </div>
        <div className="team-stat-card">
          <div className="team-stat-value">{invitations.length}</div>
          <div className="team-stat-label">Pending Invites</div>
        </div>
      </div>

      <div className="team-search-bar">
        <Search size={15} />
        <input
          type="text"
          placeholder="Search members by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button className="team-search-clear" onClick={() => setSearch('')}>
            <X size={14} />
          </button>
        )}
      </div>

      {invitations.length > 0 && (
        <>
          <h3 className="team-section-title">Pending Invitations</h3>
          <div className="team-list" style={{ marginBottom: 'var(--space-6)' }}>
            {filteredInvitations.length === 0 && search && (
              <div className="team-empty">No invitations match your search.</div>
            )}
            {filteredInvitations.map(i => (
              <div key={i.id} className="team-list-item team-list-item-invited">
                <div className="team-member-info">
                  <div className="team-invite-avatar">
                    <Mail size={18} />
                  </div>
                  <div>
                    <div className="team-member-name">
                      {i.name || i.email.split('@')[0]}
                      <span className="team-invite-badge">Invited</span>
                    </div>
                    <div className="team-member-email">
                      <Mail size={11} />
                      {i.email}
                    </div>
                    <div className="team-invite-meta">
                      <Clock size={11} />
                      Invited {new Date(i.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} &middot; Expires {new Date(i.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                </div>
                <div className="team-member-right">
                  <span className="team-member-role">{ROLE_LABELS[i.role] || i.role}</span>
                  {isAdmin && (
                    <div className="team-member-menu-wrap">
                      <button
                        className="team-member-more"
                        onClick={() => setOpenMenuId(openMenuId === i.id ? null : i.id)}
                        aria-label={`More options for ${i.email}`}
                      >
                        <MoreHorizontal size={18} />
                        <ChevronDown size={12} />
                      </button>
                      {openMenuId === i.id && (
                        <div className="team-dropdown">
                          <button
                            className="team-dropdown-item"
                            onClick={() => {
                              handleCopyInviteLink(i.id)
                              setOpenMenuId(null)
                            }}
                          >
                            {copiedId === i.id ? <CheckCircle size={14} /> : <Copy size={14} />}
                            {copiedId === i.id ? 'Copied!' : 'Copy Invite Link'}
                          </button>
                          <button
                            className="team-dropdown-item danger"
                            onClick={() => handleCancelInvitation(i.id)}
                            disabled={actionLoading}
                          >
                            <Trash2 size={14} />
                            Cancel Invitation
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <h3 className="team-section-title">Members</h3>
      <div className="team-list">
        {filtered.length === 0 && (
          <div className="team-empty">
            {search ? 'No members match your search.' : 'No team members yet.'}
          </div>
        )}
        {filtered.map(m => (
          <div key={m.id} className="team-list-item">
            <div className="team-member-info">
              <Avatar name={m.name} src={m.image} size="md" />
              <div>
                <div className="team-member-name">
                  {m.name || 'User'}
                  {m.id === initialMembers[0]?.id && <span className="team-you-badge">You</span>}
                </div>
                <div className="team-member-email">
                  <Mail size={11} />
                  {m.email}
                </div>
              </div>
            </div>
            <div className="team-member-right">
              <span className={`team-member-status ${m.isActive ? 'active' : 'inactive'}`}>
                {m.isActive ? 'Active' : 'Inactive'}
              </span>
              <span className="team-member-role">{ROLE_LABELS[m.role] || m.role}</span>
              {isAdmin && (
                <div className="team-member-menu-wrap">
                  <button
                    className="team-member-more"
                    onClick={() => setOpenMenuId(openMenuId === m.id ? null : m.id)}
                    aria-label={`More options for ${m.name}`}
                  >
                    <MoreHorizontal size={18} />
                    <ChevronDown size={12} />
                  </button>
                  {openMenuId === m.id && (
                    <div className="team-dropdown">
                      {getRoleChangeOptions(m.role).map(opt => (
                        <button
                          key={opt.value}
                          className="team-dropdown-item"
                          onClick={() => handleChangeRole(m.id, opt.value)}
                          disabled={actionLoading}
                        >
                          {opt.direction === 'up' ? <ArrowUpCircle size={14} /> : <ArrowDownCircle size={14} />}
                          {opt.direction === 'up' ? 'Promote' : 'Demote'} to {opt.label}
                        </button>
                      ))}
                      <button
                        className="team-dropdown-item"
                        onClick={() => handleToggleStatus(m.id, m.isActive)}
                        disabled={actionLoading}
                      >
                        <UserX size={14} />
                        {m.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        className="team-dropdown-item danger"
                        onClick={() => {
                          setConfirmAction({ type: 'remove', memberId: m.id, memberName: m.name || m.email })
                          setOpenMenuId(null)
                        }}
                        disabled={actionLoading}
                      >
                        <Trash2 size={14} />
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {showInvite && (
        <div className="team-modal-overlay" onClick={() => setShowInvite(false)}>
          <div className="team-modal" onClick={e => e.stopPropagation()}>
            <div className="team-modal-header">
              <h3>Invite Member</h3>
              <button className="team-modal-close" onClick={() => setShowInvite(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleInvite}>
              <div className="team-modal-body">
                {inviteError && <div className="team-modal-error">{inviteError}</div>}
                <p className="team-modal-desc">
                  An invitation email with a sign-up link will be sent to this address.
                </p>
                <label className="team-modal-label">
                  Email address
                  <input
                    type="email"
                    required
                    placeholder="colleague@example.com"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                  />
                </label>
                <label className="team-modal-label">
                  Name (optional)
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={inviteName}
                    onChange={e => setInviteName(e.target.value)}
                  />
                </label>
                <label className="team-modal-label">
                  Role
                  <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}>
                    <option value="ADMIN">Admin</option>
                    <option value="ANALYST">Analyst</option>
                    <option value="VIEWER">Viewer</option>
                  </select>
                </label>
              </div>
              <div className="team-modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowInvite(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={inviteLoading}>
                  {inviteLoading ? 'Sending...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmAction && (
        <div className="team-modal-overlay" onClick={() => setConfirmAction(null)}>
          <div className="team-modal team-modal-confirm" onClick={e => e.stopPropagation()}>
            <div className="team-modal-header">
              <h3>Remove Member</h3>
              <button className="team-modal-close" onClick={() => setConfirmAction(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="team-modal-body">
              <p>Are you sure you want to remove <strong>{confirmAction.memberName}</strong> from the workspace? They will lose access to all workspace data.</p>
            </div>
            <div className="team-modal-footer">
              <button className="btn-secondary" onClick={() => setConfirmAction(null)}>
                Cancel
              </button>
              <button
                className="btn-primary btn-danger"
                onClick={() => handleRemove(confirmAction.memberId)}
                disabled={actionLoading}
              >
                {actionLoading ? 'Removing...' : 'Remove Member'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
