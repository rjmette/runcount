import { useState, useEffect } from 'react';

import { useError } from '../../../context/ErrorContext';
import { type GameData } from '../../../types/game';

import type { GameBackend } from '../../../backend/types';
import type { AppUser } from '../../../types/auth';

interface UseGameHistoryProps {
  backend: GameBackend;
  user: AppUser | null;
}

const LOCAL_GAME_PREFIX = 'runcount_game_';

const isLocalGameKey = (key: string) =>
  key.startsWith(LOCAL_GAME_PREFIX) && key !== 'runcount_game_settings';

const loadLocalGames = () => {
  const games: GameData[] = [];

  for (let index = 0; index < localStorage.length; index++) {
    const key = localStorage.key(index);
    if (!key || !isLocalGameKey(key)) continue;

    try {
      const rawGame = localStorage.getItem(key);
      if (!rawGame) continue;

      const game = JSON.parse(rawGame) as GameData;
      if (game && game.id && Array.isArray(game.players) && game.players.length > 0) {
        games.push(game);
      }
    } catch (err) {
      console.warn(`Skipping invalid local game history entry: ${key}`, err);
    }
  }

  return games.sort(
    (left, right) => new Date(right.date).getTime() - new Date(left.date).getTime(),
  );
};

export const useGameHistory = ({ backend, user }: UseGameHistoryProps) => {
  const [games, setGames] = useState<GameData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { addError } = useError();

  useEffect(() => {
    const fetchGames = async () => {
      try {
        setLoading(true);

        const data = user ? await backend.listGames(user) : loadLocalGames();

        // Type cast and filter out any potentially invalid data
        const validGames = (data || [])
          .filter((game) => {
            if (!game || typeof game !== 'object') {
              console.error('Invalid game object:', game);
              return false;
            }

            // Check for required fields
            if (!game.id) {
              console.error('Game missing required ID:', game);
              return false;
            }

            // Check that players array exists and is properly formed
            if (!Array.isArray(game.players) || game.players.length === 0) {
              console.error('Game has invalid or empty players array:', game.id);
              return false;
            }

            return true;
          })
          .map((game) => game as unknown as GameData);

        setGames(validGames);
      } catch (err) {
        console.error('Error in fetchGames:', err);
        setError('Failed to load game history');
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, [backend, user]);

  const deleteGame = async (gameId: string) => {
    try {
      if (user) {
        await backend.deleteGame(gameId);
      } else {
        localStorage.removeItem(`${LOCAL_GAME_PREFIX}${gameId}`);
      }

      // Update local state
      setGames(games.filter((g) => g.id !== gameId));

      return true;
    } catch (err) {
      // Surface as a transient toast rather than the hook's `error` state,
      // which replaces the entire history view with a full-page error.
      console.error('Error deleting game:', err);
      addError('Failed to delete game. Please try again.');
      return false;
    }
  };

  return {
    games,
    loading,
    error,
    deleteGame,
  };
};
