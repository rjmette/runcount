import { useMemo, useState, type FC } from 'react';

import { type SupabaseClient, type User } from '@supabase/supabase-js';

import { MetricToggle, type MetricDefinition } from './components/MetricToggle';
import { PlayerSelector } from './components/PlayerSelector';
import { SummaryCards } from './components/SummaryCards';
import { TrendChart, type TrendSeries } from './components/TrendChart';
import { useTrendsData } from './hooks/useTrendsData';

import type { TrendMetric } from './utils/trendsData';

const METRIC_DECIMALS: Record<TrendMetric, number> = {
  bpi: 2,
  shootingPercentage: 0,
  highRun: 0,
  safetyEfficiency: 0,
};

const METRIC_UNITS: Record<TrendMetric, string> = {
  bpi: '',
  shootingPercentage: '%',
  highRun: '',
  safetyEfficiency: '%',
};

interface TrendsPageProps {
  supabase: SupabaseClient;
  user: User | null;
  onStartNewGame: () => void;
}

const METRIC_DEFINITIONS: MetricDefinition[] = [
  { key: 'bpi', label: 'BPI', color: '#2563eb' },
  { key: 'shootingPercentage', label: 'Shooting %', color: '#10b981' },
  { key: 'highRun', label: 'High Run', color: '#f59e0b' },
  { key: 'safetyEfficiency', label: 'Safety %', color: '#8b5cf6' },
];

const TRENDS_REQUIRED_GAMES = 3;
const TRENDS_DELTA_MIN_GAMES = 10;

const TrendsPage: FC<TrendsPageProps> = ({ supabase, user, onStartNewGame }) => {
  const {
    loading,
    error,
    playerOptions,
    selectedPlayerKey,
    setSelectedPlayerKey,
    selectedPlayer,
    trendPoints,
    summary,
    hasAnyCompletedGames,
  } = useTrendsData({ supabase, user });

  const [visibleMetrics, setVisibleMetrics] = useState<TrendMetric[]>(() =>
    METRIC_DEFINITIONS.map((metric) => metric.key),
  );

  const toggleMetric = (metric: TrendMetric) => {
    setVisibleMetrics((current) =>
      current.includes(metric)
        ? current.filter((entry) => entry !== metric)
        : [...current, metric],
    );
  };

  const visibleSeries = useMemo<TrendSeries[]>(
    () =>
      METRIC_DEFINITIONS.filter((metric) => visibleMetrics.includes(metric.key)).map(
        (metric) => ({
          key: metric.key,
          label: metric.label,
          color: metric.color,
          decimals: METRIC_DECIMALS[metric.key],
          unit: METRIC_UNITS[metric.key],
        }),
      ),
    [visibleMetrics],
  );

  if (loading) {
    return (
      <div
        className="flex items-center justify-center h-64"
        role="status"
        aria-label="Loading trends..."
      >
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
        <span className="sr-only">Loading trends...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }

  return (
    <div className="max-w-5xl w-full mx-auto my-auto">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="text-center sm:text-left">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Performance
          </p>
          <h2 className="mt-1 text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Trends
          </h2>
        </div>
        <button
          onClick={onStartNewGame}
          className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-800"
        >
          New Game
        </button>
      </div>

      {!hasAnyCompletedGames ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center text-gray-700 dark:text-gray-300">
          <p className="text-lg font-medium mb-2">No completed games yet</p>
          <p className="text-sm">
            Finish a game to start building your performance trends.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 flex flex-wrap items-center justify-between gap-4">
            <PlayerSelector
              options={playerOptions}
              selectedKey={selectedPlayerKey}
              onChange={setSelectedPlayerKey}
            />
            <MetricToggle
              metrics={METRIC_DEFINITIONS}
              visibleMetrics={visibleMetrics}
              onToggle={toggleMetric}
            />
          </div>

          {trendPoints.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center text-gray-700 dark:text-gray-300">
              <p className="text-sm">
                No completed games for {selectedPlayer?.displayName ?? 'this player'} yet.
              </p>
            </div>
          ) : (
            <>
              <SummaryCards
                summary={summary}
                hasEnoughForTrends={trendPoints.length >= TRENDS_DELTA_MIN_GAMES}
              />

              {trendPoints.length < TRENDS_REQUIRED_GAMES ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center text-gray-700 dark:text-gray-300">
                  <p className="text-sm">
                    Need at least {TRENDS_REQUIRED_GAMES} games to chart trends.
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {trendPoints.length} of {TRENDS_REQUIRED_GAMES} so far — keep playing.
                  </p>
                </div>
              ) : (
                <TrendChart data={trendPoints} series={visibleSeries} />
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default TrendsPage;
