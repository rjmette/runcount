import React from 'react';

import type { GameSummaryContext } from './index';

interface GameSummaryActionsProps {
  context: GameSummaryContext;
  copySuccess: boolean;
  onCopyResults: () => void;
  onViewInnings: () => void;
  onStartNewGame?: () => void;
}

/**
 * Post-game: full-width accent `Start New Game` + Copy · Innings.
 * History: Copy · Innings only.
 *
 * Phone portrait renders this as a fixed bottom bar; landscape and tablet
 * inline it (see .gs-actions in summary.css).
 */
export const GameSummaryActions: React.FC<GameSummaryActionsProps> = ({
  context,
  copySuccess,
  onCopyResults,
  onViewInnings,
  onStartNewGame,
}) => {
  const hasPrimary = context === 'post-game' && Boolean(onStartNewGame);

  return (
    <div className={`gs-actions${hasPrimary ? '' : ' no-primary'}`}>
      {hasPrimary && (
        <button type="button" onClick={onStartNewGame} className="rcs-pbtn">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Start New Game
        </button>
      )}
      <div className="gs-arow">
        <button
          type="button"
          onClick={onCopyResults}
          className={`rcs-abtn${copySuccess ? ' ok' : ''}`}
        >
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
            />
          </svg>
          {copySuccess ? (
            <span>Copied!</span>
          ) : (
            <>
              <span className="brief">Copy</span>
              <span className="long">Copy Results</span>
            </>
          )}
        </button>
        <button type="button" onClick={onViewInnings} className="rcs-abtn">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <span className="brief">Innings</span>
          <span className="long">View Innings</span>
        </button>
      </div>
    </div>
  );
};
