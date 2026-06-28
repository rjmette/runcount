import { useState, useEffect } from 'react';

import { DEFAULT_SHOT_CLOCK_SECONDS } from '../constants/gameSettings';
import {
  isFiniteNumber,
  isNullableFiniteNumber,
  isNumberRecord,
  isStringArray,
  readValidated,
  writeValidated,
} from '../utils/storage';

/**
 * Custom hook for managing and persisting game settings
 * Stores last used players, target scores, breaking player ID, and shot clock
 *
 * All reads go through validated storage helpers so corrupt or wrong-shaped
 * localStorage entries fall back to defaults instead of crashing the app.
 */
export const useGameSettings = () => {
  const [lastPlayers, setLastPlayers] = useState<string[]>(() =>
    readValidated('runcount_lastPlayers', isStringArray, []),
  );

  const [lastPlayerTargetScores, setLastPlayerTargetScores] = useState<
    Record<string, number>
  >(() => readValidated('runcount_lastPlayerTargetScores', isNumberRecord, {}));

  const [lastBreakingPlayerId, setLastBreakingPlayerId] = useState<number>(() =>
    readValidated('runcount_lastBreakingPlayerId', isFiniteNumber, 0),
  );

  const [lastShotClockSeconds, setLastShotClockSeconds] = useState<number | null>(() =>
    readValidated(
      'runcount_lastShotClockSeconds',
      isNullableFiniteNumber,
      DEFAULT_SHOT_CLOCK_SECONDS,
    ),
  );

  // Persist game settings to localStorage
  useEffect(() => {
    if (lastPlayers.length > 0) {
      writeValidated('runcount_lastPlayers', lastPlayers);
    }
  }, [lastPlayers]);

  useEffect(() => {
    if (Object.keys(lastPlayerTargetScores).length > 0) {
      writeValidated('runcount_lastPlayerTargetScores', lastPlayerTargetScores);
    }
  }, [lastPlayerTargetScores]);

  useEffect(() => {
    writeValidated('runcount_lastBreakingPlayerId', lastBreakingPlayerId);
  }, [lastBreakingPlayerId]);

  useEffect(() => {
    writeValidated('runcount_lastShotClockSeconds', lastShotClockSeconds);
  }, [lastShotClockSeconds]);

  return {
    lastPlayers,
    setLastPlayers,
    lastPlayerTargetScores,
    setLastPlayerTargetScores,
    lastBreakingPlayerId,
    setLastBreakingPlayerId,
    lastShotClockSeconds,
    setLastShotClockSeconds,
  };
};
