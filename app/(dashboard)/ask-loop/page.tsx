import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Zap, Sparkles, TrendingUp, AlertTriangle, Lightbulb } from 'lucide-react'

import AIInsightsPanel from '../../components/insights/AIInsightsPanel'
import './page.css'

export default async function AskLoopPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/api/auth")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  })
  if (!user) redirect("/api/auth")

  return (
    <>
    <div className="page-header">
      <div>
        <h1 className="page-title">Ask LOOP</h1>
        <p className="page-subtitle">Chat with LOOP AI to uncover insights from your feedback data.</p>
      </div>
    </div>

    <div className="ask-loop-chat">
      <div className="ask-loop-welcome">
        <div className="ask-loop-avatar">
          <Zap size={24} />
        </div>
        <h2 className="ask-loop-greeting">Hello! I'm LOOP AI</h2>
        <p className="ask-loop-desc">Ask me anything about your feedback data. Here are some suggestions:</p>

        <div className="ask-loop-suggestions">
          {[
            { icon: TrendingUp, text: 'What are the top feedback themes this week?', color: '#22C55E', bg: '#F0FDF4' },
            { icon: AlertTriangle, text: 'Are there any negative sentiment spikes?', color: '#F87171', bg: '#FEF2F2' },
            { icon: Lightbulb, text: 'What improvements do customers want most?', color: '#A78BFA', bg: '#F5F3FF' },
            { icon: Sparkles, text: 'Summarize recent feedback for me', color: '#FB923C', bg: '#FFF7ED' },
          ].map((s, i) => (
            <button key={i} className="ask-loop-suggestion-btn" id={`suggestion-${i}`}>
              <div className="ask-loop-suggestion-icon" style={{ background: s.bg, color: s.color }}>
                <s.icon size={16} />
              </div>
              <span>{s.text}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="ask-loop-input-wrap">
        <input
          type="text"
          className="ask-loop-input"
          placeholder="Ask LOOP about your feedback data…"
          aria-label="Ask LOOP a question"
        />
        <button className="ask-loop-send-btn">Ask</button>
      </div>
    </div>
    </>
  )
}
