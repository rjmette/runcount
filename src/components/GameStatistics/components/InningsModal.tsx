import React from 'react';
import { GameAction, Player } from '../../../types/game';
import { calculateInningActions } from '../../GameHistory/utils/calculations';

interface InningsModalProps {
  isOpen: boolean;
  onClose: () => void;
  actions: GameAction[];
  players: Player[];
}

export const InningsModal: React.FC<InningsModalProps> = ({
  isOpen,
  onClose,
  actions,
  players,
}) => {
  if (!isOpen) return null;

  const inningActions = calculateInningActions(actions, players);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-auto dark:text-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Game Innings</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
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
    </div>
  );
};
