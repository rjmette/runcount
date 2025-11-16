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
        setGameWinner,
        setShowEndGameModal,
        setPlayerNeedsReBreak,
        setMatchEndTime,
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

  test('handleAddScore updates score and high run correctly', () => {
    const { result, players, mocks } = setup({ currentRun: 5 });

    act(() => {
      result.current.handleAddScore(1, 10); // 5 balls pocketed = 5 points
    });

    expect(mocks.setCurrentRun).toHaveBeenCalledWith(10); // currentRun 5 + 5 pocketed
    expect(players[0].score).toBe(5); // 5 points added
    expect(players[0].highRun).toBe(10); // new high run of 10
    expect(players[0].consecutiveFouls).toBe(0); // reset fouls
  });

  test('handleAddFoul applies default break foul penalty (-2 points)', () => {
    const { result, players } = setup();

    act(() => {
      result.current.handleAddFoul(14);
    });

    // Break foul logic: adds balls pocketed (1) then subtracts break foul penalty (-2) = -1 total
    expect(players[0].score).toBe(-1); // 1 ball pocketed - 2 break foul penalty = -1
    expect(players[0].fouls).toBe(1);
    expect(players[0].consecutiveFouls).toBe(1);
  });

  test('handleAddFoul applies 1-point break foul penalty when specified', () => {
    const { result, players } = setup();

    act(() => {
      result.current.handleAddFoul(14, 1);
    });

    // Break foul with 1-point penalty: adds balls pocketed (1) then subtracts 1-point penalty = 0 total
    expect(players[0].score).toBe(0); // 1 ball pocketed - 1 break foul penalty = 0
    expect(players[0].fouls).toBe(1);
    expect(players[0].consecutiveFouls).toBe(1);
  });

  test('handleAddFoul applies 2-point break foul penalty when specified', () => {
    const { result, players } = setup();

    act(() => {
      result.current.handleAddFoul(14, 2);
    });

    // Break foul with 2-point penalty: adds balls pocketed (1) then subtracts 2-point penalty = -1 total
    expect(players[0].score).toBe(-1); // 1 ball pocketed - 2 break foul penalty = -1
    expect(players[0].fouls).toBe(1);
    expect(players[0].consecutiveFouls).toBe(1);
  });

  test('handleAddFoul applies regular foul penalty (-1 point)', () => {
    const { result, players } = setup({ 
      actions: [{ id: '1', type: 'score', playerId: 0, value: 5, timestamp: new Date() }] // Not first action
    });

    act(() => {
      result.current.handleAddFoul(14);
    });

    // Regular foul: adds balls pocketed (1) then subtracts regular foul penalty (-1) = 0 total
    expect(players[0].score).toBe(0); // 1 ball pocketed - 1 regular foul penalty = 0
    expect(players[0].fouls).toBe(1);
    expect(players[0].consecutiveFouls).toBe(1);
  });

  test('handleAddFoul handles three consecutive fouls with 15-point penalty', () => {
    const { result, players, mocks } = setup();
    
    // Set player to have 2 consecutive fouls already
    players[0].consecutiveFouls = 2;

    act(() => {
      result.current.handleAddFoul(14);
    });

    // Three consecutive fouls: adds balls pocketed (1) - break foul (-2) - three foul penalty (-15) = -16
    expect(players[0].score).toBe(-16); // 1 ball pocketed - 2 break foul - 15 three consecutive fouls = -16
    expect(players[0].consecutiveFouls).toBe(0); // reset after penalty
    expect(mocks.setShowAlertModal).toHaveBeenCalledWith(true);
    expect(mocks.setAlertMessage).toHaveBeenCalledWith(
      expect.stringContaining('three consecutive fouls')
    );
  });

  test('handleAddSafety switches player and adds safety count', () => {
    const { result, players, mocks } = setup();

    act(() => {
      result.current.handleAddSafety(13);
    });

    expect(players[0].safeties).toBe(1);
    expect(players[0].consecutiveFouls).toBe(0);
    expect(mocks.setActivePlayerIndex).toHaveBeenCalledWith(1); // switch to player 1
    expect(mocks.setCurrentRun).toHaveBeenCalledWith(0); // reset run
  });

  test('handleAddMiss switches player and adds miss count', () => {
    const { result, players, mocks } = setup();

    act(() => {
      result.current.handleAddMiss(13);
    });

    expect(players[0].missedShots).toBe(1);
    expect(players[0].consecutiveFouls).toBe(0);
    expect(mocks.setActivePlayerIndex).toHaveBeenCalledWith(1); // switch to player 1
    expect(mocks.setCurrentRun).toHaveBeenCalledWith(0); // reset run
  });

  test('advances inning when cycling back to first player', () => {
    const { result, players, mocks } = setup({ activePlayerIndex: 1 }); // Bob active

    act(() => {
      result.current.handleAddMiss(13);
    });

    expect(mocks.setActivePlayerIndex).toHaveBeenCalledWith(0); // back to Alice
    expect(mocks.setCurrentInning).toHaveBeenCalledWith(2); // advance inning
    expect(players[0].innings).toBe(2); // Alice gets inning 2
  });

  test('clears re-break status when player scores', () => {
    const { result, mocks } = setup({ playerNeedsReBreak: 0 });

    act(() => {
      result.current.handleAddScore(1, 10);
    });

    expect(mocks.setPlayerNeedsReBreak).toHaveBeenCalledWith(null);
  });

  test('triggers game end when player reaches target score via safety', () => {
    const { result, players, mocks } = setup({ 
      actions: [{ id: '1', type: 'score', playerId: 0, value: 5, timestamp: new Date() }] // Has prior score actions
    });
    players[0].score = 9; // Set to 9, will add 1 ball pocketed to reach 10

    act(() => {
      result.current.handleAddSafety(14); // 1 ball pocketed (15-14=1) + score 9 = 10 total
    });

    expect(players[0].score).toBe(10); // Should reach target (9 + 1 pocketed = 10)
    expect(mocks.setGameWinner).toHaveBeenCalledWith(expect.objectContaining({ name: 'Alice' }));
    expect(mocks.setShowEndGameModal).toHaveBeenCalledWith(true);
    expect(mocks.setMatchEndTime).toHaveBeenCalledWith(expect.any(Date));
  });

  test('adds balls pocketed when no prior score actions exist', () => {
    const { result, players } = setup({ currentRun: 3 });

    act(() => {
      result.current.handleAddSafety(12); // 3 balls pocketed
    });

    expect(players[0].score).toBe(6); // currentRun 3 + ballsPocketed 3
  });

  test('adds only balls pocketed when prior score actions exist', () => {
    const { result, players } = setup({ 
      currentRun: 3,
      actions: [{ id: '1', type: 'score', playerId: 0, value: 2, timestamp: new Date() }]
    });

    act(() => {
      result.current.handleAddSafety(12); // 3 balls pocketed
    });

    expect(players[0].score).toBe(3); // only ballsPocketed 3, not currentRun
  });

  test('shows two-foul warning after second consecutive foul', () => {
    const { result, players, mocks } = setup();
    players[0].consecutiveFouls = 1; // Already has one foul

    act(() => {
      result.current.handleAddFoul(14);
    });

    expect(players[0].consecutiveFouls).toBe(2);
    expect(mocks.setAlertMessage).toHaveBeenCalledWith(
      expect.stringContaining('two consecutive fouls')
    );
    expect(mocks.setShowAlertModal).toHaveBeenCalledWith(true);
  });

  test('handles re-break player correctly for all action types', () => {
    const { result, mocks } = setup({ playerNeedsReBreak: 0 });

    // Test each action type clears re-break status
    act(() => {
      result.current.handleAddSafety(13);
    });
    expect(mocks.setPlayerNeedsReBreak).toHaveBeenCalledWith(null);

    // Reset mock
    mocks.setPlayerNeedsReBreak.mockClear();

    act(() => {
      result.current.handleAddMiss(13);
    });
    expect(mocks.setPlayerNeedsReBreak).toHaveBeenCalledWith(null);
  });
});
