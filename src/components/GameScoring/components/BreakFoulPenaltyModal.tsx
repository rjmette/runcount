import React from 'react';

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
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full p-6">
        <div className="text-center mb-6">
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

        <div className="space-y-4">
          <button
            onClick={() => onSelectPenalty(1)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <div className="font-bold text-lg mb-1">1-Point Foul</div>
            <div className="text-sm opacity-90">
              Break requirement met, but scratched
            </div>
          </button>
          <button
            onClick={() => onSelectPenalty(2)}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            <div className="font-bold text-lg mb-1">2-Point Foul</div>
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
