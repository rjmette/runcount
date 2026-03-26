import { calculateInningActions } from './calculations';

import type { GameAction, Player } from '../../../types/game';

const makePlayers = (): Player[] => [
  {
    id: 0,
    name: 'Alice',
    score: 0,
    innings: 0,
    highRun: 0,
    fouls: 0,
    consecutiveFouls: 0,
    safeties: 0,
    missedShots: 0,
    targetScore: 100,
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
    targetScore: 100,
  },
];

const makeAction = (
  action: Partial<GameAction> & Pick<GameAction, 'type' | 'playerId' | 'value'>,
): GameAction => ({
  timestamp: new Date('2026-03-26T00:00:00Z'),
  ...action,
});

describe('calculateInningActions', () => {
  test('attributes the first inning to Player 1 when Player 1 breaks', () => {
    const inningActions = calculateInningActions(
      [
        makeAction({
          type: 'miss',
          playerId: 0,
          value: 0,
          ballsOnTable: 15,
        }),
        makeAction({
          type: 'miss',
          playerId: 1,
          value: 0,
          ballsOnTable: 15,
        }),
      ],
      makePlayers(),
    );

    expect(inningActions.map((inning) => inning.playerId)).toEqual([0, 1]);
    expect(inningActions.map((inning) => inning.inningNumber)).toEqual([1, 1]);
  });

  test('attributes the first inning to Player 2 when Player 2 breaks', () => {
    const inningActions = calculateInningActions(
      [
        makeAction({
          type: 'miss',
          playerId: 1,
          value: 0,
          ballsOnTable: 15,
        }),
        makeAction({
          type: 'miss',
          playerId: 0,
          value: 0,
          ballsOnTable: 15,
        }),
        makeAction({
          type: 'safety',
          playerId: 1,
          value: 0,
          ballsOnTable: 15,
        }),
      ],
      makePlayers(),
    );

    expect(inningActions.map((inning) => inning.playerId)).toEqual([1, 0, 1]);
    expect(inningActions.map((inning) => inning.inningNumber)).toEqual([1, 1, 2]);
  });

  test('does not increment the inning when the same player repeats due to re-break', () => {
    const inningActions = calculateInningActions(
      [
        makeAction({
          type: 'foul',
          playerId: 1,
          value: -16,
          ballsOnTable: 15,
          reBreak: true,
        }),
        makeAction({
          type: 'miss',
          playerId: 1,
          value: 0,
          ballsOnTable: 15,
        }),
        makeAction({
          type: 'miss',
          playerId: 0,
          value: 0,
          ballsOnTable: 15,
        }),
      ],
      makePlayers(),
    );

    expect(inningActions.map((inning) => inning.playerId)).toEqual([1, 1, 0]);
    expect(inningActions.map((inning) => inning.inningNumber)).toEqual([1, 1, 1]);
  });
});
