import React, { useState, useEffect } from 'react';

import { type GameStatisticsProps, type GameData } from '../types/game';
import { isValidGameData } from '../utils/gameValidation';
import { readValidated } from '../utils/storage';

import GameSummary from './GameSummary';

/**
 * Post-game route: fetches the finished game (localStorage first, then the
 * cloud backend), keeps the save-after-login behaviour, and renders the
 * shared GameSummary in `post-game` context.
 */
const GameStatistics: React.FC<GameStatisticsProps> = ({
  gameId,
  backend,
  startNewGame,
  user,
}) => {
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savedToCloud, setSavedToCloud] = useState(false);

  useEffect(() => {
    const fetchGameData = async () => {
      if (!gameId) {
        console.log('No game ID provided, skipping fetch');
        setError('No game ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log('Fetching game data for ID:', gameId);

        // First try to get game from localStorage if available.
        // readValidated parses, validates the shape, and clears corrupt entries.
        const localGameData = readValidated(
          `runcount_game_${gameId}`,
          isValidGameData,
          null,
        );
        if (localGameData) {
          console.log('Found valid game in localStorage');
          setGameData(localGameData as GameData);
          setLoading(false);
          return;
        }
        console.log('No valid game found in localStorage, trying backend');

        // If no local data, try cloud backend
        const data = await backend.getGame(gameId);

        console.log('Fetched game data from cloud backend:', data);
        setGameData(data);
      } catch (err) {
        console.error('Error in fetchGameData:', err);
        setError('Failed to load game data');
      } finally {
        setLoading(false);
      }
    };

    fetchGameData();
  }, [gameId, backend]);

  // Effect to save game to cloud backend when user logs in
  useEffect(() => {
    if (user && gameData && !savedToCloud) {
      const saveGameToCloud = async () => {
        try {
          console.log('Saving game to cloud backend after login on results screen');

          const payload: GameData = {
            ...gameData,
            deleted: false,
          };

          await backend.saveGame(payload, user);
          console.log('Successfully saved game to cloud backend after login');
          setSavedToCloud(true);
        } catch (err) {
          console.error('Error saving game to cloud backend after login:', err);
        }
      };

      saveGameToCloud();
    }
  }, [user, gameData, backend, savedToCloud]);

  if (loading) {
    return (
      <div
        className="flex items-center justify-center h-64"
        role="status"
        aria-label="Loading game statistics..."
      >
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 dark:border-blue-400"></div>
        <span className="sr-only">Loading game statistics...</span>
      </div>
    );
  }

  if (error || !gameData) {
    return (
      <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded relative">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error || 'Failed to load game data'}</span>
        <div className="mt-4">
          <button
            onClick={startNewGame}
            className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-700 dark:hover:bg-blue-800"
          >
            Start New Game
          </button>
        </div>
      </div>
    );
  }

  return (
    <GameSummary game={gameData} context="post-game" onStartNewGame={startNewGame} />
  );
};

export default GameStatistics;
