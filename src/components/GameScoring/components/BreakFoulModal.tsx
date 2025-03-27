import React from 'react';
import { Player } from '../../../types/game';

interface BreakFoulModalProps {
  show: boolean;
  onClose: () => void;
  onAcceptTable: () => void;
  onRequireReBreak: () => void;
  breaker: Player;
  incomingPlayer: Player;
}

export const BreakFoulModal: React.FC<BreakFoulModalProps> = ({
  show,
  onClose,
  onAcceptTable,
  onRequireReBreak,
  breaker,
  incomingPlayer,
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full p-6">
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Foul on the Break
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            {breaker.name} has fouled on the opening break.
          </p>
          <p className="text-gray-600 dark:text-gray-300 mt-2 font-medium">
            {incomingPlayer.name}, what would you like to do?
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={onAcceptTable}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Accept the table as-is
          </button>
          <button
            onClick={onRequireReBreak}
            className="w-full bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-white py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
          >
            Require {breaker.name} to break again
          </button>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
            Note: If {breaker.name} fouls again on the re-break, they will
            receive another 2-point penalty.
          </div>
        </div>
      </div>
    </div>
  );
};
