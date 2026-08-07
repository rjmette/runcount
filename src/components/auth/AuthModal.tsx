import { useState } from 'react';
import type { FC } from 'react';

import Auth, { type AuthTab, type AwsAuthOperations } from './Auth';

import type { GameState } from '../../hooks/useGameState';

interface AuthModalProps {
  isOpen: boolean;
  gameState: GameState;
  onClose: () => void;
  awsAuth: AwsAuthOperations;
}

const AuthModal: FC<AuthModalProps> = ({ isOpen, gameState, onClose, awsAuth }) => {
  const [activeTab, setActiveTab] = useState<AuthTab>('login');

  if (!isOpen) return null;

  const tabTitles: Record<AuthTab, string> = {
    login: 'Welcome back',
    signup: 'Create your account',
    'reset-password': 'Reset your password',
  };
  const tabSubtitles: Record<AuthTab, string> = {
    login: 'Sign in with email or Google to save games to AWS.',
    signup: 'Create a Cognito account for cloud game history.',
    'reset-password': "We'll email a verification code to reset your password.",
  };
  const showBenefitsPanel = activeTab !== 'reset-password';

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-sm sm:max-w-lg w-full relative max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="aws-auth-modal-title"
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-7 h-7 flex items-center justify-center rounded-full bg-black/30 hover:bg-black/50 text-white transition-colors"
          aria-label="Close authentication"
        >
          x
        </button>
        <div className="p-4 sm:p-5 text-center bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-700/60 dark:to-gray-700/30 rounded-t-2xl border-b border-gray-200 dark:border-gray-700">
          <h2
            id="aws-auth-modal-title"
            className="text-lg sm:text-xl font-bold dark:text-white"
          >
            {tabTitles[activeTab]}
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            {tabSubtitles[activeTab]}
          </p>
        </div>
        <div className="p-3 sm:p-4">
          {gameState === 'scoring' || gameState === 'summary' ? (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900 text-blue-800 dark:text-blue-100 rounded-lg text-sm">
              Logging in will save your current game to your account.
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
            awsAuth={awsAuth}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onAuthSuccess={onClose}
          />
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
