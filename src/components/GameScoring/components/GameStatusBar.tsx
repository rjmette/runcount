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

    const clockState = isOverLimit ? 'over' : isApproaching ? 'warn' : '';

    return (
      <div className="rc-metastrip">
        {/* Balls on Table */}
        <div className="rc-meta-cell">
          <div className="rc-meta-label">Balls on Table</div>
          <div className="rc-meta-value">
            <span
              className="big"
              data-testid="bot-indicator"
              aria-label={`Balls on Table: ${ballsOnTable}`}
            >
              {ballsOnTable}
            </span>
          </div>
        </div>

        {/* Turn Timer */}
        <div className="rc-meta-cell">
          <div className="rc-meta-label">Turn</div>
          <div className="rc-meta-value">
            <span className={`rc-meta-ic ${clockState}`}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className={`mono ${clockState}`} data-testid="turn-timer">
              {turnTime}
            </span>
            {hasLimit && (
              <span
                className={`rc-clock-badge ${clockState}`}
                aria-label={`Shot clock set to ${shotClockSeconds} seconds`}
              >
                {shotClockSeconds}s
              </span>
            )}
          </div>
        </div>

        {/* Inning + Rack */}
        <div className="rc-meta-cell">
          <div className="rc-meta-label">Game</div>
          <div className="rc-meta-value">
            <span className="game-main">Inning {currentInning}</span>
            <span className="game-sub">Rack {rackNumber}</span>
          </div>
        </div>
      </div>
    );
  },
);

GameStatusBar.displayName = 'GameStatusBar';
