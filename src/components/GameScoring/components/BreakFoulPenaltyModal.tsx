import React, { useEffect } from 'react';

interface BreakFoulPenaltyModalProps {
  show: boolean;
  onClose: () => void;
  onSelectPenalty: (penalty: 1 | 2) => void;
  playerName: string;
}

export const BreakFoulPenaltyModal: React.FC<BreakFoulPenaltyModalProps> = ({
  show,
  onClose,
  onSelectPenalty,
  playerName,
}) => {
  // Handle ESC key to close modal
  useEffect(() => {
    if (!show) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full p-6">
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1 text-center">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Break Foul Penalty
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              {playerName} fouled on the break.
            </p>
            <p className="text-gray-600 dark:text-gray-300 mt-2 font-medium">
              What type of foul occurred?
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 ml-4"
            aria-label="Cancel"
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

        <div className="space-y-4">
          <button
            onClick={() => onSelectPenalty(1)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <div className="font-bold text-lg mb-1">Scratch on Legal Break (-1 point)</div>
            <div className="text-sm opacity-90">
              Break requirement met, but scratched
            </div>
          </button>
          <button
            onClick={() => onSelectPenalty(2)}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            <div className="font-bold text-lg mb-1">Illegal Break (-2 points)</div>
            <div className="text-sm opacity-90">
              Break requirement NOT met
            </div>
          </button>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-left space-y-2">
            <p className="font-semibold">Break requirement:</p>
            <ul className="list-disc list-inside ml-2 space-y-1">
              <li>Pocket a ball, OR</li>
              <li>Cue ball + 2 object balls hit a rail</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
