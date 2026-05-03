import { describe, expect, test } from 'vitest';

import { createMockPlayer } from '../../../testing/factories';
import { type GameAction, type GameData, type Player } from '../../../types/game';

import {
  buildPlayerTrendData,
  buildTrendsSummary,
  getTrendsPlayerOptions,
} from './trendsData';

const score = (playerId: number, value = 1): GameAction => ({
  type: 'score',
  playerId,
  value,
  timestamp: new Date(),
});

const miss = (playerId: number): GameAction => ({
  type: 'miss',
  playerId,
  value: 0,
  timestamp: new Date(),
});

const buildPlayer = (overrides: Partial<Player> = {}) =>
  createMockPlayer({
    id: 1,
    name: 'Alice',
    score: 50,
    innings: 10,
    highRun: 12,
    safeties: 0,
    fouls: 0,
    missedShots: 0,
    ...overrides,
  });

const createGame = (overrides: Partial<GameData> = {}): GameData => ({
  id: 'game-1',
  date: '2026-04-01T12:00:00.000Z',
  players: [buildPlayer(), createMockPlayer({ id: 2, name: 'Bob', score: 40 })],
  winner_id: 1,
  completed: true,
  actions: [],
  ...overrides,
});

describe('getTrendsPlayerOptions', () => {
  test('returns players from completed games sorted by frequency', () => {
    const games: GameData[] = [
      createGame({
        id: 'a',
        date: '2026-03-01T00:00:00.000Z',
        players: [
          buildPlayer({ name: 'alice' }),
          createMockPlayer({ id: 2, name: 'Bob' }),
        ],
      }),
      createGame({
        id: 'b',
        date: '2026-04-01T00:00:00.000Z',
        players: [
          buildPlayer({ name: 'Alice' }),
          createMockPlayer({ id: 2, name: 'Charlie' }),
        ],
      }),
      createGame({
        id: 'c',
        date: '2026-05-01T00:00:00.000Z',
        completed: false,
        players: [buildPlayer({ name: 'Diana' })],
      }),
    ];

    const options = getTrendsPlayerOptions(games);

    expect(options.map((option) => option.key)).toEqual(['alice', 'bob', 'charlie']);
    expect(options[0]).toMatchObject({
      key: 'alice',
      gameCount: 2,
      displayName: 'Alice',
    });
  });

  test('returns empty array when no completed games exist', () => {
    expect(
      getTrendsPlayerOptions([
        createGame({ completed: false }),
        createGame({ id: 'two', completed: false }),
      ]),
    ).toEqual([]);
  });
});

describe('buildPlayerTrendData', () => {
  test('produces sorted per-game stats for the selected player', () => {
    const games: GameData[] = [
      createGame({
        id: 'older',
        date: '2026-04-01T12:00:00.000Z',
        players: [
          buildPlayer({ id: 1, name: 'Alice', score: 50, innings: 10, highRun: 14 }),
          createMockPlayer({ id: 2, name: 'Bob', score: 40 }),
        ],
        actions: [score(1, 1), score(1, 1), miss(1), score(2, 1), miss(2)],
      }),
      createGame({
        id: 'newer',
        date: '2026-04-15T12:00:00.000Z',
        players: [
          buildPlayer({ id: 1, name: 'Alice', score: 75, innings: 9, highRun: 22 }),
          createMockPlayer({ id: 2, name: 'Bob', score: 40 }),
        ],
        winner_id: 1,
      }),
    ];

    const trend = buildPlayerTrendData(games, 'alice');

    expect(trend).toHaveLength(2);
    expect(trend[0].gameId).toBe('older');
    expect(trend[1].gameId).toBe('newer');
    expect(trend[1].won).toBe(true);
    expect(trend[1].bpi).toBeCloseTo(75 / 9, 2);
    expect(trend[1].highRun).toBe(22);
  });

  test('skips games where the player did not appear', () => {
    const games: GameData[] = [
      createGame({
        id: 'no-alice',
        players: [
          createMockPlayer({ id: 2, name: 'Bob', score: 50 }),
          createMockPlayer({ id: 3, name: 'Charlie', score: 40 }),
        ],
        winner_id: 2,
      }),
    ];

    expect(buildPlayerTrendData(games, 'alice')).toEqual([]);
  });

  test('returns empty array when no player key provided', () => {
    expect(buildPlayerTrendData([createGame()], '')).toEqual([]);
  });
});

describe('buildTrendsSummary', () => {
  test('computes win rate and trend deltas across many games', () => {
    const points = Array.from({ length: 12 }, (_, index) => ({
      gameId: `g-${index}`,
      date: new Date(2026, 0, index + 1).toISOString(),
      timestamp: new Date(2026, 0, index + 1).getTime(),
      bpi: index < 6 ? 1 : 3,
      shootingPercentage: 50,
      highRun: 5 + index,
      safetyEfficiency: 50,
      won: index % 2 === 0,
    }));

    const summary = buildTrendsSummary(points);

    expect(summary.totalGames).toBe(12);
    expect(summary.wins).toBe(6);
    expect(summary.winRate).toBeCloseTo(0.5, 2);
    expect(summary.bpi.direction).toBe('up');
    expect(summary.bpi.recentDelta).toBeGreaterThan(0);
    expect(summary.highRun.best).toBe(16);
    expect(summary.shootingPercentage.direction).toBe('flat');
  });

  test('returns flat direction when there are not enough games for a delta', () => {
    const points = [
      {
        gameId: 'g-1',
        date: '2026-01-01T00:00:00.000Z',
        timestamp: new Date('2026-01-01').getTime(),
        bpi: 2,
        shootingPercentage: 60,
        highRun: 8,
        safetyEfficiency: 40,
        won: true,
      },
    ];

    const summary = buildTrendsSummary(points);

    expect(summary.bpi.direction).toBe('flat');
    expect(summary.bpi.average).toBe(2);
    expect(summary.bpi.best).toBe(2);
  });

  test('returns zeroed summary for empty input', () => {
    const summary = buildTrendsSummary([]);
    expect(summary.totalGames).toBe(0);
    expect(summary.winRate).toBe(0);
    expect(summary.bpi).toEqual({
      average: 0,
      best: 0,
      recentDelta: 0,
      direction: 'flat',
    });
  });
});
