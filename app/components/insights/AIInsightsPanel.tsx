'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Bot,
  AlertCircle,
  Lightbulb,
  AlertTriangle,
  ThumbsUp,
  BookOpen,
  RefreshCw,
  type LucideIcon,
} from 'lucide-react';
import './Insights.css';

export interface DashboardInsights {
  weeklySummary: string;
  topIssue: { title: string; detail: string };
  recommendation: { title: string; detail: string };
  riskAlert: { title: string; detail: string };
  positiveHighlight: string;
}

interface InsightCardProps {
  type: string;
  icon: LucideIcon;
  label: string;
  title?: string;
  detail: string;
}

function InsightCard({ type, icon: Icon, label, title, detail }: InsightCardProps) {
  return (
    <div className={`insight-card ${type}`}>
      <div className="insight-card-header">
        <div className="insight-card-icon">
          <Icon size={14} />
        </div>
        <span className="insight-card-label">{label}</span>
      </div>
      {title && <p className="insight-card-title">{title}</p>}
      <p className="insight-card-detail">{detail}</p>
    </div>
  );
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const secs = Math.floor(diff / 1000)
  if (secs < 10) return 'just now'
  if (secs < 60) return `${secs}s ago`
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `${mins}m ago`
  return `${Math.floor(mins / 60)}h ago`
}

interface AIInsightsPanelProps {
  insights?: DashboardInsights | null;
}

const REFRESH_INTERVAL = 30_000

function AIInsightsPanel({ insights: initialInsights }: AIInsightsPanelProps) {
  const [insights, setInsights] = useState<DashboardInsights | null>(initialInsights ?? null)
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const mountedRef = useRef(true)

  const fetchInsights = useCallback(async (silent = true) => {
    if (!mountedRef.current) return
    if (!silent) setIsRefreshing(true)

    try {
      const res = await fetch('/api/dashboard/insights')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      if (!mountedRef.current) return

      setInsights(data.insights)
      setUpdatedAt(data.updatedAt)
      setError(null)
    } catch {
      if (mountedRef.current) setError('Failed to refresh insights')
    } finally {
      if (mountedRef.current) setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true

    // Initial fetch to get the timestamp
    fetchInsights(true)

    // Set up polling
    intervalRef.current = setInterval(() => fetchInsights(true), REFRESH_INTERVAL)

    return () => {
      mountedRef.current = false
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [fetchInsights])

  const handleManualRefresh = () => {
    fetchInsights(false)
  }

  return (
    <div className="insights-panel">
      <div className="insights-header">
        <div className="insights-header-icon">
          <Bot size={18} color="#fff" />
        </div>
        <div>
          <h2 className="insights-title">AI Insights</h2>
          <p className="insights-subtitle">Powered by your workspace data</p>
        </div>
        <div className="insights-header-right">
          {updatedAt && (
            <span className="insights-updated-at">
              Updated {formatRelativeTime(updatedAt)}
            </span>
          )}
          <button
            className={`insights-refresh-btn ${isRefreshing ? 'spinning' : ''}`}
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            title="Refresh insights"
          >
            <RefreshCw size={13} />
          </button>
          <div className="insights-ai-badge">
            <span className="ai-live-dot" />
            Live Analysis
          </div>
        </div>
      </div>

      {error && (
        <div className="insights-error-banner">
          <AlertTriangle size={13} />
          {error}
        </div>
      )}

      {!insights ? (
        <p className="insight-card-detail" style={{ padding: '0 4px' }}>
          No insights available yet. Add feedback to your workspace to generate
          analysis.
        </p>
      ) : (
        <div className="insights-grid">
          <InsightCard
            type="summary"
            icon={BookOpen}
            label="Weekly Summary"
            detail={insights.weeklySummary}
          />

          <InsightCard
            type="issue"
            icon={AlertCircle}
            label="Top Issue"
            title={insights.topIssue.title}
            detail={insights.topIssue.detail}
          />

          <InsightCard
            type="recommendation"
            icon={Lightbulb}
            label="Recommendation"
            title={insights.recommendation.title}
            detail={insights.recommendation.detail}
          />

          <InsightCard
            type="risk"
            icon={AlertTriangle}
            label="Risk Alert"
            title={insights.riskAlert.title}
            detail={insights.riskAlert.detail}
          />

          <InsightCard
            type="positive"
            icon={ThumbsUp}
            label="Positive Highlight"
            detail={insights.positiveHighlight}
          />
        </div>
      )}
    </div>
  );
}

export default AIInsightsPanel;
