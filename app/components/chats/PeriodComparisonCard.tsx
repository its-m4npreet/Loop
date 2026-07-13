'use client';

import React from 'react';
import './Charts.css';

interface PeriodData {
  current: {
    totalFeedback: number;
    negativePct: number;
  };
  previous: {
    totalFeedback: number;
    negativePct: number;
  };
  volumeChange: number;
  negChange: number;
  periodLabel: string;
}

interface PeriodComparisonCardProps {
  data: PeriodData;
}

function StatDelta({ label, current, change, unit, invertColor }: {
  label: string;
  current: number;
  change: number;
  unit?: string;
  invertColor?: boolean;
}) {
  const isUp = change > 0;
  // For negative metrics (like negativePct), going up is bad
  const colorClass = invertColor
    ? (isUp ? 'delta-negative' : change < 0 ? 'delta-positive' : '')
    : (isUp ? 'delta-positive' : change < 0 ? 'delta-negative' : '');

  return (
    <div className="period-stat">
      <div className="period-stat-label">{label}</div>
      <div className="period-stat-value">
        {current.toLocaleString()}{unit}
      </div>
      <div className={`period-stat-delta ${colorClass}`}>
        {isUp ? '↑' : change < 0 ? '↓' : '→'} {Math.abs(change)}%
        <span className="period-stat-vs">vs previous</span>
      </div>
    </div>
  );
}

function PeriodComparisonCard({ data }: PeriodComparisonCardProps) {
  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <div>
          <h3 className="chart-card-title">Period Comparison</h3>
          <p className="chart-card-subtitle">{data.periodLabel}</p>
        </div>
      </div>
      <div className="period-comparison-grid">
        <StatDelta
          label="Total Feedback"
          current={data.current.totalFeedback}
          change={data.volumeChange}
        />
        <StatDelta
          label="Negative %"
          current={data.current.negativePct}
          change={data.negChange}
          unit="%"
          invertColor
        />
        <div className="period-stat">
          <div className="period-stat-label">Previous Period</div>
          <div className="period-stat-value">{data.previous.totalFeedback.toLocaleString()}</div>
          <div className="period-stat-delta">
            {data.previous.negativePct}% negative
          </div>
        </div>
      </div>
    </div>
  );
}

export default PeriodComparisonCard;
