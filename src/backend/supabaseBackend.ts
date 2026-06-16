import type { GameBackend } from './types';
import type { AppUser } from '../types/auth';
import type { GameData } from '../types/game';
import type { SupabaseClient } from '@supabase/supabase-js';

function validGames(data: unknown): GameData[] {
  if (!Array.isArray(data)) return [];
  return data
    .filter((game) => {
      if (!game || typeof game !== 'object') return false;
      const candidate = game as Partial<GameData>;
      return (
        !!candidate.id && Array.isArray(candidate.players) && candidate.players.length > 0
      );
    })
    .map((game) => game as unknown as GameData);
}

export function createSupabaseBackend(supabase: SupabaseClient): GameBackend {
  return {
    async listGames(user: AppUser | null) {
      const query = supabase.from('games').select('*');
      if (user?.id) query.eq('owner_id', user.id);
      query.eq('deleted', false);
      query.order('date', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      return validGames(data);
    },

    async getGame(gameId: string) {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('id', gameId)
        .eq('deleted', false)
        .single();
      if (error) throw error;
      return data as unknown as GameData | null;
    },

    async saveGame(game: GameData, user: AppUser | null) {
      if (!user) return;
      const payload = {
        ...game,
        owner_id: user.id,
        deleted: false,
      };
      const { error } = await supabase.from('games').upsert(payload);
      if (error) throw error;
    },

    async deleteGame(gameId: string) {
      const { error } = await supabase
        .from('games')
        .update({ deleted: true })
        .eq('id', gameId);
      if (error) throw error;
    },

    async getProfileStats(user: AppUser) {
      const { data, error } = await supabase
        .from('games')
        .select('date')
        .eq('owner_id', user.id)
        .eq('deleted', false)
        .order('date', { ascending: false });
      if (error || !data) {
        return { totalGames: 0, lastGameDate: null };
      }
      return {
        totalGames: data.length,
        lastGameDate: data.length > 0 && data[0]?.date ? String(data[0].date) : null,
      };
    },

    async updateEmail(email: string) {
      const { error } = await supabase.auth.updateUser({ email });
      if (error) throw error;
    },

    async updatePassword(password: string) {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
    },
  };
}
