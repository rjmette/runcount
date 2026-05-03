import { useEffect, useMemo, useState } from 'react';

import { type SupabaseClient, type User } from '@supabase/supabase-js';

import { useGameHistory } from '../../GameHistory/hooks/useGameHistory';
import {
  buildPlayerTrendData,
  buildTrendsSummary,
  getTrendsPlayerOptions,
  type PlayerOption,
  type PlayerTrendPoint,
  type TrendsSummary,
} from '../utils/trendsData';

interface UseTrendsDataParams {
  supabase: SupabaseClient;
  user: User | null;
}

interface UseTrendsDataResult {
  loading: boolean;
  error: string;
  playerOptions: PlayerOption[];
  selectedPlayerKey: string;
  setSelectedPlayerKey: (key: string) => void;
  selectedPlayer: PlayerOption | null;
  trendPoints: PlayerTrendPoint[];
  summary: TrendsSummary;
  hasAnyCompletedGames: boolean;
}

export const useTrendsData = ({
  supabase,
  user,
}: UseTrendsDataParams): UseTrendsDataResult => {
  const { games, loading, error } = useGameHistory({ supabase, user });

  const playerOptions = useMemo(() => getTrendsPlayerOptions(games), [games]);
  const [selectedPlayerKey, setSelectedPlayerKey] = useState<string>('');

  useEffect(() => {
    if (playerOptions.length === 0) {
      if (selectedPlayerKey !== '') {
        setSelectedPlayerKey('');
      }
      return;
    }

    if (!playerOptions.some((option) => option.key === selectedPlayerKey)) {
      setSelectedPlayerKey(playerOptions[0].key);
    }
  }, [playerOptions, selectedPlayerKey]);

  const trendPoints = useMemo(
    () => buildPlayerTrendData(games, selectedPlayerKey),
    [games, selectedPlayerKey],
  );
  const summary = useMemo(() => buildTrendsSummary(trendPoints), [trendPoints]);

  const selectedPlayer =
    playerOptions.find((option) => option.key === selectedPlayerKey) ?? null;

  return {
    loading,
    error: error || '',
    playerOptions,
    selectedPlayerKey,
    setSelectedPlayerKey,
    selectedPlayer,
    trendPoints,
    summary,
    hasAnyCompletedGames: playerOptions.length > 0,
  };
};
