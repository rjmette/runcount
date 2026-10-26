import React from 'react';

interface SuccessAnimationProps {
  visible: boolean;
}

export const SuccessAnimation: React.FC<SuccessAnimationProps> = ({ visible }) => {
  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      role="status"
      aria-live="polite"
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-sm w-full text-center">
        <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-7 h-7 text-green-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <p className="text-gray-900 dark:text-white font-semibold">Success!</p>
        <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
          Your changes have been saved.
        </p>
      </div>
    </div>
  );
};
