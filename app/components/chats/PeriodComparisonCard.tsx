'use client';

import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  MessageSquare,
  Smile,
  Frown,
  CheckCircle2,
  Clock,
  Star,
} from 'lucide-react';
import './Charts.css';

interface PeriodSnapshot {
  totalFeedback: number;
  positivePct: number;
  negativePct: number;
  resolutionRate: number;
  avgResponseTime: number;
  avgSatisfaction: number;
}

interface PeriodData {
  current: PeriodSnapshot;
  previous: PeriodSnapshot;
  volumeChange: number;
  posChange: number;
  negChange: number;
  resolutionChange: number;
  responseChange: number;
  csatChange: number;
  periodLabel: string;
  periodDays?: number;
}

interface PeriodComparisonCardProps {
  data: PeriodData;
}

type MetricKey = keyof PeriodSnapshot;

interface MetricDef {
  key: MetricKey;
  label: string;
  changeKey: keyof Pick<
    PeriodData,
    | 'volumeChange'
    | 'posChange'
    | 'negChange'
    | 'resolutionChange'
    | 'responseChange'
    | 'csatChange'
  >;
  /** When true, increase is bad (e.g. negative %, response time) */
  invert?: boolean;
  format: (value: number) => string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  accent: string;
}

function formatResponseTime(minutes: number): string {
  if (minutes <= 0) return '—';
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  return `${minutes}m`;
}

const METRICS: MetricDef[] = [
  {
    key: 'totalFeedback',
    label: 'Total Feedback',
    changeKey: 'volumeChange',
    format: (v) => v.toLocaleString(),
    icon: MessageSquare,
    accent: '#3B82F6',
  },
  {
    key: 'positivePct',
    label: 'Positive',
    changeKey: 'posChange',
    format: (v) => `${v}%`,
    icon: Smile,
    accent: '#22C55E',
  },
  {
    key: 'negativePct',
    label: 'Negative',
    changeKey: 'negChange',
    invert: true,
    format: (v) => `${v}%`,
    icon: Frown,
    accent: '#EF4444',
  },
  {
    key: 'avgSatisfaction',
    label: 'Avg CSAT',
    changeKey: 'csatChange',
    format: (v) => (v > 0 ? `${v.toFixed(1)} / 5` : '—'),
    icon: Star,
    accent: '#F59E0B',
  },
  {
    key: 'avgResponseTime',
    label: 'Avg Response',
    changeKey: 'responseChange',
    invert: true,
    format: formatResponseTime,
    icon: Clock,
    accent: '#8B5CF6',
  },
  {
    key: 'resolutionRate',
    label: 'Resolution',
    changeKey: 'resolutionChange',
    format: (v) => `${v}%`,
    icon: CheckCircle2,
    accent: '#14B8A6',
  },
];

function DeltaBadge({
  change,
  invert,
}: {
  change: number;
  invert?: boolean;
}) {
  const isUp = change > 0;
  const isDown = change < 0;
  const isGood = invert ? isDown : isUp;
  const isBad = invert ? isUp : isDown;

  let tone = 'neutral';
  if (isGood) tone = 'good';
  else if (isBad) tone = 'bad';

  const Icon = isUp ? TrendingUp : isDown ? TrendingDown : Minus;

  return (
    <span className={`period-delta-badge period-delta-${tone}`}>
      <Icon size={12} />
      {isUp ? '+' : ''}
      {change}%
    </span>
  );
}

function ComparisonBar({
  current,
  previous,
  invert,
  accent,
}: {
  current: number;
  previous: number;
  invert?: boolean;
  accent: string;
}) {
  const max = Math.max(current, previous, 1);
  const currentPct = Math.max(4, Math.round((current / max) * 100));
  const previousPct = Math.max(4, Math.round((previous / max) * 100));

  return (
    <div className="period-compare-bars" aria-hidden>
      <div className="period-compare-bar-row">
        <span className="period-compare-bar-label">Now</span>
        <div className="period-compare-bar-track">
          <div
            className="period-compare-bar-fill current"
            style={{
              width: `${currentPct}%`,
              background: invert && current > previous ? '#EF4444' : accent,
            }}
          />
        </div>
      </div>
      <div className="period-compare-bar-row">
        <span className="period-compare-bar-label">Prev</span>
        <div className="period-compare-bar-track">
          <div
            className="period-compare-bar-fill previous"
            style={{ width: `${previousPct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function PeriodComparisonCard({ data }: PeriodComparisonCardProps) {
  const volumeMax = Math.max(
    data.current.totalFeedback,
    data.previous.totalFeedback,
    1
  );
  const currentVolumeShare = Math.round(
    (data.current.totalFeedback / volumeMax) * 100
  );
  const previousVolumeShare = Math.round(
    (data.previous.totalFeedback / volumeMax) * 100
  );

  return (
    <div className="chart-card period-comparison-card">
      <div className="chart-card-header">
        <div>
          <h3 className="chart-card-title">Period Comparison</h3>
          <p className="chart-card-subtitle">{data.periodLabel}</p>
        </div>
        <DeltaBadge change={data.volumeChange} />
      </div>

      {/* Volume summary */}
      <div className="period-volume-summary">
        <div className="period-volume-col current">
          <span className="period-volume-tag">Current</span>
          <span className="period-volume-value">
            {data.current.totalFeedback.toLocaleString()}
          </span>
          <span className="period-volume-hint">feedback items</span>
        </div>
        <div className="period-volume-divider" aria-hidden>
          vs
        </div>
        <div className="period-volume-col previous">
          <span className="period-volume-tag">Previous</span>
          <span className="period-volume-value">
            {data.previous.totalFeedback.toLocaleString()}
          </span>
          <span className="period-volume-hint">feedback items</span>
        </div>
      </div>

      <div className="period-volume-meter" aria-hidden>
        <div
          className="period-volume-meter-fill current"
          style={{ width: `${Math.max(currentVolumeShare, 2)}%` }}
          title="Current period"
        />
        <div
          className="period-volume-meter-fill previous"
          style={{ width: `${Math.max(previousVolumeShare, 2)}%` }}
          title="Previous period"
        />
      </div>

      {/* Metric rows */}
      <div className="period-metrics-list">
        {METRICS.map((metric) => {
          const currentVal = data.current[metric.key];
          const previousVal = data.previous[metric.key];
          const change = data[metric.changeKey] as number;
          const Icon = metric.icon;

          return (
            <div key={metric.key} className="period-metric-row">
              <div className="period-metric-top">
                <div className="period-metric-identity">
                  <span
                    className="period-metric-icon"
                    style={{
                      background: `${metric.accent}18`,
                      color: metric.accent,
                    }}
                  >
                    <Icon size={14} />
                  </span>
                  <span className="period-metric-label">{metric.label}</span>
                </div>
                <DeltaBadge change={change} invert={metric.invert} />
              </div>

              <div className="period-metric-values">
                <div className="period-metric-value-block">
                  <span className="period-metric-value-label">Current</span>
                  <span className="period-metric-value">
                    {metric.format(currentVal)}
                  </span>
                </div>
                <div className="period-metric-value-block previous">
                  <span className="period-metric-value-label">Previous</span>
                  <span className="period-metric-value">
                    {metric.format(previousVal)}
                  </span>
                </div>
              </div>

              <ComparisonBar
                current={currentVal}
                previous={previousVal}
                invert={metric.invert}
                accent={metric.accent}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default PeriodComparisonCard;
