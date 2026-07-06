// StatCard.jsx
import React from 'react';
import {
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Tag,
  FileText,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import './Cards.css';

const ICON_MAP = {
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Tag,
  FileText,
};

const ICON_COLORS = {
  'total-feedback':     { color: '#60A5FA', bg: '#EFF6FF' },
  'positive-sentiment': { color: '#22C55E', bg: '#F0FDF4' },
  'negative-sentiment': { color: '#F87171', bg: '#FEF2F2' },
  'neutral-sentiment':  { color: '#94A3B8', bg: '#F8FAFC' },
  'active-themes':      { color: '#A78BFA', bg: '#F5F3FF' },
  'reports-generated':  { color: '#FB923C', bg: '#FFF7ED' },
};

function StatCard({ stat }) {
  const Icon   = ICON_MAP[stat.icon] || MessageSquare;
  const colors = ICON_COLORS[stat.id] || { color: '#22C55E', bg: '#F0FDF4' };
  const isPositiveChange = stat.changeType === 'positive';

  return (
    <div className="stat-card" id={`stat-card-${stat.id}`}>
      <div className="stat-card-header">
        <span className="stat-card-title">{stat.title}</span>
        <div
          className="stat-card-icon-wrap"
          style={{ background: colors.bg }}
        >
          <Icon size={18} color={colors.color} />
        </div>
      </div>

      <div className="stat-card-value">{stat.value}</div>

      <div className="stat-card-footer">
        <span className={`stat-card-change ${stat.changeType}`}>
          {isPositiveChange
            ? <TrendingUp size={12} />
            : <TrendingDown size={12} />
          }
          {stat.change}
        </span>
        <span className="stat-card-description">{stat.description}</span>
      </div>
    </div>
  );
}

export default StatCard;
