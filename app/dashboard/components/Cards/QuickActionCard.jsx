// QuickActionCard.jsx
import React from 'react';
import {
  PlusCircle,
  Upload,
  Bot,
  BarChart2,
  ArrowRight,
} from 'lucide-react';
import './Cards.css';

const ICON_MAP = {
  PlusCircle,
  Upload,
  Bot,
  BarChart2,
};

function QuickActionCard({ action, onClick }) {
  const Icon = ICON_MAP[action.icon] || PlusCircle;

  return (
    <div
      className="quick-action-card"
      id={`quick-action-${action.id}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick && onClick()}
      aria-label={action.label}
    >
      <div
        className="quick-action-icon-wrap"
        style={{ background: action.bgColor }}
      >
        <Icon size={22} color={action.color} />
      </div>

      <div>
        <div className="quick-action-label">{action.label}</div>
        <div className="quick-action-description">{action.description}</div>
      </div>

      <ArrowRight size={16} className="quick-action-arrow" />
    </div>
  );
}

export default QuickActionCard;
