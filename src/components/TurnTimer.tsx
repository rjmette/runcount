import React, { useState, useEffect, memo } from 'react';

interface TurnTimerProps {
  startTime: Date | string | null;
  isRunning?: boolean;
  shotClockSeconds?: number | null;
}

export const TurnTimer: React.FC<TurnTimerProps> = memo(
  ({ startTime, isRunning = true, shotClockSeconds = 15 }) => {
    const [elapsedSeconds, setElapsedSeconds] = useState(0);

    useEffect(() => {
      if (!startTime) {
        setElapsedSeconds(0);
        return;
      }

      const updateTimer = () => {
        const start = new Date(startTime);
        const now = new Date();
        const diff = now.getTime() - start.getTime();

        if (diff < 0) {
          setElapsedSeconds(0);
          return;
        }

        const minutes = Math.floor(diff / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setElapsedSeconds(minutes * 60 + seconds);
      };

      // Update immediately
      updateTimer();

      // Set up interval only if timer is running
      if (isRunning) {
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
      }
    }, [startTime, isRunning]);

    if (shotClockSeconds === null) {
      return (
        <div
          className="flex items-center gap-1 sm:gap-2 bg-slate-100 dark:bg-slate-800 px-2 py-1 sm:px-3 sm:py-2 rounded-lg"
          data-testid="turn-timer-disabled"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-500 dark:text-slate-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Shot Clock Off
          </span>
        </div>
      );
    }

    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = elapsedSeconds % 60;
    const elapsedTime =
      `${minutes.toString().padStart(2, '0')}:` +
      `${seconds.toString().padStart(2, '0')}`;
    const isOverLimit = elapsedSeconds >= shotClockSeconds;
    const isApproaching =
      !isOverLimit && elapsedSeconds >= Math.floor(shotClockSeconds * 0.75);
    // Three states: neutral (in budget), approaching (>=75%), over.
    const containerClasses = isOverLimit
      ? 'bg-red-100 dark:bg-red-900'
      : isApproaching
        ? 'bg-amber-100 dark:bg-amber-900/60'
        : 'bg-gray-100 dark:bg-gray-700';
    const iconClasses = isOverLimit
      ? 'text-red-600 dark:text-red-300'
      : isApproaching
        ? 'text-amber-600 dark:text-amber-300'
        : 'text-gray-500 dark:text-gray-300';
    const timeClasses = isOverLimit
      ? 'text-red-800 dark:text-red-100'
      : isApproaching
        ? 'text-amber-800 dark:text-amber-100'
        : 'text-gray-800 dark:text-gray-200';
    const badgeClasses = isOverLimit
      ? 'bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-100'
      : isApproaching
        ? 'bg-amber-200 text-amber-800 dark:bg-amber-800 dark:text-amber-100'
        : 'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200';

    return (
      <div
        className={`flex items-center gap-1 sm:gap-2 px-2 py-1 sm:px-3 sm:py-2 rounded-lg ${containerClasses}`}
        data-testid="turn-timer"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${iconClasses}`}
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
        <span className={`text-sm sm:text-lg font-mono font-bold ${timeClasses}`}>
          {elapsedTime}
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide sm:text-xs ${badgeClasses}`}
          aria-label={`Shot clock set to ${shotClockSeconds} seconds`}
        >
          {shotClockSeconds}s
        </span>
      </div>
    );
  },
);

TurnTimer.displayName = 'TurnTimer';
