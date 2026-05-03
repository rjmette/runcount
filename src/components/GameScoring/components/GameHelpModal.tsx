import React from 'react';

interface GameHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const helpItems = [
  {
    term: 'BOT',
    description:
      'Balls on Table. When a turn ends, enter how many object balls remain so the app can calculate the completed run.',
  },
  {
    term: 'BPI',
    description:
      'Balls Per Inning, a simple pace stat based on total points and innings.',
  },
  {
    term: 'Miss',
    description:
      'Ends the inning without an intentional safety. Record the balls still on the table.',
  },
  {
    term: 'Safety',
    description:
      'Ends the inning with a defensive shot. Use it when the shot was intentionally safe rather than a miss.',
  },
  {
    term: 'Foul',
    description:
      'Records a penalty shot. On the opening break, the app will ask whether it was a legal-break scratch or an illegal break.',
  },
  {
    term: '+Rack',
    description:
      'Use when the shooter reaches the end of the rack and continues after the re-rack hold-out decision.',
  },
  {
    term: 'Break',
    description:
      'Shows who opens the match and who must re-break after a re-break penalty.',
  },
];

export const GameHelpModal: React.FC<GameHelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="game-help-title"
      data-testid="game-help-modal"
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full p-6 dark:text-white">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h3 id="game-help-title" className="text-xl font-bold">
              14.1 Straight Pool Help
            </h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              RunCount is a live straight-pool scorekeeper. At the end of each turn,
              record what happened and how many balls remain on the table.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            aria-label="Close help"
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
          {helpItems.map((item) => (
            <div
              key={item.term}
              className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0"
            >
              <h4 className="font-semibold text-gray-900 dark:text-white">{item.term}</h4>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                {item.description}
              </p>
            </div>
          ))}
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
