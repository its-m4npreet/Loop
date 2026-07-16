'use client';

import React from 'react';
import {
  Bot,
  AlertCircle,
  Lightbulb,
  AlertTriangle,
  ThumbsUp,
  BookOpen,
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

interface AIInsightsPanelProps {
  insights?: DashboardInsights | null;
}

function AIInsightsPanel({ insights }: AIInsightsPanelProps) {
  if (!insights) {
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
        </div>
        <p className="insight-card-detail" style={{ padding: '0 4px' }}>
          No insights available yet. Add feedback to your workspace to generate
          analysis.
        </p>
      </div>
    );
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
        <div className="insights-ai-badge">
          <span className="ai-live-dot" />
          Live Analysis
        </div>
      </div>

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
    </div>
  );
}

export default AIInsightsPanel;
