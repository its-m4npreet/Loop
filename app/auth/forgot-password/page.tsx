'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { Mail, ArrowLeft, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.')
        return
      }
      setSent(true)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.successIcon}>
            <CheckCircle size={48} color="#22c55e" />
          </div>
          <h1 style={styles.title}>Check your inbox</h1>
          <p style={styles.subtitle}>
            If an account exists for <strong>{email}</strong>, we&apos;ve sent a
            password reset link. It will expire in 1 hour.
          </p>
          <Link href="/api/auth" style={styles.link}>
            Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logo}>
            <span style={styles.logoIcon}>Loop</span>
          </div>
          <h1 style={styles.title}>Forgot your password?</h1>
          <p style={styles.subtitle}>
            Enter your email and we&apos;ll send you a link to reset it.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {error && (
            <div style={styles.error}>
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <div style={styles.inputWrap}>
              <Mail size={16} style={styles.inputIcon} />
              <input
                type="email"
                required
                placeholder="you@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={styles.input}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ ...styles.button, ...(loading ? styles.buttonDisabled : {}) }}
          >
            {loading && <Loader2 size={16} style={styles.spinner} />}
            {loading ? 'Sending...' : 'Send reset link'}
          </button>
        </form>

        <div style={styles.footer}>
          <Link href="/api/auth" style={styles.backLink}>
            <ArrowLeft size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
            Back to sign in
          </Link>
        </div>
      </div>
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
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
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
  spinner: {
    animation: 'spin 1s linear infinite',
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
  backLink: {
    fontSize: '13px',
    color: '#22c55e',
    fontWeight: 600,
    textDecoration: 'none',
  },
  link: {
    display: 'block',
    textAlign: 'center',
    marginTop: '24px',
    fontSize: '13px',
    color: '#22c55e',
    fontWeight: 600,
    textDecoration: 'none',
  },
}
