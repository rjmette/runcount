import { renderHook, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

import { useProfileStats } from '../useProfileStats';

import type { GameBackend } from '../../../../../backend/types';
import type { AppUser } from '../../../../../types/auth';

describe('useProfileStats', () => {
  const user: AppUser = {
    id: 'user-1',
    email: 'player@example.com',
    created_at: '2026-01-01T00:00:00.000Z',
  };

  test('loads profile stats from the backend', async () => {
    const backend = {
      getProfileStats: vi.fn().mockResolvedValue({
        totalGames: 4,
        lastGameDate: '2026-03-01T12:00:00.000Z',
      }),
    } as unknown as GameBackend;

    const { result } = renderHook(() => useProfileStats(backend, user));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(backend.getProfileStats).toHaveBeenCalledWith(user);
    expect(result.current.totalGames).toBe(4);
    expect(result.current.lastGameDate).toBe('2026-03-01T12:00:00.000Z');
  });

  test('falls back to empty stats when the backend fails', async () => {
    const backend = {
      getProfileStats: vi.fn().mockRejectedValue(new Error('network')),
    } as unknown as GameBackend;

    const { result } = renderHook(() => useProfileStats(backend, user));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.totalGames).toBe(0);
    expect(result.current.lastGameDate).toBeNull();
  });
});
