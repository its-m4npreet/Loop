'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  ArrowLeft,
  FileBarChart,
  Calendar,
  Loader2,
  CheckCircle,
  Sparkles,
} from 'lucide-react'
import Link from 'next/link'
import './page.css'

const REPORT_TYPES = [
  {
    value: 'weekly-summary',
    label: 'Weekly Summary',
    desc: "Overview of the past week's feedback and sentiment.",
  },
  {
    value: 'sentiment',
    label: 'Sentiment Report',
    desc: 'Deep analysis of sentiment trends over a period.',
  },
  {
    value: 'theme-analysis',
    label: 'Theme Analysis',
    desc: 'Breakdown of trending themes and their impact.',
  },
  {
    value: 'executive',
    label: 'Executive Summary',
    desc: 'High-level overview for stakeholders.',
  },
]

function GenerateReportForm() {
  const searchParams = useSearchParams()
  const [title, setTitle] = useState('')
  const [reportType, setReportType] = useState('weekly-summary')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [description, setDescription] = useState('')
  const [generating, setGenerating] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [createdReportId, setCreatedReportId] = useState<string | null>(null)

  useEffect(() => {
    const type = searchParams.get('type')
    if (type && REPORT_TYPES.some((t) => t.value === type)) {
      setReportType(type)
    }
  }, [searchParams])

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !dateFrom || !dateTo) {
      setError('Please fill in title and date range.')
      return
    }
    if (dateFrom > dateTo) {
      setError('Start date must be on or before end date.')
      return
    }

    setGenerating(true)
    setError('')
    setCreatedReportId(null)

    try {
      const res = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          periodStart: dateFrom,
          periodEnd: dateTo,
          status: 'COMPLETED',
          reportType: reportType,
          description: description.trim() || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to generate report.')
        return
      }

      setCreatedReportId(data.id ?? null)
      setDone(true)
    } catch {
      setError('A network error occurred. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  const selectedType = REPORT_TYPES.find((t) => t.value === reportType)

  return (
    <div className="generate-page">
      <div className="page-header generate-page-header">
        <div className="generate-page-header-text">
          <Link href="/reports" className="generate-back">
            <ArrowLeft size={15} />
            Back to Reports
          </Link>
          <h1 className="page-title">Generate Report</h1>
          <p className="page-subtitle">
            Configure and generate an AI-powered report from your feedback data.
          </p>
        </div>
      </div>

      {done ? (
        <div className="generate-done-wrap">
          <div className="generate-done">
            <div className="generate-done-icon">
              <CheckCircle size={40} />
            </div>
            <h2 className="generate-done-title">Report Generated</h2>
            <p className="generate-done-desc">
              Your <strong>{selectedType?.label}</strong> report has been
              generated successfully and saved to your workspace.
            </p>
            <div className="generate-done-actions">
              <Link
                href={createdReportId ? `/reports?view=${createdReportId}` : '/reports'}
                className="btn-primary"
              >
                View Report
              </Link>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setDone(false)
                  setTitle('')
                  setDescription('')
                  setCreatedReportId(null)
                  setError('')
                }}
              >
                Generate Another
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="generate-layout">
          <form className="generate-form" onSubmit={handleGenerate}>
            <div className="generate-form-card">
              {error && (
                <div className="generate-error" role="alert">
                  {error}
                </div>
              )}

              <div className="generate-section">
                <div className="generate-section-heading">
                  <h2 className="generate-section-title">Report details</h2>
                  <p className="generate-section-desc">
                    Name your report and choose the analysis type.
                  </p>
                </div>

                <div className="generate-field">
                  <label className="generate-label" htmlFor="report-title">
                    Report Title
                  </label>
                  <input
                    id="report-title"
                    type="text"
                    className="generate-input"
                    placeholder="e.g. Weekly Feedback Summary"
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value)
                      setError('')
                    }}
                    required
                    disabled={generating}
                  />
                </div>

                <div className="generate-field">
                  <span className="generate-label">Report Type</span>
                  <div className="generate-type-grid" role="radiogroup" aria-label="Report type">
                    {REPORT_TYPES.map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        role="radio"
                        aria-checked={reportType === t.value}
                        className={`generate-type-card ${
                          reportType === t.value ? 'active' : ''
                        }`}
                        onClick={() => setReportType(t.value)}
                      >
                        <span className="generate-type-icon">
                          <FileBarChart size={18} />
                        </span>
                        <div className="generate-type-text">
                          <div className="generate-type-label">{t.label}</div>
                          <div className="generate-type-desc">{t.desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="generate-section">
                <div className="generate-section-heading">
                  <h2 className="generate-section-title">Date range</h2>
                  <p className="generate-section-desc">
                    Select the period to include in this report.
                  </p>
                </div>

                <div className="generate-field-row">
                  <div className="generate-field">
                    <label className="generate-label" htmlFor="date-from">
                      <Calendar size={13} />
                      From
                    </label>
                    <input
                      id="date-from"
                      type="date"
                      className="generate-input"
                      value={dateFrom}
                      onChange={(e) => {
                        setDateFrom(e.target.value)
                        setError('')
                      }}
                      required
                      disabled={generating}
                    />
                  </div>
                  <div className="generate-field">
                    <label className="generate-label" htmlFor="date-to">
                      <Calendar size={13} />
                      To
                    </label>
                    <input
                      id="date-to"
                      type="date"
                      className="generate-input"
                      value={dateTo}
                      onChange={(e) => {
                        setDateTo(e.target.value)
                        setError('')
                      }}
                      required
                      disabled={generating}
                    />
                  </div>
                </div>
              </div>

              <div className="generate-section">
                <div className="generate-section-heading">
                  <h2 className="generate-section-title">Additional context</h2>
                  <p className="generate-section-desc">
                    Optional notes to guide the report focus.
                  </p>
                </div>

                <div className="generate-field">
                  <label className="generate-label" htmlFor="report-description">
                    Description
                    <span className="generate-optional">Optional</span>
                  </label>
                  <textarea
                    id="report-description"
                    className="generate-textarea"
                    placeholder="Any specific focus areas or notes for this report..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    disabled={generating}
                  />
                </div>
              </div>
            </div>

            <div className="generate-actions">
              <Link href="/reports" className="btn-secondary">
                Cancel
              </Link>
              <button type="submit" className="btn-primary" disabled={generating}>
                {generating ? (
                  <>
                    <Loader2 size={15} className="spin" />
                    Generating with AI...
                  </>
                ) : (
                  <>
                    <FileBarChart size={15} />
                    Generate Report
                  </>
                )}
              </button>
            </div>
          </form>

          <aside className="generate-aside" aria-label="Report tips">
            <div className="generate-aside-card">
              <div className="generate-aside-icon">
                <Sparkles size={20} />
              </div>
              <h3 className="generate-aside-title">How it works</h3>
              <ul className="generate-aside-list">
                <li>Pulls feedback from the selected date range</li>
                <li>Summarizes sentiment, themes, and trends</li>
                <li>Produces a shareable report you can revisit anytime</li>
              </ul>
            </div>
            <div className="generate-aside-card generate-aside-summary">
              <h3 className="generate-aside-title">Current selection</h3>
              <dl className="generate-aside-meta">
                <div>
                  <dt>Type</dt>
                  <dd>{selectedType?.label ?? '—'}</dd>
                </div>
                <div>
                  <dt>Period</dt>
                  <dd>
                    {dateFrom && dateTo
                      ? `${dateFrom} → ${dateTo}`
                      : 'Not set yet'}
                  </dd>
                </div>
              </dl>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}

export default function GenerateReportPage() {
  return (
    <Suspense>
      <GenerateReportForm />
    </Suspense>
  )
}
