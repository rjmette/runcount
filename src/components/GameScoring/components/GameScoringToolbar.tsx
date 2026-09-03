import type { FC } from 'react';

import { MatchTimer } from '../../MatchTimer';

interface GameScoringToolbarProps {
  isUndoEnabled: boolean;
  matchStartTime: Date | null;
  matchEndTime: Date | null;
  onShowInnings: () => void;
  onUndo: () => void;
  onEndGame: () => void;
  onShowHelp: () => void;
}

export const GameScoringToolbar: FC<GameScoringToolbarProps> = ({
  isUndoEnabled,
  matchStartTime,
  matchEndTime,
  onShowInnings,
  onUndo,
  onEndGame,
  onShowHelp,
}) => (
  <div className="rc-toolbar">
    <button
      type="button"
      onClick={onShowInnings}
      className="rc-pill"
      title="View game innings"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"
        />
      </svg>
      Innings
    </button>

    <button
      type="button"
      onClick={onUndo}
      disabled={!isUndoEnabled}
      className="rc-pill undo"
      title="Undo last action"
      aria-label="Undo last action"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v6h6" />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 13a9 9 0 1 0 3-7.7L3 8"
        />
      </svg>
      Undo
    </button>

    <button type="button" onClick={onEndGame} className="rc-pill">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 6l6 6-6 6" />
      </svg>
      End Game
    </button>

    <button
      type="button"
      onClick={onShowHelp}
      className="rc-pill icon-only"
      title="Show straight pool help"
      aria-label="Show help"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
      >
        <circle cx="12" cy="12" r="9" />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1 .9-1 1.7M12 17h.01"
        />
      </svg>
      <span className="rc-pill-mob">Help</span>
    </button>

    <span className="rc-toolbar-sep" aria-hidden="true" />

    <MatchTimer
      startTime={matchStartTime}
      endTime={matchEndTime}
      isRunning={!matchEndTime}
    />
  </div>
);
