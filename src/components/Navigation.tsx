import type { FC } from 'react';

import type { GameState } from '../hooks/useGameState';
import type { User } from '@supabase/supabase-js';

interface NavigationProps {
  gameState: GameState;
  user: User | null;
  onNavigate: (state: GameState) => void;
}

export const Navigation: FC<NavigationProps> = ({ gameState, user, onNavigate }) => {
  // Only show navigation tabs when not in an active game
  if (gameState === 'scoring') {
    return null;
  }

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex space-x-4 overflow-x-auto">
          <button
            onClick={() => onNavigate('setup')}
            className={`py-3 px-3 text-sm font-medium transition-colors ${
              gameState === 'setup'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            New Game
          </button>
          {user && (
            <>
              <button
                onClick={() => onNavigate('history')}
                className={`py-3 px-3 text-sm font-medium transition-colors ${
                  gameState === 'history'
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                History
              </button>
              <button
                onClick={() => onNavigate('profile')}
                className={`py-3 px-3 text-sm font-medium transition-colors ${
                  gameState === 'profile'
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                My Profile
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};
