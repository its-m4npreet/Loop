'use client'

import { useState, FormEvent, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, Loader2, ArrowLeft } from 'lucide-react'

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(token ? '' : 'Invalid or missing reset token.')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    if (!token) return

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to reset password.')
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
        <h1 style={styles.title}>Password updated!</h1>
        <p style={styles.subtitle}>
          Your password has been changed. Redirecting to sign in...
        </p>
      </div>
    )
  }

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>Loop</span>
        </div>
        <h1 style={styles.title}>Set a new password</h1>
        <p style={styles.subtitle}>Choose a strong password for your account.</p>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        {error && (
          <div style={styles.error}>
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        <div style={styles.field}>
          <label style={styles.label}>New Password</label>
          <div style={styles.inputWrap}>
            <Lock size={16} style={styles.inputIcon} />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              placeholder="At least 8 characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={styles.input}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={styles.eyeButton}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Confirm Password</label>
          <div style={styles.inputWrap}>
            <Lock size={16} style={styles.inputIcon} />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              style={styles.input}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !token}
          style={{ ...styles.button, ...(loading || !token ? styles.buttonDisabled : {}) }}
        >
          {loading && <Loader2 size={16} style={styles.spinner} />}
          {loading ? 'Updating...' : 'Update password'}
        </button>
      </form>

      <div style={styles.footer}>
        <Link href="/api/auth" style={styles.backLink}>
          <ArrowLeft size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
          Back to sign in
        </Link>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <div style={styles.page}>
      <Suspense
        fallback={
          <div style={styles.page}>
            <div style={styles.card}>
              <p style={styles.subtitle}>Loading...</p>
            </div>
          </div>
        }
      >
        <ResetPasswordForm />
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
    padding: '0 40px 0 38px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    background: '#ffffff',
    color: '#0f172a',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.15s ease',
    boxSizing: 'border-box',
  },
  eyeButton: {
    position: 'absolute',
    right: '12px',
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    padding: '4px',
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
}
