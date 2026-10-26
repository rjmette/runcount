import React from 'react';

export const GameHistoryLoading: React.FC = () => (
  <div
    className="flex items-center justify-center h-64"
    role="status"
    aria-label="Loading game history..."
  >
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    <span className="sr-only">Loading game history...</span>
  </div>
);

interface GameHistoryErrorProps {
  message: string;
  onStartNewGame: () => void;
}

export const GameHistoryError: React.FC<GameHistoryErrorProps> = ({
  message,
  onStartNewGame,
}) => (
  <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded relative">
    <strong className="font-bold">Error!</strong>
    <span className="block sm:inline"> {message}</span>
    <div className="mt-4">
      <button
        onClick={onStartNewGame}
        className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-700 dark:hover:bg-blue-800"
      >
        Start New Game
      </button>
    </div>
  </div>
);
