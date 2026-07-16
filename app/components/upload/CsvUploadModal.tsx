'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Upload,
  X,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Download,
} from 'lucide-react'
import './CsvUpload.css'

const SAMPLE_CSV = `content,channel,customer,sentiment,status,theme,satisfaction,responseTime
"The new dashboard is fast and clear.",Support Ticket,Aisha Patel,POSITIVE,NEW,UI/UX,5,12
"Billing page charged me twice.",Email,Marcus Johnson,NEGATIVE,NEW,Billing,1,45
"Works fine overall, mobile could improve.",NPS Survey,Priya Sharma,NEUTRAL,REVIEWED,Performance,3,20
`

interface ImportResult {
  imported: number
  skipped: number
  themesCreated: number
  themesLinked: number
  warnings?: string[]
}

interface CsvUploadModalProps {
  open: boolean
  onClose: () => void
}

export default function CsvUploadModal({ open, onClose }: CsvUploadModalProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<ImportResult | null>(null)

  const reset = useCallback(() => {
    setFile(null)
    setDragOver(false)
    setLoading(false)
    setError('')
    setResult(null)
    if (inputRef.current) inputRef.current.value = ''
  }, [])

  useEffect(() => {
    if (!open) {
      // Delay reset so close animation isn't jarring
      const t = setTimeout(reset, 200)
      return () => clearTimeout(t)
    }
  }, [open, reset])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !loading) onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, loading, onClose])

  function acceptFile(f: File | null | undefined) {
    setError('')
    setResult(null)
    if (!f) return
    const name = f.name.toLowerCase()
    if (!name.endsWith('.csv') && f.type && !f.type.includes('csv') && !f.type.includes('text')) {
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
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    acceptFile(e.dataTransfer.files?.[0])
  }

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

    try {
      const form = new FormData()
      form.append('file', file)

      const res = await fetch('/api/feedback/import', {
        method: 'POST',
        body: form,
      })
      const data = await res.json()

      if (!res.ok) {
        const detail =
          Array.isArray(data.details) && data.details.length
            ? ` ${data.details[0]}`
            : ''
        setError((data.error || 'Import failed.') + detail)
        return
      }

      setResult({
        imported: data.imported ?? 0,
        skipped: data.skipped ?? 0,
        themesCreated: data.themesCreated ?? 0,
        themesLinked: data.themesLinked ?? 0,
        warnings: data.warnings,
      })
      router.refresh()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div
      className="csv-modal-overlay"
      onClick={() => !loading && onClose()}
      role="presentation"
    >
      <div
        className="csv-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="csv-upload-title"
      >
        <div className="csv-modal-header">
          <h3 id="csv-upload-title">Upload CSV</h3>
          <button
            type="button"
            className="csv-modal-close"
            onClick={() => !loading && onClose()}
            aria-label="Close"
            disabled={loading}
          >
            <X size={16} />
          </button>
        </div>

        <div className="csv-modal-body">
          {result ? (
            <div className="csv-result">
              <CheckCircle2 size={36} className="csv-result-icon" />
              <p className="csv-result-title">
                Imported {result.imported.toLocaleString()} feedback
                {result.imported === 1 ? ' entry' : ' entries'}
              </p>
              <ul className="csv-result-meta">
                {result.skipped > 0 && (
                  <li>{result.skipped} row{result.skipped === 1 ? '' : 's'} skipped (empty content)</li>
                )}
                {result.themesCreated > 0 && (
                  <li>{result.themesCreated} new theme{result.themesCreated === 1 ? '' : 's'} created</li>
                )}
                {result.themesLinked > 0 && (
                  <li>{result.themesLinked} theme link{result.themesLinked === 1 ? '' : 's'} added</li>
                )}
              </ul>
              {result.warnings && result.warnings.length > 0 && (
                <div className="csv-warnings">
                  {result.warnings.slice(0, 5).map((w, i) => (
                    <p key={i}>{w}</p>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              <p className="csv-modal-desc">
                Import customer feedback in bulk. Required column:{' '}
                <strong>content</strong> (or feedback / message). Optional:{' '}
                channel, customer, sentiment, status, theme, satisfaction,
                responseTime, createdAt.
              </p>

              <div
                className={`csv-dropzone ${dragOver ? 'drag-over' : ''} ${file ? 'has-file' : ''}`}
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragOver(true)
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
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
                  className="csv-file-input"
                  onChange={(e) => acceptFile(e.target.files?.[0])}
                />
                {file ? (
                  <>
                    <FileSpreadsheet size={28} className="csv-drop-icon" />
                    <span className="csv-file-name">{file.name}</span>
                    <span className="csv-file-size">
                      {(file.size / 1024).toFixed(1)} KB — click to change
                    </span>
                  </>
                ) : (
                  <>
                    <Upload size={28} className="csv-drop-icon" />
                    <span className="csv-drop-title">
                      Drop a CSV file here, or click to browse
                    </span>
                    <span className="csv-drop-hint">Max 5 MB · up to 5,000 rows</span>
                  </>
                )}
              </div>

              <button
                type="button"
                className="csv-sample-btn"
                onClick={downloadSample}
              >
                <Download size={14} />
                Download sample CSV
              </button>

              {error && (
                <div className="csv-modal-error" role="alert">
                  <AlertCircle size={14} />
                  <span>{error}</span>
                </div>
              )}
            </>
          )}
        </div>

        <div className="csv-modal-footer">
          {result ? (
            <button type="button" className="btn-primary" onClick={onClose}>
              Done
            </button>
          ) : (
            <>
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
                {loading ? 'Importing…' : 'Import feedback'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
