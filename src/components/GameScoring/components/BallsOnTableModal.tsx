import React, { useMemo } from 'react';

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
  if (!isOpen || !action) return null;

  const isRackAction = action === 'newrack';
  if (
    process.env.NODE_ENV !== 'production' &&
    typeof currentBallsOnTable === 'number' &&
    currentBallsOnTable < 0
  ) {
    console.warn('BallsOnTableModal received negative currentBallsOnTable value');
  }
  const maxAvailableBalls = currentBallsOnTable < 0 ? 0 : currentBallsOnTable;

  const availableValues = useMemo(() => {
    return isRackAction
      ? [0, 1]
      : Array.from({ length: maxAvailableBalls + 1 }, (_, i) => i);
  }, [isRackAction, maxAvailableBalls]);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="balls-on-table-title"
      data-testid="balls-on-table-modal"
    >
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-sm w-full mx-4 dark:text-white">
        <h3 id="balls-on-table-title" className="text-xl font-bold mb-4">
          Balls on table?
        </h3>

        <div className="grid grid-cols-4 gap-3 mb-6" data-testid="bot-grid">
          {availableValues.map((num) => (
            <button
              key={num}
              onClick={() => onSubmit(num)}
              className="aspect-square rounded-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-100 font-bold text-xl flex items-center justify-center transition-colors"
            >
              {num}
            </button>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-lg font-medium text-gray-600 dark:text-gray-300 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
