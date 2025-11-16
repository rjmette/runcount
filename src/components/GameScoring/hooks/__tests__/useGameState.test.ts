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
    // Mock document.getElementById for DOM updates
    document.getElementById = vi.fn().mockReturnValue({
      textContent: '',
    });
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
      }),
    );

    expect(setGameId).toHaveBeenCalledTimes(1);
    expect(result.current.currentInning).toBe(1);
    expect(result.current.activePlayerIndex).toBe(0);
    expect(result.current.playerData[0].name).toBe('Alice');
    expect(result.current.playerData[0].innings).toBe(1);
    expect(result.current.playerData[1].innings).toBe(0);
    expect(result.current.ballsOnTable).toBe(15);
    expect(result.current.currentRun).toBe(0);
    expect(result.current.matchStartTime).not.toBeNull();
    expect(result.current.matchEndTime).toBeNull();
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
      }),
    );

    expect(result.current.matchStartTime).not.toBeNull();
    expect(result.current.currentInning).toBe(1);
    expect(setGameId).not.toHaveBeenCalled(); // Should not generate new ID for existing game
  });

  test('restores game state with actions and calculates current state correctly', () => {
    const now = new Date();
    const actions = [
      {
        id: '1',
        type: 'score',
        playerId: 0,
        value: 5,
        ballsOnTable: 10,
        timestamp: now.toISOString(),
      },
      {
        id: '2',
        type: 'miss',
        playerId: 0,
        value: 0,
        ballsOnTable: 10,
        timestamp: now.toISOString(),
      },
      {
        id: '3',
        type: 'score',
        playerId: 1,
        value: 3,
        ballsOnTable: 7,
        timestamp: now.toISOString(),
      },
    ];

    const saved: GameData = {
      id: 'game-1',
      date: now.toISOString(),
      players: makePlayers(['Alice', 'Bob'], [75, 60]) as Player[],
      winner_id: null,
      completed: false,
      actions,
      startTime: now.toISOString(),
      endTime: undefined,
    };

    const getGameState = () => saved;

    const { result } = renderHook(() =>
      useGameState({
        players: ['Alice', 'Bob'],
        playerTargetScores: { Alice: 75, Bob: 60 },
        gameId: 'game-1',
        setGameId: vi.fn(),
        breakingPlayerId: 0,
        getGameState,
        saveGameToSupabase: vi.fn(),
      }),
    );

    expect(result.current.activePlayerIndex).toBe(1); // Bob is active after Alice's miss
    expect(result.current.currentInning).toBe(1);
    expect(result.current.ballsOnTable).toBe(7); // Last action set balls to 7
    expect(result.current.currentRun).toBe(3); // Bob's current run
    expect(result.current.isUndoEnabled).toBe(true); // Actions exist
  });

  test('handles re-break scenario correctly', () => {
    const now = new Date();
    const actions = [
      {
        id: '1',
        type: 'foul',
        playerId: 0,
        value: -1,
        ballsOnTable: 15,
        reBreak: true,
        timestamp: now.toISOString(),
      },
    ];

    const saved: GameData = {
      id: 'game-1',
      date: now.toISOString(),
      players: makePlayers(['Alice', 'Bob'], [75, 60]) as Player[],
      winner_id: null,
      completed: false,
      actions,
      startTime: now.toISOString(),
      endTime: undefined,
    };

    const getGameState = () => saved;

    const { result } = renderHook(() =>
      useGameState({
        players: ['Alice', 'Bob'],
        playerTargetScores: { Alice: 75, Bob: 60 },
        gameId: 'game-1',
        setGameId: vi.fn(),
        breakingPlayerId: 0,
        getGameState,
        saveGameToSupabase: vi.fn(),
      }),
    );

    expect(result.current.playerNeedsReBreak).toBe(0); // Alice needs re-break
    expect(result.current.activePlayerIndex).toBe(0); // Alice stays active for re-break
  });

  test('advances inning when turn cycles back to first player', () => {
    const now = new Date();
    const actions = [
      {
        id: '1',
        type: 'miss',
        playerId: 0,
        value: 0,
        ballsOnTable: 15,
        timestamp: now.toISOString(),
      },
      {
        id: '2',
        type: 'miss',
        playerId: 1,
        value: 0,
        ballsOnTable: 15,
        timestamp: now.toISOString(),
      },
    ];

    const saved: GameData = {
      id: 'game-1',
      date: now.toISOString(),
      players: makePlayers(['Alice', 'Bob'], [75, 60]) as Player[],
      winner_id: null,
      completed: false,
      actions,
      startTime: now.toISOString(),
      endTime: undefined,
    };

    const getGameState = () => saved;

    const { result } = renderHook(() =>
      useGameState({
        players: ['Alice', 'Bob'],
        playerTargetScores: { Alice: 75, Bob: 60 },
        gameId: 'game-1',
        setGameId: vi.fn(),
        breakingPlayerId: 0,
        getGameState,
        saveGameToSupabase: vi.fn(),
      }),
    );

    expect(result.current.currentInning).toBe(2); // Should advance to inning 2
    expect(result.current.activePlayerIndex).toBe(0); // Back to Alice
  });

  test('updates DOM element when current run changes', () => {
    const mockElement = { textContent: '' };
    document.getElementById = vi.fn().mockReturnValue(mockElement);

    const { result } = renderHook(() =>
      useGameState({
        players: ['Alice', 'Bob'],
        playerTargetScores: { Alice: 75, Bob: 60 },
        gameId: null,
        setGameId: vi.fn(),
        breakingPlayerId: 0,
        getGameState: () => null,
        saveGameToSupabase: vi.fn(),
      }),
    );

    // Trigger a state change that would update current run
    act(() => {
      result.current.setCurrentRun(5);
    });

    expect(document.getElementById).toHaveBeenCalledWith('current-run');
    expect(mockElement.textContent).toBe('5');
  });

  test('does not initialize twice with ref guard', () => {
    const saveGameToSupabase = vi.fn();
    const setGameId = vi.fn();

    const { rerender } = renderHook(() =>
      useGameState({
        players: ['Alice', 'Bob'],
        playerTargetScores: { Alice: 75, Bob: 60 },
        gameId: null,
        setGameId,
        breakingPlayerId: 0,
        getGameState: () => null,
        saveGameToSupabase,
      }),
    );

    // Force a re-render
    rerender();

    // Should only initialize once
    expect(setGameId).toHaveBeenCalledTimes(1);
    expect(saveGameToSupabase).toHaveBeenCalledTimes(1);
  });
});
