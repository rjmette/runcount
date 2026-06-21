/**
 * Scoring-rule tests for 14.1 Continuous (Straight Pool).
 *
 * These tests validate the engine against the WPA "Rules of Play" — Section 4,
 * "14.1 Continuous Pool" (Effective 2025-06-27). Each test cites the rule it
 * checks so the scoring engine stays anchored to the official ruleset.
 *
 * See: https://wpapool.com/rules-of-play/
 */
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
    targetScore: 150,
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
    targetScore: 150,
  },
];

function setup(overrides: Partial<Parameters<typeof useGameActions>[0]> = {}) {
  let players = JSON.parse(JSON.stringify(basePlayers)) as Player[];
  let actions: GameAction[] = [];

  const props = {
    playerData: players,
    activePlayerIndex: 0,
    currentRun: 0,
    ballsOnTable: 15,
    actions,
    gameId: 'rules-game',
    currentInning: 1,
    persistGame: vi.fn(),
    setPlayerData: (p: Player[]) => {
      players = p;
    },
    setActions: (a: GameAction[]) => {
      actions = a;
    },
    setBallsOnTable: vi.fn(),
    setCurrentRun: vi.fn(),
    setActivePlayerIndex: vi.fn(),
    setCurrentInning: vi.fn(),
    setGameWinner: vi.fn(),
    setShowEndGameModal: vi.fn(),
    setPlayerNeedsReBreak: vi.fn(),
    setShowAlertModal: vi.fn(),
    setAlertMessage: vi.fn(),
    setIsUndoEnabled: vi.fn(),
    playerNeedsReBreak: null,
    setMatchEndTime: vi.fn(),
    setTurnStartTime: vi.fn(),
    ...overrides,
  } as any;

  const { result } = renderHook(() => useGameActions(props));
  return {
    result,
    props,
    get players() {
      return players;
    },
    get actions() {
      return actions;
    },
  };
}

const priorScore = (playerId = 0): GameAction[] => [
  { type: 'score', playerId, value: 5, timestamp: new Date() } as GameAction,
];

describe('WPA 14.1 scoring rules', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  // WPA 4.7 — "The shooter scores one point for legally pocketing a called
  // shot. Each additional ball pocketed on such a shot also counts one point."
  test('4.7: awards one point per ball pocketed', () => {
    const { result, players } = setup({ ballsOnTable: 15 });

    act(() => {
      // 15 on table, 5 remain after the run => 10 balls pocketed
      result.current.handleAddScore(0, 5);
    });

    expect(players[0].score).toBe(10);
  });

  // WPA 4.9 — "If the shooter commits a standard foul, a point is subtracted
  // from his score..."
  test('4.9: a standard foul subtracts one point', () => {
    const { result, players } = setup({ actions: priorScore() });
    players[0].score = 7;

    act(() => {
      // Mid-game (not a break), no balls pocketed: -1 standard foul
      result.current.handleAddFoul(15);
    });

    expect(players[0].score).toBe(6);
    expect(players[0].fouls).toBe(1);
    expect(players[0].consecutiveFouls).toBe(1);
  });

  // WPA 4.3(b) / 4.10 — an illegal opening break is a breaking foul penalized
  // by the loss of two points.
  test('4.10: an illegal break is a two-point breaking foul', () => {
    const { result, players } = setup();

    act(() => {
      // First action of the game => opening break; -2 illegal break
      result.current.handleAddFoul(15, 2);
    });

    expect(players[0].score).toBe(-2);
    expect(players[0].fouls).toBe(1);
  });

  // WPA 6.1 (a standard foul under 4.9) — a scratch on an otherwise legal break
  // is only a one-point standard foul, not the two-point breaking foul.
  test('4.9/6.1: a scratch on a legal break costs one point', () => {
    const { result, players } = setup();

    act(() => {
      result.current.handleAddFoul(15, 1);
    });

    expect(players[0].score).toBe(-1);
  });

  // WPA 4.7 — "Scores may be negative due to penalties from fouls."
  test('4.7: scores may go negative', () => {
    const { result, players } = setup({ actions: priorScore() });
    players[0].score = 0;

    act(() => {
      result.current.handleAddFoul(15);
    });

    expect(players[0].score).toBe(-1);
  });

  // WPA 4.11 — three consecutive (standard) fouls: the third foul's point is
  // subtracted, then an additional 15-point penalty; the consecutive-foul count
  // resets, all 15 balls are re-racked, and the offender re-breaks.
  test('4.11: three consecutive standard fouls add a 15-point penalty and force a re-break', () => {
    const { result, players, props } = setup({ actions: priorScore() });
    players[0].score = 20;
    players[0].consecutiveFouls = 2;

    act(() => {
      result.current.handleAddFoul(15);
    });

    // 20 - 1 (third foul) - 15 (penalty) = 4
    expect(players[0].score).toBe(4);
    expect(players[0].consecutiveFouls).toBe(0);
    expect(props.setBallsOnTable).toHaveBeenCalledWith(15);
    expect(props.setPlayerNeedsReBreak).toHaveBeenCalledWith(0);
    expect(props.setAlertMessage).toHaveBeenCalledWith(
      expect.stringContaining('three consecutive fouls'),
    );
  });

  // WPA 4.11 — "only standard fouls are counted, so a breaking foul does not
  // count as one of the three fouls."
  test('4.11: a breaking foul does not count toward three consecutive fouls', () => {
    const { result, players, props } = setup();
    players[0].consecutiveFouls = 2;

    act(() => {
      // Illegal break (-2) while already on two fouls must NOT trigger the penalty
      result.current.handleAddFoul(15, 2);
    });

    expect(players[0].score).toBe(-2); // just the breaking foul, no -15
    expect(players[0].consecutiveFouls).toBe(2); // unchanged, not advanced
    expect(props.setPlayerNeedsReBreak).not.toHaveBeenCalled();
    expect(props.setAlertMessage).not.toHaveBeenCalledWith(
      expect.stringContaining('three consecutive fouls'),
    );
  });

  // WPA 4.11 — a one-point scratch on a legal break IS a standard foul, so it
  // does count toward the three-foul rule.
  test('4.11: a one-point break scratch still counts toward consecutive fouls', () => {
    const { result, players } = setup();
    players[0].consecutiveFouls = 1;

    act(() => {
      result.current.handleAddFoul(15, 1);
    });

    expect(players[0].consecutiveFouls).toBe(2);
  });
});
