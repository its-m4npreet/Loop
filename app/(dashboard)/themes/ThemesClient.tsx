'use client';

import React, { useMemo, useState } from 'react';
import { Search, Tag } from 'lucide-react';
import ThemeCard, { type Theme } from '../../components/cards/ThemeCard';

export type ThemeItem = Theme;

type FilterTab = 'all' | 'rising' | 'falling' | 'stable';
type SortKey = 'mentions' | 'growth' | 'name';

interface ThemesClientProps {
  themes: ThemeItem[];
}

export default function ThemesClient({ themes }: ThemesClientProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterTab>('all');
  const [sort, setSort] = useState<SortKey>('mentions');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = themes.filter((t) => {
      if (q) {
        const hay = `${t.name} ${t.description ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filter === 'rising') return t.growthType === 'positive';
      if (filter === 'falling') return t.growthType === 'negative';
      if (filter === 'stable') return t.growthType === 'neutral';
      return true;
    });

    list = [...list].sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name);
      if (sort === 'growth') {
        const av = parseInt(a.weeklyGrowth.replace(/[^-\d]/g, ''), 10) || 0;
        const bv = parseInt(b.weeklyGrowth.replace(/[^-\d]/g, ''), 10) || 0;
        return bv - av;
      }
      return b.mentions - a.mentions;
    });

    return list;
  }, [themes, search, filter, sort]);

  const counts = useMemo(
    () => ({
      all: themes.length,
      rising: themes.filter((t) => t.growthType === 'positive').length,
      falling: themes.filter((t) => t.growthType === 'negative').length,
      stable: themes.filter((t) => t.growthType === 'neutral').length,
    }),
    [themes]
  );

  return (
    <div className="themes-browser">
      <div className="themes-toolbar">
        <div className="themes-search-wrap">
          <Search size={16} className="themes-search-icon" aria-hidden />
          <input
            type="search"
            className="themes-search-input"
            placeholder="Search themes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search themes"
          />
        </div>

        <div className="themes-toolbar-right">
          <label className="themes-sort">
            <span className="themes-sort-label">Sort</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              aria-label="Sort themes"
            >
              <option value="mentions">Most mentions</option>
              <option value="growth">Weekly growth</option>
              <option value="name">Name A–Z</option>
            </select>
          </label>
        </div>
      </div>

      <div className="themes-filter-tabs" role="tablist" aria-label="Filter themes">
        {(
          [
            ['all', 'All', counts.all],
            ['rising', 'Rising', counts.rising],
            ['falling', 'Falling', counts.falling],
            ['stable', 'Stable', counts.stable],
          ] as const
        ).map(([key, label, count]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={filter === key}
            className={`themes-filter-tab ${filter === key ? 'active' : ''}`}
            onClick={() => setFilter(key)}
          >
            {label}
            <span className="themes-filter-count">{count}</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="themes-empty">
          <Tag size={40} className="themes-empty-icon" />
          <p className="themes-empty-title">No themes found</p>
          <p className="themes-empty-desc">
            Try a different search or filter, or add themes to your workspace.
          </p>
        </div>
      ) : (
        <div className="themes-page-grid">
          {filtered.map((theme) => (
            <ThemeCard key={theme.id} theme={theme} />
          ))}
        </div>
      )}
    </div>
  );
}
