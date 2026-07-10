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
import { aiInsights } from '../../data/dashboardData';
import './Insights.css';

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

function AIInsightsPanel() {
  return (
    <div className="insights-panel">
      <div className="insights-header">
        <div className="insights-header-icon">
          <Bot size={18} color="#fff" />
        </div>
        <div>
          <h2 className="insights-title">AI Insights</h2>
          <p className="insights-subtitle">Powered by LOOP Intelligence Engine</p>
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
          detail={aiInsights.weeklySummary}
        />

        <InsightCard
          type="issue"
          icon={AlertCircle}
          label="Top Issue"
          title={aiInsights.topIssue.title}
          detail={aiInsights.topIssue.detail}
        />

        <InsightCard
          type="recommendation"
          icon={Lightbulb}
          label="Recommendation"
          title={aiInsights.recommendation.title}
          detail={aiInsights.recommendation.detail}
        />

        <InsightCard
          type="risk"
          icon={AlertTriangle}
          label="Risk Alert"
          title={aiInsights.riskAlert.title}
          detail={aiInsights.riskAlert.detail}
        />

        <InsightCard
          type="positive"
          icon={ThumbsUp}
          label="Positive Highlight"
          detail={aiInsights.positiveHighlight}
        />
      </div>
    </div>
  );
}

export default AIInsightsPanel;
