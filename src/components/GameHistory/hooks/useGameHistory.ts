import { useState, useEffect } from 'react';
import { SupabaseClient, User } from '@supabase/supabase-js';
import { GameData } from '../../../types/game';

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

        let query = supabase
          .from('games')
          .select('*')
          .eq('deleted', false)
          .order('date', { ascending: false });

        // If user is authenticated, only fetch their games
        if (user?.id) {
          query = query.eq('owner_id', user.id);
        }

        const { data, error } = await query;

        if (error) {
          throw error;
        }

        setGames(data as unknown as GameData[]);
      } catch (err) {
        setError('Failed to load game history');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, [supabase, user]);

  const deleteGame = async (gameId: string) => {
    try {
      // Soft delete - update game with deleted flag
      const { error } = await supabase
        .from('games')
        .update({ deleted: true })
        .eq('id', gameId);

      if (error) throw error;

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
