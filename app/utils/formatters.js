// formatters.js – Utility helpers for the LOOP dashboard

/**
 * Format a number with thousands separator.
 * @param {number|string} num
 * @returns {string}
 */
export const formatNumber = (num) => {
  const parsed = typeof num === 'string' ? parseFloat(num.replace(/,/g, '')) : num;
  if (isNaN(parsed)) return String(num);
  return parsed.toLocaleString('en-US');
};

/**
 * Truncate a string to a maximum length.
 * @param {string} str
 * @param {number} maxLen
 * @returns {string}
 */
export const truncate = (str, maxLen = 80) => {
  if (!str) return '';
  return str.length > maxLen ? str.slice(0, maxLen) + '…' : str;
};

/**
 * Return a CSS class suffix for sentiment values.
 * @param {string} sentiment
 * @returns {string} 'positive' | 'negative' | 'neutral'
 */
export const sentimentClass = (sentiment) => {
  const lower = (sentiment || '').toLowerCase();
  if (lower === 'positive') return 'positive';
  if (lower === 'negative') return 'negative';
  return 'neutral';
};

/**
 * Return a CSS class suffix for status values.
 * @param {string} status
 * @returns {string}
 */
export const statusClass = (status) => {
  const lower = (status || '').toLowerCase().replace(/\s+/g, '-');
  // Map display labels + DB enums to badge classes
  if (lower === 'new') return 'open';
  if (lower === 'reviewed') return 'in-progress';
  if (lower === 'actioned') return 'resolved';
  return lower; // 'open' | 'resolved' | 'in-progress'
};
