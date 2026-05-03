import { useState, useEffect } from 'react';

import { DEFAULT_SHOT_CLOCK_SECONDS } from '../constants/gameSettings';

/**
 * Custom hook for managing and persisting game settings
 * Stores last used players, target scores, breaking player ID, and shot clock
 */
export const useGameSettings = () => {
  const [lastPlayers, setLastPlayers] = useState<string[]>(() => {
    const savedPlayers = localStorage.getItem('runcount_lastPlayers');
    return savedPlayers ? JSON.parse(savedPlayers) : [];
  });

  const [lastPlayerTargetScores, setLastPlayerTargetScores] = useState<
    Record<string, number>
  >(() => {
    const savedTargetScores = localStorage.getItem('runcount_lastPlayerTargetScores');
    return savedTargetScores ? JSON.parse(savedTargetScores) : {};
  });

  const [lastBreakingPlayerId, setLastBreakingPlayerId] = useState<number>(() => {
    const savedBreakingPlayerId = localStorage.getItem('runcount_lastBreakingPlayerId');
    return savedBreakingPlayerId ? JSON.parse(savedBreakingPlayerId) : 0;
  });

  const [lastShotClockSeconds, setLastShotClockSeconds] = useState<number | null>(() => {
    const savedShotClockSeconds = localStorage.getItem('runcount_lastShotClockSeconds');

    if (savedShotClockSeconds === null) {
      return DEFAULT_SHOT_CLOCK_SECONDS;
    }

    return JSON.parse(savedShotClockSeconds) as number | null;
  });

  // Persist game settings to localStorage
  useEffect(() => {
    if (lastPlayers.length > 0) {
      localStorage.setItem('runcount_lastPlayers', JSON.stringify(lastPlayers));
    }
  }, [lastPlayers]);

  useEffect(() => {
    if (Object.keys(lastPlayerTargetScores).length > 0) {
      localStorage.setItem(
        'runcount_lastPlayerTargetScores',
        JSON.stringify(lastPlayerTargetScores),
      );
    }
  }, [lastPlayerTargetScores]);

  useEffect(() => {
    localStorage.setItem(
      'runcount_lastBreakingPlayerId',
      JSON.stringify(lastBreakingPlayerId),
    );
  }, [lastBreakingPlayerId]);

  useEffect(() => {
    localStorage.setItem(
      'runcount_lastShotClockSeconds',
      JSON.stringify(lastShotClockSeconds),
    );
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
