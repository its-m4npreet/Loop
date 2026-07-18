'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  Infinity as LoopMark,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Send,
  Plus,
  MessageSquare,
  History,
  Trash2,
  Loader2,
  X,
} from 'lucide-react'

interface ConversationSummary {
  id: string
  title: string
  updatedAt: string
  createdAt: string
}

interface ChatMessage {
  id: string
  role: 'USER' | 'ASSISTANT'
  content: string
}

interface AskLoopClientProps {
  initialConversations: ConversationSummary[]
}

const SUGGESTIONS = [
  { icon: TrendingUp, text: 'What are the top feedback themes this week?', color: '#22C55E', bg: '#F0FDF4' },
  { icon: AlertTriangle, text: 'Are there any negative sentiment spikes?', color: '#F87171', bg: '#FEF2F2' },
  { icon: Lightbulb, text: 'What improvements do customers want most?', color: '#A78BFA', bg: '#F5F3FF' },
  { icon: Sparkles, text: 'Summarize recent feedback for me', color: '#FB923C', bg: '#FFF7ED' },
]

let localIdCounter = 0
function nextLocalId(): string {
  localIdCounter += 1
  return `local-${Date.now()}-${localIdCounter}`
}

/**
 * Inline markdown: **bold**, *italic*, `code`.
 * Order matters so **bold** is matched before single-asterisk italic.
 */
function formatInline(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = []
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g
  let last = 0
  let match: RegExpExecArray | null
  let key = 0

  while ((match = re.exec(text)) !== null) {
    if (match.index > last) {
      nodes.push(<React.Fragment key={key++}>{text.slice(last, match.index)}</React.Fragment>)
    }
    const token = match[0]
    if (token.startsWith('**') && token.endsWith('**')) {
      nodes.push(<strong key={key++}>{token.slice(2, -2)}</strong>)
    } else if (token.startsWith('`') && token.endsWith('`')) {
      nodes.push(
        <code key={key++} className="ask-loop-inline-code">
          {token.slice(1, -1)}
        </code>
      )
    } else if (token.startsWith('*') && token.endsWith('*')) {
      nodes.push(<em key={key++}>{token.slice(1, -1)}</em>)
    } else {
      nodes.push(<React.Fragment key={key++}>{token}</React.Fragment>)
    }
    last = match.index + token.length
  }

  if (last < text.length) {
    nodes.push(<React.Fragment key={key++}>{text.slice(last)}</React.Fragment>)
  }

  return nodes.length > 0 ? nodes : [text]
}

const HEADING_PATTERN = /^\s*(#{1,3})\s+(.+)$/
const BULLET_PATTERN = /^\s*[-*•]\s+(.+)$/
const NUMBERED_PATTERN = /^\s*\d+[.)]\s+(.+)$/

type ListBuffer =
  | { kind: 'ul'; items: string[] }
  | { kind: 'ol'; items: string[] }
  | null

/**
 * Renders assistant answers with lightweight markdown:
 * headings, bullet/numbered lists, bold, italic, inline code.
 */
function AnswerContent({ text }: { text: string }) {
  const lines = text.split('\n')
  const blocks: React.ReactNode[] = []
  let listBuffer: ListBuffer = null

  const flushList = () => {
    if (!listBuffer || listBuffer.items.length === 0) {
      listBuffer = null
      return
    }
    const listKey = `list-${blocks.length}`
    if (listBuffer.kind === 'ul') {
      blocks.push(
        <ul key={listKey} className="ask-loop-list ask-loop-bullet-list">
          {listBuffer.items.map((item, i) => (
            <li key={i} className="ask-loop-list-item">
              {formatInline(item)}
            </li>
          ))}
        </ul>
      )
    } else {
      blocks.push(
        <ol key={listKey} className="ask-loop-list ask-loop-number-list">
          {listBuffer.items.map((item, i) => (
            <li key={i} className="ask-loop-list-item">
              {formatInline(item)}
            </li>
          ))}
        </ol>
      )
    }
    listBuffer = null
  }

  const pushListItem = (kind: 'ul' | 'ol', item: string) => {
    if (!listBuffer || listBuffer.kind !== kind) {
      flushList()
      listBuffer = { kind, items: [item] }
    } else {
      listBuffer.items.push(item)
    }
  }

  for (const rawLine of lines) {
    const line = rawLine.replace(/\r$/, '')
    const trimmed = line.trim()

    // Blank line = paragraph break between blocks
    if (!trimmed) {
      flushList()
      continue
    }

    const headingMatch = HEADING_PATTERN.exec(trimmed)
    if (headingMatch) {
      flushList()
      const level = headingMatch[1].length
      const Tag = (`h${level}` as 'h1' | 'h2' | 'h3')
      blocks.push(
        <Tag key={`h-${blocks.length}`} className={`ask-loop-heading ask-loop-heading-${level}`}>
          {formatInline(headingMatch[2])}
        </Tag>
      )
      continue
    }

    const bulletMatch = BULLET_PATTERN.exec(line)
    if (bulletMatch) {
      pushListItem('ul', bulletMatch[1])
      continue
    }

    const numberedMatch = NUMBERED_PATTERN.exec(line)
    if (numberedMatch) {
      pushListItem('ol', numberedMatch[1])
      continue
    }

    flushList()
    blocks.push(
      <p key={`p-${blocks.length}`} className="ask-loop-line">
        {formatInline(trimmed)}
      </p>
    )
  }
  flushList()

  return <div className="ask-loop-answer">{blocks}</div>
}

export default function AskLoopClient({ initialConversations }: AskLoopClientProps) {
  const [conversations, setConversations] = useState<ConversationSummary[]>(initialConversations)
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [isSwitching, setIsSwitching] = useState(false)
  const [error, setError] = useState('')
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const conversationIdRef = useRef<string | null>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!isHistoryOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsHistoryOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [isHistoryOpen])

  const startNewChat = useCallback(() => {
    setActiveConversationId(null)
    conversationIdRef.current = null
    setMessages([])
    setError('')
    setIsHistoryOpen(false)
  }, [])

  const loadConversation = useCallback(async (id: string) => {
    if (id === activeConversationId) {
      setIsHistoryOpen(false)
      return
    }
    setIsSwitching(true)
    setError('')
    setIsHistoryOpen(false)
    try {
      const res = await fetch(`/api/ask-loop/conversations/${id}`)
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to load conversation.')
        return
      }
      setActiveConversationId(id)
      conversationIdRef.current = id
      setMessages(
        (data.messages as Array<{ id: string; role: 'USER' | 'ASSISTANT'; content: string }>).map(
          (m) => ({ id: m.id, role: m.role, content: m.content })
        )
      )
    } catch {
      setError('A network error occurred while loading that conversation.')
    } finally {
      setIsSwitching(false)
    }
  }, [activeConversationId])

  const deleteConversation = useCallback(
    async (id: string, e: React.MouseEvent) => {
      e.stopPropagation()
      try {
        const res = await fetch(`/api/ask-loop/conversations/${id}`, { method: 'DELETE' })
        if (res.ok) {
          setConversations((prev) => prev.filter((c) => c.id !== id))
          if (activeConversationId === id) startNewChat()
        }
      } catch {
        // Silent — non-critical UI cleanup action
      }
    },
    [activeConversationId, startNewChat]
  )

  const refreshConversationList = useCallback(async () => {
    try {
      const res = await fetch('/api/ask-loop/conversations')
      if (res.ok) {
        const data = await res.json()
        setConversations(data.conversations)
      }
    } catch {
      // Non-critical — list will just be stale until next refresh
    }
  }, [])

  const sendMessage = useCallback(
    async (text: string) => {
      const question = text.trim()
      if (!question || isStreaming) return

      setError('')
      setInput('')

      const userMessage: ChatMessage = { id: nextLocalId(), role: 'USER', content: question }
      const assistantMessage: ChatMessage = { id: nextLocalId(), role: 'ASSISTANT', content: '' }
      setMessages((prev) => [...prev, userMessage, assistantMessage])
      setIsStreaming(true)

      const wasNewConversation = conversationIdRef.current === null

      try {
        const res = await fetch('/api/ask-loop/ask', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: question,
            conversationId: conversationIdRef.current ?? undefined,
          }),
        })

        if (!res.ok || !res.body) {
          const data = await res.json().catch(() => ({}))
          setError(data.error || 'Failed to get a response from LOOP AI.')
          setMessages((prev) => prev.slice(0, -1))
          return
        }

        const newConversationId = res.headers.get('X-Conversation-Id')
        if (newConversationId) {
          conversationIdRef.current = newConversationId
          setActiveConversationId(newConversationId)
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()

        for (;;) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value, { stream: true })
          setMessages((prev) => {
            const updated = [...prev]
            const last = updated[updated.length - 1]
            updated[updated.length - 1] = { ...last, content: last.content + chunk }
            return updated
          })
        }

        if (wasNewConversation) {
          void refreshConversationList()
        } else {
          setConversations((prev) => {
            const idx = prev.findIndex((c) => c.id === conversationIdRef.current)
            if (idx === -1) return prev
            const updated = [...prev]
            const [item] = updated.splice(idx, 1)
            return [{ ...item, updatedAt: new Date().toISOString() }, ...updated]
          })
        }
      } catch {
        setError('A network error occurred. Please try again.')
        setMessages((prev) => prev.slice(0, -1))
      } finally {
        setIsStreaming(false)
      }
    },
    [isStreaming, refreshConversationList]
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    void sendMessage(input)
  }

  const showWelcome = messages.length === 0 && !isSwitching

  const formatHistoryDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    } catch {
      return ''
    }
  }

  return (
    <div className="ask-loop-layout">
      <div className="ask-loop-toolbar">
        <div className="ask-loop-toolbar-brand">
          <span className="ask-loop-brand-mark" aria-hidden>
            <LoopMark size={16} strokeWidth={2.5} />
          </span>
          <span>Ask LOOP</span>
        </div>
        <div className="ask-loop-toolbar-actions">
          <button
            type="button"
            className="ask-loop-toolbar-btn ask-loop-toolbar-btn-primary"
            onClick={startNewChat}
            disabled={isStreaming || (showWelcome && !activeConversationId)}
          >
            <Plus size={16} />
            <span>New chat</span>
          </button>
          <button
            type="button"
            className="ask-loop-toolbar-btn"
            onClick={() => setIsHistoryOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={isHistoryOpen}
          >
            <History size={16} />
            <span>History</span>
            {conversations.length > 0 && (
              <span className="ask-loop-toolbar-count">{conversations.length}</span>
            )}
          </button>
        </div>
      </div>

      <div className="ask-loop-main">
        <div className="ask-loop-chat">
          {showWelcome ? (
            <div className="ask-loop-welcome">
              <div className="ask-loop-hero-logo" aria-hidden>
                <div className="ask-loop-hero-logo-ring">
                  <div className="ask-loop-hero-logo-mark">
                    <LoopMark size={36} strokeWidth={2.5} />
                  </div>
                </div>
                <span className="ask-loop-hero-logo-wordmark">LOOP</span>
              </div>
              <h2 className="ask-loop-greeting">Hello! I&apos;m LOOP AI</h2>
              <p className="ask-loop-desc">Ask me anything about your feedback data. Here are some suggestions:</p>

              <div className="ask-loop-suggestions">
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    className="ask-loop-suggestion-btn"
                    onClick={() => void sendMessage(s.text)}
                  >
                    <div className="ask-loop-suggestion-icon" style={{ background: s.bg, color: s.color }}>
                      <s.icon size={16} />
                    </div>
                    <span>{s.text}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="ask-loop-messages">
              {isSwitching ? (
                <div className="ask-loop-switching">
                  <Loader2 size={20} className="ask-loop-spin" />
                </div>
              ) : (
                messages.map((m, i) => (
                  <div key={m.id} className={`ask-loop-msg ask-loop-msg-${m.role.toLowerCase()}`}>
                    {m.role === 'ASSISTANT' && (
                      <div className="ask-loop-msg-avatar">
                        <LoopMark size={14} strokeWidth={2.5} />
                      </div>
                    )}
                    <div className="ask-loop-msg-bubble">
                      {m.role === 'ASSISTANT' ? (
                        m.content ? (
                          <AnswerContent text={m.content} />
                        ) : (
                          isStreaming &&
                          i === messages.length - 1 && (
                            <span className="ask-loop-typing">
                              <span />
                              <span />
                              <span />
                            </span>
                          )
                        )
                      ) : (
                        <p className="ask-loop-line">{m.content}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          )}

          {error && <div className="ask-loop-error">{error}</div>}

          <form className="ask-loop-input-wrap" onSubmit={handleSubmit}>
            <input
              type="text"
              className="ask-loop-input"
              placeholder="Ask LOOP about your feedback data…"
              aria-label="Ask LOOP a question"
              value={input}
              disabled={isStreaming}
              onChange={(e) => setInput(e.target.value)}
            />
            <button type="submit" className="ask-loop-send-btn" disabled={isStreaming || !input.trim()}>
              {isStreaming ? <Loader2 size={16} className="ask-loop-spin" /> : <Send size={16} />}
              <span className="ask-loop-send-label">Ask</span>
            </button>
          </form>
        </div>
      </div>

      {isHistoryOpen && (
        <div
          className="ask-loop-modal-backdrop"
          onClick={() => setIsHistoryOpen(false)}
          role="presentation"
        >
          <div
            className="ask-loop-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ask-loop-history-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ask-loop-modal-header">
              <div>
                <h2 id="ask-loop-history-title" className="ask-loop-modal-title">
                  Chat history
                </h2>
                <p className="ask-loop-modal-subtitle">
                  {conversations.length === 0
                    ? 'No past conversations yet'
                    : `${conversations.length} conversation${conversations.length === 1 ? '' : 's'}`}
                </p>
              </div>
              <button
                type="button"
                className="ask-loop-modal-close"
                onClick={() => setIsHistoryOpen(false)}
                aria-label="Close history"
              >
                <X size={18} />
              </button>
            </div>

            <div className="ask-loop-history-list">
              {conversations.length === 0 ? (
                <div className="ask-loop-history-empty">
                  <MessageSquare size={28} />
                  <p>Start a chat and it will show up here.</p>
                </div>
              ) : (
                conversations.map((c) => (
                  <div
                    key={c.id}
                    className={`ask-loop-history-item${c.id === activeConversationId ? ' active' : ''}`}
                  >
                    <button
                      type="button"
                      className="ask-loop-history-item-main"
                      onClick={() => void loadConversation(c.id)}
                    >
                      <MessageSquare size={16} className="ask-loop-history-icon" />
                      <span className="ask-loop-history-text">
                        <span className="ask-loop-history-title">{c.title}</span>
                        <span className="ask-loop-history-date">{formatHistoryDate(c.updatedAt)}</span>
                      </span>
                    </button>
                    <button
                      type="button"
                      className="ask-loop-history-delete"
                      aria-label="Delete conversation"
                      onClick={(e) => void deleteConversation(c.id, e)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
