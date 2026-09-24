'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Building2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  FileSpreadsheet,
  PlusCircle,
  Upload,
  Users,
  PartyPopper,
  X,
  AlertCircle,
  KeyRound,
  Download,
} from 'lucide-react'
import { IMPORT_CHANNELS } from '@/lib/importConstants'

interface OnboardingWizardProps {
  userName: string | null
}

type StepId = 1 | 2 | 3

const STEPS: { id: StepId; label: string }[] = [
  { id: 1, label: 'Workspace' },
  { id: 2, label: 'Import' },
  { id: 3, label: 'Team' },
]

const SAMPLE_CSV = `content,channel,customer_name,rating,created_at
Cannot login after update,Support Ticket,John,1,2026-07-01
Need dark mode on web,Survey Response,Sarah,4,2026-07-02
Billing page crashes on checkout,App Review,Alex,2,2026-07-03
`

export default function OnboardingWizard({ userName }: OnboardingWizardProps) {
  const router = useRouter()
  const [step, setStep] = useState<StepId>(1)

  const first = userName?.split(' ')[0] || 'there'

  async function finish() {
    router.push('/dashboard')
    router.refresh()
  }

  async function skip() {
    const res = await fetch('/api/onboarding/skip', { method: 'POST' })
    if (res.ok) {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="onboarding-card">
      <div className="onboarding-progress">
        {STEPS.map((s) => (
          <div
            key={s.id}
            className={`onboarding-progress-step ${
              s.id === step ? 'active' : ''
            } ${s.id < step ? 'done' : ''}`}
          >
            <span className="onboarding-progress-dot">
              {s.id < step ? <CheckCircle2 size={14} /> : s.id}
            </span>
            <span className="onboarding-progress-label">{s.label}</span>
          </div>
        ))}
      </div>

      {step === 1 && (
        <StepWorkspace
          firstName={first}
          onDone={() => setStep(2)}
          onSkip={skip}
        />
      )}
      {step === 2 && (
        <StepImport
          onDone={() => setStep(3)}
          onBack={() => setStep(1)}
          onSkip={skip}
        />
      )}
      {step === 3 && (
        <StepTeam
          onBack={() => setStep(2)}
          onSkip={skip}
          onFinish={finish}
        />
      )}
    </div>
  )
}

function StepWorkspace({
  firstName,
  onDone,
  onSkip,
}: {
  firstName: string
  onDone: () => void
  onSkip: () => void
}) {
  const [companyName, setCompanyName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = companyName.trim()
    if (trimmed.length < 2) return

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
      onDone()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="onboarding-step">
      <h1 className="onboarding-title">
        Welcome, {firstName}! Let&apos;s set up your workspace.
      </h1>
      <p className="onboarding-subtitle">
        Name your company or team. You can change this anytime from Workspace
        settings.
      </p>

      <form onSubmit={handleSubmit} className="onboarding-form">
        <div className="onboarding-field">
          <label className="onboarding-label" htmlFor="company-name">
            Company Name
          </label>
          <div className="onboarding-input-wrap">
            <Building2 size={16} className="onboarding-input-icon" />
            <input
              id="company-name"
              type="text"
              className="onboarding-input"
              placeholder="e.g. Acme Corporation"
              value={companyName}
              onChange={(e) => {
                setCompanyName(e.target.value)
                setError('')
              }}
              autoFocus
            />
          </div>
        </div>

        {error && (
          <p className="onboarding-error">
            <AlertCircle size={15} />
            {error}
          </p>
        )}

        <button
          type="submit"
          className="onboarding-btn-primary"
          disabled={loading || companyName.trim().length < 2}
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

      <button className="onboarding-btn-ghost" onClick={onSkip}>
        Skip for now
      </button>
    </div>
  )
}

function StepImport({
  onDone,
  onBack,
  onSkip,
}: {
  onDone: () => void
  onBack: () => void
  onSkip: () => void
}) {
  const [mode, setMode] = useState<'choose' | 'manual' | 'csv'>('choose')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const [content, setContent] = useState('')
  const [channel, setChannel] = useState<string>(IMPORT_CHANNELS[0])
  const [customerName, setCustomerName] = useState('')
  const [rating, setRating] = useState('')
  const [fileName, setFileName] = useState('')

  async function submitManual(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/feedback/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          channel,
          customerName: customerName || undefined,
          rating: rating ? rating : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to save feedback')
        return
      }
      setDone(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function submitCsv(e: React.FormEvent) {
    e.preventDefault()
    const input = document.getElementById('onboarding-csv-file') as HTMLInputElement | null
    const file = input?.files?.[0]
    if (!file) {
      setError('Choose a CSV file to upload.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/feedback/import', {
        method: 'POST',
        body: form,
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to import CSV')
        return
      }
      setDone(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="onboarding-step onboarding-success">
        <span className="onboarding-success-icon">
          <CheckCircle2 size={40} />
        </span>
        <h1 className="onboarding-title">Feedback imported!</h1>
        <p className="onboarding-subtitle">
          Your data has been analyzed and will appear across the Dashboard,
          Inbox, Analytics, Ask LOOP, and Reports.
        </p>
        <div className="onboarding-actions">
          <button className="onboarding-btn-primary" onClick={onDone}>
            Continue
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="onboarding-step">
      <h1 className="onboarding-title">Add your first feedback</h1>
      <p className="onboarding-subtitle">
        Bring in customer feedback so LOOP can surface insights. You can always
        add more later.
      </p>

      {mode === 'choose' && (
        <div className="onboarding-options">
          <button
            className="onboarding-option"
            onClick={() => setMode('manual')}
          >
            <span className="onboarding-option-icon">
              <PlusCircle size={22} />
            </span>
            <span className="onboarding-option-title">Manual entry</span>
            <span className="onboarding-option-desc">
              Type a single piece of feedback right now.
            </span>
          </button>

          <button className="onboarding-option" onClick={() => setMode('csv')}>
            <span className="onboarding-option-icon">
              <Upload size={22} />
            </span>
            <span className="onboarding-option-title">CSV upload</span>
            <span className="onboarding-option-desc">
              Bulk import feedback from a spreadsheet.
            </span>
          </button>

          <Link href="/settings/integrations" className="onboarding-option">
            <span className="onboarding-option-icon">
              <KeyRound size={22} />
            </span>
            <span className="onboarding-option-title">Integrations</span>
            <span className="onboarding-option-desc">
              Connect via API key or future native channels.
            </span>
          </Link>
        </div>
      )}

      {mode === 'manual' && (
        <form onSubmit={submitManual} className="onboarding-form">
          <div className="onboarding-field">
            <label className="onboarding-label" htmlFor="onb-content">
              Feedback content
            </label>
            <textarea
              id="onb-content"
              className="onboarding-textarea"
              placeholder="e.g. The mobile app keeps crashing when I try to checkout."
              value={content}
              onChange={(e) => {
                setContent(e.target.value)
                setError('')
              }}
              rows={4}
              autoFocus
            />
          </div>

          <div className="onboarding-field">
            <label className="onboarding-label" htmlFor="onb-channel">
              Channel
            </label>
            <select
              id="onb-channel"
              className="onboarding-input"
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
            >
              {IMPORT_CHANNELS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="onboarding-row">
            <div className="onboarding-field">
              <label className="onboarding-label" htmlFor="onb-customer">
                Customer name (optional)
              </label>
              <input
                id="onb-customer"
                type="text"
                className="onboarding-input"
                placeholder="e.g. Sarah"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>
            <div className="onboarding-field">
              <label className="onboarding-label" htmlFor="onb-rating">
                Rating (1–5, optional)
              </label>
              <input
                id="onb-rating"
                type="number"
                min={1}
                max={5}
                className="onboarding-input"
                placeholder="e.g. 4"
                value={rating}
                onChange={(e) => setRating(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <p className="onboarding-error">
              <AlertCircle size={15} />
              {error}
            </p>
          )}

          <button
            type="submit"
            className="onboarding-btn-primary"
            disabled={loading || !content.trim()}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="spin" />
                Saving...
              </>
            ) : (
              <>
                Save Feedback
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      )}

      {mode === 'csv' && (
        <form onSubmit={submitCsv} className="onboarding-form">
          <div className="onboarding-csv-box">
            <span className="onboarding-option-icon">
              <FileSpreadsheet size={22} />
            </span>
            <p className="onboarding-csv-title">
              {fileName ? `Selected: ${fileName}` : 'Choose a CSV file'}
            </p>
            <p className="onboarding-csv-hint">
              Columns: content (required), channel (required), customer_name,
              rating, created_at
            </p>
            <input
              id="onboarding-csv-file"
              type="file"
              accept=".csv"
              className="onboarding-file-input"
              onChange={(e) => setFileName(e.target.files?.[0]?.name || '')}
            />
          </div>

          <button
            type="button"
            className="onboarding-btn-download"
            onClick={() => {
              const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = 'feedback-sample.csv'
              a.click()
              URL.revokeObjectURL(url)
            }}
          >
            <Download size={15} />
            Download sample CSV
          </button>

          {error && (
            <p className="onboarding-error">
              <AlertCircle size={15} />
              {error}
            </p>
          )}

          <button
            type="submit"
            className="onboarding-btn-primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="spin" />
                Importing...
              </>
            ) : (
              <>
                Upload CSV
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      )}

      <div className="onboarding-actions">
        {mode !== 'choose' ? (
          <button
            className="onboarding-btn-ghost"
            onClick={() => {
              setMode('choose')
              setError('')
            }}
          >
            <ArrowLeft size={15} />
            Back to options
          </button>
        ) : (
          <>
            <button className="onboarding-btn-ghost" onClick={onBack}>
              <ArrowLeft size={15} />
              Back
            </button>
            <button className="onboarding-btn-ghost" onClick={onSkip}>
              Skip for now
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function StepTeam({
  onBack,
  onSkip,
  onFinish,
}: {
  onBack: () => void
  onSkip: () => void
  onFinish: () => void
}) {
  const [email, setEmail] = useState('')
  const [invited, setInvited] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role: 'VIEWER' }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to send invitation')
        return
      }
      setInvited((prev) => [...prev, email.trim()])
      setEmail('')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="onboarding-step">
      <h1 className="onboarding-title">Invite your team</h1>
      <p className="onboarding-subtitle">
        Add teammates so they can see insights too. Invitations are sent by
        email.
      </p>

      <form onSubmit={handleInvite} className="onboarding-form">
        <div className="onboarding-invite-row">
          <div className="onboarding-field">
            <label className="onboarding-label" htmlFor="onb-invite">
              Email address
            </label>
            <div className="onboarding-input-wrap">
              <Users size={16} className="onboarding-input-icon" />
              <input
                id="onb-invite"
                type="email"
                className="onboarding-input"
                placeholder="teammate@company.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setError('')
                }}
              />
            </div>
          </div>
        </div>

        {error && (
          <p className="onboarding-error">
            <AlertCircle size={15} />
            {error}
          </p>
        )}

        <div className="onboarding-invite-actions">
          <button
            type="submit"
            className="onboarding-btn-secondary"
            disabled={loading || !email.trim()}
          >
            {loading ? (
              <Loader2 size={16} className="spin" />
            ) : (
              'Send Invite'
            )}
          </button>
        </div>
      </form>

      {invited.length > 0 && (
        <div className="onboarding-invited">
          {invited.map((inv) => (
            <div key={inv} className="onboarding-invited-item">
              <CheckCircle2 size={15} />
              Invited {inv}
              <button
                type="button"
                className="onboarding-invited-remove"
                onClick={() =>
                  setInvited((prev) => prev.filter((x) => x !== inv))
                }
                aria-label="Undo invite"
              >
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="onboarding-actions">
        <button className="onboarding-btn-ghost" onClick={onBack}>
          <ArrowLeft size={15} />
          Back
        </button>
        <button className="onboarding-btn-ghost" onClick={onSkip}>
          Skip for now
        </button>
      </div>

      <div className="onboarding-finish">
        <button className="onboarding-btn-primary" onClick={onFinish}>
          <PartyPopper size={16} />
          Finish Setup
        </button>
      </div>
    </div>
  )
}