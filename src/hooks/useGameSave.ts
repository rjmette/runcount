import { SupabaseClient } from '@supabase/supabase-js';

type UseGameSaveArgs = {
  supabase: SupabaseClient | any;
  user: any | null;
  saveGameState: (state: any) => void;
  clearGameState: () => void;
  matchStartTime?: string | undefined;
  matchEndTime?: string | undefined;
};

type WinnerId = number | string | null;

export const saveGameToSupabaseHelper = async (options: {
  supabase: any;
  user: any | null;
  saveGameState: (s: any) => void;
  clearGameState: () => void;
  matchStartTime?: string | undefined;
  matchEndTime?: string | undefined;
  gameId: string;
  players: any;
  actions: any;
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
    winner_id,
  } = options;

  // Save game state to our persistent storage context
  if (completed) {
    clearGameState();
  } else {
    saveGameState({
      id: gameId,
      date: new Date().toISOString(),
      players,
      actions,
      completed,
      winner_id: winner_id as any,
      startTime: matchStartTime,
      endTime: matchEndTime,
    });
  }

  // First save to localStorage
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
        winner_id: winner_id as any,
        startTime: matchStartTime,
        endTime: matchEndTime,
      })
    );
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error saving game to localStorage history:', err);
    try {
      const evt = new CustomEvent('appError', {
        detail: 'Unable to save game locally. Check storage settings.',
      });
      window.dispatchEvent(evt);
    } catch {}
  }

  // Only save to Supabase if user is authenticated
  if (!user) return;

  try {
    const now = new Date();
    const payload: any = {
      id: gameId,
      date: now.toISOString(),
      players,
      actions,
      completed,
      winner_id: winner_id as any,
      owner_id: user.id,
      deleted: false,
    };

    if (matchStartTime) payload.startTime = matchStartTime;
    if (matchEndTime) payload.endTime = matchEndTime;

    const { error } = await supabase.from('games').upsert(payload);

    if (error) {
      // eslint-disable-next-line no-console
      console.error('Error saving game to Supabase:', error);
      try {
        const evt = new CustomEvent('appError', {
          detail: "Cloud save failed. We'll keep trying in the background.",
        });
        window.dispatchEvent(evt);
      } catch {}
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error saving game to Supabase:', err);
    try {
      const evt = new CustomEvent('appError', {
        detail: 'Network error during cloud save.',
      });
      window.dispatchEvent(evt);
    } catch {}
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
    players: any,
    actions: any,
    completed: boolean,
    winner_id: WinnerId,
    startTime?: string | undefined,
    endTime?: string | undefined
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
      winner_id,
    });
  };

  return { saveGameToSupabase };
};

export default useGameSave;
