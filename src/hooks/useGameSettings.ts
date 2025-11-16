import { useState, useEffect } from 'react';

/**
 * Custom hook for managing and persisting game settings
 * Stores last used players, target scores, and breaking player ID
 */
export const useGameSettings = () => {
  const [lastPlayers, setLastPlayers] = useState<string[]>(() => {
    const savedPlayers = localStorage.getItem('runcount_lastPlayers');
    return savedPlayers ? JSON.parse(savedPlayers) : [];
  });

  const [lastPlayerTargetScores, setLastPlayerTargetScores] = useState<
    Record<string, number>
  >(() => {
    const savedTargetScores = localStorage.getItem(
      'runcount_lastPlayerTargetScores'
    );
    return savedTargetScores ? JSON.parse(savedTargetScores) : {};
  });

  const [lastBreakingPlayerId, setLastBreakingPlayerId] = useState<number>(
    () => {
      const savedBreakingPlayerId = localStorage.getItem(
        'runcount_lastBreakingPlayerId'
      );
      return savedBreakingPlayerId ? JSON.parse(savedBreakingPlayerId) : 0;
    }
  );

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
        JSON.stringify(lastPlayerTargetScores)
      );
    }
  }, [lastPlayerTargetScores]);

  useEffect(() => {
    localStorage.setItem(
      'runcount_lastBreakingPlayerId',
      JSON.stringify(lastBreakingPlayerId)
    );
  }, [lastBreakingPlayerId]);

  return {
    lastPlayers,
    setLastPlayers,
    lastPlayerTargetScores,
    setLastPlayerTargetScores,
    lastBreakingPlayerId,
    setLastBreakingPlayerId,
  };
};
