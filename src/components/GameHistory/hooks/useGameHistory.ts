import { useState, useEffect } from 'react';

import { useError } from '../../../context/ErrorContext';
import { type GameData } from '../../../types/game';

import type { GameBackend } from '../../../backend/types';
import type { AppUser } from '../../../types/auth';

interface UseGameHistoryProps {
  backend: GameBackend;
  user: AppUser | null;
}

export const useGameHistory = ({ backend, user }: UseGameHistoryProps) => {
  const [games, setGames] = useState<GameData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { addError } = useError();

  useEffect(() => {
    const fetchGames = async () => {
      try {
        setLoading(true);

        const data = await backend.listGames(user);

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
      await backend.deleteGame(gameId);

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
