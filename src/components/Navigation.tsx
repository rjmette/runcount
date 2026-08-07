import type { FC } from 'react';

import type { GameState } from '../hooks/useGameState';
import type { AppUser } from '../types/auth';

interface NavigationProps {
  gameState: GameState;
  user: AppUser | null;
  onNavigate: (state: GameState) => void;
}

export const Navigation: FC<NavigationProps> = ({ gameState, user, onNavigate }) => {
  // Hide nav during active scoring, and when signed out (only "New Game" would show — redundant
  // with the page-level Start New Game CTAs and the page itself).
  if (gameState === 'scoring' || !user) {
    return null;
  }

  // The second slot is contextual: it reads "Game Summary" while viewing a
  // post-game summary (matching the handoff frames) and "History" everywhere
  // else. Either way it navigates to the history list.
  const onSummary = gameState === 'summary';

  return (
    <nav className="rcs-scope rcs-tabs">
      <button
        type="button"
        onClick={() => onNavigate('setup')}
        className={`rcs-tab${gameState === 'setup' ? ' on' : ''}`}
      >
        New Game
      </button>
      <button
        type="button"
        onClick={() => onNavigate('history')}
        className={`rcs-tab${gameState === 'history' || onSummary ? ' on' : ''}`}
      >
        {onSummary ? 'Game Summary' : 'History'}
      </button>
      <button
        type="button"
        onClick={() => onNavigate('trends')}
        className={`rcs-tab${gameState === 'trends' ? ' on' : ''}`}
      >
        Trends
      </button>
      <button
        type="button"
        onClick={() => onNavigate('profile')}
        className={`rcs-tab${gameState === 'profile' ? ' on' : ''}`}
      >
        My Profile
      </button>
    </nav>
  );
};
