import { useState, useCallback, useEffect } from 'react';

import { useGamePersist } from '../context/GamePersistContext';

import type { GameData } from '../types/game';

// Game states
export type GameState =
  | 'setup'
  | 'scoring'
  | 'summary'
  | 'history'
  | 'trends'
  | 'profile';

const getRestoredBreakingPlayerId = (saved: GameData | null) => {
  if (!saved || saved.completed) return 0;
  if (typeof saved.breakingPlayerId === 'number') return saved.breakingPlayerId;

  const breakingPlayerIndex = saved.players.findIndex((player) => player.innings > 0);
  return breakingPlayerIndex === -1 ? 0 : breakingPlayerIndex;
};

/**
 * Custom hook for managing game state and related data
 * Handles game setup, scoring, statistics, and history navigation
 */
export const useGameState = () => {
  const { getGameState, hasActiveGame, clearGameState } = useGamePersist();

  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = getGameState();
    return saved && !saved.completed ? 'scoring' : 'setup';
  });

  const [players, setPlayers] = useState<string[]>(() => {
    const saved = getGameState();
    if (saved && !saved.completed) {
      return saved.players.map((p) => p.name);
    }
    return [];
  });

  const [playerTargetScores, setPlayerTargetScores] = useState<Record<string, number>>(
    () => {
      const saved = getGameState();
      if (saved && !saved.completed) {
        const targets: Record<string, number> = {};
        saved.players.forEach((p) => {
          targets[p.name] = p.targetScore;
        });
        return targets;
      }
      return {};
    },
  );

  const [currentGameId, setCurrentGameId] = useState<string | null>(() => {
    const saved = getGameState();
    return saved && !saved.completed ? saved.id : null;
  });

  const [breakingPlayerId, setBreakingPlayerId] = useState<number>(() =>
    getRestoredBreakingPlayerId(getGameState()),
  );

  // Timer state for header display during scoring
  const [matchStartTime, setMatchStartTime] = useState<Date | null>(() => {
    const saved = getGameState();
    if (saved && !saved.completed && saved.startTime) {
      return new Date(saved.startTime);
    }
    return null;
  });

  const [matchEndTime, setMatchEndTime] = useState<Date | null>(() => {
    const saved = getGameState();
    if (saved && !saved.completed && saved.endTime) {
      return new Date(saved.endTime);
    }
    return null;
  });

  const [turnStartTime, setTurnStartTime] = useState<Date | null>(() => {
    const saved = getGameState();
    if (saved && !saved.completed) {
      if (saved.turnStartTime) {
        return new Date(saved.turnStartTime);
      }
      // Fallback to match start time if active
      if (saved.startTime) {
        return new Date(saved.startTime);
      }
    }
    return null;
  });
  const [ballsOnTable, setBallsOnTable] = useState<number>(15);

  // Check for saved game on initial load
  useEffect(() => {
    if (hasActiveGame) {
      const savedGame = getGameState();
      if (!savedGame || savedGame.completed) {
        // If the saved game is completed or corrupted, clear it and stay on setup
        if (savedGame?.completed) {
          clearGameState();
        }
        setGameState('setup');
      }
    }
  }, [hasActiveGame, getGameState, clearGameState]);

  // Listen for navigation to history from end game modal
  useEffect(() => {
    const handleSwitchToHistory = () => {
      setGameState('history');
    };

    window.addEventListener('switchToHistory', handleSwitchToHistory);
    return () => {
      window.removeEventListener('switchToHistory', handleSwitchToHistory);
    };
  }, []);

  // Game state handlers
  const handleStartGame = useCallback(
    (
      players: string[],
      playerTargetScores: Record<string, number>,
      breakingPlayerId: number,
      onSaveSettings: (
        players: string[],
        targetScores: Record<string, number>,
        breakingPlayerId: number,
      ) => void,
    ) => {
      console.log('App: Setting breaking player ID to:', breakingPlayerId);
      setPlayers(players);
      setPlayerTargetScores(playerTargetScores);
      setBreakingPlayerId(breakingPlayerId);
      onSaveSettings(players, playerTargetScores, breakingPlayerId);
      setGameState('scoring');
    },
    [],
  );

  const handleFinishGame = useCallback(() => {
    setGameState('summary');
  }, []);

  const handleStartNewGame = useCallback(() => {
    setCurrentGameId(null);
    setGameState('setup');
  }, []);

  const handleViewHistory = useCallback(() => {
    setGameState('history');
  }, []);

  const handleViewTrends = useCallback(() => {
    setGameState('trends');
  }, []);

  const handleGoToSetup = useCallback(() => {
    setGameState('setup');
  }, []);

  return {
    gameState,
    setGameState,
    players,
    playerTargetScores,
    currentGameId,
    setCurrentGameId,
    breakingPlayerId,
    matchStartTime,
    setMatchStartTime,
    matchEndTime,
    setMatchEndTime,
    turnStartTime,
    setTurnStartTime,
    ballsOnTable,
    setBallsOnTable,
    handleStartGame,
    handleFinishGame,
    handleStartNewGame,
    handleViewHistory,
    handleViewTrends,
    handleGoToSetup,
  };
};
