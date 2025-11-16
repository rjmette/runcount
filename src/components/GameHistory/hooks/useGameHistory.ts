import { useState, useEffect } from 'react';

import { type SupabaseClient, type User } from '@supabase/supabase-js';

import { type GameData } from '../../../types/game';

interface UseGameHistoryProps {
  supabase: SupabaseClient;
  user: User | null;
}

export const useGameHistory = ({ supabase, user }: UseGameHistoryProps) => {
  const [games, setGames] = useState<GameData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchGames = async () => {
      try {
        setLoading(true);

        // Simplify the query to just get user's games
        const query = supabase.from('games').select('*');

        // If user is authenticated, filter by owner
        if (user?.id) {
          query.eq('owner_id', user.id);
        }

        // Filter out deleted games
        query.eq('deleted', false);

        // Order by date descending
        query.order('date', { ascending: false });

        // Execute query
        const { data, error } = await query;

        if (error) {
          console.error('Error fetching games:', error);
          throw error;
        }

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

    // Set up a real-time subscription to the games table
    const subscription = supabase
      .channel('games-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'games',
          filter: user?.id ? `owner_id=eq.${user.id}` : undefined,
        },
        (payload) => {
          // Handle different types of changes
          if (payload.eventType === 'INSERT') {
            const newGame = payload.new as unknown as GameData;
            if (!newGame.deleted) {
              setGames((prevGames) => [newGame, ...prevGames]);
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedGame = payload.new as unknown as GameData;
            setGames((prevGames) => {
              if (updatedGame.deleted) {
                // If the game was soft-deleted, remove it from the list
                return prevGames.filter((game) => game.id !== updatedGame.id);
              } else {
                // Otherwise, update the game in the list
                return prevGames.map((game) =>
                  game.id === updatedGame.id ? updatedGame : game,
                );
              }
            });
          } else if (payload.eventType === 'DELETE') {
            const deletedGame = payload.old as unknown as GameData;
            setGames((prevGames) =>
              prevGames.filter((game) => game.id !== deletedGame.id),
            );
          }
        },
      )
      .subscribe();

    // Clean up the subscription when the component unmounts
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [supabase, user]);

  const deleteGame = async (gameId: string) => {
    try {
      // Soft delete - update game with deleted flag
      const { error } = await supabase
        .from('games')
        .update({ deleted: true })
        .eq('id', gameId);

      if (error) {
        console.error('Error soft-deleting game:', error);
        throw error;
      }

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
