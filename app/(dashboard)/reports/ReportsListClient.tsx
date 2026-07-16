'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
  FileText,
  AlertCircle,
  Sparkles,
  Printer,
  CalendarRange,
  TrendingUp,
  Tags,
  Briefcase,
  Download
} from 'lucide-react';
import type { ReportStatus } from '../../generated/prisma/client';

interface ReportListItem {
  id: string;
  title: string;
  type: string;
  status: ReportStatus;
  periodStart: string | null;
  periodEnd: string | null;
  createdAt: string;
  generatedByName: string;
}

interface ReportsListClientProps {
  initialData: {
    reports: ReportListItem[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

interface VoCContent {
  executiveSummary: string;
  topThemes: Array<{ name: string; count: number; trend: string }>;
  sentimentAnalysis: {
    positive: number;
    neutral: number;
    negative: number;
    summary: string;
  };
  notableQuotes: Array<{ quote: string; sentiment: string; channel: string }>;
  recommendations: string[];
  generatedAt: string;
}

interface RawReportTheme {
  name?: string;
  theme?: string;
  count?: number;
  mentions?: number;
  trend?: string;
}

interface RawReportQuote {
  quote?: string;
  sentiment?: string;
  channel?: string;
}

interface RawReportContent {
  executiveSummary?: string;
  summary?: string;
  sentimentAnalysis?: {
    positive?: number;
    neutral?: number;
    negative?: number;
    summary?: string;
  };
  sentimentBreakdown?: {
    positive?: number;
    neutral?: number;
    negative?: number;
  };
  topThemes?: Array<string | RawReportTheme>;
  notableQuotes?: RawReportQuote[];
  recommendations?: string[];
  generatedAt?: string;
}

function parseResilientReportContent(raw: RawReportContent | null | undefined): VoCContent {
  if (!raw) {
    return {
      executiveSummary: '',
      topThemes: [],
      sentimentAnalysis: { positive: 0, neutral: 0, negative: 0, summary: '' },
      notableQuotes: [],
      recommendations: [],
      generatedAt: ''
    };
  }

  // Handle executive summary
  const executiveSummary = raw.executiveSummary || raw.summary || '';

  // Handle sentiment analysis
  let sentimentAnalysis = { positive: 0, neutral: 0, negative: 0, summary: '' };
  if (raw.sentimentAnalysis) {
    sentimentAnalysis = {
      positive: raw.sentimentAnalysis.positive ?? 0,
      neutral: raw.sentimentAnalysis.neutral ?? 0,
      negative: raw.sentimentAnalysis.negative ?? 0,
      summary: raw.sentimentAnalysis.summary ?? ''
    };
  } else if (raw.sentimentBreakdown) {
    sentimentAnalysis = {
      positive: raw.sentimentBreakdown.positive ?? 0,
      neutral: raw.sentimentBreakdown.neutral ?? 0,
      negative: raw.sentimentBreakdown.negative ?? 0,
      summary: raw.summary || ''
    };
  }

  // Handle top themes
  let topThemes: Array<{ name: string; count: number; trend: string }> = [];
  if (Array.isArray(raw.topThemes)) {
    topThemes = raw.topThemes.map((theme: string | RawReportTheme) => {
      if (typeof theme === 'string') {
        return { name: theme, count: 0, trend: 'stable' };
      }
      return {
        name: theme?.name || theme?.theme || '',
        count: theme?.count || theme?.mentions || 0,
        trend: theme?.trend || 'stable'
      };
    });
  }

  // Handle notable quotes
  let notableQuotes: Array<{ quote: string; sentiment: string; channel: string }> = [];
  if (Array.isArray(raw.notableQuotes)) {
    notableQuotes = raw.notableQuotes.map((q: RawReportQuote) => ({
      quote: q?.quote || '',
      sentiment: q?.sentiment || 'neutral',
      channel: q?.channel || 'General'
    }));
  }

  // Handle recommendations
  const recommendations = Array.isArray(raw.recommendations) ? raw.recommendations : [];

  return {
    executiveSummary,
    topThemes,
    sentimentAnalysis,
    notableQuotes,
    recommendations,
    generatedAt: raw.generatedAt || ''
  };
}

export default function ReportsListClient({ initialData }: ReportsListClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [reports, setReports] = useState<ReportListItem[]>(initialData.reports);
  const [page, setPage] = useState(initialData.page);
  const [totalPages, setTotalPages] = useState(initialData.totalPages);
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'ALL'>('ALL');
  const [isLoading, setIsLoading] = useState(false);

  // New Report Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reportTitle, setReportTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [generationError, setGenerationError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportStatus, setReportStatus] = useState<ReportStatus>('COMPLETED');

  // Report Details Modal State
  const [selectedReportContent, setSelectedReportContent] = useState<VoCContent | null>(null);
  const [selectedReportTitle, setSelectedReportTitle] = useState('');
  const [selectedReportId, setSelectedReportId] = useState('');
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCompiling, setIsCompiling] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const positive = selectedReportContent?.sentimentAnalysis?.positive ?? 0;
  const neutral = selectedReportContent?.sentimentAnalysis?.neutral ?? 0;
  const negative = selectedReportContent?.sentimentAnalysis?.negative ?? 0;
  const totalSentiment = positive + neutral + negative || 1;

  const posWidth = `${(positive / totalSentiment) * 100}%`;
  const neuWidth = `${(neutral / totalSentiment) * 100}%`;
  const negWidth = `${(negative / totalSentiment) * 100}%`;
  const sentimentSummary = selectedReportContent?.sentimentAnalysis?.summary ?? '';

  // Escape key event listener to close modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsModalOpen(false);
        setIsDetailsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const fetchReports = async (pageNum: number, searchVal: string, statusVal: ReportStatus | 'ALL') => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        search: searchVal,
        status: statusVal,
      });
      const res = await fetch(`/api/reports?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports);
        setPage(data.page);
        setTotalPages(data.totalPages);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearch(val);
    setPage(1);
    fetchReports(1, val, statusFilter);
  };

  const handleFilterClick = (status: ReportStatus | 'ALL') => {
    setStatusFilter(status);
    setPage(1);
    fetchReports(1, search, status);
  };

  const handlePrevPage = () => {
    if (page > 1) {
      fetchReports(page - 1, search, statusFilter);
    }
  };

  const handleNextPage = () => {
    if (page < totalPages) {
      fetchReports(page + 1, search, statusFilter);
    }
  };

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportTitle || !startDate || !endDate) {
      setGenerationError('Please fill in all fields.');
      return;
    }
    setGenerationError('');
    setIsGenerating(true);

    try {
      const res = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: reportTitle,
          periodStart: startDate,
          periodEnd: endDate,
          status: reportStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setGenerationError(data.error || 'Failed to generate report.');
      } else {
        // Success
        setIsModalOpen(false);
        setReportTitle('');
        setStartDate('');
        setEndDate('');
        setReportStatus('COMPLETED');
        fetchReports(1, search, statusFilter);
      }
    } catch {
      setGenerationError('A network error occurred.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleViewReport = useCallback(async (reportId: string, title?: string) => {
    setSelectedReportId(reportId);
    if (title) setSelectedReportTitle(title);
    try {
      const res = await fetch(`/api/reports/${reportId}`);
      if (!res.ok) {
        alert('Failed to load report content.');
        return;
      }

      const data = await res.json();
      setSelectedReportTitle(data.title || title || 'Report');
      setEditTitle(data.title || '');
      setEditStartDate(data.periodStart ? data.periodStart.slice(0, 10) : '');
      setEditEndDate(data.periodEnd ? data.periodEnd.slice(0, 10) : '');

      if (!data.contentJson) {
        alert('This report does not have detailed content available.');
        return;
      }

      let parsed: RawReportContent | null = null;
      try {
        parsed =
          typeof data.contentJson === 'string'
            ? (JSON.parse(data.contentJson) as RawReportContent)
            : (data.contentJson as RawReportContent);
      } catch (parseErr) {
        console.error('Failed to parse report contentJson', parseErr);
        alert('Report content is corrupted and could not be displayed.');
        return;
      }

      setSelectedReportContent(parseResilientReportContent(parsed));
      setIsDetailsOpen(true);
    } catch (e) {
      console.error(e);
      alert('Failed to load report content.');
    }
  }, []);

  // Open a specific report when arriving from generate page (?view=reportId)
  useEffect(() => {
    const viewId = searchParams.get('view');
    if (!viewId) return;

    void handleViewReport(viewId);
    // Clear query so refresh/back doesn't re-open forever
    router.replace('/reports', { scroll: false });
  }, [searchParams, handleViewReport, router]);

  const handleUpdateReport = async () => {
    if (!selectedReportId) return;
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/reports/${selectedReportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          periodStart: editStartDate,
          periodEnd: editEndDate,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to update report configuration.');
      } else {
        alert('Report configuration updated successfully!');
        setSelectedReportTitle(editTitle);
        fetchReports(page, search, statusFilter);
      }
    } catch {
      alert('A network error occurred.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCompileReport = async () => {
    if (!selectedReportId) return;
    setIsCompiling(true);
    try {
      const res = await fetch(`/api/reports/${selectedReportId}/run`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to compile report.');
      } else {
        setSelectedReportContent(parseResilientReportContent(data.content));
        fetchReports(page, search, statusFilter);
      }
    } catch {
      alert('A network error occurred.');
    } finally {
      setIsCompiling(false);
    }
  };

  const TEMPLATES = [
    { title: 'Weekly Summary', desc: "Overview of the past week's feedback and sentiment.", icon: CalendarRange, color: '#3B82F6', audience: 'Support & Ops' },
    { title: 'Sentiment Report', desc: 'Deep analysis of sentiment trends over a period.', icon: TrendingUp, color: '#EF4444', audience: 'Success & CS' },
    { title: 'Theme Analysis', desc: 'Breakdown of trending themes and their impact.', icon: Tags, color: '#10B981', audience: 'Product & Eng' },
    { title: 'Executive Summary', desc: 'High-level overview for stakeholders.', icon: Briefcase, color: '#8B5CF6', audience: 'Executives' },
  ];

  const handleSelectTemplate = (templateTitle: string) => {
    const today = new Date();
    const formatInputDate = (d: Date) => d.toISOString().split('T')[0];

    let start: Date;
    if (templateTitle === 'Weekly Summary') {
      start = new Date(today.getTime() - 7 * 86400000);
    } else {
      start = new Date(today.getTime() - 30 * 86400000);
    }

    setStartDate(formatInputDate(start));
    setEndDate(formatInputDate(today));
    setReportTitle(`${templateTitle} - ${today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`);
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="reports-templates">
        <div className="section-title">Templates</div>
        <div className="reports-grid">
          {TEMPLATES.map((t, i) => (
            <button
              key={i}
              type="button"
              className="reports-template-card"
              id={`template-${i}`}
              onClick={() => handleSelectTemplate(t.title)}
            >
              <div className="reports-template-card-body">
                <div className="reports-template-icon" style={{ color: t.color }}>
                  <t.icon size={24} />
                </div>
                <div className="reports-template-title">{t.title}</div>
                <div className="reports-template-desc">{t.desc}</div>
              </div>
              <span className="reports-template-audience">{t.audience}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="section-title reports-section-title">Recent Reports</div>

      <div className="reports-actions-row">
        <div className="search-bar-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search reports by title..."
            className="reports-search-input"
            value={search}
            onChange={handleSearchChange}
          />
        </div>
        <button
          type="button"
          className="btn-primary reports-new-btn"
          onClick={() => setIsModalOpen(true)}
          aria-label="New Report"
          title="New Report"
        >
          <Plus size={15} />
          <span className="reports-new-btn-label">New Report</span>
        </button>
      </div>

      <div className="reports-filters-tabs">
        {(['ALL', 'COMPLETED', 'DRAFT', 'SCHEDULED'] as const).map((tab) => (
          <button
            key={tab}
            className={`filter-tab-btn ${statusFilter === tab ? 'active' : ''}`}
            onClick={() => handleFilterClick(tab)}
          >
            {tab.charAt(0) + tab.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      <div className="reports-list mt-4">
        {isLoading ? (
          <div className="reports-loader-container">
            <Loader2 className="animate-spin text-accent" size={32} />
            <p>Loading reports...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="reports-empty-state">
            <FileText size={48} className="empty-state-icon" />
            <p className="empty-state-title">No reports found</p>
            <p className="empty-state-subtitle">
              Try adjusting your search query or filters, or generate a new report.
            </p>
          </div>
        ) : (
          reports.map((r) => {
            const formattedDate = new Date(r.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });
            const periodText = r.periodStart && r.periodEnd
              ? `${new Date(r.periodStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${new Date(r.periodEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
              : 'N/A';

            return (
              <div key={r.id} className="reports-list-item" id={`report-${r.id}`}>
                <div
                  className="reports-info-clickable"
                  onClick={() => r.status === 'COMPLETED' && handleViewReport(r.id, r.title)}
                  style={{ cursor: r.status === 'COMPLETED' ? 'pointer' : 'default' }}
                >
                  <div className="reports-list-title">
                    <span className="reports-list-title-text">{r.title}</span>
                    {r.status === 'COMPLETED' && (
                      <Sparkles size={14} className="sparkle-ai-badge" />
                    )}
                  </div>
                  <div className="reports-list-meta">
                    {r.type.toUpperCase()} · Period: {periodText} · Generated{' '}
                    {formattedDate} by {r.generatedByName}
                  </div>
                  <div className="reports-list-meta-parts">
                    <span>{r.type.toUpperCase()}</span>
                    <span>Period: {periodText}</span>
                    <span>{formattedDate}</span>
                    <span>by {r.generatedByName}</span>
                  </div>
                </div>
                <div className="reports-list-actions">
                  <span className={`reports-status status-${r.status.toLowerCase()}`}>
                    {r.status}
                  </span>
                  {r.status === 'COMPLETED' ? (
                    <button
                      className="reports-download-btn"
                      onClick={() => handleViewReport(r.id, r.title)}
                      title="View PDF / Report details"
                    >
                      <FileText size={16} />
                    </button>
                  ) : (
                    <button
                      className="reports-download-btn disabled"
                      disabled
                      title="No action available"
                    >
                      <Download size={16} />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && !isLoading && (
        <div className="reports-pagination">
          <button
            className="pagination-btn"
            onClick={handlePrevPage}
            disabled={page === 1}
          >
            <ChevronLeft size={16} />
            Prev
          </button>
          <span className="pagination-text">
            Page {page} of {totalPages}
          </span>
          <button
            className="pagination-btn"
            onClick={handleNextPage}
            disabled={page === totalPages}
          >
            Next
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* NEW REPORT MODAL */}
      {isModalOpen && (
        <div className="reports-modal-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) setIsModalOpen(false);
        }}>
          <div className="reports-modal-content">
            <div className="reports-modal-header">
              <h3>Generate AI VoC Report</h3>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateReport}>
              <div className="reports-modal-body">
                {generationError && (
                  <div className="error-banner">
                    <AlertCircle size={16} />
                    <span>{generationError}</span>
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="report-title">Report Title</label>
                  <input
                    id="report-title"
                    type="text"
                    placeholder="e.g. Weekly Feedback Analysis - July Week 2"
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                    required
                    disabled={isGenerating}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="report-status">Report Action</label>
                  <select
                    id="report-status"
                    value={reportStatus}
                    onChange={(e) => setReportStatus(e.target.value as ReportStatus)}
                    disabled={isGenerating}
                  >
                    <option value="COMPLETED">Run AI Analysis Now (Completed)</option>
                    <option value="DRAFT">Save Configuration Only (Draft)</option>
                    <option value="SCHEDULED">Schedule Weekly Execution (Scheduled)</option>
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="start-date">Start Date</label>
                    <input
                      id="start-date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                      disabled={isGenerating}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="end-date">End Date</label>
                    <input
                      id="end-date"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      required
                      disabled={isGenerating}
                    />
                  </div>
                </div>

                <div className="ai-notice-box">
                  <Sparkles size={16} className="text-accent" />
                  <p>
                    LOOP will parse all customer comments in this range, compute theme frequency, sentiment shifts, and use Gemini to generate a narrative report.
                  </p>
                </div>
              </div>
              <div className="reports-modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isGenerating}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={isGenerating}>
                  {isGenerating ? (
                    <>
                      <Loader2 className="animate-spin" size={14} />
                      Generating with AI...
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      Generate
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REPORT VIEW DETAILS MODAL */}
      {isDetailsOpen && selectedReportContent && (
        <div className="reports-modal-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) setIsDetailsOpen(false);
        }}>
          <div className="reports-modal-content wide">
            <div className="reports-modal-header">
              <div className="title-with-badge">
                <h3>{selectedReportTitle}</h3>
                <span className="badge-ai-generated">AI Generated</span>
              </div>
              <button className="close-btn" onClick={() => setIsDetailsOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="reports-modal-body details-body">
              {/* Executive Summary */}
              <div className="report-detail-section">
                <h4>Executive Summary</h4>
                <p className="summary-text">{selectedReportContent.executiveSummary}</p>
                {selectedReportContent.executiveSummary.includes("pending") && (
                  <div className="ai-notice-box report-config-editor">
                    <div className="report-config-editor-head">
                      <Sparkles size={16} className="text-accent" />
                      <span>Edit Report Configuration</span>
                    </div>

                    <div className="form-group">
                      <label htmlFor="edit-report-title">Report Title</label>
                      <input
                        id="edit-report-title"
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="reports-search-input"
                      />
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="edit-start-date">Start Date</label>
                        <input
                          id="edit-start-date"
                          type="date"
                          value={editStartDate}
                          onChange={(e) => setEditStartDate(e.target.value)}
                          className="reports-search-input"
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="edit-end-date">End Date</label>
                        <input
                          id="edit-end-date"
                          type="date"
                          value={editEndDate}
                          onChange={(e) => setEditEndDate(e.target.value)}
                          className="reports-search-input"
                        />
                      </div>
                    </div>

                    <div className="report-config-actions">
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={handleUpdateReport}
                        disabled={isUpdating || isCompiling}
                      >
                        {isUpdating ? 'Saving...' : 'Save Configuration'}
                      </button>
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={handleCompileReport}
                        disabled={isUpdating || isCompiling}
                      >
                        {isCompiling ? (
                          <>
                            <Loader2 className="animate-spin" size={14} />
                            Compiling...
                          </>
                        ) : (
                          <>
                            <Sparkles size={14} />
                            Run AI Analysis Now
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Sentiment Analysis */}
              <div className="report-detail-section">
                <h4>Sentiment Analysis</h4>
                <div className="sentiment-analysis-wrap">
                  <div className="sentiment-meter-bar">
                    <div
                      className="meter-segment positive"
                      style={{ width: posWidth }}
                    />
                    <div
                      className="meter-segment neutral"
                      style={{ width: neuWidth }}
                    />
                    <div
                      className="meter-segment negative"
                      style={{ width: negWidth }}
                    />
                  </div>
                  <div className="sentiment-meter-legend">
                    <span>Positive: {positive}</span>
                    <span>Neutral: {neutral}</span>
                    <span>Negative: {negative}</span>
                  </div>
                  <p className="sentiment-desc">{sentimentSummary}</p>
                </div>
              </div>

              {/* Top Themes & Recommendations */}
              <div className="report-two-col">
                <div className="report-detail-section">
                  <h4>Top Emerging Themes</h4>
                  <div className="details-themes-list">
                    {selectedReportContent.topThemes.map((theme, i) => (
                      <div key={i} className="details-theme-row">
                        <span className="theme-name-tag">{theme.name}</span>
                        <span className="theme-mentions-count">{theme.count} mentions</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="report-detail-section">
                  <h4>Recommended Actions</h4>
                  <ul className="details-recommendations-list">
                    {selectedReportContent.recommendations.map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Notable Quotes */}
              <div className="report-detail-section">
                <h4>Notable Verbatim Quotes</h4>
                <div className="details-quotes-grid">
                  {selectedReportContent.notableQuotes.map((q, i) => (
                    <div key={i} className={`quote-card ${q.sentiment.toLowerCase()}`}>
                      <p className="quote-text">&ldquo;{q.quote}&rdquo;</p>
                      <div className="quote-meta">
                        <span>{q.channel}</span>
                        <span className={`quote-sentiment-pill ${q.sentiment.toLowerCase()}`}>
                          {q.sentiment}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="reports-modal-footer details-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => window.print()}
              >
                <Printer size={14} />
                Print PDF
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setIsDetailsOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
