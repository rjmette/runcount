import React from 'react';

interface ProfileStatusMessagesProps {
  error: string | null;
  message: string | null;
}

export const ProfileStatusMessages: React.FC<ProfileStatusMessagesProps> = ({
  error,
  message,
}) => (
  <>
    {error && (
      <div
        role="alert"
        className="mb-4 rounded-lg border border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/30 px-4 py-2.5 text-sm text-red-700 dark:text-red-200"
      >
        {error}
      </div>
    )}
    {message && (
      <div
        role="status"
        className="mb-4 rounded-lg border border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/30 px-4 py-2.5 text-sm text-green-700 dark:text-green-200"
      >
        {message}
      </div>
    )}
  </>
);
