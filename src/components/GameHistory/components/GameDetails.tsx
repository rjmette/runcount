import React from 'react';

import { type GameData } from '../../../types/game';
import GameSummary from '../../GameSummary';

interface GameDetailsProps {
  game: GameData;
  onBack: () => void;
  onPrevious: () => void;
  onNext: () => void;
  canNavigatePrevious: boolean;
  canNavigateNext: boolean;
  /** Zero-based index of this game within the filtered list. */
  currentIndex: number;
  totalCount: number;
}

/**
 * Historical match detail: the back-to-list bar (`← History`, `1 of 12`,
 * prev/next arrows) above the shared GameSummary in `history` context.
 */
export const GameDetails: React.FC<GameDetailsProps> = ({
  game,
  onBack,
  onPrevious,
  onNext,
  canNavigatePrevious,
  canNavigateNext,
  currentIndex,
  totalCount,
}) => (
  <div className="rcs-scope">
    <div className="gs-dnav">
      <button type="button" onClick={onBack} className="back">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 19l-7-7m0 0l7-7m-7 7h18"
          />
        </svg>
        History
      </button>

      {totalCount > 0 && currentIndex >= 0 && (
        <span className="pos rcs-mono">
          {currentIndex + 1} of {totalCount}
        </span>
      )}

      <div className="arrows">
        <button
          type="button"
          onClick={onPrevious}
          disabled={!canNavigatePrevious}
          aria-label="Previous game"
        >
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!canNavigateNext}
          aria-label="Next game"
        >
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
    </div>

    <GameSummary game={game} context="history" />
  </div>
);
