import { useState, useEffect } from 'react';

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

    if (
      import.meta.env.VITE_DISABLE_SUPABASE_REALTIME === 'true' ||
      !backend.subscribeToGames
    ) {
      return undefined;
    }

    const subscription = backend.subscribeToGames(user, ({ type, game }) => {
      if (type === 'INSERT') {
        if (!game.deleted) {
          setGames((prevGames) => [game, ...prevGames]);
        }
      } else if (type === 'UPDATE') {
        setGames((prevGames) => {
          if (game.deleted) {
            return prevGames.filter((entry) => entry.id !== game.id);
          }
          return prevGames.map((entry) => (entry.id === game.id ? game : entry));
        });
      } else if (type === 'DELETE') {
        setGames((prevGames) => prevGames.filter((entry) => entry.id !== game.id));
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [backend, user]);

  const deleteGame = async (gameId: string) => {
    try {
      await backend.deleteGame(gameId);

      // Update local state
      setGames(games.filter((g) => g.id !== gameId));

      return true;
    } catch (err) {
      console.error('Error deleting game:', err);
      setError('Failed to delete game');
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
