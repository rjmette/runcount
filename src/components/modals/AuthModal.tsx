import type { FC } from 'react';

import Auth from '../auth/Auth';

import type { GameState } from '../../hooks/useGameState';
import type { SupabaseClient } from '@supabase/supabase-js';

interface AuthModalProps {
  isOpen: boolean;
  gameState: GameState;
  supabase: SupabaseClient;
  onClose: () => void;
}

export const AuthModal: FC<AuthModalProps> = ({
  isOpen,
  gameState,
  supabase,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-sm sm:max-w-lg w-full relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-7 h-7 flex items-center justify-center rounded-full bg-black bg-opacity-20 hover:bg-opacity-30 text-white transition-colors"
        >
          ✕
        </button>
        <div className="p-4 sm:p-6 text-center bg-gray-100 dark:bg-gray-700 rounded-t-2xl">
          <h2 className="text-lg sm:text-xl font-bold dark:text-white">Authentication</h2>
        </div>
        <div className="p-3 sm:p-4">
          {gameState === 'scoring' || gameState === 'statistics' ? (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900 text-blue-800 dark:text-blue-100 rounded-lg text-sm">
              <p>
                <strong>Note:</strong> Logging in will save your current game to your
                account, allowing you to access it from any device.
              </p>
            </div>
          ) : (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900 text-green-800 dark:text-green-100 rounded-lg text-sm">
              <p className="font-semibold mb-2">Benefits of logging in:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Save your game history across devices</li>
                <li>Track your statistics and progress</li>
                <li>Never lose your game data</li>
                <li>Access your games from anywhere</li>
              </ul>
            </div>
          )}
          <Auth supabase={supabase} onAuthSuccess={onClose} />
        </div>
      </div>
    </div>
  );
};
