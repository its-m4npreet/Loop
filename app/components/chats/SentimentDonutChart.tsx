'use client';

import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  type TooltipProps,
} from 'recharts';
import { sentimentDistributionData as defaultData } from '../../data/dashboardData';
import './Charts.css';

interface SentimentDonutChartProps {
  data?: Array<{ name: string; value: number; color: string }>;
}

function CustomTooltip({ active, payload }: TooltipProps<number, string>) {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="label">{payload[0]?.name}</p>
        <p className="value">{payload[0]?.value}%</p>
      </div>
    );
  }
  return null;
}

function SentimentDonutChart({ data }: SentimentDonutChartProps) {
  const chartData = data ?? defaultData;
  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <div>
          <h3 className="chart-card-title">Sentiment Distribution</h3>
          <p className="chart-card-subtitle">This week</p>
        </div>
      </div>

      <div className="donut-chart-wrap">
        <div className="donut-chart-canvas">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius="58%"
                outerRadius="88%"
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="donut-legend">
          {chartData.map((item) => (
            <div key={item.name} className="donut-legend-item">
              <span
                className="donut-legend-dot"
                style={{ background: item.color }}
              />
              <span className="donut-legend-label">{item.name}</span>
              <span className="donut-legend-value">{item.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SentimentDonutChart;
