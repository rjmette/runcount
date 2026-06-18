import React, { useState, useEffect, memo } from 'react';

interface GameStatusBarProps {
  ballsOnTable: number;
  currentInning: number;
  rackNumber: number;
  turnStartTime: Date | null;
  isRunning: boolean;
  shotClockSeconds: number | null;
}

export const GameStatusBar: React.FC<GameStatusBarProps> = memo(
  ({
    ballsOnTable,
    currentInning,
    rackNumber,
    turnStartTime,
    isRunning,
    shotClockSeconds,
  }) => {
    const [elapsedSeconds, setElapsedSeconds] = useState(0);

    useEffect(() => {
      if (!turnStartTime) {
        setElapsedSeconds(0);
        return;
      }

      const update = () => {
        const start = new Date(turnStartTime);
        const diff = new Date().getTime() - start.getTime();
        setElapsedSeconds(diff < 0 ? 0 : Math.floor(diff / 1000));
      };

      update();

      if (isRunning) {
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
      }
    }, [turnStartTime, isRunning]);

    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = elapsedSeconds % 60;
    const turnTime =
      `${minutes.toString().padStart(2, '0')}:` +
      `${seconds.toString().padStart(2, '0')}`;

    const hasLimit = shotClockSeconds !== null;
    const isOverLimit = hasLimit && elapsedSeconds >= (shotClockSeconds ?? 0);
    const isApproaching =
      hasLimit &&
      !isOverLimit &&
      elapsedSeconds >= Math.floor((shotClockSeconds ?? 0) * 0.75);

    const timerTextColor = isOverLimit
      ? 'text-red-600 dark:text-red-300'
      : isApproaching
        ? 'text-amber-600 dark:text-amber-300'
        : 'text-blue-600 dark:text-blue-300';

    const timerBadgeCls = isOverLimit
      ? 'bg-red-100 text-red-700 dark:bg-red-700/70 dark:text-red-100'
      : isApproaching
        ? 'bg-amber-100 text-amber-700 dark:bg-amber-700/70 dark:text-amber-100'
        : 'bg-blue-50 text-blue-700 dark:bg-white/10 dark:text-gray-300';

    return (
      <div className="mt-3 flex items-center gap-0 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
        {/* Balls on Table */}
        <div className="flex flex-1 flex-col items-center gap-0.5">
          <span className="text-[10px] font-bold uppercase text-gray-500 dark:text-slate-400">
            Balls on Table
          </span>
          <span
            className="font-mono text-3xl font-black leading-none text-gray-900 dark:text-white"
            data-testid="bot-indicator"
            aria-label={`Balls on Table: ${ballsOnTable}`}
          >
            {ballsOnTable}
          </span>
        </div>

        {/* Divider */}
        <div className="mx-3 w-px flex-shrink-0 self-stretch bg-gray-200 dark:bg-slate-700" />

        {/* Turn Timer */}
        <div className="flex flex-1 flex-col items-center gap-0.5">
          <span className="text-[10px] font-bold uppercase text-gray-500 dark:text-slate-400">
            Turn
          </span>
          <div className="flex items-center gap-1.5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-4 w-4 ${timerTextColor}`}
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
            <span
              className={`font-mono text-2xl font-black leading-none ${timerTextColor}`}
              data-testid="turn-timer"
            >
              {turnTime}
            </span>
            {hasLimit && (
              <span
                className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${timerBadgeCls}`}
                aria-label={`Shot clock set to ${shotClockSeconds} seconds`}
              >
                {shotClockSeconds}s
              </span>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="mx-3 w-px flex-shrink-0 self-stretch bg-gray-200 dark:bg-slate-700" />

        {/* Inning + Rack */}
        <div className="flex flex-1 flex-col items-center gap-1">
          <span className="text-[10px] font-bold uppercase text-gray-500 dark:text-slate-400">
            Game
          </span>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-sm font-bold leading-none text-gray-800 dark:text-white">
              Inning {currentInning}
            </span>
            <span className="text-xs font-medium leading-none text-gray-500 dark:text-slate-400">
              Rack {rackNumber}
            </span>
          </div>
        </div>
      </div>
    );
  },
);

GameStatusBar.displayName = 'GameStatusBar';
