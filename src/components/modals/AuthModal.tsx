import { useState, type FC } from 'react';

import Auth, { type AuthTab } from '../auth/Auth';

import type { GameState } from '../../hooks/useGameState';
import type { SupabaseClient } from '@supabase/supabase-js';

interface AuthModalProps {
  isOpen: boolean;
  gameState: GameState;
  supabase: SupabaseClient;
  onClose: () => void;
}

const TAB_TITLES: Record<AuthTab, string> = {
  login: 'Welcome back',
  signup: 'Create your account',
  'reset-password': 'Reset your password',
};

const TAB_SUBTITLES: Record<AuthTab, string | null> = {
  login: 'Sign in to access your game history.',
  signup: 'Save your games and track stats across devices.',
  'reset-password': "We'll email you a link to set a new password.",
};

export const AuthModal: FC<AuthModalProps> = ({
  isOpen,
  gameState,
  supabase,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<AuthTab>('login');

  if (!isOpen) return null;

  // The "Benefits of logging in" sales pitch makes sense for someone
  // deciding to commit (Login or Sign Up). It's irrelevant to someone
  // who's already a user trying to recover access (Reset Password) —
  // they made their decision long ago.
  const showBenefitsPanel = activeTab !== 'reset-password';

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-sm sm:max-w-lg w-full relative max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-7 h-7 flex items-center justify-center rounded-full bg-black/30 hover:bg-black/50 text-white transition-colors"
          aria-label="Close authentication"
        >
          ✕
        </button>

        {/* Per-tab modal header — replaces the previous cold "Authentication"
            heading. The subtitle gives the user a one-line cue about what
            this tab will do. */}
        <div className="p-4 sm:p-5 text-center bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-700/60 dark:to-gray-700/30 rounded-t-2xl border-b border-gray-200 dark:border-gray-700">
          <h2
            id="auth-modal-title"
            className="text-lg sm:text-xl font-bold dark:text-white"
          >
            {TAB_TITLES[activeTab]}
          </h2>
          {TAB_SUBTITLES[activeTab] && (
            <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              {TAB_SUBTITLES[activeTab]}
            </p>
          )}
        </div>

        <div className="p-3 sm:p-4">
          {/* Mid-game prompt: take precedence over the benefits panel
              because saving the in-flight game is the more compelling reason
              to authenticate right now. */}
          {gameState === 'scoring' || gameState === 'statistics' ? (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900 text-blue-800 dark:text-blue-100 rounded-lg text-sm">
              <p>
                <strong>Note:</strong> Logging in will save your current game to your
                account, allowing you to access it from any device.
              </p>
            </div>
          ) : (
            showBenefitsPanel && (
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-900 text-green-800 dark:text-green-100 rounded-lg text-sm">
                <p className="font-semibold mb-2">Benefits of logging in:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Save your game history across devices</li>
                  <li>Track your statistics and progress</li>
                  <li>Never lose your game data</li>
                  <li>Access your games from anywhere</li>
                </ul>
              </div>
            )
          )}

          <Auth
            supabase={supabase}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onAuthSuccess={onClose}
          />
        </div>
      </div>
    </div>
  );
};
