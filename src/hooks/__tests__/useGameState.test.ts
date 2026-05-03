import { act, renderHook } from '@testing-library/react';
import { vi } from 'vitest';

import { createMockGameData, createMockPlayer } from '../../testing/factories';
import { useGameState } from '../useGameState';

const getGameState = vi.fn();
const clearGameState = vi.fn();
let hasActiveGame = false;

vi.mock('../../context/GamePersistContext', () => ({
  useGamePersist: () => ({
    getGameState,
    clearGameState,
    hasActiveGame,
  }),
}));

describe('useGameState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hasActiveGame = false;
    getGameState.mockReturnValue(null);
  });

  test('initializes to setup when there is no saved game', () => {
    const { result } = renderHook(() => useGameState());

    expect(result.current.gameState).toBe('setup');
    expect(result.current.players).toEqual([]);
    expect(result.current.currentGameId).toBeNull();
  });

  test('restores an incomplete saved game into scoring state', () => {
    getGameState.mockReturnValue(
      createMockGameData({
        id: 'saved-game',
        completed: false,
        players: [
          createMockPlayer({ id: 0, name: 'Alice', targetScore: 75 }),
          createMockPlayer({ id: 1, name: 'Bob', targetScore: 60 }),
        ],
        startTime: '2026-01-01T00:00:00.000Z',
        turnStartTime: '2026-01-01T00:01:00.000Z',
      }),
    );

    const { result } = renderHook(() => useGameState());

    expect(result.current.gameState).toBe('scoring');
    expect(result.current.players).toEqual(['Alice', 'Bob']);
    expect(result.current.playerTargetScores).toEqual({ Alice: 75, Bob: 60 });
    expect(result.current.currentGameId).toBe('saved-game');
    expect(result.current.matchStartTime?.toISOString()).toBe('2026-01-01T00:00:00.000Z');
    expect(result.current.turnStartTime?.toISOString()).toBe('2026-01-01T00:01:00.000Z');
  });

  test('clears completed active saved games and stays on setup', () => {
    hasActiveGame = true;
    getGameState.mockReturnValue(createMockGameData({ completed: true }));

    const { result } = renderHook(() => useGameState());

    expect(result.current.gameState).toBe('setup');
    expect(clearGameState).toHaveBeenCalledTimes(1);
  });

  test('transitions through setup, scoring, statistics, and history handlers', () => {
    const onSaveSettings = vi.fn();
    const { result } = renderHook(() => useGameState());

    act(() => {
      result.current.handleStartGame(
        ['Alice', 'Bob'],
        { Alice: 75, Bob: 60 },
        1,
        onSaveSettings,
      );
    });

    expect(result.current.gameState).toBe('scoring');
    expect(result.current.breakingPlayerId).toBe(1);
    expect(onSaveSettings).toHaveBeenCalledWith(
      ['Alice', 'Bob'],
      { Alice: 75, Bob: 60 },
      1,
    );

    act(() => {
      result.current.handleFinishGame();
    });

    expect(result.current.gameState).toBe('statistics');

    act(() => {
      result.current.handleViewHistory();
    });

    expect(result.current.gameState).toBe('history');

    act(() => {
      result.current.handleStartNewGame();
    });

    expect(result.current.gameState).toBe('setup');
    expect(result.current.currentGameId).toBeNull();
  });

  test('responds to switchToHistory window events', () => {
    const { result } = renderHook(() => useGameState());

    act(() => {
      window.dispatchEvent(new Event('switchToHistory'));
    });

    expect(result.current.gameState).toBe('history');
  });
});
