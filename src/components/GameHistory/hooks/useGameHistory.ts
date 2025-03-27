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
        console.log('Fetching game history...');

        let query = supabase
          .from('games')
          .select('*')
          .eq('deleted', false)
          .order('date', { ascending: false });

        // If user is authenticated, only fetch their games
        if (user?.id) {
          console.log(
            'User authenticated, filtering games by owner_id:',
            user.id
          );
          query = query.eq('owner_id', user.id);
        } else {
          console.log('No authenticated user, fetching all games');
        }

        const { data, error } = await query;

        if (error) {
          console.error('Error fetching games from Supabase:', error);
          throw error;
        }

        console.log('Fetched games from Supabase:', data);
        setGames(data as unknown as GameData[]);
      } catch (err) {
        console.error('Error in fetchGames:', err);
        setError('Failed to load game history');
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
