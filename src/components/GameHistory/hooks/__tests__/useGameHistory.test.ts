import { act, renderHook, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

import { createMockGameData } from '../../../../testing/factories';
import { useGameHistory } from '../useGameHistory';

const createQuery = (result: unknown) => {
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    order: vi.fn(() => query),
    update: vi.fn(() => query),
    then: (resolve: (value: unknown) => unknown) => Promise.resolve(result).then(resolve),
  };

  return query;
};

const createSupabase = (query: ReturnType<typeof createQuery>) => ({
  from: vi.fn(() => query),
  channel: vi.fn(() => ({
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn(() => ({ id: 'subscription' })),
  })),
  removeChannel: vi.fn(),
});

describe('useGameHistory', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_DISABLE_SUPABASE_REALTIME', 'true');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test('loads valid games from Supabase ordered by date', async () => {
    const validGame = createMockGameData({ id: 'valid-game' });
    const invalidGame = { id: 'invalid-game', players: [] };
    const query = createQuery({ data: [validGame, invalidGame], error: null });
    const supabase = createSupabase(query);

    const { result } = renderHook(() =>
      useGameHistory({ supabase: supabase as never, user: null }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(supabase.from).toHaveBeenCalledWith('games');
    expect(query.eq).toHaveBeenCalledWith('deleted', false);
    expect(query.order).toHaveBeenCalledWith('date', { ascending: false });
    expect(result.current.games).toEqual([validGame]);
    expect(result.current.error).toBe('');
  });

  test('filters authenticated queries by owner id', async () => {
    const query = createQuery({ data: [], error: null });
    const supabase = createSupabase(query);
    const user = { id: 'user-1' };

    const { result } = renderHook(() =>
      useGameHistory({
        supabase: supabase as never,
        user: user as never,
      }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(query.eq).toHaveBeenCalledWith('owner_id', 'user-1');
  });

  test('sets an error when loading games fails', async () => {
    const query = createQuery({ data: null, error: new Error('load failed') });
    const supabase = createSupabase(query);

    const { result } = renderHook(() =>
      useGameHistory({ supabase: supabase as never, user: null }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('Failed to load game history');
    expect(result.current.games).toEqual([]);
  });

  test('soft deletes a game and removes it from local state', async () => {
    const game = createMockGameData({ id: 'game-to-delete' });
    const query = createQuery({ data: [game], error: null });
    const deleteQuery = createQuery({ error: null });
    const supabase = createSupabase(query);
    supabase.from.mockReturnValueOnce(query).mockReturnValueOnce(deleteQuery);

    const { result } = renderHook(() =>
      useGameHistory({ supabase: supabase as never, user: null }),
    );

    await waitFor(() => expect(result.current.games).toHaveLength(1));

    await act(async () => {
      await result.current.deleteGame('game-to-delete');
    });

    expect(deleteQuery.update).toHaveBeenCalledWith({ deleted: true });
    expect(deleteQuery.eq).toHaveBeenCalledWith('id', 'game-to-delete');
    expect(result.current.games).toEqual([]);
  });
});
