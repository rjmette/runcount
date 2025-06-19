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
  const isGameCompleted = !!gameWinner;

  // Find highest run
  const highestRun = Math.max(...playerData.map(p => p.highRun));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full relative">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black bg-opacity-20 hover:bg-opacity-30 text-white transition-colors"
          aria-label="Close"
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
        
        {/* Header with celebration */}
        <div className={`p-6 text-center ${isGameCompleted ? 'bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600' : 'bg-gray-100 dark:bg-gray-700'} rounded-t-2xl`}>
          {isGameCompleted ? (
            <div className="text-white">
              <div className="text-6xl mb-2">🏆</div>
              <h2 className="text-3xl font-bold mb-2">Congratulations!</h2>
              <p className="text-xl font-semibold">{gameWinner.name} Wins!</p>
              <div className="flex items-center justify-center mt-2 space-x-4">
                <span className="text-2xl font-bold">{gameWinner.score}</span>
                <span className="text-lg">points</span>
              </div>
            </div>
          ) : (
            <div className="text-gray-800 dark:text-white">
              <div className="text-4xl mb-2">⏹️</div>
              <h2 className="text-2xl font-bold mb-2">End Game?</h2>
              <p className="text-gray-600 dark:text-gray-300">Are you sure you want to end this game?</p>
            </div>
          )}
        </div>

        {/* Game Overview */}
        <div className="p-6 bg-gray-50 dark:bg-gray-700">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{gameDuration}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Duration</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{currentInning}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Innings</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{highestRun}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">High Run</div>
            </div>
          </div>
        </div>

        {/* Player Results Summary */}
        <div className="p-6">
          <div className="space-y-3">
            {playerData.map((player) => {
              const isWinner = gameWinner?.id === player.id;
              return (
                <div key={player.id} className={`p-4 rounded-lg border-2 ${isWinner ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20' : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {isWinner && <span className="text-xl">👑</span>}
                      <h3 className="text-lg font-semibold dark:text-white">{player.name}</h3>
                    </div>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{player.score}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 bg-gray-50 dark:bg-gray-700">
          <button
            onClick={onEndGame}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
          >
            {isGameCompleted ? 'Continue' : 'End Game'}
          </button>
        </div>
      </div>
    </div>
  );
};