'use client';

import React from 'react';
import {
  CreditCard,
  Rocket,
  Zap,
  Headphones,
  TrendingUp,
  TrendingDown,
  Minus,
  Monitor,
  DollarSign,
  Layers,
  Smartphone,
  Shield,
  Tag,
  type LucideIcon,
} from 'lucide-react';
import './Cards.css';

const ICON_MAP: Record<string, LucideIcon> = {
  CreditCard,
  Rocket,
  Zap,
  Headphones,
  Monitor,
  DollarSign,
  Layers,
  Smartphone,
  Shield,
  Tag,
};

function iconForTheme(name: string, explicit?: string): LucideIcon {
  if (explicit && ICON_MAP[explicit]) return ICON_MAP[explicit];
  const n = name.toLowerCase();
  if (n.includes('bill') || n.includes('pric')) return DollarSign;
  if (n.includes('onboard')) return Rocket;
  if (n.includes('perform') || n.includes('speed')) return Zap;
  if (n.includes('support')) return Headphones;
  if (n.includes('ui') || n.includes('ux') || n.includes('design')) return Monitor;
  if (n.includes('feature')) return Layers;
  if (n.includes('mobile') || n.includes('app')) return Smartphone;
  if (n.includes('secur') || n.includes('privacy')) return Shield;
  return Tag;
}

function hexToSoftBg(hex: string): string {
  const cleaned = hex.replace('#', '');
  if (cleaned.length !== 6) return 'var(--color-surface)';
  const r = parseInt(cleaned.slice(0, 2), 16);
  const g = parseInt(cleaned.slice(2, 4), 16);
  const b = parseInt(cleaned.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, 0.12)`;
}

export interface Theme {
  id: string;
  icon?: string;
  name: string;
  description?: string | null;
  mentions: number;
  growthType: 'positive' | 'negative' | 'neutral';
  weeklyGrowth: string;
  bgColor?: string;
  color: string;
  thisWeek?: number;
  positivePct?: number;
  negativePct?: number;
}

interface ThemeCardProps {
  theme: Theme;
}

function ThemeCard({ theme }: ThemeCardProps) {
  const Icon = iconForTheme(theme.name, theme.icon);
  const bg = theme.bgColor || hexToSoftBg(theme.color);
  const GrowthIcon =
    theme.growthType === 'positive'
      ? TrendingUp
      : theme.growthType === 'negative'
        ? TrendingDown
        : Minus;

  return (
    <article className="theme-card" id={`theme-card-${theme.id}`}>
      <div className="theme-card-header">
        <div className="theme-card-icon-wrap" style={{ background: bg }}>
          <Icon size={20} color={theme.color} />
        </div>
        <div className="theme-card-heading">
          <span className="theme-card-name">{theme.name}</span>
          {theme.description ? (
            <span className="theme-card-desc">{theme.description}</span>
          ) : null}
        </div>
      </div>

      <div className="theme-card-body">
        <div>
          <div className="theme-card-mentions">
            {theme.mentions.toLocaleString()}
          </div>
          <div className="theme-card-mentions-label">mentions</div>
        </div>

        <span className={`theme-card-badge ${theme.growthType}`}>
          <GrowthIcon size={12} />
          {theme.weeklyGrowth}
        </span>
      </div>

      {(theme.thisWeek != null ||
        theme.positivePct != null ||
        theme.negativePct != null) && (
        <div className="theme-card-footer">
          {theme.thisWeek != null && (
            <span className="theme-card-meta">
              <strong>{theme.thisWeek}</strong> this week
            </span>
          )}
          {theme.positivePct != null && (
            <span className="theme-card-meta positive">
              {theme.positivePct}% pos
            </span>
          )}
          {theme.negativePct != null && (
            <span className="theme-card-meta negative">
              {theme.negativePct}% neg
            </span>
          )}
        </div>
      )}
    </article>
  );
}

export default ThemeCard;
