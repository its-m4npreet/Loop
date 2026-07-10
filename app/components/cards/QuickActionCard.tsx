'use client';

import React from 'react';
import {
  PlusCircle,
  Upload,
  Bot,
  BarChart2,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react';
import './Cards.css';

const ICON_MAP: Record<string, LucideIcon> = {
  PlusCircle,
  Upload,
  Bot,
  BarChart2,
};

interface Action {
  id: string;
  icon: string;
  label: string;
  description: string;
  bgColor: string;
  color: string;
}

interface QuickActionCardProps {
  action: Action;
  onClick?: () => void;
}

function QuickActionCard({ action, onClick }: QuickActionCardProps) {
  const Icon = ICON_MAP[action.icon] || PlusCircle;

  return (
    <div
      className="quick-action-card"
      id={`quick-action-${action.id}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
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
