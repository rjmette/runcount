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
      'Re-rack and keep shooting. Available at any time during a run — tap it when you reach the end of a rack, then record how many balls were left (the break ball carries into the new rack).',
  },
  {
    term: 'Break',
    description:
      'Shows who opens the match and who must re-break after a re-break penalty.',
  },
];

const scoringRules = [
  '1 point per ball legally pocketed (WPA 4.7).',
  'Standard foul: −1 point (WPA 4.9).',
  'Illegal break: −2 points; a scratch on an otherwise legal break is a −1 standard foul (WPA 4.3/4.10).',
  'Three consecutive standard fouls: −1 for the third foul plus an extra −15, then all 15 balls are re-racked and the offender re-breaks. Breaking fouls do not count toward the three (WPA 4.11).',
  'Re-rack after 14 balls are pocketed; the 15th stays as the break ball (WPA 4.2/4.4).',
];

const WPA_RULES_URL = 'https://wpapool.com/rules-of-play/';

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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full p-6 dark:text-white max-h-[90vh] overflow-y-auto">
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

        <div className="mt-6">
          <h4 className="font-semibold text-gray-900 dark:text-white">
            Scoring at a glance
          </h4>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-600 dark:text-gray-300">
            {scoringRules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
            Full ruleset:{' '}
            <a
              href={WPA_RULES_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-blue-600 underline hover:text-blue-700 dark:text-blue-400"
            >
              WPA Official Rules of Play
            </a>{' '}
            (Section 4, 14.1 Continuous Pool).
          </p>
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
