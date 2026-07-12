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
    <div className="page-header-actions">
      <div className="btn-secondary" style={{ display: 'flex', alignItems: 'center', padding: '0 12px', height: '38px', borderRadius: '6px' }}>
        <Calendar size={15} style={{ marginRight: '6px', color: 'var(--color-text-muted)' }} />
        <select
          value={activeDays}
          onChange={(e) => {
            window.location.href = `/analytics?days=${e.target.value}`;
          }}
          style={{
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--color-text)',
            cursor: 'pointer',
            padding: 0,
            margin: 0
          }}
        >
          <option value="7">Last 7 Days</option>
          <option value="30">Last 30 Days</option>
          <option value="90">Last 90 Days</option>
        </select>
      </div>
      <button className="btn-primary" id="export-btn" onClick={handleExportCSV}>
        <Download size={15} />
        Export CSV
      </button>
    </div>
  );
}
