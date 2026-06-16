import { act, renderHook, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

import { createMockGameData } from '../../../../testing/factories';
import { useGameHistory } from '../useGameHistory';

describe('useGameHistory', () => {
  test('loads valid games from backend', async () => {
    const validGame = createMockGameData({ id: 'valid-game' });
    const invalidGame = { id: 'invalid-game', players: [] };
    const backend = {
      listGames: vi.fn().mockResolvedValue([validGame, invalidGame]),
      deleteGame: vi.fn(),
    };

    const { result } = renderHook(() =>
      useGameHistory({ backend: backend as never, user: null }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(backend.listGames).toHaveBeenCalledWith(null);
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

    const { result } = renderHook(() =>
      useGameHistory({ backend: backend as never, user: null }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('Failed to load game history');
    expect(result.current.games).toEqual([]);
  });

  test('soft deletes a game and removes it from local state', async () => {
    const game = createMockGameData({ id: 'game-to-delete' });
    const backend = {
      listGames: vi.fn().mockResolvedValue([game]),
      deleteGame: vi.fn().mockResolvedValue(undefined),
    };

    const { result } = renderHook(() =>
      useGameHistory({ backend: backend as never, user: null }),
    );

    await waitFor(() => expect(result.current.games).toHaveLength(1));

    await act(async () => {
      await result.current.deleteGame('game-to-delete');
    });

    expect(backend.deleteGame).toHaveBeenCalledWith('game-to-delete');
    expect(result.current.games).toEqual([]);
  });
});
