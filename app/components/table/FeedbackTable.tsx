'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Search,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  Mail,
  MessageCircle,
  Globe,
  Smartphone,
  Monitor,
  CircleDot,
  Ticket,
  Users,
  Phone,
  type LucideIcon,
} from 'lucide-react';
import useDebounce from '../../hooks/useDebounce';
import { sentimentClass, statusClass } from '../../utils/formatters';
import Avatar from '../Avatar';
import './Tables.css';

const PAGE_SIZE = 5;

const CHANNEL_ICONS: Record<string, LucideIcon> = {
  Email: Mail,
  'In-App': Monitor,
  'Support Chat': MessageCircle,
  'Twitter/X': Globe,
  'App Store': Smartphone,
  'Support Ticket': Ticket,
  'NPS Survey': Users,
  'Sales Call': Phone,
  'Community Post': Globe,
};

export interface FeedbackRow {
  id: string;
  customer: string;
  feedback: string;
  channel: string;
  theme: string;
  sentiment: string;
  status: string;
  time: string;
}

interface SortConfig {
  key: string | null;
  direction: 'asc' | 'desc';
}

interface SortIconProps {
  column: string;
  sortConfig: SortConfig;
}

function SortIcon({ column, sortConfig }: SortIconProps) {
  if (sortConfig.key !== column) {
    return <ChevronsUpDown size={12} className="sort-icon" />;
  }
  return sortConfig.direction === 'asc' ? (
    <ChevronUp size={12} className="sort-icon active" />
  ) : (
    <ChevronDown size={12} className="sort-icon active" />
  );
}

const COLUMNS: { key: keyof FeedbackRow; label: string }[] = [
  { key: 'customer', label: 'Customer' },
  { key: 'feedback', label: 'Feedback' },
  { key: 'channel', label: 'Channel' },
  { key: 'theme', label: 'Theme' },
  { key: 'sentiment', label: 'Sentiment' },
  { key: 'status', label: 'Status' },
  { key: 'time', label: 'Time' },
];

interface FeedbackTableProps {
  data?: FeedbackRow[];
  title?: string;
}

function FeedbackTable({
  data = [],
  title = 'Recent Feedback',
}: FeedbackTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: null,
    direction: 'asc',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [filterSentiment, setFilterSentiment] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  const debouncedSearch = useDebounce(searchQuery, 250);

  const filtered = useMemo(() => {
    let rows = [...data];
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      rows = rows.filter(
        (row) =>
          row.customer.toLowerCase().includes(q) ||
          row.feedback.toLowerCase().includes(q) ||
          row.theme.toLowerCase().includes(q) ||
          row.channel.toLowerCase().includes(q)
      );
    }
    if (filterSentiment !== 'All') {
      rows = rows.filter((r) => r.sentiment === filterSentiment);
    }
    if (filterStatus !== 'All') {
      rows = rows.filter((r) => r.status === filterStatus);
    }
    return rows;
  }, [data, debouncedSearch, filterSentiment, filterStatus]);

  const sorted = useMemo(() => {
    if (!sortConfig.key) return filtered;
    return [...filtered].sort((a, b) => {
      const aVal = (a[sortConfig.key as keyof FeedbackRow] || '')
        .toString()
        .toLowerCase();
      const bVal = (b[sortConfig.key as keyof FeedbackRow] || '')
        .toString()
        .toLowerCase();
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filtered, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  // Keep page in range when filters shrink the result set
  const safePage = Math.min(currentPage, totalPages);
  const paginated = sorted.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  /**
   * Compact page list so small viewports don't wrap 1…N buttons.
   * Examples: [1,2,3,4,5] or [1,'…',4,5,6,'…',12]
   */
  const pageItems = useMemo((): Array<number | 'ellipsis'> => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages = new Set<number>([1, totalPages, safePage]);
    if (safePage - 1 > 1) pages.add(safePage - 1);
    if (safePage + 1 < totalPages) pages.add(safePage + 1);

    // Near the start/end, show a fuller run of pages instead of sparse holes
    if (safePage <= 3) {
      pages.add(2);
      pages.add(3);
      pages.add(4);
    }
    if (safePage >= totalPages - 2) {
      pages.add(totalPages - 1);
      pages.add(totalPages - 2);
      pages.add(totalPages - 3);
    }

    const sortedPages = Array.from(pages)
      .filter((n) => n >= 1 && n <= totalPages)
      .sort((a, b) => a - b);

    const items: Array<number | 'ellipsis'> = [];
    for (let i = 0; i < sortedPages.length; i++) {
      if (i > 0 && sortedPages[i] - sortedPages[i - 1] > 1) {
        items.push('ellipsis');
      }
      items.push(sortedPages[i]);
    }
    return items;
  }, [totalPages, safePage]);

  function handleSort(key: string) {
    setSortConfig((prev) => ({
      key,
      direction:
        prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
    setCurrentPage(1);
  }

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  }

  function handleFilterSentiment(e: React.ChangeEvent<HTMLSelectElement>) {
    setFilterSentiment(e.target.value);
    setCurrentPage(1);
  }

  function handleFilterStatus(e: React.ChangeEvent<HTMLSelectElement>) {
    setFilterStatus(e.target.value);
    setCurrentPage(1);
  }

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  return (
    <div className="feedback-table-wrapper">
      <div className="feedback-table-header">
        <div className="feedback-table-title-group">
          <h2>{title}</h2>
          <p>{sorted.length} entries found</p>
        </div>

        <div className="feedback-table-controls">
          <div className="table-search-wrap">
            <Search size={14} className="table-search-icon" aria-hidden />
            <input
              type="search"
              className="table-search-input"
              placeholder="Search feedback…"
              value={searchQuery}
              onChange={handleSearch}
              aria-label="Search feedback"
              id="feedback-table-search"
            />
          </div>

          <div className="table-filter-group">
            <select
              className="table-filter-select"
              value={filterSentiment}
              onChange={handleFilterSentiment}
              aria-label="Filter by sentiment"
              id="feedback-filter-sentiment"
            >
              <option value="All">All sentiments</option>
              <option value="Positive">Positive</option>
              <option value="Negative">Negative</option>
              <option value="Neutral">Neutral</option>
            </select>

            <select
              className="table-filter-select"
              value={filterStatus}
              onChange={handleFilterStatus}
              aria-label="Filter by status"
              id="feedback-filter-status"
            >
              <option value="All">All status</option>
              <option value="Open">Open</option>
              <option value="Resolved">Resolved</option>
              <option value="In Progress">In Progress</option>
            </select>
          </div>
        </div>
      </div>

      {/* Desktop / tablet table */}
      <div className="table-scroll-container feedback-table-desktop">
        <table className="feedback-table" aria-label="Customer feedback">
          <thead>
            <tr>
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className={
                    col.key === 'channel'
                      ? 'hide-mobile-sm'
                      : col.key === 'theme' || col.key === 'time'
                        ? 'hide-mobile'
                        : ''
                  }
                >
                  <div className="th-sortable">
                    {col.label}
                    <SortIcon column={col.key} sortConfig={sortConfig} />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length}>
                  <div className="table-empty">
                    <CircleDot size={32} color="#D1D5DB" />
                    <p>
                      {data.length === 0
                        ? 'No feedback in this workspace yet.'
                        : 'No feedback matches your search.'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              paginated.map((row) => {
                const ChannelIcon = CHANNEL_ICONS[row.channel] || Mail;
                const sClass = sentimentClass(row.sentiment);
                const stClass = statusClass(row.status);

                return (
                  <tr key={row.id}>
                    <td>
                      <div className="customer-cell">
                        <Avatar name={row.customer} size="sm" />
                        <span className="customer-name">{row.customer}</span>
                      </div>
                    </td>

                    <td>
                      <div className="feedback-text">{row.feedback}</div>
                    </td>

                    <td className="hide-mobile-sm">
                      <span className="channel-badge">
                        <ChannelIcon size={11} />
                        {row.channel}
                      </span>
                    </td>

                    <td className="hide-mobile">{row.theme}</td>

                    <td>
                      <span className={`sentiment-badge ${sClass}`}>
                        {row.sentiment}
                      </span>
                    </td>

                    <td>
                      <span className={`status-badge ${stClass}`}>
                        {row.status}
                      </span>
                    </td>

                    <td className="time-cell hide-mobile">{row.time}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile card list */}
      <div className="feedback-card-list" aria-label="Customer feedback">
        {paginated.length === 0 ? (
          <div className="table-empty">
            <CircleDot size={32} color="#D1D5DB" />
            <p>
              {data.length === 0
                ? 'No feedback in this workspace yet.'
                : 'No feedback matches your search.'}
            </p>
          </div>
        ) : (
          paginated.map((row) => {
            const ChannelIcon = CHANNEL_ICONS[row.channel] || Mail;
            const sClass = sentimentClass(row.sentiment);
            const stClass = statusClass(row.status);

            return (
              <article key={row.id} className="feedback-card">
                <div className="feedback-card-top">
                  <div className="customer-cell">
                    <Avatar name={row.customer} size="sm" />
                    <div className="feedback-card-customer-meta">
                      <span className="customer-name">{row.customer}</span>
                      <span className="feedback-card-time">{row.time}</span>
                    </div>
                  </div>
                  <div className="feedback-card-badges">
                    <span className={`sentiment-badge ${sClass}`}>
                      {row.sentiment}
                    </span>
                    <span className={`status-badge ${stClass}`}>{row.status}</span>
                  </div>
                </div>

                <p className="feedback-card-text">{row.feedback}</p>

                <div className="feedback-card-footer">
                  <span className="channel-badge">
                    <ChannelIcon size={11} />
                    {row.channel}
                  </span>
                  {row.theme ? (
                    <span className="feedback-card-theme">{row.theme}</span>
                  ) : null}
                </div>
              </article>
            );
          })
        )}
      </div>

      <div className="table-footer">
        <p className="table-page-info">
          Showing{' '}
          <strong>
            {sorted.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1}–
            {Math.min(safePage * PAGE_SIZE, sorted.length)}
          </strong>{' '}
          of <strong>{sorted.length}</strong> entries
        </p>

        <div className="pagination-controls" role="navigation" aria-label="Pagination">
          <button
            type="button"
            className="pagination-btn"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={safePage === 1}
            aria-label="Previous page"
          >
            <ChevronLeft size={14} />
          </button>

          {pageItems.map((item, idx) =>
            item === 'ellipsis' ? (
              <span key={`e-${idx}`} className="pagination-ellipsis" aria-hidden>
                …
              </span>
            ) : (
              <button
                type="button"
                key={item}
                className={`pagination-btn ${safePage === item ? 'active' : ''}`}
                onClick={() => setCurrentPage(item)}
                aria-label={`Page ${item}`}
                aria-current={safePage === item ? 'page' : undefined}
              >
                {item}
              </button>
            )
          )}

          <button
            type="button"
            className="pagination-btn"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
            aria-label="Next page"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default FeedbackTable;
