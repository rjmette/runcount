import { describe, expect, test } from 'vitest';

import { createMockPlayer } from '../../../testing/factories';
import { type GameData } from '../../../types/game';

import {
  buildGameHistoryCsv,
  buildGameHistoryExport,
  buildGameHistoryTrends,
  defaultHistoryFilters,
  filterAndSortGames,
} from './historyEnhancements';

const createGame = (overrides: Partial<GameData> = {}): GameData => ({
  id: 'game-1',
  date: '2026-04-01T12:00:00.000Z',
  players: [
    createMockPlayer({ id: 1, name: 'Alice', score: 75, targetScore: 75 }),
    createMockPlayer({ id: 2, name: 'Bob', score: 60, targetScore: 75 }),
  ],
  winner_id: 1,
  completed: true,
  actions: [],
  ...overrides,
});

describe('historyEnhancements', () => {
  test('filters by date, opponent, and completion status', () => {
    const games = [
      createGame({ id: 'older', date: '2026-03-15T12:00:00.000Z' }),
      createGame({
        id: 'matching',
        date: '2026-04-10T12:00:00.000Z',
        players: [
          createMockPlayer({ id: 1, name: 'Alice', score: 75 }),
          createMockPlayer({ id: 2, name: 'Charlie', score: 62 }),
        ],
      }),
      createGame({
        id: 'unfinished',
        date: '2026-04-12T12:00:00.000Z',
        completed: false,
      }),
    ];

    const filteredGames = filterAndSortGames(
      games,
      {
        ...defaultHistoryFilters,
        startDate: '2026-04-01',
        endDate: '2026-04-30',
        opponent: 'char',
        gameType: 'completed',
      },
      'date-desc',
    );

    expect(filteredGames.map((game) => game.id)).toEqual(['matching']);
  });

  test('sorts by total score descending', () => {
    const games = [
      createGame({ id: 'low' }),
      createGame({
        id: 'high',
        players: [
          createMockPlayer({ id: 1, name: 'Alice', score: 100 }),
          createMockPlayer({ id: 2, name: 'Bob', score: 90 }),
        ],
      }),
    ];

    const sortedGames = filterAndSortGames(
      games,
      defaultHistoryFilters,
      'total-score-desc',
    );

    expect(sortedGames.map((game) => game.id)).toEqual(['high', 'low']);
  });

  test('builds CSV and JSON-friendly export data', () => {
    const games = [createGame()];

    expect(buildGameHistoryExport(games)).toEqual([
      expect.objectContaining({
        id: 'game-1',
        status: 'completed',
        winner: 'Alice',
        playerCount: 2,
        totalScore: 135,
      }),
    ]);
    expect(buildGameHistoryCsv(games)).toContain(
      '"Game ID","Date","Status","Winner","Players","Total Score","Scores"',
    );
    expect(buildGameHistoryCsv(games)).toContain('"Alice (75/75); Bob (60/75)"');
  });

  test('builds daily scoring trend points', () => {
    const trends = buildGameHistoryTrends([
      createGame({ id: 'one', date: '2026-04-02T12:00:00.000Z' }),
      createGame({ id: 'two', date: '2026-04-02T18:00:00.000Z' }),
      createGame({ id: 'three', date: '2026-04-03T12:00:00.000Z' }),
    ]);

    expect(trends).toEqual([
      { label: '2026-04-02', games: 2, totalScore: 270 },
      { label: '2026-04-03', games: 1, totalScore: 135 },
    ]);
  });
});
