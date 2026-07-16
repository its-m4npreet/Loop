'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  type TooltipProps,
} from 'recharts';
import { feedbackChannelsData as defaultData } from '../../data/dashboardData';
import './Charts.css';

interface FeedbackChannelsChartProps {
  data?: Array<{ channel: string; count: number }>;
}

function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="label">{label}</p>
        <p className="value">{payload[0]?.value?.toLocaleString() ?? 0} entries</p>
      </div>
    );
  }
  return null;
}

function FeedbackChannelsChart({ data }: FeedbackChannelsChartProps) {
  const chartData = data ?? defaultData;
  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <div>
          <h3 className="chart-card-title">Feedback by Channel</h3>
          <p className="chart-card-subtitle">Across all platforms</p>
        </div>
      </div>

      <div className="chart-body">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 5, right: 8, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
            <XAxis
              dataKey="channel"
              tick={{ fontSize: 11, fill: '#9CA3AF' }}
              axisLine={false}
              tickLine={false}
              interval={0}
              angle={0}
              minTickGap={8}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#9CA3AF' }}
              axisLine={false}
              tickLine={false}
              width={36}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(34,197,94,0.06)' }} />
            <Bar
              dataKey="count"
              fill="#22C55E"
              radius={[6, 6, 0, 0]}
              maxBarSize={36}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default FeedbackChannelsChart;
