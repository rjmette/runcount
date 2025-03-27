import React from 'react';
import { Player, GameAction } from '../../../types/game';
import { calculateGameDuration } from '../utils/calculations';

interface EndGameModalProps {
  isOpen: boolean;
  gameWinner: Player | null;
  playerData: Player[];
  currentInning: number;
  actions: GameAction[];
  onClose: () => void;
  onEndGame: () => void;
}

export const EndGameModal: React.FC<EndGameModalProps> = ({
  isOpen,
  gameWinner,
  playerData,
  currentInning,
  actions,
  onClose,
  onEndGame,
}) => {
  if (!isOpen) return null;

  const gameDuration = calculateGameDuration(actions);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full dark:text-white">
        <h3 className="text-xl font-bold mb-4">
          {gameWinner ? 'Game Over!' : 'End Game?'}
        </h3>

        {gameWinner && (
          <div className="mb-4">
            <p className="text-lg font-semibold text-green-600 dark:text-green-400">
              {gameWinner.name} wins!
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Final Score: {gameWinner.score}
            </p>
          </div>
        )}

        <div className="mb-6">
          <p className="text-gray-600 dark:text-gray-300">
            {gameWinner
              ? 'Would you like to start a new game?'
              : 'Are you sure you want to end this game?'}
          </p>
          <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            <p>Innings played: {currentInning}</p>
            <p>Game duration: {gameDuration}</p>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-5 py-3 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-lg font-medium dark:text-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={onEndGame}
            className="px-5 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-lg font-medium"
          >
            {gameWinner ? 'New Game' : 'End Game'}
          </button>
        </div>
      </div>
    </div>
  );
};
