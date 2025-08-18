import { describe, it, expect, vi, beforeEach } from 'vitest';
import { saveGameToSupabaseHelper } from './useGameSave';

describe('saveGameToSupabaseHelper', () => {
  const players = [{ id: 0, name: 'A' }];
  const actions: any[] = [];
  const gameId = 'game-123';

  let saveGameState: any;
  let clearGameState: any;
  let supabase: any;
  let upsertSpy: any;
  let tableName: string | null;

  beforeEach(() => {
    saveGameState = vi.fn();
    clearGameState = vi.fn();
    upsertSpy = vi.fn(async () => ({ error: null }));
    tableName = null;
    supabase = {
      from: (t: string) => {
        tableName = t;
        return { upsert: upsertSpy };
      },
    };
    vi.spyOn(window.localStorage.__proto__, 'setItem');
    (window.localStorage.setItem as any).mockClear();
  });

  it('saves to localStorage and context but not Supabase when user is null', async () => {
    await saveGameToSupabaseHelper({
      supabase,
      user: null,
      saveGameState,
      clearGameState,
      matchStartTime: '2025-08-17T00:00:00.000Z',
      matchEndTime: undefined,
      gameId,
      players,
      actions,
      completed: false,
      winner_id: null,
    });

    expect(saveGameState).toHaveBeenCalledTimes(1);
    expect(clearGameState).not.toHaveBeenCalled();
    expect(window.localStorage.setItem).toHaveBeenCalledWith(
      `runcount_game_${gameId}`,
      expect.stringContaining('"id":"game-123"')
    );
    expect(tableName).toBe(null);
    expect(upsertSpy).not.toHaveBeenCalled();
  });

  it('saves to Supabase when user is present', async () => {
    const user = { id: 'user-42' };

    await saveGameToSupabaseHelper({
      supabase,
      user,
      saveGameState,
      clearGameState,
      matchStartTime: '2025-08-17T00:00:00.000Z',
      matchEndTime: '2025-08-17T01:00:00.000Z',
      gameId,
      players,
      actions,
      completed: false,
      winner_id: 0,
    });

    expect(saveGameState).toHaveBeenCalledTimes(1);
    expect(tableName).toBe('games');
    expect(upsertSpy).toHaveBeenCalledTimes(1);
    const payload = upsertSpy.mock.calls[0][0];
    expect(payload).toMatchObject({
      id: gameId,
      players,
      actions,
      completed: false,
      winner_id: 0,
      owner_id: user.id,
      deleted: false,
      startTime: '2025-08-17T00:00:00.000Z',
      endTime: '2025-08-17T01:00:00.000Z',
    });
    expect(typeof payload.date).toBe('string');
  });

  it('clears context when completed=true and still persists', async () => {
    const user = { id: 'user-42' };

    await saveGameToSupabaseHelper({
      supabase,
      user,
      saveGameState,
      clearGameState,
      matchStartTime: undefined,
      matchEndTime: undefined,
      gameId,
      players,
      actions,
      completed: true,
      winner_id: null,
    });

    expect(clearGameState).toHaveBeenCalledTimes(1);
    expect(saveGameState).not.toHaveBeenCalled();
    expect(window.localStorage.setItem).toHaveBeenCalled();
    expect(upsertSpy).toHaveBeenCalled();
  });
});
