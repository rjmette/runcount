import { calculatePlayerStats } from './stats';

import type { GameAction, Player } from '../../types/game';

const makePlayer = (overrides: Partial<Player> = {}): Player => ({
  id: 0,
  name: 'Alice',
  score: 20,
  innings: 4,
  highRun: 8,
  fouls: 0,
  consecutiveFouls: 0,
  safeties: 1,
  missedShots: 1,
  targetScore: 100,
  ...overrides,
});

const makeAction = (
  action: Partial<GameAction> & Pick<GameAction, 'type' | 'playerId' | 'value'>,
): GameAction => ({
  timestamp: new Date('2026-03-26T00:00:00Z'),
  ...action,
});

describe('calculatePlayerStats', () => {
  test('treats a safety followed by an opponent miss as successful', () => {
    const player = makePlayer({ safeties: 1 });
    const actions = [
      makeAction({ type: 'safety', playerId: 0, value: 0 }),
      makeAction({ type: 'miss', playerId: 1, value: 0 }),
    ];

    expect(calculatePlayerStats(player, actions)).toMatchObject({
      safetyEfficiency: 100,
      successfulSafeties: 1,
      failedSafeties: 0,
      offensiveBPI: '6.67',
    });
  });

  test('treats a safety followed by continued opponent offense as failed', () => {
    const player = makePlayer({ safeties: 1 });
    const actions = [
      makeAction({ type: 'safety', playerId: 0, value: 0 }),
      makeAction({ type: 'score', playerId: 1, value: 3 }),
    ];

    expect(calculatePlayerStats(player, actions)).toMatchObject({
      safetyEfficiency: 0,
      successfulSafeties: 0,
      failedSafeties: 1,
      offensiveBPI: '6.67',
    });
  });

  test('counts final safeties against offensive innings even with no next action', () => {
    const player = makePlayer({ safeties: 2 });
    const actions = [
      makeAction({ type: 'safety', playerId: 0, value: 0 }),
      makeAction({ type: 'safety', playerId: 1, value: 0 }),
      makeAction({ type: 'score', playerId: 1, value: 4 }),
      makeAction({ type: 'safety', playerId: 0, value: 0 }),
    ];

    expect(calculatePlayerStats(player, actions)).toMatchObject({
      safetyEfficiency: 0,
      successfulSafeties: 0,
      failedSafeties: 1,
      offensiveBPI: '10.00',
    });
  });
});
