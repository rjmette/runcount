import React from 'react';

import { type Player, type GameAction } from '../../types/game';

import { type StatCalculator, type PlayerStats } from './types';

interface GameSummaryPanelProps {
  players: Player[];
  winnerId?: number | null;
  completed: boolean;
  date: string | Date;
  matchLength: string;
  calculatePlayerStats: StatCalculator;
  actions: GameAction[];
  tooltipContent: Record<string, string>;
  onCopyResults: () => void;
  onViewInnings?: () => void;
  onShowDescriptions: () => void;
  copySuccess: boolean;
}

interface MetricRow {
  label: string;
  getValue: (player: Player, stats: PlayerStats) => string | number;
}

const METRICS: MetricRow[] = [
  { label: 'High Run', getValue: (p) => p.highRun },
  { label: 'BPI', getValue: (_p, s) => s.bpi },
  { label: 'Offensive BPI', getValue: (_p, s) => s.offensiveBPI },
  { label: 'Shooting %', getValue: (_p, s) => `${s.shootingPercentage}%` },
  { label: 'Safety Eff.', getValue: (_p, s) => `${s.safetyEfficiency}%` },
  { label: 'Safeties', getValue: (p) => p.safeties },
  { label: 'Misses', getValue: (p) => p.missedShots },
  { label: 'Fouls', getValue: (p) => p.fouls },
];

export const GameSummaryPanel: React.FC<GameSummaryPanelProps> = ({
  players,
  winnerId,
  completed,
  date,
  matchLength,
  calculatePlayerStats,
  actions,
  onCopyResults,
  onViewInnings,
  onShowDescriptions,
  copySuccess,
}) => {
  const gameDate = new Date(date);
  const dayOfWeek = gameDate.toLocaleDateString('en-US', { weekday: 'short' });
  const formattedDate = gameDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  const formattedTime = gameDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const sortedPlayers = [...players].sort((a, b) => {
    if (a.id === winnerId) return -1;
    if (b.id === winnerId) return 1;
    return 0;
  });

  // Compute stats once per player
  const statsMap = new Map<number, PlayerStats>();
  sortedPlayers.forEach((player) => {
    statsMap.set(player.id, calculatePlayerStats(player, actions));
  });

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6 overflow-hidden"
      data-testid="game-summary-panel"
    >
      {/* Status Header */}
      <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100 dark:border-gray-700">
        <div
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            completed
              ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
              : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
          }`}
        >
          {completed ? 'Completed' : 'In Progress'}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {completed
            ? `${dayOfWeek}, ${formattedDate} ${formattedTime}`
            : 'Not completed'}
        </div>
      </div>

      {/* Score Cards */}
      <div className="grid grid-cols-2 gap-3 p-4">
        {sortedPlayers.map((player) => (
          <div
            key={player.id}
            className={`p-3 rounded-lg ${
              player.id === winnerId
                ? 'border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                : 'border-l-4 border-transparent bg-gray-50 dark:bg-gray-700/50'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-sm dark:text-white">{player.name}</span>
              {player.id === winnerId && (
                <span className="text-yellow-500 text-sm">🏆</span>
              )}
            </div>
            <div className="text-2xl font-bold dark:text-white">
              {player.score}
              <span className="text-sm font-normal text-gray-400 dark:text-gray-500">
                {' '}
                / {player.targetScore}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Metrics Table */}
      <div className="px-4 pb-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Performance
          </span>
          <button
            onClick={onShowDescriptions}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="View Statistic Descriptions"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>
        </div>
        <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"></th>
                {sortedPlayers.map((player) => (
                  <th
                    key={player.id}
                    className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    {player.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {METRICS.map((metric) => (
                <tr key={metric.label}>
                  <td className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    {metric.label}
                  </td>
                  {sortedPlayers.map((player) => {
                    const stats = statsMap.get(player.id)!;
                    return (
                      <td
                        key={player.id}
                        className="px-3 py-2 text-sm text-gray-900 dark:text-gray-200"
                      >
                        {metric.getValue(player, stats)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer: Meta + Actions */}
      <div className="flex flex-col items-center gap-3 px-4 py-3 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          <span>
            <span className="font-medium">Length:</span> {matchLength}
          </span>
          <span>
            <span className="font-medium">Innings:</span>{' '}
            {Math.max(...players.map((p) => p.innings))}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onCopyResults}
            className={`px-3 py-1.5 text-sm rounded-md flex items-center gap-1.5 transition-colors ${
              copySuccess
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
              />
            </svg>
            <span>{copySuccess ? 'Copied!' : 'Copy Results'}</span>
          </button>
          {onViewInnings && (
            <button
              onClick={onViewInnings}
              className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center gap-1.5 transition-colors"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <span>View Innings</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
