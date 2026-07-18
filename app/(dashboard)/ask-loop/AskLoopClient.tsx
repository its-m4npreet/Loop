'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  Zap,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Send,
  Plus,
  MessageSquare,
  Trash2,
  Loader2,
  Menu,
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

/** Very light inline formatting: turns **bold** segments into <strong>. */
function formatInline(text: string): React.ReactNode[] {
  return text
    .split(/(\*\*[^*]+\*\*)/g)
    .filter(Boolean)
    .map((part, i) =>
      part.startsWith('**') && part.endsWith('**') ? (
        <strong key={i}>{part.slice(2, -2)}</strong>
      ) : (
        <React.Fragment key={i}>{part}</React.Fragment>
      )
    )
}

const BULLET_PATTERN = /^\s*[-•]\s+(.*)$/

/** Renders plain text into paragraphs, grouping consecutive "- " lines into a <ul>. */
function AnswerContent({ text }: { text: string }) {
  const lines = text.split('\n').filter((l) => l.trim().length > 0)
  const blocks: React.ReactNode[] = []
  let bulletBuffer: string[] = []

  const flushBullets = () => {
    if (bulletBuffer.length === 0) return
    blocks.push(
      <ul key={`ul-${blocks.length}`} className="ask-loop-bullet-list">
        {bulletBuffer.map((item, i) => (
          <li key={i} className="ask-loop-bullet">
            {formatInline(item)}
          </li>
        ))}
      </ul>
    )
    bulletBuffer = []
  }

  for (const line of lines) {
    const bulletMatch = BULLET_PATTERN.exec(line)
    if (bulletMatch) {
      bulletBuffer.push(bulletMatch[1])
    } else {
      flushBullets()
      blocks.push(
        <p key={blocks.length} className="ask-loop-line">
          {formatInline(line)}
        </p>
      )
    }
  }
  flushBullets()

  return <>{blocks}</>
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

  const startNewChat = useCallback(() => {
    setActiveConversationId(null)
    conversationIdRef.current = null
    setMessages([])
    setError('')
    setIsHistoryOpen(false)
  }, [])

  const loadConversation = useCallback(async (id: string) => {
    if (id === activeConversationId) return
    setIsSwitching(true)
    setError('')
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
      setIsHistoryOpen(false)
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

  return (
    <div className="ask-loop-layout">
      {isHistoryOpen && (
        <div
          className="ask-loop-sidebar-backdrop"
          onClick={() => setIsHistoryOpen(false)}
        />
      )}

      <aside className={`ask-loop-sidebar${isHistoryOpen ? ' open' : ''}`}>
        <div className="ask-loop-sidebar-header">
          <span className="ask-loop-sidebar-title">Conversations</span>
          <button
            type="button"
            className="ask-loop-sidebar-close"
            onClick={() => setIsHistoryOpen(false)}
            aria-label="Close history"
          >
            <X size={16} />
          </button>
        </div>

        <button type="button" className="ask-loop-new-chat-btn" onClick={startNewChat}>
          <Plus size={16} />
          New chat
        </button>

        <div className="ask-loop-history-list">
          {conversations.length === 0 && (
            <p className="ask-loop-history-empty">No past conversations yet.</p>
          )}
          {conversations.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`ask-loop-history-item${c.id === activeConversationId ? ' active' : ''}`}
              onClick={() => void loadConversation(c.id)}
            >
              <MessageSquare size={14} className="ask-loop-history-icon" />
              <span className="ask-loop-history-title">{c.title}</span>
              <span
                className="ask-loop-history-delete"
                role="button"
                tabIndex={0}
                aria-label="Delete conversation"
                onClick={(e) => void deleteConversation(c.id, e)}
              >
                <Trash2 size={13} />
              </span>
            </button>
          ))}
        </div>
      </aside>

      <div className="ask-loop-main">
        <div className="ask-loop-mobile-header">
          <button
            type="button"
            className="ask-loop-toggle-hist"
            onClick={() => setIsHistoryOpen(true)}
            aria-label="Toggle history"
          >
            <Menu size={18} />
            <span>History</span>
          </button>
          <div className="ask-loop-mobile-logo">
            <Zap size={14} className="ask-loop-logo-icon" />
            <span>LOOP AI</span>
          </div>
          <button
            type="button"
            className="ask-loop-mobile-new-chat"
            onClick={startNewChat}
            aria-label="Start new chat"
          >
            <Plus size={18} />
          </button>
        </div>

        <div className="ask-loop-chat">
          {showWelcome ? (
            <div className="ask-loop-welcome">
              <div className="ask-loop-avatar">
                <Zap size={24} />
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
                        <Zap size={14} />
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
    </div>
  )
}
