'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  const noToken = !token
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(noToken ? 'error' : 'loading')
  const [error, setError] = useState(noToken ? 'Invalid or missing verification token.' : '')

  useEffect(() => {
    if (!token) return

    fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) {
          setStatus('error')
          setError(data.error || 'Verification failed.')
          return
        }
        setStatus('success')
        setTimeout(() => router.push('/api/auth'), 2000)
      })
      .catch(() => {
        setStatus('error')
        setError('Network error. Please try again.')
      })
  }, [token, router])

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {status === 'loading' && (
          <div style={styles.center}>
            <Loader2 size={40} color="#22c55e" style={styles.spinner} />
            <h1 style={styles.title}>Verifying your email...</h1>
          </div>
        )}

        {status === 'success' && (
          <div style={styles.center}>
            <div style={styles.iconWrap}>
              <CheckCircle size={48} color="#22c55e" />
            </div>
            <h1 style={styles.title}>Email verified!</h1>
            <p style={styles.subtitle}>
              Your account is now active. Redirecting to sign in...
            </p>
          </div>
        )}

        {status === 'error' && (
          <div style={styles.center}>
            <div style={styles.iconWrap}>
              <AlertCircle size={48} color="#ef4444" />
            </div>
            <h1 style={styles.title}>Verification failed</h1>
            <p style={styles.subtitle}>{error}</p>
            <Link href="/api/auth" style={styles.link}>
              Back to sign in
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default function VerifyEmailRoute() {
  return (
    <Suspense
      fallback={
        <div style={styles.page}>
          <div style={styles.card}>
            <p style={styles.subtitle}>Loading...</p>
          </div>
        </div>
      }
    >
      <VerifyEmailPage />
    </Suspense>
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
    padding: '48px 36px',
  },
  center: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: '12px',
  },
  iconWrap: {
    marginBottom: '4px',
  },
  spinner: {
    animation: 'spin 1s linear infinite',
    marginBottom: '4px',
  },
  title: {
    margin: 0,
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
  link: {
    marginTop: '8px',
    fontSize: '14px',
    color: '#22c55e',
    fontWeight: 600,
    textDecoration: 'none',
  },
}
