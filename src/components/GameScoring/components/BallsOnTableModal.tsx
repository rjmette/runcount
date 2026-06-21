import React, { useMemo } from 'react';

const MIN_SELECTABLE_BALLS = 2;
const NEW_RACK_ENDING_VALUES = [0, 1] as const;

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
  const maxAvailableBalls =
    currentBallsOnTable < MIN_SELECTABLE_BALLS
      ? MIN_SELECTABLE_BALLS
      : currentBallsOnTable;

  const availableValues = useMemo(() => {
    // Starting a new rack means the shooter cleared the rack — they left either
    // the break ball (1, the common case) or nothing (0). Turn-ending actions
    // (miss/safety/foul) never go below two balls.
    if (isRackAction) {
      return [...NEW_RACK_ENDING_VALUES];
    }

    return Array.from(
      { length: maxAvailableBalls - MIN_SELECTABLE_BALLS + 1 },
      (_, index) => index + MIN_SELECTABLE_BALLS,
    );
  }, [isRackAction, maxAvailableBalls]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-3 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="balls-on-table-title"
      data-testid="balls-on-table-modal"
    >
      <div className="w-full max-w-md rounded-xl bg-white p-4 shadow-2xl dark:bg-gray-800 dark:text-white sm:p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 id="balls-on-table-title" className="text-2xl font-black">
              Balls left
            </h3>
            <p className="mt-1 text-sm font-medium text-gray-600 dark:text-gray-300">
              Tap the count remaining on the table.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg border border-gray-300 px-3 py-2 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700 dark:focus:ring-gray-900"
          >
            Cancel
          </button>
        </div>

        <div
          className="grid grid-cols-4 gap-3 rounded-2xl bg-emerald-950 p-3 shadow-inner shadow-black/30 dark:bg-emerald-950"
          data-testid="bot-grid"
        >
          {availableValues.map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => onSubmit(num)}
              className="flex aspect-square items-center justify-center rounded-full border-4 border-white/90 bg-gray-50 font-mono text-3xl font-black leading-none text-gray-950 shadow-md shadow-black/30 transition-transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300 active:scale-95 dark:border-gray-100 dark:bg-gray-100 dark:text-gray-950 sm:text-4xl"
            >
              {num}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full rounded-lg border border-gray-300 py-4 text-lg font-black text-gray-700 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700 dark:focus:ring-gray-900"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
