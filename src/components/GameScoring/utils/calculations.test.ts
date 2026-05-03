import { createMockGameAction, createMockPlayer } from '../../../testing/factories';

import {
  calculateGameDuration,
  calculatePlayerStats,
  calculatePointsInInning,
} from './calculations';

describe('GameScoring calculations', () => {
  describe('calculatePlayerStats', () => {
    test('calculates BPI and shooting percentage from player totals', () => {
      const stats = calculatePlayerStats(
        createMockPlayer({
          id: 1,
          score: 30,
          innings: 6,
          safeties: 2,
          missedShots: 3,
          fouls: 1,
        }),
        [],
      );

      expect(stats).toMatchObject({
        bpi: '5.00',
        shootingPercentage: 83,
        safetyEfficiency: 0,
      });
    });

    test('counts safeties followed by opponent misses or fouls as successful', () => {
      const stats = calculatePlayerStats(
        createMockPlayer({ id: 1, score: 10, innings: 4, safeties: 2 }),
        [
          createMockGameAction({ type: 'safety', playerId: 1, value: 0 }),
          createMockGameAction({ type: 'miss', playerId: 2, value: 0 }),
          createMockGameAction({ type: 'safety', playerId: 1, value: 0 }),
          createMockGameAction({ type: 'foul', playerId: 2, value: -1 }),
        ],
      );

      expect(stats.successfulSafeties).toBe(2);
      expect(stats.safetyEfficiency).toBe(100);
      expect(stats.offensiveBPI).toBe('5.00');
    });

    test('handles zero innings and zero shot attempts without NaN values', () => {
      const stats = calculatePlayerStats(
        createMockPlayer({
          score: 0,
          innings: 0,
          safeties: 0,
          missedShots: 0,
          fouls: 0,
        }),
        [],
      );

      expect(stats.bpi).toBe('0.00');
      expect(stats.shootingPercentage).toBe(0);
      expect(stats.safetyEfficiency).toBe(0);
    });
  });

  describe('calculateGameDuration', () => {
    test('returns N/A for games with no actions', () => {
      expect(calculateGameDuration([])).toBe('N/A');
    });

    test('formats elapsed minutes and seconds across action timestamps', () => {
      expect(
        calculateGameDuration([
          createMockGameAction({ timestamp: new Date('2026-01-01T00:00:00Z') }),
          createMockGameAction({ timestamp: new Date('2026-01-01T00:03:42Z') }),
        ]),
      ).toBe('3m 42s');
    });
  });

  describe('calculatePointsInInning', () => {
    test('adds the current run when the player has no prior scoring action', () => {
      const points = calculatePointsInInning(
        [],
        1,
        4,
        15,
        createMockGameAction({
          type: 'miss',
          playerId: 1,
          value: 0,
          ballsOnTable: 12,
        }),
      );

      expect(points).toBe(7);
    });

    test('uses only final-shot balls once prior score actions exist', () => {
      const points = calculatePointsInInning(
        [
          createMockGameAction({
            type: 'score',
            playerId: 1,
            value: 5,
            ballsOnTable: 10,
          }),
        ],
        1,
        5,
        10,
        createMockGameAction({
          type: 'miss',
          playerId: 1,
          value: 0,
          ballsOnTable: 8,
        }),
      );

      expect(points).toBe(2);
    });

    test('subtracts a foul penalty from final inning points', () => {
      const points = calculatePointsInInning(
        [],
        1,
        3,
        15,
        createMockGameAction({
          type: 'foul',
          playerId: 1,
          value: -1,
          ballsOnTable: 14,
        }),
      );

      expect(points).toBe(3);
    });
  });
});
