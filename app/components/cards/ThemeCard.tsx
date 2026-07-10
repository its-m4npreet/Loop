'use client';

import React from 'react';
import {
  CreditCard,
  Rocket,
  Zap,
  Headphones,
  TrendingUp,
  TrendingDown,
  type LucideIcon,
} from 'lucide-react';
import './Cards.css';

const ICON_MAP: Record<string, LucideIcon> = {
  CreditCard,
  Rocket,
  Zap,
  Headphones,
};

export interface Theme {
  id: string;
  icon: string;
  name: string;
  mentions: number;
  growthType: 'positive' | 'negative';
  weeklyGrowth: string;
  bgColor: string;
  color: string;
}

interface ThemeCardProps {
  theme: Theme;
}

function ThemeCard({ theme }: ThemeCardProps) {
  const Icon = ICON_MAP[theme.icon] || Zap;
  const isPositive = theme.growthType === 'positive';

  return (
    <div className="theme-card" id={`theme-card-${theme.id}`}>
      <div className="theme-card-header">
        <div
          className="theme-card-icon-wrap"
          style={{ background: theme.bgColor }}
        >
          <Icon size={20} color={theme.color} />
        </div>
        <span className="theme-card-name">{theme.name}</span>
      </div>

      <div className="theme-card-body">
        <div>
          <div className="theme-card-mentions">{theme.mentions.toLocaleString()}</div>
          <div className="theme-card-mentions-label">mentions</div>
        </div>

        <span className={`theme-card-badge ${theme.growthType}`}>
          {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {theme.weeklyGrowth}
        </span>
      </div>
    </div>
  );
}

export default ThemeCard;
