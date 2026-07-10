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
  Cell,
  type TooltipProps,
} from 'recharts';
import { topThemesChartData } from '../../data/dashboardData';
import './Charts.css';

const BAR_COLORS = ['#22C55E', '#16A34A', '#4ADE80', '#86EFAC', '#BBF7D0', '#DCFCE7'];

function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="label">{label}</p>
        <p className="value">{payload[0]?.value?.toLocaleString() ?? 0} mentions</p>
      </div>
    );
  }
  return null;
}

function TopThemesChart() {
  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <div>
          <h3 className="chart-card-title">Top Themes</h3>
          <p className="chart-card-subtitle">By mention volume</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <BarChart
          layout="vertical"
          data={topThemesChartData}
          margin={{ top: 0, right: 20, left: 10, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: '#9CA3AF' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="theme"
            tick={{ fontSize: 12, fill: '#6B7280' }}
            axisLine={false}
            tickLine={false}
            width={100}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(34,197,94,0.06)' }} />
          <Bar dataKey="mentions" radius={[0, 6, 6, 0]} barSize={16}>
            {topThemesChartData.map((entry, index) => (
              <Cell key={entry.theme} fill={BAR_COLORS[index % BAR_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default TopThemesChart;
