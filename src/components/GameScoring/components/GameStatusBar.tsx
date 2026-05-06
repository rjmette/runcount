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
      ? 'text-red-300'
      : isApproaching
        ? 'text-amber-300'
        : 'text-blue-300';

    const timerBadgeCls = isOverLimit
      ? 'bg-red-700/70 text-red-100'
      : isApproaching
        ? 'bg-amber-700/70 text-amber-100'
        : 'bg-white/10 text-gray-300';

    return (
      <div className="mt-3 rounded-xl bg-slate-800 dark:bg-slate-900 border border-slate-700 px-4 py-3 flex items-center gap-0">
        {/* Balls on Table */}
        <div className="flex flex-col items-center flex-1 gap-0.5">
          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
            Balls on Table
          </span>
          <span
            className="text-5xl font-black text-white font-mono leading-none"
            data-testid="bot-indicator"
            aria-label={`Balls on Table: ${ballsOnTable}`}
          >
            {ballsOnTable}
          </span>
        </div>

        {/* Divider */}
        <div className="w-px self-stretch bg-slate-600 mx-3 flex-shrink-0" />

        {/* Turn Timer */}
        <div className="flex flex-col items-center flex-1 gap-0.5">
          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
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
              className={`text-4xl font-black font-mono leading-none ${timerTextColor}`}
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
        <div className="w-px self-stretch bg-slate-600 mx-3 flex-shrink-0" />

        {/* Inning + Rack */}
        <div className="flex flex-col items-center flex-1 gap-1">
          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
            Game
          </span>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-white text-sm font-bold leading-none">
              Inning {currentInning}
            </span>
            <span className="text-slate-400 text-xs font-medium leading-none">
              Rack {rackNumber}
            </span>
          </div>
        </div>
      </div>
    );
  },
);

GameStatusBar.displayName = 'GameStatusBar';
