import React, { useState, useEffect, memo } from 'react';

interface TurnTimerProps {
  startTime: Date | string | null;
  isRunning?: boolean;
}

export const TurnTimer: React.FC<TurnTimerProps> = memo(
  ({ startTime, isRunning = true }) => {
    const [elapsedTime, setElapsedTime] = useState<string>('00:00');

    useEffect(() => {
      if (!startTime) {
        setElapsedTime('00:00');
        return;
      }

      const updateTimer = () => {
        const start = new Date(startTime);
        const now = new Date();
        const diff = now.getTime() - start.getTime();

        if (diff < 0) {
          setElapsedTime('00:00');
          return;
        }

        const minutes = Math.floor(diff / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        const formattedTime =
          `${minutes.toString().padStart(2, '0')}:` +
          `${seconds.toString().padStart(2, '0')}`;

        setElapsedTime(formattedTime);
      };

      // Update immediately
      updateTimer();

      // Set up interval only if timer is running
      if (isRunning) {
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
      }
    }, [startTime, isRunning]);

    return (
      <div className="flex items-center gap-2 bg-orange-100 dark:bg-orange-900 px-3 py-2 rounded-lg">
        <div className="flex items-center gap-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 text-orange-600 dark:text-orange-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="text-xs font-semibold text-orange-700 dark:text-orange-300">
            TURN
          </span>
        </div>
        <span className="text-lg font-mono font-bold text-orange-800 dark:text-orange-200">
          {elapsedTime}
        </span>
      </div>
    );
  },
);

TurnTimer.displayName = 'TurnTimer';
