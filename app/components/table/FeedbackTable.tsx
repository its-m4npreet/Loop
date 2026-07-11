'use client';

import React, { useState, useMemo } from 'react';
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
  type LucideIcon,
} from 'lucide-react';
import { recentFeedbackData } from '../../data/dashboardData';
import useDebounce from '../../hooks/useDebounce';
import { sentimentClass, statusClass } from '../../utils/formatters';
import Avatar from '../Avatar';
import './Tables.css';

const PAGE_SIZE = 5;

const CHANNEL_ICONS: Record<string, LucideIcon> = {
  Email:          Mail,
  'In-App':       Monitor,
  'Support Chat': MessageCircle,
  'Twitter/X':    Globe,
  'App Store':    Smartphone,
};

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
  return sortConfig.direction === 'asc'
    ? <ChevronUp size={12} className="sort-icon active" />
    : <ChevronDown size={12} className="sort-icon active" />;
}

interface FeedbackRow {
  id: number;
  customer: string;
  feedback: string;
  channel: string;
  theme: string;
  sentiment: string;
  status: string;
  time: string;
}

const COLUMNS: { key: keyof FeedbackRow; label: string }[] = [
  { key: 'customer',  label: 'Customer'  },
  { key: 'feedback',  label: 'Feedback'  },
  { key: 'channel',   label: 'Channel'   },
  { key: 'theme',     label: 'Theme'     },
  { key: 'sentiment', label: 'Sentiment' },
  { key: 'status',    label: 'Status'    },
  { key: 'time',      label: 'Time'      },
];

function FeedbackTable() {
  const [searchQuery, setSearchQuery]   = useState('');
  const [sortConfig, setSortConfig]     = useState<SortConfig>({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage]   = useState(1);
  const [filterSentiment, setFilterSentiment] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  const debouncedSearch = useDebounce(searchQuery, 250);

  const filtered = useMemo(() => {
    let data = [...recentFeedbackData];
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      data = data.filter(
        (row) =>
          row.customer.toLowerCase().includes(q) ||
          row.feedback.toLowerCase().includes(q) ||
          row.theme.toLowerCase().includes(q) ||
          row.channel.toLowerCase().includes(q)
      );
    }
    if (filterSentiment !== 'All') {
      data = data.filter((r) => r.sentiment === filterSentiment);
    }
    if (filterStatus !== 'All') {
      data = data.filter((r) => r.status === filterStatus);
    }
    return data;
  }, [debouncedSearch, filterSentiment, filterStatus]);

  const sorted = useMemo(() => {
    if (!sortConfig.key) return filtered;
    return [...filtered].sort((a, b) => {
      const aVal = (a[sortConfig.key as keyof FeedbackRow] || '').toString().toLowerCase();
      const bVal = (b[sortConfig.key as keyof FeedbackRow] || '').toString().toLowerCase();
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filtered, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paginated  = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function handleSort(key: string) {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
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

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="feedback-table-wrapper">
      <div className="feedback-table-header">
        <div className="feedback-table-title-group">
          <h2>Recent Feedback</h2>
          <p>{sorted.length} entries found</p>
        </div>

        <div className="feedback-table-controls">
          <div className="table-search-wrap">
            <Search size={14} className="table-search-icon" />
            <input
              type="text"
              className="table-search-input"
              placeholder="Search feedback…"
              value={searchQuery}
              onChange={handleSearch}
              aria-label="Search feedback"
              id="feedback-table-search"
            />
          </div>

          <select
            className="table-filter-select"
            value={filterSentiment}
            onChange={handleFilterSentiment}
            aria-label="Filter by sentiment"
            id="feedback-filter-sentiment"
          >
            <option value="All">All Sentiments</option>
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
            <option value="All">All Status</option>
            <option value="Open">Open</option>
            <option value="Resolved">Resolved</option>
            <option value="In Progress">In Progress</option>
          </select>
        </div>
      </div>

      <div className="table-scroll-container">
        <table className="feedback-table" aria-label="Recent customer feedback">
          <thead>
            <tr>
              {COLUMNS.map((col) => (
                <th key={col.key} onClick={() => handleSort(col.key)} className={
                    col.key === 'channel' ? 'hide-mobile-sm' :
                    col.key === 'theme' || col.key === 'time' ? 'hide-mobile' : ''
                  }>
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
                    <p>No feedback matches your search.</p>
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

      <div className="table-footer">
        <p className="table-page-info">
          Showing{' '}
          <strong>
            {sorted.length === 0
              ? 0
              : (currentPage - 1) * PAGE_SIZE + 1}
            –{Math.min(currentPage * PAGE_SIZE, sorted.length)}
          </strong>{' '}
          of <strong>{sorted.length}</strong> entries
        </p>

        <div className="pagination-controls">
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            aria-label="Previous page"
          >
            <ChevronLeft size={14} />
          </button>

          {pageNumbers.map((num) => (
            <button
              key={num}
              className={`pagination-btn ${currentPage === num ? 'active' : ''}`}
              onClick={() => setCurrentPage(num)}
              aria-label={`Page ${num}`}
              aria-current={currentPage === num ? 'page' : undefined}
            >
              {num}
            </button>
          ))}

          <button
            className="pagination-btn"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
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
