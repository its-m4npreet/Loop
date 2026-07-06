// DashboardContent.jsx – Main dashboard page content (client component)
import React from 'react';
import { Upload, FileBarChart } from 'lucide-react';

import StatCard        from './components/Cards/StatCard';
import ThemeCard       from './components/Cards/ThemeCard';
import FeedbackVolumeChart   from './components/Charts/FeedbackVolumeChart';
import SentimentDonutChart   from './components/Charts/SentimentDonutChart';
import TopThemesChart        from './components/Charts/TopThemesChart';
import FeedbackChannelsChart from './components/Charts/FeedbackChannelsChart';
import AIInsightsPanel from './components/Insights/AIInsightsPanel';
import FeedbackTable   from './components/Tables/FeedbackTable';
import QuickActions    from './components/QuickActions/QuickActions';

import { statsData, topThemesCards } from './data/dashboardData';
import './Dashboard.css';

function DashboardContent() {
  return (
    <div>
      {/* ── Page Header ── */}
      <div className="dashboard-page-header">
        <div>
          <h1 className="dashboard-title">Customer Intelligence Dashboard</h1>
          <p className="dashboard-subtitle">
            Monitor customer feedback, AI insights, sentiment and trends in real time.
          </p>
        </div>
        <div className="dashboard-header-actions">
          <button className="btn-secondary" id="upload-csv-btn">
            <Upload size={15} />
            Upload CSV
          </button>
          <button className="btn-primary" id="generate-report-btn">
            <FileBarChart size={15} />
            Generate Report
          </button>
        </div>
      </div>

      {/* ── Statistics Cards ── */}
      <div className="stats-grid mb-6">
        {statsData.map((stat) => (
          <StatCard key={stat.id} stat={stat} />
        ))}
      </div>

      {/* ── Charts Row 1: Volume + Sentiment ── */}
      <div className="charts-row charts-row-2-col mb-6">
        <FeedbackVolumeChart />
        <SentimentDonutChart />
      </div>

      {/* ── Charts Row 2: Themes + Channels ── */}
      <div className="charts-row charts-row-equal mb-6">
        <TopThemesChart />
        <FeedbackChannelsChart />
      </div>

      {/* ── AI Insights Panel ── */}
      <div className="mb-6">
        <AIInsightsPanel />
      </div>

      {/* ── Top Themes Cards ── */}
      <div className="mb-4">
        <h2 className="section-title">Top Themes</h2>
      </div>
      <div className="themes-grid mb-6">
        {topThemesCards.map((theme) => (
          <ThemeCard key={theme.id} theme={theme} />
        ))}
      </div>

      {/* ── Recent Feedback Table ── */}
      <div className="mb-6">
        <FeedbackTable />
      </div>

      {/* ── Quick Actions ── */}
      <QuickActions />
    </div>
  );
}

export default DashboardContent;
