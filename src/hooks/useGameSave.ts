import { type SupabaseClient, type User } from '@supabase/supabase-js';

import type { GameAction, GameData, Player } from '../types/game';

type UseGameSaveArgs = {
  supabase: SupabaseClient;
  user: User | null;
  saveGameState: (state: GameData) => void;
  clearGameState: () => void;
  matchStartTime?: string;
  matchEndTime?: string;
};

type WinnerId = number | string | null;

type SupabaseGamePayload = GameData & {
  owner_id: string;
  deleted: boolean;
};

export const saveGameToSupabaseHelper = async (options: {
  supabase: SupabaseClient;
  user: User | null;
  saveGameState: (state: GameData) => void;
  clearGameState: () => void;
  matchStartTime?: string;
  matchEndTime?: string;
  gameId: string;
  players: Player[];
  actions: GameAction[];
  completed: boolean;
  winner_id: WinnerId;
}) => {
  const {
    supabase,
    user,
    saveGameState,
    clearGameState,
    matchStartTime,
    matchEndTime,
    gameId,
    players,
    actions,
    completed,
    winner_id: winnerId,
  } = options;

  if (completed) {
    clearGameState();
  } else {
    saveGameState({
      id: gameId,
      date: new Date().toISOString(),
      players,
      actions,
      completed,
      winner_id: winnerId,
      startTime: matchStartTime,
      endTime: matchEndTime,
    });
  }

  try {
    const now = new Date();
    localStorage.setItem(
      `runcount_game_${gameId}`,
      JSON.stringify({
        id: gameId,
        date: now.toISOString(),
        players,
        actions,
        completed,
        winner_id: winnerId,
        startTime: matchStartTime,
        endTime: matchEndTime,
      }),
    );
  } catch (err) {
    console.error('Error saving game to localStorage history:', err);
    try {
      const evt = new CustomEvent('appError', {
        detail: 'Unable to save game locally. Check storage settings.',
      });
      window.dispatchEvent(evt);
    } catch (dispatchError) {
      console.warn('Unable to dispatch local save warning', dispatchError);
    }
  }

  if (!user) return;

  try {
    const now = new Date();
    const payload: SupabaseGamePayload = {
      id: gameId,
      date: now.toISOString(),
      players,
      actions,
      completed,
      winner_id: winnerId,
      owner_id: user.id,
      deleted: false,
    };

    if (matchStartTime) {
      payload.startTime = matchStartTime;
    }
    if (matchEndTime) {
      payload.endTime = matchEndTime;
    }

    const { error } = await supabase.from('games').upsert(payload);

    if (error) {
      console.error('Error saving game to Supabase:', error);
      try {
        const evt = new CustomEvent('appError', {
          detail: "Cloud save failed. We'll keep trying in the background.",
        });
        window.dispatchEvent(evt);
      } catch (dispatchError) {
        console.warn('Unable to dispatch Supabase save warning', dispatchError);
      }
    }
  } catch (err) {
    console.error('Error saving game to Supabase:', err);
    try {
      const evt = new CustomEvent('appError', {
        detail: 'Network error during cloud save.',
      });
      window.dispatchEvent(evt);
    } catch (dispatchError) {
      console.warn('Unable to dispatch Supabase network warning', dispatchError);
    }
  }
};

export const useGameSave = ({
  supabase,
  user,
  saveGameState,
  clearGameState,
  matchStartTime,
  matchEndTime,
}: UseGameSaveArgs) => {
  const saveGameToSupabase = async (
    gameId: string,
    players: Player[],
    actions: GameAction[],
    completed: boolean,
    winnerId: WinnerId,
    startTime?: string,
    endTime?: string,
  ) => {
    await saveGameToSupabaseHelper({
      supabase,
      user,
      saveGameState,
      clearGameState,
      matchStartTime: startTime || matchStartTime,
      matchEndTime: endTime || matchEndTime,
      gameId,
      players,
      actions,
      completed,
      winner_id: winnerId,
    });
  };

  return { saveGameToSupabase };
};

export default useGameSave;
