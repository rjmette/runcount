import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { type GameData } from '../../types/game';
import { computeMatchLength } from '../computeMatchLength';

const makeGame = (overrides: Partial<GameData> = {}): GameData => ({
  id: 'g1',
  date: '2025-05-04T15:00:00.000Z',
  players: [],
  winner_id: null,
  completed: true,
  actions: [],
  ...overrides,
});

describe('computeMatchLength', () => {
  it('formats sub-minute durations in seconds', () => {
    const game = makeGame({
      startTime: '2025-05-04T15:00:00.000Z',
      endTime: '2025-05-04T15:00:42.000Z',
    });
    expect(computeMatchLength(game)).toBe('42s');
  });

  it('clamps zero duration to "1s" so test/short games never read as missing', () => {
    const game = makeGame({
      startTime: '2025-05-04T15:00:00.000Z',
      endTime: '2025-05-04T15:00:00.000Z',
    });
    expect(computeMatchLength(game)).toBe('1s');
  });

  it('formats sub-hour durations in whole minutes', () => {
    const game = makeGame({
      startTime: '2025-05-04T15:00:00.000Z',
      endTime: '2025-05-04T15:23:00.000Z',
    });
    expect(computeMatchLength(game)).toBe('23m');
  });

  it('formats multi-hour durations as "Nh Nm"', () => {
    const game = makeGame({
      startTime: '2025-05-04T15:00:00.000Z',
      endTime: '2025-05-04T16:35:00.000Z',
    });
    expect(computeMatchLength(game)).toBe('1h 35m');
  });

  it('returns "—" for completed legacy games with no endTime', () => {
    // Pre-time-tracking-columns games: only `date` is set. We genuinely
    // don't know how long the game took — surface that honestly rather
    // than rendering a misleading "0h 0m".
    const game = makeGame({
      completed: true,
      startTime: undefined,
      endTime: undefined,
    });
    expect(computeMatchLength(game)).toBe('—');
  });

  it('measures live elapsed time for in-progress games', () => {
    // Freeze "now" so the assertion is deterministic.
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-05-04T15:30:00.000Z'));

    const game = makeGame({
      completed: false,
      startTime: '2025-05-04T15:25:00.000Z',
      endTime: undefined,
    });
    expect(computeMatchLength(game)).toBe('5m');
  });

  it('falls back to game.date when startTime is missing', () => {
    const game = makeGame({
      date: '2025-05-04T15:00:00.000Z',
      startTime: undefined,
      endTime: '2025-05-04T15:12:00.000Z',
    });
    expect(computeMatchLength(game)).toBe('12m');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  beforeEach(() => {
    vi.useRealTimers();
  });
});
