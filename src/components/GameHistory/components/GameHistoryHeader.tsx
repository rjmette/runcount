import React from 'react';

interface GameHistoryHeaderProps {
  validGameCount: number;
  onStartNewGame: () => void;
  onViewTrends?: () => void;
}

export const GameHistoryHeader: React.FC<GameHistoryHeaderProps> = ({
  validGameCount,
  onStartNewGame,
  onViewTrends,
}) => (
  <div className="gh-headrow">
    <div className="gh-titlebox">
      <p className="rcs-eyebrow" style={{ margin: 0 }}>
        Past games
      </p>
      <h2 className="gh-h1">Game History</h2>
      {validGameCount > 0 && (
        <span className="gh-count" data-testid="game-history-count">
          {validGameCount}
        </span>
      )}
    </div>
    <div className="gh-headbtns">
      {/* Signed-out users have no tab row, so History keeps a
          direct path to Trends. */}
      {onViewTrends && validGameCount > 0 && (
        <button
          type="button"
          onClick={onViewTrends}
          className="gh-chip"
          aria-label="View Trends"
        >
          Trends
        </button>
      )}
      <button type="button" onClick={onStartNewGame} className="gh-new">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
        New
      </button>
    </div>
  </div>
);
