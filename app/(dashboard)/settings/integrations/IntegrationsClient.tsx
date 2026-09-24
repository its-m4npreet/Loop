'use client'

import { useState } from 'react'
import {
  KeyRound,
  Plus,
  Copy,
  Check,
  Trash2,
  Loader2,
  AlertCircle,
  Terminal,
  ExternalLink,
  Code2,
} from 'lucide-react'

interface IntegrationKey {
  id: string
  name: string
  keyPrefix: string
  rawKey: string | null
  lastUsedAt: string | null
  revokedAt: string | null
  createdAt: string
}

type ViewMode = 'key' | 'snippet'

interface IntegrationsClientProps {
  canManage: boolean
  initialKeys: IntegrationKey[]
  apiBaseUrl: string
}

const btnGhost =
  'inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-slate-200 bg-white text-slate-500 text-xs font-semibold cursor-pointer whitespace-nowrap transition-colors hover:bg-slate-50 hover:text-slate-900 hover:border-green-500 disabled:opacity-55 disabled:cursor-not-allowed'

const btnDanger = `${btnGhost} text-red-500 border-red-200 hover:bg-red-50 hover:border-red-200`

const btnPrimary =
  'inline-flex items-center justify-center gap-1.5 h-[38px] px-4 rounded-md bg-green-500 text-white text-[13px] font-semibold cursor-pointer transition-colors hover:bg-green-600 disabled:opacity-55 disabled:cursor-not-allowed'

const sectionTitle =
  'text-[13px] font-bold text-slate-500 uppercase tracking-[0.4px]'

const codeBlock =
  'flex-1 min-w-0 overflow-x-auto p-2.5 bg-slate-900 text-sky-300 text-xs rounded-md font-mono whitespace-nowrap'

const card = 'bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden'

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function IntegrationsClient({
  canManage,
  initialKeys,
  apiBaseUrl,
}: IntegrationsClientProps) {
  const [keys, setKeys] = useState<IntegrationKey[]>(initialKeys)
  const [name, setName] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [created, setCreated] = useState<{
    name: string
    rawKey: string
  } | null>(null)
  const [revokingId, setRevokingId] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('key')

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreateError('')
    if (!name.trim()) {
      setCreateError('Name is required.')
      return
    }
    setCreating(true)
    try {
      const res = await fetch('/api/integrations/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setCreateError(data.error || 'Failed to create API key.')
        return
      }
      setKeys((prev) => [
        { ...data.key, rawKey: data.rawKey, lastUsedAt: null, revokedAt: null },
        ...prev,
      ])
      setCreated({ name: data.key.name, rawKey: data.rawKey })
      setName('')
    } catch {
      setCreateError('Network error. Please try again.')
    } finally {
      setCreating(false)
    }
  }

  async function handleRevoke(id: string) {
    if (
      !window.confirm(
        'Revoke this API key? Requests using it will stop working immediately.'
      )
    ) {
      return
    }
    setRevokingId(id)
    try {
      const res = await fetch(`/api/integrations/api-keys/${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setKeys((prev) =>
          prev.map((k) =>
            k.id === id ? { ...k, revokedAt: new Date().toISOString() } : k
          )
        )
      }
    } finally {
      setRevokingId(null)
    }
  }

  async function copyKey(text: string, id: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(id)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      setCopied(null)
    }
  }

  return (
    <div className="w-full flex flex-col gap-5">
      <div className="w-full">
        <h1 className="text-[22px] font-extrabold text-slate-900 tracking-tight leading-tight">
          Integrations
        </h1>
        <p className="mt-1 text-sm text-slate-500 leading-relaxed max-w-[480px]">
          Programmatically send customer feedback into LOOP with API keys.
        </p>
      </div>

      {/* ── Curl example ── */}
      <section className="w-full">
        <h2 className={`${sectionTitle} mb-2`}>Ingest feedback via API</h2>
        <div className={card}>
          <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-slate-100">
            <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-900 font-mono">
              <Terminal size={16} />
              <span>POST /api/v1/feedback</span>
            </div>
            <button
              type="button"
              className={btnGhost}
              onClick={() => copyKey(buildCurl(apiBaseUrl, 'lk_YOUR_API_KEY'), 'curl')}
            >
              {copied === 'curl' ? <Check size={14} /> : <Copy size={14} />}
              {copied === 'curl' ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <pre className="m-0 p-5 bg-slate-900 text-slate-200 text-xs leading-relaxed font-mono overflow-x-auto whitespace-pre">
            {buildCurl(apiBaseUrl, 'lk_YOUR_API_KEY')}
          </pre>
          <p className="m-0 px-5 py-2.5 text-xs text-slate-500 border-t border-slate-100 leading-relaxed">
            Feedback is AI-analyzed on save and shows up across Dashboard,
            Inbox, Analytics, Ask LOOP, and Reports. Switch to{' '}
            <strong className="text-slate-700 font-semibold">Snippets</strong>{' '}
            below to get a ready-to-run request with one of your real keys.
          </p>
        </div>
      </section>

      {/* ── Create key ── */}
      {canManage && (
        <section className="w-full">
          <h2 className={`${sectionTitle} mb-2`}>Create API key</h2>
          <div className={card}>
            <form
              className="flex flex-col sm:flex-row gap-3 p-4 px-5"
              onSubmit={handleCreate}
            >
              <input
                type="text"
                placeholder="Name this key, e.g. Zendesk webhook"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
                disabled={creating}
                className="flex-1 min-w-0 px-3 py-2 sm:px-3 rounded-md border border-slate-200 bg-white text-slate-900 text-[13px] outline-none transition-colors focus:border-green-500 disabled:opacity-55"
              />
              <button
                type="submit"
                className={`${btnPrimary} w-full sm:w-auto`}
                disabled={creating || !name.trim()}
              >
                {creating ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Creating…
                  </>
                ) : (
                  <>
                    <Plus size={15} />
                    Create key
                  </>
                )}
              </button>
            </form>
            {createError && (
              <div
                className="flex items-start gap-2 mx-5 mb-4 text-xs font-semibold text-red-500 px-3 py-2 bg-red-50 rounded-md leading-snug"
                role="alert"
              >
                <AlertCircle size={14} className="shrink-0 mt-px" />
                {createError}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── One-time key display ── */}
      {created && (
        <section className="w-full">
          <h2 className={`${sectionTitle} mb-2`}>Key created — save it now</h2>
          <div className="p-5 rounded-xl border border-green-500">
            <p className="m-0 mb-3 text-[13px] text-slate-500 leading-relaxed">
              Your new key <strong className="text-slate-900">{created.name}</strong>{' '}
              is shown below. It is also saved and can be copied anytime from the
              list.
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <code className={codeBlock}>{created.rawKey}</code>
              <button
                type="button"
                className={`${btnGhost} sm:self-auto self-end`}
                onClick={() => copyKey(created.rawKey, 'new')}
              >
                {copied === 'new' ? <Check size={14} /> : <Copy size={14} />}
                {copied === 'new' ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ── Key list ── */}
      <section className="w-full">
        <div className="flex items-center justify-between gap-3 mb-2">
          <h2 className={sectionTitle}>API keys</h2>
          <div
            className="inline-flex gap-0.5 bg-slate-50 border border-slate-200 rounded-full p-0.5"
            role="tablist"
            aria-label="API key view"
          >
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'key'}
              className={`inline-flex items-center gap-1.5 border-none px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
                viewMode === 'key'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'bg-transparent text-slate-500 hover:text-slate-700'
              }`}
              onClick={() => setViewMode('key')}
            >
              <KeyRound size={13} />
              Keys
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'snippet'}
              className={`inline-flex items-center gap-1.5 border-none px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
                viewMode === 'snippet'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'bg-transparent text-slate-500 hover:text-slate-700'
              }`}
              onClick={() => setViewMode('snippet')}
            >
              <Code2 size={13} />
              Snippets
            </button>
          </div>
        </div>

        <div className={card}>
          {keys.length === 0 ? (
            <div className="flex items-center gap-3 p-5 text-[13px] text-slate-500">
              <KeyRound size={20} className="text-slate-400 shrink-0" />
              <span>
                {canManage
                  ? 'No API keys yet. Create one to start ingesting feedback.'
                  : 'No API keys have been created.'}
              </span>
            </div>
          ) : (
            keys.map((k) => {
              const revoked = !!k.revokedAt
              return (
                <div key={k.id} className="border-b border-slate-100 last:border-b-0">
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 py-3.5 px-5">
                    <div className="min-w-0">
                      <div
                        className={`text-sm font-semibold text-slate-900 leading-tight ${
                          revoked ? 'line-through' : ''
                        }`}
                      >
                        {k.name}
                      </div>
                      <div className="mt-0.5 text-xs text-slate-500 leading-snug">
                        Created {formatDate(k.createdAt)} · Last used{' '}
                        {formatDate(k.lastUsedAt)}
                      </div>
                    </div>
                    <div
                      className={`flex items-center justify-end gap-2 shrink-0 ${
                        revoked ? 'opacity-65' : ''
                      }`}
                    >
                      {revoked ? (
                        <span className="text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full bg-red-50 text-red-500 whitespace-nowrap">
                          Revoked
                        </span>
                      ) : (
                        <>
                          <span className="text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full bg-green-50 text-green-600 whitespace-nowrap">
                            Active
                          </span>
                          {canManage && (
                            <button
                              type="button"
                              className={btnDanger}
                              onClick={() => handleRevoke(k.id)}
                              disabled={revokingId === k.id}
                              aria-label="Revoke API key"
                            >
                              {revokingId === k.id ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <Trash2 size={14} />
                              )}
                              <span className="hidden sm:inline">Revoke</span>
                            </button>
                          )}
                          {k.rawKey && (
                            <button
                              type="button"
                              className={btnGhost}
                              onClick={() => copyKey(k.rawKey!, `key-${k.id}`)}
                              aria-label="Copy API key"
                            >
                              {copied === `key-${k.id}` ? (
                                <Check size={14} />
                              ) : (
                                <Copy size={14} />
                              )}
                              <span className="hidden sm:inline">
                                {copied === `key-${k.id}` ? 'Copied!' : 'Copy'}
                              </span>
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {!revoked && viewMode === 'key' && (
                    <div className="px-5 pb-4">
                      {k.rawKey ? (
                        <code className="block w-full overflow-x-auto p-2.5 bg-slate-900 text-sky-300 text-xs rounded-md font-mono whitespace-nowrap">
                          {k.rawKey}
                        </code>
                      ) : (
                        <span className="text-xs text-slate-500 italic">
                          Full key unavailable. Revoke and create a new key.
                        </span>
                      )}
                    </div>
                  )}

                  {!revoked && viewMode === 'snippet' && (
                    <div className="flex flex-col items-stretch gap-3 px-5 pb-4">
                      {k.rawKey ? (
                        <SnippetTabs rawKey={k.rawKey} origin={apiBaseUrl} />
                      ) : (
                        <span className="text-xs text-slate-500 italic">
                          Snippet unavailable. Revoke and create a new key.
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </section>

      <section className="w-full">
        <h2 className={`${sectionTitle} mb-2`}>Related</h2>
        <div className={card}>
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 py-3.5 px-5 border-b border-slate-100 last:border-b-0">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-slate-900 leading-tight">
                Import Feedback
              </div>
              <div className="mt-0.5 text-xs text-slate-500">
                Manual entry and CSV upload options
              </div>
            </div>
            <div className="flex items-center justify-end">
              <a href="/import-feedback" className={btnGhost}>
                <ExternalLink size={14} />
                Open
              </a>
            </div>
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 py-3.5 px-5">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-slate-900 leading-tight">
                Settings
              </div>
              <div className="mt-0.5 text-xs text-slate-500">
                Account and notification settings
              </div>
            </div>
            <div className="flex items-center justify-end">
              <a href="/settings" className={btnGhost}>
                <ExternalLink size={14} />
                Open
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function buildCurl(origin: string, apiKey: string) {
  return [
    `curl -X POST ${origin}/api/v1/feedback \\`,
    `  -H "Authorization: Bearer ${apiKey}" \\`,
    `  -H "Content-Type: application/json" \\`,
    `  -d '{`,
    `    "content": "Cannot login after the update.",`,
    `    "channel": "Support Ticket",`,
    `    "customerName": "Alex",`,
    `    "rating": 2,`,
    `    "sourceRef": "ticket-4821"`,
    `  }'`,
  ].join('\n')
}

function buildNode(origin: string, apiKey: string) {
  return [
    `const res = await fetch("${origin}/api/v1/feedback", {`,
    `  method: "POST",`,
    `  headers: {`,
    `    Authorization: "Bearer ${apiKey}",`,
    `    "Content-Type": "application/json",`,
    `  },`,
    `  body: JSON.stringify({`,
    `    content: "Cannot login after the update.",`,
    `    channel: "Support Ticket",`,
    `    customerName: "Alex",`,
    `    rating: 2,`,
    `    sourceRef: "ticket-4821",`,
    `  }),`,
    `})`,
    ``,
    `const data = await res.json()`,
    `console.log(data)`,
  ].join('\n')
}

function buildPython(origin: string, apiKey: string) {
  return [
    `import requests`,
    ``,
    `resp = requests.post(`,
    `    "${origin}/api/v1/feedback",`,
    `    headers={"Authorization": "Bearer ${apiKey}"},`,
    `    json={`,
    `        "content": "Cannot login after the update.",`,
    `        "channel": "Support Ticket",`,
    `        "customerName": "Alex",`,
    `        "rating": 2,`,
    `        "sourceRef": "ticket-4821",`,
    `    },`,
    `)`,
    `print(resp.status_code, resp.json())`,
  ].join('\n')
}

const SNIPPET_LANGS = ['curl', 'node', 'python'] as const
type SnippetLang = (typeof SNIPPET_LANGS)[number]

function SnippetTabs({ rawKey, origin }: { rawKey: string; origin: string }) {
  const [lang, setLang] = useState<SnippetLang>('curl')
  const [snippetCopied, setSnippetCopied] = useState(false)

  const snippets: Record<SnippetLang, string> = {
    curl: buildCurl(origin, rawKey),
    node: buildNode(origin, rawKey),
    python: buildPython(origin, rawKey),
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(snippets[lang])
      setSnippetCopied(true)
      setTimeout(() => setSnippetCopied(false), 2000)
    } catch {
      setSnippetCopied(false)
    }
  }

  return (
    <div className="w-full flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <div className="inline-flex gap-1" role="tablist">
          {SNIPPET_LANGS.map((l) => (
            <button
              key={l}
              type="button"
              role="tab"
              aria-selected={lang === l}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer border transition-colors ${
                lang === l
                  ? 'bg-slate-50 text-green-600 border-green-500'
                  : 'bg-white text-slate-500 border-slate-200 hover:text-slate-700'
              }`}
              onClick={() => setLang(l)}
            >
              {l === 'node' ? 'Node.js' : l[0].toUpperCase() + l.slice(1)}
            </button>
          ))}
        </div>
        <button type="button" className={btnGhost} onClick={copy}>
          {snippetCopied ? <Check size={14} /> : <Copy size={14} />}
          {snippetCopied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="m-0 w-full p-5 bg-slate-900 text-slate-200 text-xs leading-relaxed font-mono overflow-x-auto whitespace-pre">
        {snippets[lang]}
      </pre>
    </div>
  )
}