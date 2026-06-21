import { act, renderHook, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

import { createMockGameData } from '../../../../testing/factories';
import { useGameHistory } from '../useGameHistory';

describe('useGameHistory', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('loads valid games from localStorage when signed out', async () => {
    const validGame = createMockGameData({ id: 'valid-game' });
    const backend = {
      listGames: vi.fn(),
      deleteGame: vi.fn(),
    };
    localStorage.setItem(`runcount_game_${validGame.id}`, JSON.stringify(validGame));
    localStorage.setItem(
      'runcount_game_invalid',
      JSON.stringify({ id: 'invalid-game', players: [] }),
    );

    const { result } = renderHook(() =>
      useGameHistory({ backend: backend as never, user: null }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(backend.listGames).not.toHaveBeenCalled();
    expect(result.current.games).toEqual([validGame]);
    expect(result.current.error).toBe('');
  });

  test('passes authenticated user to backend queries', async () => {
    const backend = {
      listGames: vi.fn().mockResolvedValue([]),
      deleteGame: vi.fn(),
    };
    const user = { id: 'user-1' };

    const { result } = renderHook(() =>
      useGameHistory({
        backend: backend as never,
        user: user as never,
      }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(backend.listGames).toHaveBeenCalledWith(user);
  });

  test('sets an error when loading games fails', async () => {
    const backend = {
      listGames: vi.fn().mockRejectedValue(new Error('load failed')),
      deleteGame: vi.fn(),
    };
    const user = { id: 'user-1' };

    const { result } = renderHook(() =>
      useGameHistory({ backend: backend as never, user: user as never }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('Failed to load game history');
    expect(result.current.games).toEqual([]);
  });

  test('soft deletes a game and removes it from local state', async () => {
    const game = createMockGameData({ id: 'game-to-delete' });
    const backend = {
      listGames: vi.fn(),
      deleteGame: vi.fn().mockResolvedValue(undefined),
    };
    localStorage.setItem(`runcount_game_${game.id}`, JSON.stringify(game));

    const { result } = renderHook(() =>
      useGameHistory({ backend: backend as never, user: null }),
    );

    await waitFor(() => expect(result.current.games).toHaveLength(1));

    await act(async () => {
      await result.current.deleteGame('game-to-delete');
    });

    expect(backend.deleteGame).not.toHaveBeenCalled();
    expect(localStorage.getItem(`runcount_game_${game.id}`)).toBeNull();
    expect(result.current.games).toEqual([]);
  });

  test('keeps the history view intact when a delete fails', async () => {
    const game = createMockGameData({ id: 'game-to-delete' });
    const backend = {
      listGames: vi.fn().mockResolvedValue([game]),
      deleteGame: vi.fn().mockRejectedValue(new Error('delete failed')),
    };
    const user = { id: 'user-1' };

    const { result } = renderHook(() =>
      useGameHistory({ backend: backend as never, user: user as never }),
    );

    await waitFor(() => expect(result.current.games).toHaveLength(1));

    let outcome: boolean | undefined;
    await act(async () => {
      outcome = await result.current.deleteGame('game-to-delete');
    });

    // Failure is surfaced via the transient toast, not the hook's `error`
    // state (which would replace the whole history view). The list is kept.
    expect(outcome).toBe(false);
    expect(result.current.error).toBe('');
    expect(result.current.games).toHaveLength(1);
  });
});
