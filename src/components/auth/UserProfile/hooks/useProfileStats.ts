import { useEffect, useState } from 'react';

import type { GameBackend } from '../../../../backend/types';
import type { AppUser } from '../../../../types/auth';

export interface ProfileStatsState {
  loading: boolean;
  totalGames: number;
  lastGameDate: string | null;
}

export const useProfileStats = (
  backend: GameBackend,
  user: AppUser | undefined,
): ProfileStatsState => {
  const [stats, setStats] = useState<ProfileStatsState>({
    loading: true,
    totalGames: 0,
    lastGameDate: null,
  });

  useEffect(() => {
    if (!user) {
      setStats({ loading: false, totalGames: 0, lastGameDate: null });
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const data = await backend.getProfileStats(user);

        if (cancelled) return;
        setStats({
          loading: false,
          totalGames: data.totalGames,
          lastGameDate: data.lastGameDate,
        });
      } catch {
        if (!cancelled) {
          setStats({ loading: false, totalGames: 0, lastGameDate: null });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [backend, user]);

  return stats;
};
