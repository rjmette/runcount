import React from 'react';

interface BallsOnTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (value: number) => void;
  currentBallsOnTable: number;
  action: 'newrack' | 'foul' | 'safety' | 'miss' | null;
}

export const BallsOnTableModal: React.FC<BallsOnTableModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  currentBallsOnTable,
  action,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full dark:text-white">
        <h3 className="text-xl font-bold mb-4">
          How many balls are on the table?
        </h3>

        <div className="mb-6">
          <p className="mb-4 text-gray-600 dark:text-gray-300">
            {action === 'newrack'
              ? `How many balls are left on the table before racking? (0 or 1) Current balls on table: ${currentBallsOnTable}`
              : `Please enter the number of balls currently on the table (2-${currentBallsOnTable}):`}
          </p>

          <div className="grid grid-cols-5 gap-2">
            {action === 'newrack'
              ? // For new rack, only allow 0 or 1 balls
                [0, 1].map((num) => (
                  <button
                    key={num}
                    onClick={() => onSubmit(num)}
                    className="px-5 py-6 bg-blue-100 hover:bg-blue-200 text-blue-800 dark:bg-blue-900 dark:hover:bg-blue-800 dark:text-blue-200 font-medium text-2xl rounded-md"
                  >
                    {num}
                  </button>
                ))
              : // For other actions, create an array from 2 to current ballsOnTable
                Array.from(
                  { length: Math.max(0, currentBallsOnTable - 1) },
                  (_, i) => i + 2
                ).map((num) => (
                  <button
                    key={num}
                    onClick={() => onSubmit(num)}
                    className="px-5 py-6 bg-blue-100 hover:bg-blue-200 text-blue-800 dark:bg-blue-900 dark:hover:bg-blue-800 dark:text-blue-200 font-medium text-2xl rounded-md"
                  >
                    {num}
                  </button>
                ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-3 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-lg font-medium dark:text-gray-200"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
