import React from 'react';
import { Player } from '../../types/game';
import { StatCalculator } from './types';

interface GameStatusPanelProps {
  players: Player[];
  winnerId?: number | null;
  completed: boolean;
  date: string | Date;
  matchLength: string;
  calculatePlayerStats: StatCalculator;
  onCopyResults: () => void;
  onViewInnings?: () => void;
  copySuccess: boolean;
  actions: any[];
}

export const GameStatusPanel: React.FC<GameStatusPanelProps> = ({
  players,
  winnerId,
  completed,
  date,
  matchLength,
  calculatePlayerStats,
  onCopyResults,
  onViewInnings,
  copySuccess,
  actions,
}) => {
  const gameDate = new Date(date);
  const dayOfWeek = gameDate.toLocaleDateString('en-US', {
    weekday: 'short',
  });
  const formattedDate = gameDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  const formattedTime = gameDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <div className="bg-blue-50 dark:bg-blue-900 p-6 rounded-lg shadow-md mb-6 border-2 border-blue-500 dark:border-blue-600">
      {/* Top Row: Status and Date */}
      <div className="flex justify-between items-center mb-6">
        {/* Left side: Game Status */}
        <div
          className={`px-4 py-2 rounded-full text-sm font-medium ${
            completed
              ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
              : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
          }`}
        >
          {completed ? 'Completed' : 'In Progress'}
        </div>

        {/* Right side: Date */}
        <div className="text-blue-800 dark:text-blue-200 font-medium">
          {completed
            ? `${dayOfWeek}, ${formattedDate} ${formattedTime}`
            : 'Not completed'}
        </div>
      </div>

      {/* Player Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {[...players]
          .sort((a, b) => {
            if (a.id === winnerId) return -1;
            if (b.id === winnerId) return 1;
            return 0;
          })
          .map((player) => {
            const stats = calculatePlayerStats(player, actions);
            return (
              <div
                key={player.id}
                className={`p-4 rounded-lg ${
                  player.id === winnerId
                    ? 'bg-blue-200 dark:bg-blue-800 border-2 border-blue-300 dark:border-blue-700'
                    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="font-medium dark:text-white text-lg">
                    {player.name}
                  </div>
                  {player.id === winnerId && (
                    <div className="text-blue-600 dark:text-blue-400 font-medium flex items-center space-x-1">
                      <span className="text-yellow-500">🏆</span>
                      <span>Winner</span>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm dark:text-gray-300">
                  <div>
                    <span className="font-medium">Score:</span> {player.score}
                  </div>
                  <div>
                    <span className="font-medium">Target:</span>{' '}
                    {player.targetScore}
                  </div>
                  <div>
                    <span className="font-medium">High Run:</span>{' '}
                    {player.highRun}
                  </div>
                  <div>
                    <span className="font-medium">BPI:</span> {stats.bpi}
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      {/* Bottom Row: Stats and Action Buttons */}
      <div className="flex flex-col items-center space-y-4">
        {/* Game Stats */}
        <div className="flex items-center space-x-6 text-blue-800 dark:text-blue-200">
          <div className="flex items-center space-x-2">
            <span className="font-medium">Length:</span>
            <span>{matchLength}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-medium">Innings:</span>
            <span>{Math.max(...players.map((p) => p.innings))}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <button
            onClick={onCopyResults}
            className={`px-4 py-2 text-sm ${
              copySuccess
                ? 'bg-green-600 text-white'
                : 'bg-gray-600 text-white hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-800'
            } rounded-md transition-colors duration-200 flex items-center space-x-2`}
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
                d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
              />
            </svg>
            <span>{copySuccess ? 'Copied!' : 'Copy Results'}</span>
          </button>
          {onViewInnings && (
            <button
              onClick={onViewInnings}
              className="px-4 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-800 flex items-center space-x-2"
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
