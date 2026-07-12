'use client';

import React from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  type TooltipProps,
} from 'recharts';
import { feedbackVolumeData as defaultData } from '../../data/dashboardData';
import './Charts.css';

interface FeedbackVolumeChartProps {
  data?: Array<{ date: string; count: number }>;
}

function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="label">{label}</p>
        <p className="value">{payload[0]?.value?.toLocaleString() ?? 0} feedback</p>
      </div>
    );
  }
  return null;
}

function FeedbackVolumeChart({ data }: FeedbackVolumeChartProps) {
  const chartData = data ?? defaultData;
  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <div>
          <h3 className="chart-card-title">Feedback Volume Over Time</h3>
          <p className="chart-card-subtitle">Last 7 days</p>
        </div>
        <span className="chart-pill-badge">↑ 18% this week</span>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="feedbackGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#22C55E" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#22C55E" stopOpacity={0}    />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12, fill: '#9CA3AF' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#9CA3AF' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#E5E7EB', strokeWidth: 1 }} />
          <Area
            type="monotone"
            dataKey="count"
            stroke="#22C55E"
            strokeWidth={2.5}
            fill="url(#feedbackGradient)"
            dot={{ r: 4, fill: '#22C55E', strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 6, fill: '#22C55E', stroke: '#fff', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default FeedbackVolumeChart;
