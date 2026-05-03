import type { FC } from 'react';

import type { MetricSummary, TrendDirection, TrendsSummary } from '../utils/trendsData';

const formatNumber = (value: number, decimals = 2) => {
  if (!Number.isFinite(value)) return '—';
  return value.toFixed(decimals);
};

const formatPercent = (value: number, decimals = 0) => {
  if (!Number.isFinite(value)) return '—';
  return `${value.toFixed(decimals)}%`;
};

const directionLabel = (direction: TrendDirection) => {
  if (direction === 'up') return '▲';
  if (direction === 'down') return '▼';
  return '–';
};

const directionClass = (direction: TrendDirection, invert = false) => {
  if (direction === 'flat') return 'text-gray-500 dark:text-gray-400';
  const positive = invert ? direction === 'down' : direction === 'up';
  return positive
    ? 'text-emerald-600 dark:text-emerald-400'
    : 'text-rose-600 dark:text-rose-400';
};

interface CardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: { metric: MetricSummary; format: (value: number) => string; invert?: boolean };
}

const Card: FC<CardProps> = ({ title, value, subtitle, trend }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
      {title}
    </p>
    <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{value}</p>
    {subtitle && (
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
    )}
    {trend && (
      <p
        className={`text-xs mt-2 flex items-center gap-1 ${directionClass(
          trend.metric.direction,
          trend.invert,
        )}`}
      >
        <span aria-hidden>{directionLabel(trend.metric.direction)}</span>
        <span>
          {trend.metric.direction === 'flat'
            ? 'Trend steady (last 5 vs prior 5)'
            : `${trend.format(Math.abs(trend.metric.recentDelta))} vs prior 5 games`}
        </span>
      </p>
    )}
  </div>
);

interface SummaryCardsProps {
  summary: TrendsSummary;
  hasEnoughForTrends: boolean;
}

export const SummaryCards: FC<SummaryCardsProps> = ({ summary, hasEnoughForTrends }) => {
  const winRatePct = summary.winRate * 100;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <Card
        title="Average BPI"
        value={formatNumber(summary.bpi.average, 2)}
        subtitle={`Best ${formatNumber(summary.bpi.best, 2)} • ${summary.totalGames} games`}
        trend={
          hasEnoughForTrends
            ? { metric: summary.bpi, format: (value) => formatNumber(value, 2) }
            : undefined
        }
      />
      <Card
        title="Shooting %"
        value={formatPercent(summary.shootingPercentage.average, 0)}
        subtitle={`Best ${formatPercent(summary.shootingPercentage.best, 0)}`}
        trend={
          hasEnoughForTrends
            ? {
                metric: summary.shootingPercentage,
                format: (value) => formatPercent(value, 0),
              }
            : undefined
        }
      />
      <Card
        title="High Run"
        value={formatNumber(summary.highRun.best, 0)}
        subtitle={`Avg ${formatNumber(summary.highRun.average, 1)}`}
        trend={
          hasEnoughForTrends
            ? { metric: summary.highRun, format: (value) => formatNumber(value, 1) }
            : undefined
        }
      />
      <Card
        title="Win rate"
        value={summary.totalGames === 0 ? '—' : formatPercent(winRatePct, 0)}
        subtitle={`${summary.wins} of ${summary.totalGames} games`}
      />
    </div>
  );
};
