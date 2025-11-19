import type { FC } from 'react';

import { MatchTimer } from './MatchTimer';
import { TurnTimer } from './TurnTimer';

import type { GameState } from '../hooks/useGameState';
import type { User } from '@supabase/supabase-js';

interface HeaderProps {
  gameState: GameState;
  user: User | null;
  darkMode: boolean;
  isFullScreen: boolean;
  matchStartTime: Date | null;
  matchEndTime: Date | null;
  turnStartTime?: Date | null;
  ballsOnTable: number;
  toggleDarkMode: () => void;
  toggleFullscreen: () => void;
  onAuthClick: () => void;
  onProfileClick: () => void;
}

export const Header: FC<HeaderProps> = ({
  gameState,
  user,
  darkMode,
  isFullScreen,
  matchStartTime,
  matchEndTime,
  turnStartTime,
  ballsOnTable,
  toggleDarkMode,
  toggleFullscreen,
  onAuthClick,
  onProfileClick,
}) => {
  return (
    <header className="bg-blue-800 dark:bg-blue-900 text-white py-2 px-3 shadow-md">
      <div className="flex justify-between items-center">
        <div>
          {gameState === 'scoring' ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
              <MatchTimer
                startTime={matchStartTime}
                endTime={matchEndTime}
                isRunning={!matchEndTime}
                ballsOnTable={ballsOnTable}
              />
              {turnStartTime && (
                <TurnTimer startTime={turnStartTime} isRunning={!matchEndTime} />
              )}
            </div>
          ) : (
            <h1 className="text-xl font-bold">RunCount</h1>
          )}
        </div>
        <div className="flex items-center">
          <button
            onClick={toggleDarkMode}
            className="mr-2 p-2 rounded-full hover:bg-blue-700 dark:hover:bg-blue-800"
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            )}
          </button>
          <button
            onClick={toggleFullscreen}
            className="mr-2 p-2 hover:bg-blue-700 dark:hover:bg-blue-800"
            aria-label={isFullScreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullScreen ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4 3a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V5a1 1 0 100-2H4zm2 2h8v10H6V5z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 11-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 11-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 112 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 110 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 110-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>
          {user ? (
            <div className="flex items-center space-x-2">
              <span className="hidden md:inline text-sm">{user.email}</span>
              <div className="relative">
                <button
                  className="bg-blue-700 hover:bg-blue-600 dark:bg-blue-800 dark:hover:bg-blue-700 p-2 rounded-full text-white"
                  onClick={onProfileClick}
                  aria-label="Open profile menu"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <div className="relative">
                <button
                  className="bg-gray-400 dark:bg-gray-600 hover:bg-gray-500 dark:hover:bg-gray-500 p-2 rounded-full text-gray-300 dark:text-gray-400 hover:text-gray-200 transition-colors"
                  onClick={onAuthClick}
                  aria-label="Open authentication modal"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
