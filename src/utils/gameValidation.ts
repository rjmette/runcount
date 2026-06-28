/**
 * Runtime type guards for game data persisted to localStorage.
 *
 * These mirror the compile-time interfaces in `src/types/game.ts` so that data
 * loaded from storage (which TypeScript cannot verify) is validated before use,
 * preventing corrupt or malicious entries from crashing the app.
 */
import { isNumberRecord, isStringArray, type Migrator } from './storage';

import type { GameAction, GameData, GameSettings, Player } from '../types/game';

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const isValidPlayer = (value: unknown): value is Player => {
  if (!isObject(value)) return false;
  return (
    typeof value.id === 'number' &&
    typeof value.name === 'string' &&
    typeof value.score === 'number' &&
    typeof value.innings === 'number' &&
    typeof value.highRun === 'number' &&
    typeof value.fouls === 'number' &&
    typeof value.consecutiveFouls === 'number' &&
    typeof value.safeties === 'number' &&
    typeof value.missedShots === 'number' &&
    typeof value.targetScore === 'number'
  );
};

const VALID_ACTION_TYPES: ReadonlyArray<GameAction['type']> = [
  'score',
  'foul',
  'safety',
  'miss',
];

export const isValidGameAction = (value: unknown): value is GameAction => {
  if (!isObject(value)) return false;
  if (!VALID_ACTION_TYPES.includes(value.type as GameAction['type'])) return false;
  if (typeof value.playerId !== 'number') return false;
  if (typeof value.value !== 'number') return false;
  // Persisted timestamps are ISO strings; in-memory they are Date objects.
  if (!(typeof value.timestamp === 'string' || value.timestamp instanceof Date)) {
    return false;
  }
  return true;
};

export const isValidGameData = (value: unknown): value is GameData => {
  if (!isObject(value)) return false;
  if (typeof value.id !== 'string' || value.id.length === 0) return false;
  // `date` may be an ISO string (persisted) or a Date (in-memory).
  if (!(typeof value.date === 'string' || value.date instanceof Date)) return false;
  if (!Array.isArray(value.players) || value.players.length === 0) return false;
  if (!value.players.every(isValidPlayer)) return false;
  if (!Array.isArray(value.actions) || !value.actions.every(isValidGameAction))
    return false;
  // winner_id is `number | null` in the type, but persisted records may carry a
  // string id from the save path — accept all three rather than discard a valid game.
  if (
    value.winner_id !== null &&
    typeof value.winner_id !== 'number' &&
    typeof value.winner_id !== 'string'
  ) {
    return false;
  }
  if (typeof value.completed !== 'boolean') return false;
  return true;
};

export const isValidGameSettings = (value: unknown): value is GameSettings => {
  if (!isObject(value)) return false;
  if (!isStringArray(value.players)) return false;
  if (!isNumberRecord(value.playerTargetScores)) return false;
  if (
    value.breakingPlayerId !== undefined &&
    typeof value.breakingPlayerId !== 'number'
  ) {
    return false;
  }
  if (
    value.shotClockSeconds !== undefined &&
    value.shotClockSeconds !== null &&
    typeof value.shotClockSeconds !== 'number'
  ) {
    return false;
  }
  return true;
};

/**
 * Migrates persisted game data to the current schema.
 *
 * Today v0 (legacy, unversioned) → v1 is a no-op because the shape is unchanged;
 * legacy entries are simply re-wrapped in a versioned envelope on next save.
 * Future schema changes add explicit steps here, e.g.:
 *   if (fromVersion < 2) data = { ...data, newField: defaultValue };
 */
export const migrateGameData: Migrator = (_fromVersion, data) => data;
