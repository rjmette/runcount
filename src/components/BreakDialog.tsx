import React, { useState } from 'react';

interface BreakDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onChangeBreaker: (playerId: number) => void;
  players: string[];
  currentBreakingPlayerId: number;
}

const BreakDialog: React.FC<BreakDialogProps> = ({
  isOpen,
  onClose,
  onChangeBreaker,
  players,
  currentBreakingPlayerId,
}) => {
  const [selectedBreakingPlayerId, setSelectedBreakingPlayerId] = useState<number>(currentBreakingPlayerId);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onChangeBreaker(selectedBreakingPlayerId);
    onClose();
  };

  const handleCancel = () => {
    setSelectedBreakingPlayerId(currentBreakingPlayerId); // Reset to current
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-sm sm:max-w-md w-full relative">
        <button
          onClick={handleCancel}
          className="absolute top-3 right-3 z-10 w-7 h-7 flex items-center justify-center rounded-full bg-black bg-opacity-20 hover:bg-opacity-30 text-white transition-colors"
          aria-label="Close"
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
        
        {/* Header */}
        <div className="p-4 sm:p-6 text-center bg-gray-100 dark:bg-gray-700 rounded-t-2xl">
          <div className="text-gray-800 dark:text-white">
            <div className="text-3xl sm:text-4xl mb-1 sm:mb-2">🔄</div>
            <h2 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">Change Breaking Player</h2>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">Select who should break</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Player Selection */}
          <div className="p-3 sm:p-4">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelectedBreakingPlayerId(0)}
                className={`p-3 sm:p-4 rounded-lg border-2 text-sm sm:text-base font-medium transition-colors ${
                  selectedBreakingPlayerId === 0
                    ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                    : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                {players[0]} Breaks
              </button>
              <button
                type="button"
                onClick={() => setSelectedBreakingPlayerId(1)}
                className={`p-3 sm:p-4 rounded-lg border-2 text-sm sm:text-base font-medium transition-colors ${
                  selectedBreakingPlayerId === 1
                    ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                    : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                {players[1]} Breaks
              </button>
            </div>
          </div>

          {/* Action Button */}
          <div className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-700 rounded-b-2xl">
            <button
              type="submit"
              className="w-full py-2.5 sm:py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors text-sm sm:text-base"
            >
              Select
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BreakDialog;