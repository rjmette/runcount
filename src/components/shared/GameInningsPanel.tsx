import React from 'react';
import { Player, GameAction } from '../../types/game';
import { InningAction } from './types';

interface GameInningsPanelProps {
  inningActions: InningAction[];
  players: Player[];
  onViewInnings?: () => void;
}

export const GameInningsPanel: React.FC<GameInningsPanelProps> = ({
  inningActions,
  players,
  onViewInnings,
}) => {
  if (inningActions.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
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
              d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
            />
          </svg>
          <h3 className="text-lg font-semibold dark:text-white">
            Game Innings
          </h3>
        </div>
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
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            <span>View All Innings</span>
          </button>
        )}
      </div>

      <div className="max-h-72 overflow-y-auto overflow-x-auto bg-gray-50 dark:bg-gray-700 rounded">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10">
            <tr className="bg-gray-100 dark:bg-gray-800">
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">
                Inning
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">
                Player
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">
                Action
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">
                Run
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 font-semibold">
                Score
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">
                BOT
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">
                Time
              </th>
            </tr>
          </thead>
          <tbody>
            {inningActions.map((inning, idx) => {
              const player = players.find((p) => p.id === inning.playerId);
              const actionType = inning.endAction.type;
              const actionLabel =
                actionType.charAt(0).toUpperCase() + actionType.slice(1);

              return (
                <tr
                  key={idx}
                  className={`${
                    idx % 2 === 0
                      ? 'bg-white dark:bg-gray-800'
                      : 'bg-gray-50 dark:bg-gray-700'
                  } border-t dark:border-gray-600`}
                >
                  <td className="px-3 py-2 text-sm dark:text-gray-300">
                    {inning.inningNumber}
                  </td>
                  <td className="px-3 py-2 text-sm dark:text-gray-300">
                    {player?.name || 'Unknown'}
                  </td>
                  <td className="px-3 py-2 text-sm dark:text-gray-300">
                    {actionLabel}
                  </td>
                  <td className="px-3 py-2 text-sm">
                    <span
                      className={`${
                        inning.pointsInInning > 0
                          ? 'text-green-600 dark:text-green-400 font-medium'
                          : inning.pointsInInning < 0
                          ? 'text-red-600 dark:text-red-400 font-medium'
                          : 'text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {inning.pointsInInning > 0 &&
                      inning.endAction.type !== 'foul'
                        ? inning.pointsInInning
                        : inning.endAction.type === 'foul'
                        ? inning.pointsInInning + 1
                        : 0}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400">
                    {inning.currentScore}
                  </td>
                  <td className="px-3 py-2 text-sm dark:text-gray-300">
                    {inning.endAction.ballsOnTable}
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                    {inning.endTime.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
