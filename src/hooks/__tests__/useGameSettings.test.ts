import { act, renderHook } from '@testing-library/react';

import { DEFAULT_SHOT_CLOCK_SECONDS } from '../../constants/gameSettings';
import { useGameSettings } from '../useGameSettings';

describe('useGameSettings', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('initializes default settings when localStorage is empty', () => {
    const { result } = renderHook(() => useGameSettings());

    expect(result.current.lastPlayers).toEqual([]);
    expect(result.current.lastPlayerTargetScores).toEqual({});
    expect(result.current.lastBreakingPlayerId).toBe(0);
    expect(result.current.lastShotClockSeconds).toBe(DEFAULT_SHOT_CLOCK_SECONDS);
  });

  test('restores saved settings from localStorage', () => {
    localStorage.setItem('runcount_lastPlayers', JSON.stringify(['Alice', 'Bob']));
    localStorage.setItem(
      'runcount_lastPlayerTargetScores',
      JSON.stringify({ Alice: 75, Bob: 60 }),
    );
    localStorage.setItem('runcount_lastBreakingPlayerId', JSON.stringify(1));
    localStorage.setItem('runcount_lastShotClockSeconds', JSON.stringify(null));

    const { result } = renderHook(() => useGameSettings());

    expect(result.current.lastPlayers).toEqual(['Alice', 'Bob']);
    expect(result.current.lastPlayerTargetScores).toEqual({ Alice: 75, Bob: 60 });
    expect(result.current.lastBreakingPlayerId).toBe(1);
    expect(result.current.lastShotClockSeconds).toBeNull();
  });

  test('persists updates while preserving empty players and target score guards', () => {
    const { result } = renderHook(() => useGameSettings());

    act(() => {
      result.current.setLastPlayers(['Alice', 'Bob']);
      result.current.setLastPlayerTargetScores({ Alice: 75, Bob: 60 });
      result.current.setLastBreakingPlayerId(1);
      result.current.setLastShotClockSeconds(45);
    });

    // Values are now persisted inside a versioned envelope.
    expect(JSON.parse(localStorage.getItem('runcount_lastPlayers') as string)).toEqual({
      v: 1,
      data: ['Alice', 'Bob'],
    });
    expect(
      JSON.parse(localStorage.getItem('runcount_lastPlayerTargetScores') as string),
    ).toEqual({ v: 1, data: { Alice: 75, Bob: 60 } });
    expect(
      JSON.parse(localStorage.getItem('runcount_lastBreakingPlayerId') as string),
    ).toEqual({ v: 1, data: 1 });
    expect(
      JSON.parse(localStorage.getItem('runcount_lastShotClockSeconds') as string),
    ).toEqual({ v: 1, data: 45 });

    act(() => {
      result.current.setLastPlayers([]);
      result.current.setLastPlayerTargetScores({});
    });

    expect(JSON.parse(localStorage.getItem('runcount_lastPlayers') as string)).toEqual({
      v: 1,
      data: ['Alice', 'Bob'],
    });
    expect(
      JSON.parse(localStorage.getItem('runcount_lastPlayerTargetScores') as string),
    ).toEqual({ v: 1, data: { Alice: 75, Bob: 60 } });
  });

  test('falls back to defaults instead of crashing on corrupt localStorage data', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    localStorage.setItem('runcount_lastPlayers', '{not valid json');
    localStorage.setItem('runcount_lastPlayerTargetScores', '"a string, not a record"');
    localStorage.setItem('runcount_lastBreakingPlayerId', 'NaN');
    localStorage.setItem('runcount_lastShotClockSeconds', '{"unexpected":"object"}');

    const { result } = renderHook(() => useGameSettings());

    expect(result.current.lastPlayers).toEqual([]);
    expect(result.current.lastPlayerTargetScores).toEqual({});
    expect(result.current.lastBreakingPlayerId).toBe(0);
    expect(result.current.lastShotClockSeconds).toBe(DEFAULT_SHOT_CLOCK_SECONDS);

    // Corrupt entries are cleared on read.
    expect(localStorage.getItem('runcount_lastPlayers')).toBeNull();
    warn.mockRestore();
  });
});
