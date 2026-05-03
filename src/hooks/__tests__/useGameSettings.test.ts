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

    expect(localStorage.getItem('runcount_lastPlayers')).toBe(
      JSON.stringify(['Alice', 'Bob']),
    );
    expect(localStorage.getItem('runcount_lastPlayerTargetScores')).toBe(
      JSON.stringify({ Alice: 75, Bob: 60 }),
    );
    expect(localStorage.getItem('runcount_lastBreakingPlayerId')).toBe('1');
    expect(localStorage.getItem('runcount_lastShotClockSeconds')).toBe('45');

    act(() => {
      result.current.setLastPlayers([]);
      result.current.setLastPlayerTargetScores({});
    });

    expect(localStorage.getItem('runcount_lastPlayers')).toBe(
      JSON.stringify(['Alice', 'Bob']),
    );
    expect(localStorage.getItem('runcount_lastPlayerTargetScores')).toBe(
      JSON.stringify({ Alice: 75, Bob: 60 }),
    );
  });
});
