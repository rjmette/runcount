import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { RelativeTime } from './RelativeTime';

describe('RelativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the initial relative time label', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60_000);
    render(<RelativeTime date={fiveMinAgo} />);
    expect(screen.getByText('5 min ago')).toBeInTheDocument();
  });

  it('shows absolute time in the title attribute', () => {
    const date = new Date(Date.now() - 5 * 60_000);
    render(<RelativeTime date={date} />);
    const span = screen.getByText('5 min ago');
    expect(span).toHaveAttribute('title');
    // Title should be a non-empty time string
    expect(span.getAttribute('title')).toBeTruthy();
  });

  it('updates the label after the refresh interval', () => {
    // Start at "just now"
    const date = new Date(Date.now());
    render(<RelativeTime date={date} refreshInterval={60_000} />);
    expect(screen.getByText('just now')).toBeInTheDocument();

    // Advance 2 minutes — the interval should fire and re-compute the label
    act(() => {
      vi.advanceTimersByTime(2 * 60_000);
    });

    expect(screen.getByText('2 min ago')).toBeInTheDocument();
  });

  it('cleans up the interval on unmount', () => {
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval');
    const date = new Date(Date.now() - 60_000);
    const { unmount } = render(<RelativeTime date={date} />);
    unmount();
    expect(clearIntervalSpy).toHaveBeenCalled();
    clearIntervalSpy.mockRestore();
  });

  it('accepts a string date', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60_000).toISOString();
    render(<RelativeTime date={fiveMinAgo} />);
    expect(screen.getByText('5 min ago')).toBeInTheDocument();
  });
});
