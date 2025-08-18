import React from 'react';
import { useError } from '../../context/ErrorContext';

export const ErrorBanner: React.FC = () => {
  const { errors, clearError, clearAll } = useError();

  if (!errors.length) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-1rem)] max-w-xl space-y-2">
      {errors.map((e) => (
        <div
          key={e.id}
          className="flex items-start justify-between gap-3 rounded-lg border border-red-300 bg-red-50 p-3 text-red-800 shadow dark:border-red-700 dark:bg-red-900/80 dark:text-red-100"
          role="alert"
          aria-live="assertive"
        >
          <div className="flex items-start gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-5 w-5 mt-0.5"
            >
              <path
                fillRule="evenodd"
                d="M18 10A8 8 0 11 2 10a8 8 0 0116 0zM9 7a1 1 0 012 0v4a1 1 0 11-2 0V7zm1 8a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm">{e.message}</span>
          </div>
          <button
            onClick={() => clearError(e.id)}
            className="rounded p-1 text-red-700 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-400 dark:text-red-200 dark:hover:bg-red-800"
            aria-label="Dismiss error"
            title="Dismiss"
          >
            ✕
          </button>
        </div>
      ))}
      {errors.length > 1 && (
        <div className="flex justify-end">
          <button
            onClick={clearAll}
            className="rounded bg-red-600 px-3 py-1 text-sm text-white shadow hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400"
            aria-label="Dismiss all errors"
          >
            Dismiss all
          </button>
        </div>
      )}
    </div>
  );
};

export default ErrorBanner;
