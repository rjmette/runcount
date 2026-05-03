import { describe, it, expect } from 'vitest';

import { formatGameDateLong, formatGameDateTime } from '../formatGameDate';

// Use a fixed local-friendly date so the format is predictable across runs.
// 2025-05-04T15:18:00 in the local time zone — the assertions check shape,
// not absolute time, so DST/timezone wiggle doesn't break them.
const sample = new Date(2025, 4, 4, 15, 18, 0);

describe('formatGameDateTime', () => {
  it('renders the short interpunct form used across the UI', () => {
    expect(formatGameDateTime(sample)).toBe('Sun, May 4 · 3:18 PM');
  });

  it('accepts a string input (Supabase returns ISO strings)', () => {
    const iso = sample.toISOString();
    const result = formatGameDateTime(iso);
    expect(result).toMatch(
      /^[A-Z][a-z]{2}, [A-Z][a-z]{2} \d{1,2} · \d{1,2}:\d{2} (AM|PM)$/,
    );
  });

  it('accepts a number (epoch ms) input', () => {
    const result = formatGameDateTime(sample.getTime());
    expect(result).toBe('Sun, May 4 · 3:18 PM');
  });
});

describe('formatGameDateLong', () => {
  it('renders the verbose "at" form used in copy/email exports', () => {
    expect(formatGameDateLong(sample)).toBe('Sunday, May 4 at 3:18 PM');
  });

  it('accepts a string input', () => {
    const iso = sample.toISOString();
    const result = formatGameDateLong(iso);
    expect(result).toMatch(/^[A-Z][a-z]+, [A-Z][a-z]+ \d{1,2} at \d{1,2}:\d{2} (AM|PM)$/);
  });
});
