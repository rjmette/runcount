/**
 * Formats a Date as a human-readable relative time string.
 *
 * @param date  - The timestamp to format
 * @param now   - Optional "current" time (defaults to `new Date()`); useful for deterministic tests
 * @returns       A string like "just now", "1 min ago", "5 min ago", "1 hr ago", "2 days ago"
 */
export const formatTimeAgo = (date: Date | string, now: Date = new Date()): string => {
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();

  // Future dates or very recent (< 30 s)
  if (diffMs < 30_000) return 'just now';

  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 60) return `${diffMin} min ago`;

  const diffHr = Math.floor(diffMs / 3_600_000);
  if (diffHr < 24) return `${diffHr} hr ago`;

  const diffDays = Math.floor(diffMs / 86_400_000);
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
};
