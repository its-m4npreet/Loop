'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Mail, Lock, User, CheckCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'

function InviteForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!token) setError('Invalid invitation link.')
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!token) return
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/team/invite/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, name, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to accept invitation')
        return
      }
      setSuccess(true)
      setTimeout(() => router.push('/api/auth'), 2000)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div style={styles.card}>
        <div style={styles.successIcon}>
          <CheckCircle size={48} color="#22c55e" />
        </div>
        <h1 style={styles.title}>Welcome to Loop!</h1>
        <p style={styles.subtitle}>Your account has been created. Redirecting to sign in...</p>
      </div>
    )
  }

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>Loop</span>
        </div>
        <h1 style={styles.title}>Accept Invitation</h1>
        <p style={styles.subtitle}>Set up your account to join the workspace.</p>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        {error && (
          <div style={styles.error}>
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        <div style={styles.field}>
          <label style={styles.label}>Full Name</label>
          <div style={styles.inputWrap}>
            <User size={16} style={styles.inputIcon} />
            <input
              type="text"
              required
              placeholder="John Doe"
              value={name}
              onChange={e => setName(e.target.value)}
              style={styles.input}
            />
          </div>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Password</label>
          <div style={styles.inputWrap}>
            <Lock size={16} style={styles.inputIcon} />
            <input
              type="password"
              required
              placeholder="At least 8 characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={styles.input}
            />
          </div>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Confirm Password</label>
          <div style={styles.inputWrap}>
            <Lock size={16} style={styles.inputIcon} />
            <input
              type="password"
              required
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              style={styles.input}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !token}
          style={{
            ...styles.button,
            ...(loading || !token ? styles.buttonDisabled : {}),
          }}
        >
          {loading ? 'Creating Account...' : 'Accept & Create Account'}
        </button>
      </form>

      <div style={styles.footer}>
        <Link href="/api/auth" style={styles.link}>Already have an account? Sign in</Link>
      </div>
    </div>
  )
}

export default function InvitePage() {
  return (
    <div style={styles.page}>
      <Suspense fallback={<div style={styles.page}><div style={styles.card}><p style={styles.subtitle}>Loading...</p></div></div>}>
        <InviteForm />
      </Suspense>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f4faf6',
    padding: '20px',
  },
  card: {
    width: '100%',
    maxWidth: '420px',
    background: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
    padding: '40px 36px',
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  logo: {
    marginBottom: '20px',
  },
  logoIcon: {
    fontSize: '28px',
    fontWeight: 900,
    color: '#22c55e',
    letterSpacing: '-1px',
  },
  title: {
    margin: '0 0 8px',
    fontSize: '22px',
    fontWeight: 800,
    color: '#0f172a',
    letterSpacing: '-0.4px',
  },
  subtitle: {
    margin: 0,
    fontSize: '14px',
    color: '#64748b',
    lineHeight: 1.5,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#64748b',
  },
  inputWrap: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '12px',
    color: '#94a3b8',
    pointerEvents: 'none',
  },
  input: {
    width: '100%',
    height: '42px',
    padding: '0 12px 0 38px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    background: '#ffffff',
    color: '#0f172a',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.15s ease',
    boxSizing: 'border-box',
  },
  button: {
    width: '100%',
    height: '44px',
    marginTop: '8px',
    background: '#22c55e',
    border: 'none',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'background 0.15s ease',
    letterSpacing: '-0.2px',
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  error: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 12px',
    background: '#fef2f2',
    color: '#ef4444',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
  },
  successIcon: {
    textAlign: 'center',
    marginBottom: '16px',
  },
  footer: {
    textAlign: 'center',
    marginTop: '24px',
    paddingTop: '20px',
    borderTop: '1px solid #f1f5f9',
  },
  link: {
    fontSize: '13px',
    color: '#22c55e',
    fontWeight: 600,
    textDecoration: 'none',
  },
}
