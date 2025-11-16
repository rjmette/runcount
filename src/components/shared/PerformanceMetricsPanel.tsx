import React from 'react';

import { type Player, type GameAction } from '../../types/game';

import { type StatCalculator } from './types';

interface PerformanceMetricsPanelProps {
  players: Player[];
  actions: GameAction[];
  winnerId?: number | null;
  calculatePlayerStats: StatCalculator;
  tooltipContent: Record<string, string>;
  onShowDescriptions: () => void;
}

export const PerformanceMetricsPanel: React.FC<PerformanceMetricsPanelProps> = ({
  players,
  actions,
  winnerId,
  calculatePlayerStats,
  tooltipContent,
  onShowDescriptions,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <svg
            className="w-6 h-6 text-blue-500 dark:text-blue-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <h3 className="text-lg font-semibold dark:text-white">Performance Metrics</h3>
        </div>
        <button
          onClick={onShowDescriptions}
          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
          title="View Statistic Descriptions"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </button>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-full inline-block align-middle">
          <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="w-32 px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"></th>
                  {[...players]
                    .sort((a, b) => {
                      if (a.id === winnerId) return -1;
                      if (b.id === winnerId) return 1;
                      return 0;
                    })
                    .map((player) => (
                      <th
                        key={player.id}
                        className="w-32 px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                      >
                        <div className="flex items-center">
                          <span>{player.name}</span>
                        </div>
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {Object.entries(tooltipContent).map(([statName]) => (
                  <tr key={statName} className="transition-colors duration-200">
                    <td className="w-32 px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {statName}
                      </div>
                    </td>
                    {[...players]
                      .sort((a, b) => {
                        if (a.id === winnerId) return -1;
                        if (b.id === winnerId) return 1;
                        return 0;
                      })
                      .map((player) => {
                        const stats = calculatePlayerStats(player, actions);
                        return (
                          <td
                            key={player.id}
                            className="w-32 px-4 py-3 whitespace-nowrap"
                          >
                            <div className="text-sm text-gray-900 dark:text-gray-300">
                              {statName === 'High Run' && player.highRun}
                              {statName === 'BPI' && stats.bpi}
                              {statName === 'Offensive BPI' && stats.offensiveBPI}
                              {statName === 'Shooting %' &&
                                `${stats.shootingPercentage}%`}
                              {statName === 'Safety Eff.' && `${stats.safetyEfficiency}%`}
                              {statName === 'Safeties' && player.safeties}
                              {statName === 'Misses' && player.missedShots}
                              {statName === 'Fouls' && player.fouls}
                            </div>
                          </td>
                        );
                      })}
                  </tr>
                ))}
                {/* Add rows for stats not in tooltipContent */}
                <tr className="transition-colors duration-200">
                  <td className="w-32 px-4 py-3 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      Safeties
                    </div>
                  </td>
                  {[...players]
                    .sort((a, b) => {
                      if (a.id === winnerId) return -1;
                      if (b.id === winnerId) return 1;
                      return 0;
                    })
                    .map((player) => (
                      <td key={player.id} className="w-32 px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-300">
                          {player.safeties}
                        </div>
                      </td>
                    ))}
                </tr>
                <tr className="transition-colors duration-200">
                  <td className="w-32 px-4 py-3 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      Misses
                    </div>
                  </td>
                  {[...players]
                    .sort((a, b) => {
                      if (a.id === winnerId) return -1;
                      if (b.id === winnerId) return 1;
                      return 0;
                    })
                    .map((player) => (
                      <td key={player.id} className="w-32 px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-300">
                          {player.missedShots}
                        </div>
                      </td>
                    ))}
                </tr>
                <tr className="transition-colors duration-200">
                  <td className="w-32 px-4 py-3 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      Fouls
                    </div>
                  </td>
                  {[...players]
                    .sort((a, b) => {
                      if (a.id === winnerId) return -1;
                      if (b.id === winnerId) return 1;
                      return 0;
                    })
                    .map((player) => (
                      <td key={player.id} className="w-32 px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-300">
                          {player.fouls}
                        </div>
                      </td>
                    ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
