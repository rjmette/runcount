import { describe, expect, test } from 'vitest';

import { replayActions } from './replayActions';

import type { GameAction } from '../../../types/game';

const timestamp = new Date('2026-07-02T12:00:00.000Z');

const replay = (actions: GameAction[]) =>
  replayActions({
    players: ['Alice', 'Bob'],
    playerTargetScores: { Alice: 150, Bob: 150 },
    breakingPlayerId: 0,
    actions,
  });

const foul = (overrides: Partial<GameAction> = {}): GameAction => ({
  type: 'foul',
  playerId: 0,
  value: -1,
  timestamp,
  ballsOnTable: 15,
  ...overrides,
});

const miss = (playerId: number): GameAction => ({
  type: 'miss',
  playerId,
  value: 0,
  timestamp,
  ballsOnTable: 15,
});

describe('replayActions', () => {
  test('replays a two-point opening break foul without advancing consecutive fouls', () => {
    const state = replay([
      foul({
        value: -2,
        ballsOnTable: 14,
        isBreakFoul: true,
        reBreak: false,
      }),
    ]);

    expect(state.playerData[0].score).toBe(-1);
    expect(state.playerData[0].fouls).toBe(1);
    expect(state.playerData[0].consecutiveFouls).toBe(0);
    expect(state.activePlayerIndex).toBe(0);
    expect(state.currentInning).toBe(1);
  });

  test('replays a one-point break scratch as a consecutive standard foul', () => {
    const state = replay([
      foul({
        value: -1,
        isBreakFoul: true,
        reBreak: false,
      }),
    ]);

    expect(state.playerData[0].score).toBe(-1);
    expect(state.playerData[0].fouls).toBe(1);
    expect(state.playerData[0].consecutiveFouls).toBe(1);
    expect(state.activePlayerIndex).toBe(0);
  });

  test('uses recorded reBreak metadata to apply the automatic three-foul penalty', () => {
    const state = replay([foul(), miss(1), foul(), miss(1), foul({ reBreak: true })]);

    expect(state.playerData[0].score).toBe(-18);
    expect(state.playerData[0].fouls).toBe(3);
    expect(state.playerData[0].consecutiveFouls).toBe(0);
    expect(state.ballsOnTable).toBe(15);
    expect(state.activePlayerIndex).toBe(0);
    expect(state.playerNeedsReBreak).toBe(0);
  });

  test('honors manual three-foul reBreak actions even below two prior fouls', () => {
    const state = replay([foul({ reBreak: true })]);

    expect(state.playerData[0].score).toBe(-16);
    expect(state.playerData[0].fouls).toBe(1);
    expect(state.playerData[0].consecutiveFouls).toBe(0);
    expect(state.activePlayerIndex).toBe(0);
    expect(state.playerNeedsReBreak).toBe(0);
  });

  test('does not infer a three-foul penalty for a recorded manual regular override', () => {
    const state = replay([foul(), miss(1), foul(), miss(1), foul({ reBreak: false })]);

    expect(state.playerData[0].score).toBe(-3);
    expect(state.playerData[0].fouls).toBe(3);
    expect(state.playerData[0].consecutiveFouls).toBe(1);
    expect(state.playerNeedsReBreak).toBeNull();
    expect(state.activePlayerIndex).toBe(1);
  });

  test('advances turns only for non-break and non-rebreak terminal actions', () => {
    expect(replay([foul({ isBreakFoul: true })]).activePlayerIndex).toBe(0);
    expect(replay([foul({ reBreak: true })]).activePlayerIndex).toBe(0);

    const state = replay([foul(), foul({ playerId: 1 })]);

    expect(state.activePlayerIndex).toBe(0);
    expect(state.currentInning).toBe(2);
    expect(state.playerData[0].innings).toBe(2);
    expect(state.playerData[1].innings).toBe(1);
  });
});
