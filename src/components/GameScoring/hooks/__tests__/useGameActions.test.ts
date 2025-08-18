import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';
import { useGameActions } from '../useGameActions';
import type { GameAction, Player } from '../../../../types/game';

const basePlayers: Player[] = [
  {
    id: 0,
    name: 'Alice',
    score: 0,
    innings: 1,
    highRun: 0,
    fouls: 0,
    consecutiveFouls: 0,
    safeties: 0,
    missedShots: 0,
    targetScore: 10,
  },
  {
    id: 1,
    name: 'Bob',
    score: 0,
    innings: 0,
    highRun: 0,
    fouls: 0,
    consecutiveFouls: 0,
    safeties: 0,
    missedShots: 0,
    targetScore: 10,
  },
];

describe('useGameActions', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  function setup(
    overrides: Partial<Parameters<typeof useGameActions>[0]> = {}
  ) {
    let players = JSON.parse(JSON.stringify(basePlayers)) as Player[];
    let actions: GameAction[] = [];
    let ballsOnTable = 15;

    const setPlayerData = (p: Player[]) => {
      players = p;
    };
    const setActions = (a: GameAction[]) => {
      actions = a;
    };
    const setBallsOnTable = (n: number) => {
      ballsOnTable = n;
    };
    const setCurrentRun = vi.fn();
    const setActivePlayerIndex = vi.fn();
    const setCurrentInning = vi.fn();
    const setGameWinner = vi.fn();
    const setShowEndGameModal = vi.fn();
    const setPlayerNeedsReBreak = vi.fn();
    const setShowAlertModal = vi.fn();
    const setAlertMessage = vi.fn();
    const setIsUndoEnabled = vi.fn();
    const setMatchEndTime = vi.fn();

    const props = {
      playerData: players,
      activePlayerIndex: 0,
      currentRun: 0,
      ballsOnTable,
      actions,
      gameId: 'game-1',
      currentInning: 1,
      saveGameToSupabase: vi.fn(),
      setPlayerData,
      setActions,
      setBallsOnTable,
      setCurrentRun,
      setActivePlayerIndex,
      setCurrentInning,
      setGameWinner,
      setShowEndGameModal,
      setPlayerNeedsReBreak,
      setShowAlertModal,
      setAlertMessage,
      setIsUndoEnabled,
      playerNeedsReBreak: null,
      setMatchEndTime,
      ...overrides,
    } as any;

    const { result } = renderHook(() => useGameActions(props));
    return {
      result,
      get players() {
        return players;
      },
      get actions() {
        return actions;
      },
      mocks: {
        setCurrentRun,
        setActivePlayerIndex,
        setCurrentInning,
        setShowAlertModal,
        setAlertMessage,
      },
    };
  }

  test('handleAddScore requires balls-on-table input then applies score', () => {
    const { result, players, actions } = setup();

    const first = result.current.handleAddScore(1);
    expect(first).toEqual({ needsBOTInput: true, action: 'newrack' });

    const second = result.current.handleAddScore(1, 10);
    expect(second).toEqual({ needsBOTInput: false });
  });

  test('handleAddFoul marks break foul when first action and applies -2', () => {
    const { result } = setup();

    const first = result.current.handleAddFoul();
    expect(first).toEqual({ needsBOTInput: true, action: 'foul' });

    const second = result.current.handleAddFoul(14);
    expect(second).toEqual({ needsBOTInput: false });
  });
});
