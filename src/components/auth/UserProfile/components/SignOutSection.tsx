import React, { useState } from 'react';

interface SignOutSectionProps {
  onSignOut: () => Promise<void>;
}

export const SignOutSection: React.FC<SignOutSectionProps> = ({ onSignOut }) => {
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  const handleSignOut = async () => {
    setShowSignOutConfirm(false);
    await onSignOut();
  };

  return (
    <>
      {/* Sign out — demoted to a quiet outline pill in the page footer.
          The previous full-width red button gave a benign action the
          visual weight of a destructive one. */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={() => setShowSignOutConfirm(true)}
          className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 px-3 py-1.5 text-sm font-medium transition-colors"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          Sign out
        </button>
      </div>

      {showSignOutConfirm && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="signout-confirm-title"
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-sm p-5">
            <h3
              id="signout-confirm-title"
              className="text-base font-semibold text-gray-900 dark:text-white mb-2"
            >
              Sign out?
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              You'll need to sign back in to view your game history and profile.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowSignOutConfirm(false)}
                className="px-3 py-1.5 text-sm rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSignOut}
                className="px-3 py-1.5 text-sm rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
