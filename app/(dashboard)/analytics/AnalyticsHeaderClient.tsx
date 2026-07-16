'use client';

import React from 'react';
import { Calendar, Download } from 'lucide-react';

interface AnalyticsHeaderClientProps {
  summary: {
    totalFeedback: number;
    resolutionRate: number;
    avgResponseTime: number;
    avgSatisfaction: number;
  };
  sentiment: Array<{ name: string; value: number; count: number }>;
  channels: Array<{ channel: string; count: number }>;
  themes: Array<{ theme: string; mentions: number }>;
  activeDays: number;
}

export default function AnalyticsHeaderClient({
  summary,
  sentiment,
  channels,
  themes,
  activeDays,
}: AnalyticsHeaderClientProps) {
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Category,Metric/Name,Value/Count\n';

    // 1. Summary Metrics
    csvContent += `Summary,Total Feedback,${summary.totalFeedback}\n`;
    csvContent += `Summary,Average CSAT,${summary.avgSatisfaction}/5.0\n`;
    csvContent += `Summary,Average Response Time,${summary.avgResponseTime} minutes\n`;
    csvContent += `Summary,Resolution Rate,${summary.resolutionRate}%\n`;

    // 2. Sentiment Breakdown
    for (const s of sentiment) {
      csvContent += `Sentiment,${s.name} Ratio,${s.value}%\n`;
      csvContent += `Sentiment,${s.name} Count,${s.count}\n`;
    }

    // 3. Channels Distribution
    for (const c of channels) {
      csvContent += `Channel,"${c.channel}",${c.count}\n`;
    }

    // 4. Top Themes
    for (const t of themes) {
      csvContent += `Theme,"${t.theme}",${t.mentions}\n`;
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `analytics-export-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="page-header-actions analytics-header-actions">
      <label className="btn-secondary analytics-date-select">
        <Calendar size={15} className="analytics-date-icon" aria-hidden />
        <select
          value={activeDays}
          onChange={(e) => {
            window.location.href = `/analytics?days=${e.target.value}`;
          }}
          aria-label="Date range"
        >
          <option value="7">7 days</option>
          <option value="30">30 days</option>
          <option value="90">90 days</option>
        </select>
      </label>
      <button
        type="button"
        className="btn-primary analytics-export-btn"
        id="export-btn"
        onClick={handleExportCSV}
      >
        <Download size={15} aria-hidden />
        <span className="analytics-export-label">Export</span>
      </button>
    </div>
  );
}
