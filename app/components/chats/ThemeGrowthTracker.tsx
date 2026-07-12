'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
} from 'recharts';
import './Charts.css';

interface ThemeData {
  theme: string;
  color: string;
  data: number[];
  total: number;
}

interface ThemeGrowthTrackerProps {
  themes: ThemeData[];
}

// Deterministic hash for visual consistency (no Math.random)
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const chartData = data.map((value, i) => ({ week: i, value }));
  const gradientId = `spark-${hashCode(color + data.join(''))}`;

  return (
    <ResponsiveContainer width="100%" height={40}>
      <AreaChart data={chartData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.2} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#${gradientId})`}
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function ThemeGrowthTracker({ themes }: ThemeGrowthTrackerProps) {
  if (!themes.length) {
    return (
      <div className="chart-card">
        <div className="chart-card-header">
          <h3 className="chart-card-title">Theme Trends</h3>
        </div>
        <div className="theme-growth-empty">No theme data available</div>
      </div>
    );
  }

  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <div>
          <h3 className="chart-card-title">Theme Trends</h3>
          <p className="chart-card-subtitle">Weekly volume over 8 weeks</p>
        </div>
      </div>
      <div className="theme-growth-grid">
        {themes.slice(0, 6).map((theme) => {
          const lastWeek = theme.data[theme.data.length - 1] ?? 0;
          const prevWeek = theme.data[theme.data.length - 2] ?? 0;
          const change = prevWeek > 0 ? Math.round(((lastWeek - prevWeek) / prevWeek) * 100) : 0;
          const isUp = change > 0;

          return (
            <div key={theme.theme} className="theme-growth-card">
              <div className="theme-growth-header">
                <span
                  className="theme-growth-dot"
                  style={{ background: theme.color }}
                />
                <span className="theme-growth-name">{theme.theme}</span>
              </div>
              <div className="theme-growth-stats">
                <span className="theme-growth-total">{theme.total}</span>
                <span className={`theme-growth-change ${isUp ? 'up' : change < 0 ? 'down' : ''}`}>
                  {isUp ? '↑' : change < 0 ? '↓' : '→'} {Math.abs(change)}%
                </span>
              </div>
              <MiniSparkline data={theme.data} color={theme.color} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ThemeGrowthTracker;
