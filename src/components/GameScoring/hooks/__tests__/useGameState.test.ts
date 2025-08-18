import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';
import { useGameState } from '../useGameState';
import type { GameData, Player } from '../../../../types/game';

const makePlayers = (names: string[], targetScores: number[] = []) => {
  return names.map((name, i) => ({
    id: i,
    name,
    score: 0,
    innings: i === 0 ? 1 : 0,
    highRun: 0,
    fouls: 0,
    consecutiveFouls: 0,
    safeties: 0,
    missedShots: 0,
    targetScore: targetScores[i] ?? 100,
  }));
};

describe('useGameState', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
  });

  test('initializes new game when no saved state', () => {
    const saveGameToSupabase = vi.fn();
    const setGameId = vi.fn();

    const { result } = renderHook(() =>
      useGameState({
        players: ['Alice', 'Bob'],
        playerTargetScores: { Alice: 75, Bob: 60 },
        gameId: null,
        setGameId,
        breakingPlayerId: 0,
        getGameState: () => null,
        saveGameToSupabase,
      })
    );

    expect(setGameId).toHaveBeenCalledTimes(1);
    expect(result.current.currentInning).toBe(1);
    expect(result.current.activePlayerIndex).toBe(0);
    expect(result.current.playerData[0].name).toBe('Alice');
  });

  test('restores existing game state including timing and inning', () => {
    const now = new Date();
    const saved: GameData = {
      id: 'game-1',
      date: now.toISOString(),
      players: makePlayers(['Alice', 'Bob'], [75, 60]) as Player[],
      winner_id: null,
      completed: false,
      actions: [],
      startTime: now.toISOString(),
      endTime: undefined,
    };

    const getGameState = () => saved;
    const setGameId = vi.fn();

    const { result } = renderHook(() =>
      useGameState({
        players: ['Alice', 'Bob'],
        playerTargetScores: { Alice: 75, Bob: 60 },
        gameId: 'game-1',
        setGameId,
        breakingPlayerId: 1,
        getGameState,
        saveGameToSupabase: vi.fn(),
      })
    );

    expect(result.current.matchStartTime).not.toBeNull();
    expect(result.current.currentInning).toBe(1);
  });
});
