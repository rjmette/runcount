import { describe, expect, it } from 'vitest';

import {
  isValidGameAction,
  isValidGameData,
  isValidGameSettings,
  isValidPlayer,
  migrateGameData,
} from './gameValidation';

import type { GameAction, GameData, Player } from '../types/game';

const validPlayer = (): Player => ({
  id: 1,
  name: 'Alice',
  score: 10,
  innings: 3,
  highRun: 5,
  fouls: 0,
  consecutiveFouls: 0,
  safeties: 1,
  missedShots: 2,
  targetScore: 50,
});

const validAction = (): GameAction => ({
  type: 'score',
  playerId: 1,
  value: 3,
  timestamp: new Date().toISOString() as unknown as Date,
});

const validGame = (): GameData => ({
  id: 'game-1',
  date: new Date().toISOString(),
  players: [validPlayer()],
  winner_id: null,
  completed: false,
  actions: [validAction()],
});

describe('isValidPlayer', () => {
  it('accepts a fully-formed player', () => {
    expect(isValidPlayer(validPlayer())).toBe(true);
  });

  it('rejects missing/wrong-typed fields', () => {
    expect(isValidPlayer({ ...validPlayer(), score: '10' })).toBe(false);
    const { name: _name, ...noName } = validPlayer();
    expect(isValidPlayer(noName)).toBe(false);
    expect(isValidPlayer(null)).toBe(false);
    expect(isValidPlayer([])).toBe(false);
  });
});

describe('isValidGameAction', () => {
  it('accepts valid action types with string and Date timestamps', () => {
    expect(isValidGameAction({ ...validAction() })).toBe(true);
    expect(isValidGameAction({ ...validAction(), timestamp: new Date() })).toBe(true);
  });

  it('rejects invalid type or timestamp', () => {
    expect(isValidGameAction({ ...validAction(), type: 'bogus' })).toBe(false);
    expect(isValidGameAction({ ...validAction(), timestamp: 123 })).toBe(false);
    expect(isValidGameAction({ ...validAction(), playerId: 'x' })).toBe(false);
  });
});

describe('isValidGameData', () => {
  it('accepts a valid game', () => {
    expect(isValidGameData(validGame())).toBe(true);
  });

  it('accepts string winner_id (from save path)', () => {
    expect(isValidGameData({ ...validGame(), winner_id: 'uuid-123' })).toBe(true);
  });

  it('rejects empty id, empty players, bad actions', () => {
    expect(isValidGameData({ ...validGame(), id: '' })).toBe(false);
    expect(isValidGameData({ ...validGame(), players: [] })).toBe(false);
    expect(isValidGameData({ ...validGame(), players: [{ bad: true }] })).toBe(false);
    expect(isValidGameData({ ...validGame(), actions: 'nope' })).toBe(false);
    expect(isValidGameData({ ...validGame(), completed: 'yes' })).toBe(false);
    expect(isValidGameData(null)).toBe(false);
    expect(isValidGameData('string')).toBe(false);
  });
});

describe('isValidGameSettings', () => {
  it('accepts valid settings with optional fields present or absent', () => {
    expect(
      isValidGameSettings({ players: ['A', 'B'], playerTargetScores: { A: 50 } }),
    ).toBe(true);
    expect(
      isValidGameSettings({
        players: ['A'],
        playerTargetScores: {},
        breakingPlayerId: 0,
        shotClockSeconds: null,
      }),
    ).toBe(true);
  });

  it('rejects wrong-shaped settings', () => {
    expect(isValidGameSettings({ players: [1], playerTargetScores: {} })).toBe(false);
    expect(isValidGameSettings({ players: [], playerTargetScores: { A: 'x' } })).toBe(
      false,
    );
    expect(
      isValidGameSettings({
        players: [],
        playerTargetScores: {},
        breakingPlayerId: 'x',
      }),
    ).toBe(false);
    expect(isValidGameSettings(null)).toBe(false);
  });
});

describe('migrateGameData', () => {
  it('passes legacy v0 data through unchanged (v0 -> v1 no-op)', () => {
    const game = validGame();
    expect(migrateGameData(0, game)).toEqual(game);
  });
});
