// SentimentDonutChart.jsx
import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { sentimentDistributionData } from '../../data/dashboardData';
import './Charts.css';

function CustomTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="label">{payload[0].name}</p>
        <p className="value">{payload[0].value}%</p>
      </div>
    );
  }
  return null;
}

function SentimentDonutChart() {
  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <div>
          <h3 className="chart-card-title">Sentiment Distribution</h3>
          <p className="chart-card-subtitle">This week</p>
        </div>
      </div>

      <div className="donut-chart-wrap">
        <ResponsiveContainer width={180} height={180}>
          <PieChart>
            <Pie
              data={sentimentDistributionData}
              cx="50%"
              cy="50%"
              innerRadius={52}
              outerRadius={78}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
            >
              {sentimentDistributionData.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        <div className="donut-legend">
          {sentimentDistributionData.map((item) => (
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
