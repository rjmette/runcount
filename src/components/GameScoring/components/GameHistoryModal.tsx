import React from 'react';

import { type Player, type GameAction } from '../../../types/game';
import { calculateInningActions } from '../../GameHistory/utils/calculations';
import { RelativeTime } from '../../shared/RelativeTime';

interface GameHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerData: Player[];
  actions: GameAction[];
}

export const GameHistoryModal: React.FC<GameHistoryModalProps> = ({
  isOpen,
  onClose,
  playerData,
  actions,
}) => {
  if (!isOpen) return null;

  const inningActions = calculateInningActions(actions, playerData);

  // Sort innings in descending order (most recent first)
  const sortedInnings = [...inningActions].sort((a, b) => {
    // First sort by inning number (descending)
    if (b.inningNumber !== a.inningNumber) {
      return b.inningNumber - a.inningNumber;
    }
    // If same inning, sort by time (descending)
    return b.endTime.getTime() - a.endTime.getTime();
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-auto dark:text-white">
        <h3 className="text-xl font-bold mb-4">Game History</h3>

        <div className="mb-6">
          <div className="max-h-96 overflow-y-auto overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 z-10">
                <tr className="bg-gray-100 dark:bg-gray-700">
                  <th className="px-4 py-2 text-left">Inning</th>
                  <th className="px-4 py-2 text-left">Player</th>
                  <th className="px-4 py-2 text-left">Action</th>
                  <th className="px-4 py-2 text-left">Run</th>
                  <th className="px-4 py-2 text-left font-semibold">Score</th>
                  <th className="px-4 py-2 text-left">BOT</th>
                  <th className="px-4 py-2 text-left">Time</th>
                </tr>
              </thead>
              <tbody>
                {sortedInnings.map((inning, idx) => {
                  const player = playerData.find((p) => p.id === inning.playerId);
                  const actionType = inning.endAction.type;
                  const actionLabel =
                    actionType.charAt(0).toUpperCase() + actionType.slice(1);

                  return (
                    <tr
                      key={idx}
                      className={`${
                        idx % 2 === 0
                          ? 'bg-white dark:bg-gray-800'
                          : 'bg-gray-50 dark:bg-gray-900'
                      } border-t dark:border-gray-700`}
                    >
                      <td className="px-4 py-2">{inning.inningNumber}</td>
                      <td className="px-4 py-2">{player?.name || 'Unknown'}</td>
                      <td className="px-4 py-2">
                        {actionLabel}
                        {inning.endAction.reBreak && (
                          <span className="ml-1 text-red-500 dark:text-red-400 font-medium">
                            (Re-Break)
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        {inning.pointsInInning > 0 && inning.endAction.type !== 'foul'
                          ? inning.pointsInInning
                          : inning.endAction.type === 'foul'
                            ? inning.pointsInInning + 1
                            : 0}
                      </td>
                      <td className="px-4 py-2 font-medium text-blue-600 dark:text-blue-400">
                        {inning.currentScore}
                      </td>
                      <td className="px-4 py-2">{inning.endAction.ballsOnTable}</td>
                      <td className="px-4 py-2">
                        <RelativeTime date={inning.endTime} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-lg font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
