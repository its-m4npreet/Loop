// FeedbackChannelsChart.jsx
import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { feedbackChannelsData } from '../../data/dashboardData';
import './Charts.css';

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="label">{label}</p>
        <p className="value">{payload[0].value.toLocaleString()} entries</p>
      </div>
    );
  }
  return null;
}

function FeedbackChannelsChart() {
  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <div>
          <h3 className="chart-card-title">Feedback by Channel</h3>
          <p className="chart-card-subtitle">Across all platforms</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <BarChart
          data={feedbackChannelsData}
          margin={{ top: 5, right: 10, left: -25, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
          <XAxis
            dataKey="channel"
            tick={{ fontSize: 11, fill: '#9CA3AF' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#9CA3AF' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(34,197,94,0.06)' }} />
          <Bar
            dataKey="count"
            fill="#22C55E"
            radius={[6, 6, 0, 0]}
            barSize={32}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default FeedbackChannelsChart;
