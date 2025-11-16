import { useState, useCallback, useEffect } from 'react';

import { useGamePersist } from '../context/GamePersistContext';

// Game states
export type GameState = 'setup' | 'scoring' | 'statistics' | 'history' | 'profile';

/**
 * Custom hook for managing game state and related data
 * Handles game setup, scoring, statistics, and history navigation
 */
export const useGameState = () => {
  const { getGameState, hasActiveGame, clearGameState } = useGamePersist();

  const [gameState, setGameState] = useState<GameState>('setup');
  const [players, setPlayers] = useState<string[]>([]);
  const [playerTargetScores, setPlayerTargetScores] = useState<Record<string, number>>(
    {},
  );
  const [currentGameId, setCurrentGameId] = useState<string | null>(null);
  const [breakingPlayerId, setBreakingPlayerId] = useState<number>(0);

  // Timer state for header display during scoring
  const [matchStartTime, setMatchStartTime] = useState<Date | null>(null);
  const [matchEndTime, setMatchEndTime] = useState<Date | null>(null);
  const [ballsOnTable, setBallsOnTable] = useState<number>(15);

  // Check for saved game on initial load
  useEffect(() => {
    if (hasActiveGame) {
      const savedGame = getGameState();
      if (savedGame && !savedGame.completed) {
        // Only load games that are actually in progress
        // Set player names from the saved game
        const playerNames = savedGame.players.map((player) => player.name);
        setPlayers(playerNames);

        // Set target scores from the saved game
        const targetScores: Record<string, number> = {};
        savedGame.players.forEach((player) => {
          targetScores[player.name] = player.targetScore;
        });
        setPlayerTargetScores(targetScores);

        // Set the game ID
        setCurrentGameId(savedGame.id);

        // Redirect to scoring screen since game is in progress
        setGameState('scoring');
      } else {
        // If the saved game is completed or corrupted, clear it and stay on setup
        if (savedGame?.completed) {
          // Clear completed games from active storage
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
    setGameState('statistics');
  }, []);

  const handleStartNewGame = useCallback(() => {
    setCurrentGameId(null);
    setGameState('setup');
  }, []);

  const handleViewHistory = useCallback(() => {
    setGameState('history');
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
    ballsOnTable,
    setBallsOnTable,
    handleStartGame,
    handleFinishGame,
    handleStartNewGame,
    handleViewHistory,
    handleGoToSetup,
  };
};
