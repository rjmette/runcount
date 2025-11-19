import React from 'react';

interface ConsecutiveFoulPenaltyModalProps {
  isOpen: boolean;
  playerName: string;
  onSelectPenalty: (penalty: 'regular' | 'threeFoul') => void;
  onCancel: () => void;
}

export const ConsecutiveFoulPenaltyModal: React.FC<ConsecutiveFoulPenaltyModalProps> = ({
  isOpen,
  playerName,
  onSelectPenalty,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-lg w-full dark:text-white">
        <h3 className="text-2xl font-bold mb-2 text-center">Confirm Foul Penalty</h3>
        <p className="text-center text-gray-600 dark:text-gray-300 mb-6">
          {playerName} was on two fouls. Choose whether this is a standard 1 point foul or
          a three-foul penalty requiring a re-break.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <button
            className="px-4 py-4 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-800 dark:text-blue-100 font-semibold rounded-md"
            onClick={() => onSelectPenalty('regular')}
          >
            1 Pt. Foul
            <p className="text-xs font-normal mt-1 text-gray-600 dark:text-gray-300">
              Record as a normal foul and keep play moving.
            </p>
          </button>
          <button
            className="px-4 py-4 bg-orange-100 hover:bg-orange-200 dark:bg-orange-900 dark:hover:bg-orange-800 text-orange-800 dark:text-orange-100 font-semibold rounded-md"
            onClick={() => onSelectPenalty('threeFoul')}
          >
            16 Pt. Foul
            <p className="text-xs font-normal mt-1 text-gray-600 dark:text-gray-300">
              Apply the 1 + 15 point swing (standard foul plus three-foul penalty) and
              require a full re-break.
            </p>
          </button>
        </div>

        <div className="flex justify-center">
          <button
            className="px-5 py-3 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-lg font-medium dark:text-gray-200"
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
