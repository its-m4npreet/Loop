'use client'

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
  type KeyboardEvent,
  type DragEvent,
} from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  PlusCircle,
  Upload,
  Radio,
  X,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Download,
  Loader2,
  Ticket,
  Smartphone,
  ClipboardList,
  Sparkles,
} from 'lucide-react'
import { IMPORT_CHANNELS } from '@/lib/importConstants'

type MethodId = 'manual' | 'csv' | 'simulate'

interface ImportFeedbackClientProps {
  canImport: boolean
  canManual: boolean
  canBulk: boolean
}

interface ManualResult {
  sentiment: string
  theme: string
  featureArea: string
  confidence: number
}

interface BulkResult {
  title: string
  imported: number
  successful: number
  failed: number
  analysisComplete: boolean
  warnings?: string[]
}

const SAMPLE_CSV = `content,channel,customer_name,rating,created_at
Cannot login after update,Support Ticket,John,1,2026-07-01
Need dark mode on web,Survey Response,Sarah,4,2026-07-02
Billing page crashes on checkout,App Review,Alex,2,2026-07-03
`

const SIM_SOURCES = [
  {
    id: 'support-tickets',
    label: 'Support Tickets',
    description: 'Simulated helpdesk tickets with realistic issues',
    icon: Ticket,
    color: '#60A5FA',
    bg: '#EFF6FF',
  },
  {
    id: 'app-reviews',
    label: 'App Reviews',
    description: 'Simulated App Store / Play Store reviews',
    icon: Smartphone,
    color: '#A78BFA',
    bg: '#F5F3FF',
  },
  {
    id: 'surveys',
    label: 'Survey Responses',
    description: 'Simulated NPS and CSAT survey answers',
    icon: ClipboardList,
    color: '#FB923C',
    bg: '#FFF7ED',
  },
] as const

export default function ImportFeedbackClient({
  canImport,
  canManual,
  canBulk,
}: ImportFeedbackClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [active, setActive] = useState<MethodId | null>(null)

  // Open method from query: ?method=csv|manual|simulate
  useEffect(() => {
    const m = searchParams.get('method')
    if (m === 'csv' || m === 'manual' || m === 'simulate') {
      setActive(m)
    }
    if (searchParams.get('upload') === 'csv') {
      setActive('csv')
    }
  }, [searchParams])

  function closeModal() {
    setActive(null)
    if (searchParams.get('method') || searchParams.get('upload')) {
      router.replace('/import-feedback', { scroll: false })
    }
  }

  function afterSuccess() {
    router.refresh()
  }

  if (!canImport) {
    return (
      <>
        <div className="page-header">
          <div>
            <h1 className="page-title">Import Feedback</h1>
            <p className="page-subtitle">
              Add customer feedback via manual entry, CSV, or simulated channels.
            </p>
          </div>
        </div>
        <div className="import-denied">
          <AlertCircle size={20} />
          <p>
            Your role does not allow importing feedback. Ask a workspace admin
            to grant Analyst or Admin access.
          </p>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Import Feedback</h1>
          <p className="page-subtitle">
            Add customer feedback using manual entry, CSV upload, or simulated
            channels. Every record is AI-analyzed and appears across Dashboard,
            Inbox, Analytics, Ask LOOP, and Reports.
          </p>
        </div>
      </div>

      <div className="import-methods-grid">
        {canManual && (
          <article className="import-method-card">
            <div
              className="import-method-icon"
              style={{ background: '#F0FDF4', color: '#22C55E' }}
            >
              <PlusCircle size={22} />
            </div>
            <h2 className="import-method-title">Manual Entry</h2>
            <p className="import-method-desc">
              Add one piece of feedback manually. AI analyzes sentiment, theme,
              and feature area on save.
            </p>
            <button
              type="button"
              className="btn-primary import-method-btn"
              onClick={() => setActive('manual')}
            >
              Open
            </button>
          </article>
        )}

        {canBulk && (
          <article className="import-method-card">
            <div
              className="import-method-icon"
              style={{ background: '#EFF6FF', color: '#60A5FA' }}
            >
              <Upload size={22} />
            </div>
            <h2 className="import-method-title">CSV Upload</h2>
            <p className="import-method-desc">
              Upload multiple feedback records in bulk. Required columns:{' '}
              <strong>content</strong>, <strong>channel</strong>.
            </p>
            <button
              type="button"
              className="btn-primary import-method-btn"
              onClick={() => setActive('csv')}
            >
              Upload CSV
            </button>
          </article>
        )}

        {canBulk && (
          <article className="import-method-card">
            <div
              className="import-method-icon"
              style={{ background: '#F5F3FF', color: '#A78BFA' }}
            >
              <Radio size={22} />
            </div>
            <h2 className="import-method-title">Simulated Channels</h2>
            <p className="import-method-desc">
              Import sample feedback from predefined sources — Support Tickets,
              App Reviews, and Survey Responses.
            </p>
            <button
              type="button"
              className="btn-primary import-method-btn"
              onClick={() => setActive('simulate')}
            >
              Import
            </button>
          </article>
        )}
      </div>

      {active === 'manual' && (
        <ManualEntryModal
          onClose={closeModal}
          onSuccess={afterSuccess}
        />
      )}
      {active === 'csv' && (
        <CsvImportModal onClose={closeModal} onSuccess={afterSuccess} />
      )}
      {active === 'simulate' && (
        <SimulateModal onClose={closeModal} onSuccess={afterSuccess} />
      )}
    </>
  )
}

/* ───────────────── Manual Entry ───────────────── */

function ManualEntryModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void
  onSuccess: () => void
}) {
  const [content, setContent] = useState('')
  const [channel, setChannel] = useState<string>(IMPORT_CHANNELS[0])
  const [customerName, setCustomerName] = useState('')
  const [rating, setRating] = useState('')
  const [feedbackDate, setFeedbackDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<ManualResult | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (!content.trim()) {
      setError('Feedback content is required.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/feedback/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim(),
          channel,
          customerName: customerName.trim() || undefined,
          rating: rating ? Number(rating) : undefined,
          feedbackDate: feedbackDate || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to save feedback.')
        return
      }
      setResult({
        sentiment: data.feedback.sentiment,
        theme: data.feedback.theme,
        featureArea: data.feedback.featureArea,
        confidence: data.feedback.confidence,
      })
      onSuccess()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ModalShell title="Manual Entry" onClose={onClose} busy={loading}>
      {result ? (
        <SuccessBlock
          title="Feedback analyzed and saved"
          onDone={onClose}
          extra={
            <div className="import-ai-result">
              <div className="import-ai-row">
                <span>Sentiment</span>
                <strong className={`import-sentiment ${result.sentiment.toLowerCase()}`}>
                  {formatSentiment(result.sentiment)}
                </strong>
              </div>
              <div className="import-ai-row">
                <span>Theme</span>
                <strong>{result.theme}</strong>
              </div>
              <div className="import-ai-row">
                <span>Feature Area</span>
                <strong>{result.featureArea}</strong>
              </div>
              <div className="import-ai-row">
                <span>Confidence</span>
                <strong>{Math.round(result.confidence * 100)}%</strong>
              </div>
            </div>
          }
        />
      ) : (
        <form onSubmit={handleSubmit} className="import-form">
          <label className="import-label">
            Feedback Content <span className="req">*</span>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste or type the customer feedback…"
              rows={4}
              required
              disabled={loading}
            />
          </label>

          <label className="import-label">
            Channel <span className="req">*</span>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              disabled={loading}
              required
            >
              {IMPORT_CHANNELS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <div className="import-form-row">
            <label className="import-label">
              Customer Name
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Optional"
                disabled={loading}
              />
            </label>
            <label className="import-label">
              Rating
              <select
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                disabled={loading}
              >
                <option value="">—</option>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="import-label">
            Feedback Date
            <input
              type="date"
              value={feedbackDate}
              onChange={(e) => setFeedbackDate(e.target.value)}
              disabled={loading}
            />
          </label>

          {error && (
            <div className="import-error" role="alert">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <div className="import-modal-footer">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 size={15} className="spin" />
                  Analyzing…
                </>
              ) : (
                <>
                  <Sparkles size={15} />
                  Analyze &amp; Save
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </ModalShell>
  )
}

/* ───────────────── CSV Upload ───────────────── */

function CsvImportModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void
  onSuccess: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [result, setResult] = useState<BulkResult | null>(null)

  const acceptFile = useCallback((f: File | null | undefined) => {
    setError('')
    setResult(null)
    if (!f) return
    const name = f.name.toLowerCase()
    if (
      !name.endsWith('.csv') &&
      f.type &&
      !f.type.includes('csv') &&
      !f.type.includes('text')
    ) {
      setError('Please choose a .csv file.')
      setFile(null)
      return
    }
    if (f.size > 5 * 1024 * 1024) {
      setError('File is too large (max 5 MB).')
      setFile(null)
      return
    }
    setFile(f)
  }, [])

  function downloadSample() {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'loop-feedback-sample.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleImport() {
    if (!file || loading) return
    setLoading(true)
    setError('')
    setResult(null)
    setProgress(12)

    const tick = setInterval(() => {
      setProgress((p) => (p < 88 ? p + 4 : p))
    }, 200)

    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/feedback/import', {
        method: 'POST',
        body: form,
      })
      const data = await res.json()
      clearInterval(tick)
      setProgress(100)

      if (!res.ok) {
        setError(
          (data.error || 'Import failed.') +
            (Array.isArray(data.details) && data.details[0]
              ? ` ${data.details[0]}`
              : '')
        )
        return
      }

      setResult({
        title: 'CSV Import Complete',
        imported: data.imported ?? data.successful ?? 0,
        successful: data.successful ?? data.imported ?? 0,
        failed: data.failed ?? 0,
        analysisComplete: data.analysisComplete !== false,
        warnings: data.warnings,
      })
      onSuccess()
    } catch {
      clearInterval(tick)
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ModalShell title="CSV Upload" onClose={onClose} busy={loading}>
      {result ? (
        <SuccessBlock
          title={`${result.imported} Records Imported`}
          onDone={onClose}
          extra={
            <ul className="import-summary-list">
              <li>
                <strong>{result.successful}</strong> Successful
              </li>
              <li>
                <strong>{result.failed}</strong> Failed
              </li>
              <li className="import-summary-ok">
                {result.analysisComplete
                  ? 'Analyze Complete'
                  : 'Analysis pending'}
              </li>
            </ul>
          }
          warnings={result.warnings}
        />
      ) : (
        <div className="import-form">
          <p className="import-hint">
            Required columns: <strong>content</strong>, <strong>channel</strong>.
            Optional: customer_name, rating, created_at.
          </p>

          <div
            className={`import-dropzone ${dragOver ? 'drag-over' : ''} ${file ? 'has-file' : ''}`}
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e: DragEvent) => {
              e.preventDefault()
              setDragOver(false)
              acceptFile(e.dataTransfer.files?.[0])
            }}
            onClick={() => inputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e: KeyboardEvent) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                inputRef.current?.click()
              }
            }}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              className="import-file-input"
              onChange={(e) => acceptFile(e.target.files?.[0])}
            />
            {file ? (
              <>
                <FileSpreadsheet size={28} />
                <span className="import-file-name">{file.name}</span>
                <span className="import-file-meta">
                  {(file.size / 1024).toFixed(1)} KB — click to change
                </span>
              </>
            ) : (
              <>
                <Upload size={28} />
                <span className="import-file-name">
                  Drop a CSV file here, or click to browse
                </span>
                <span className="import-file-meta">
                  Max 5 MB · up to 5,000 rows
                </span>
              </>
            )}
          </div>

          <button
            type="button"
            className="import-sample-link"
            onClick={downloadSample}
          >
            <Download size={14} />
            Download sample CSV
          </button>

          {loading && (
            <div className="import-progress">
              <div className="import-progress-bar">
                <div
                  className="import-progress-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span>Uploading &amp; running AI analysis…</span>
            </div>
          )}

          {error && (
            <div className="import-error" role="alert">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <div className="import-modal-footer">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={handleImport}
              disabled={!file || loading}
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="spin" />
                  Importing…
                </>
              ) : (
                'Import feedback'
              )}
            </button>
          </div>
        </div>
      )}
    </ModalShell>
  )
}

/* ───────────────── Simulated Channels ───────────────── */

function SimulateModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void
  onSuccess: () => void
}) {
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [result, setResult] = useState<BulkResult | null>(null)

  async function handleImport(sourceId: string, label: string) {
    setError('')
    setResult(null)
    setLoadingId(sourceId)
    try {
      const res = await fetch('/api/feedback/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: sourceId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Import failed.')
        return
      }
      setResult({
        title: `${label} Imported`,
        imported: data.imported ?? 0,
        successful: data.imported ?? 0,
        failed: data.failed ?? 0,
        analysisComplete: data.analysisComplete !== false,
        warnings: data.warnings,
      })
      onSuccess()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <ModalShell title="Simulated Channels" onClose={onClose} busy={!!loadingId}>
      {result ? (
        <SuccessBlock
          title={result.title}
          onDone={onClose}
          extra={
            <ul className="import-summary-list">
              <li>
                <strong>{result.imported}</strong> Feedback Records Added
              </li>
              <li className="import-summary-ok">
                {result.analysisComplete
                  ? 'AI Analysis Completed'
                  : 'Analysis pending'}
              </li>
            </ul>
          }
          warnings={result.warnings}
        />
      ) : (
        <div className="import-form">
          <p className="import-hint">
            Loads realistic sample feedback from local JSON (no live
            integrations). Each import runs AI analysis and updates your
            workspace.
          </p>

          <div className="import-sim-list">
            {SIM_SOURCES.map((s) => {
              const Icon = s.icon
              const busy = loadingId === s.id
              return (
                <div key={s.id} className="import-sim-row">
                  <div
                    className="import-sim-icon"
                    style={{ background: s.bg, color: s.color }}
                  >
                    <Icon size={18} />
                  </div>
                  <div className="import-sim-text">
                    <strong>{s.label}</strong>
                    <span>{s.description}</span>
                  </div>
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={!!loadingId}
                    onClick={() => handleImport(s.id, s.label)}
                  >
                    {busy ? (
                      <>
                        <Loader2 size={14} className="spin" />
                        Importing…
                      </>
                    ) : (
                      'Import'
                    )}
                  </button>
                </div>
              )
            })}
          </div>

          {error && (
            <div className="import-error" role="alert">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <div className="import-modal-footer">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={!!loadingId}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </ModalShell>
  )
}

/* ───────────────── Shared UI pieces ───────────────── */

function ModalShell({
  title,
  onClose,
  busy,
  children,
}: {
  title: string
  onClose: () => void
  busy?: boolean
  children: ReactNode
}) {
  useEffect(() => {
    function onKey(e: globalThis.KeyboardEvent) {
      if (e.key === 'Escape' && !busy) onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [busy, onClose])

  return (
    <div
      className="import-modal-overlay"
      onClick={() => !busy && onClose()}
      role="presentation"
    >
      <div
        className="import-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-modal-title"
      >
        <div className="import-modal-header">
          <h3 id="import-modal-title">{title}</h3>
          <button
            type="button"
            className="import-modal-close"
            onClick={() => !busy && onClose()}
            disabled={busy}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
        <div className="import-modal-body">{children}</div>
      </div>
    </div>
  )
}

function SuccessBlock({
  title,
  extra,
  warnings,
  onDone,
}: {
  title: string
  extra?: ReactNode
  warnings?: string[]
  onDone: () => void
}) {
  return (
    <div className="import-success">
      <CheckCircle2 size={40} className="import-success-icon" />
      <p className="import-success-title">{title}</p>
      {extra}
      {warnings && warnings.length > 0 && (
        <div className="import-warnings">
          {warnings.slice(0, 6).map((w, i) => (
            <p key={i}>{w}</p>
          ))}
        </div>
      )}
      <div className="import-modal-footer" style={{ padding: 0, marginTop: 16 }}>
        <button type="button" className="btn-primary" onClick={onDone}>
          Done
        </button>
      </div>
    </div>
  )
}

function formatSentiment(s: string) {
  const v = s.toUpperCase()
  if (v === 'POSITIVE') return 'Positive'
  if (v === 'NEGATIVE') return 'Negative'
  return 'Neutral'
}
