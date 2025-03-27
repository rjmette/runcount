import React from 'react';

interface StatDescriptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  descriptions: Record<string, string>;
}

export const StatDescriptionsModal: React.FC<StatDescriptionsModalProps> = ({
  isOpen,
  onClose,
  descriptions,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold dark:text-white">
            Statistic Descriptions
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
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
          {Object.entries(descriptions).map(([statName, description]) => (
            <div
              key={statName}
              className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0"
            >
              <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                {statName}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
