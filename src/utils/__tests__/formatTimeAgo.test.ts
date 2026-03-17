import { describe, it, expect } from 'vitest';

import { formatTimeAgo } from '../formatTimeAgo';

describe('formatTimeAgo', () => {
  const now = new Date('2025-06-15T12:00:00Z');

  it('returns "just now" for dates less than 30 seconds ago', () => {
    const date = new Date('2025-06-15T11:59:45Z'); // 15 s ago
    expect(formatTimeAgo(date, now)).toBe('just now');
  });

  it('returns "just now" for the exact same time', () => {
    expect(formatTimeAgo(now, now)).toBe('just now');
  });

  it('returns "just now" for future dates', () => {
    const future = new Date('2025-06-15T12:05:00Z');
    expect(formatTimeAgo(future, now)).toBe('just now');
  });

  it('returns minutes for 1–59 minutes ago', () => {
    expect(formatTimeAgo(new Date('2025-06-15T11:59:00Z'), now)).toBe('1 min ago');
    expect(formatTimeAgo(new Date('2025-06-15T11:55:00Z'), now)).toBe('5 min ago');
    expect(formatTimeAgo(new Date('2025-06-15T11:01:00Z'), now)).toBe('59 min ago');
  });

  it('returns hours for 1–23 hours ago', () => {
    expect(formatTimeAgo(new Date('2025-06-15T11:00:00Z'), now)).toBe('1 hr ago');
    expect(formatTimeAgo(new Date('2025-06-15T06:00:00Z'), now)).toBe('6 hr ago');
    expect(formatTimeAgo(new Date('2025-06-14T13:00:00Z'), now)).toBe('23 hr ago');
  });

  it('returns days for 1+ days ago', () => {
    expect(formatTimeAgo(new Date('2025-06-14T12:00:00Z'), now)).toBe('1 day ago');
    expect(formatTimeAgo(new Date('2025-06-13T12:00:00Z'), now)).toBe('2 days ago');
    expect(formatTimeAgo(new Date('2025-06-08T12:00:00Z'), now)).toBe('7 days ago');
  });

  it('handles string dates', () => {
    expect(formatTimeAgo('2025-06-15T11:55:00Z', now)).toBe('5 min ago');
  });

  it('uses current time when now is omitted', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60_000);
    expect(formatTimeAgo(fiveMinAgo)).toBe('5 min ago');
  });
});
