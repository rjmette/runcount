import { type GameAction, type GameData, type Player } from '../types/game';

export const createMockPlayer = (overrides: Partial<Player> = {}): Player => ({
  id: 1,
  name: 'Test Player',
  score: 0,
  innings: 0,
  highRun: 0,
  fouls: 0,
  consecutiveFouls: 0,
  safeties: 0,
  missedShots: 0,
  targetScore: 75,
  ...overrides,
});

export const createMockGameAction = (
  overrides: Partial<GameAction> = {},
): GameAction => ({
  type: 'score',
  playerId: 1,
  value: 1,
  timestamp: new Date('2026-01-01T00:00:00.000Z'),
  ballsOnTable: 15,
  ...overrides,
});

export const createMockGameData = (overrides: Partial<GameData> = {}): GameData => ({
  id: 'game-1',
  date: '2026-01-01T00:00:00.000Z',
  players: [
    createMockPlayer({ id: 0, name: 'Alice', targetScore: 75 }),
    createMockPlayer({ id: 1, name: 'Bob', targetScore: 75 }),
  ],
  winner_id: null,
  completed: false,
  actions: [],
  deleted: false,
  ...overrides,
});
