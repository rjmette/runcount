import React, { useState, useEffect } from 'react';
import './App.css';
import { createClient } from '@supabase/supabase-js';
import GameSetup from './components/GameSetup';
import GameScoring from './components/GameScoring/index';
import GameStatistics from './components/GameStatistics';
import GameHistory from './components/GameHistory/index';
import Auth from './components/auth/Auth';
import UserProfile from './components/auth/UserProfile';
import { AuthProvider, useAuth } from './context/AuthContext';
import {
  GamePersistProvider,
  useGamePersist,
} from './context/GamePersistContext';

// Initialize Supabase client - Replace with your actual Supabase project details
const supabaseUrl = 'https://mipvwpynhcadvhknjpdq.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Game states
type GameState = 'setup' | 'scoring' | 'statistics' | 'history' | 'profile';

// Main App Component - now just wraps the content with AuthProvider
function App() {
  return (
    <AuthProvider supabase={supabase}>
      <GamePersistProvider>
        <AppContent />
      </GamePersistProvider>
    </AuthProvider>
  );
}

// The actual app content, using the auth context
function AppContent() {
  const { user, loading, signOut } = useAuth();
  const { getGameState, hasActiveGame, clearGameState } = useGamePersist();

  // Game state management
  const [gameState, setGameState] = useState<GameState>('setup');
  const [players, setPlayers] = useState<string[]>([]);
  const [playerTargetScores, setPlayerTargetScores] = useState<
    Record<string, number>
  >({});
  const [currentGameId, setCurrentGameId] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [breakingPlayerId, setBreakingPlayerId] = useState<number>(0);

  // Store last used game settings for quick restart with persistence
  const [lastPlayers, setLastPlayers] = useState<string[]>(() => {
    const savedPlayers = localStorage.getItem('runcount_lastPlayers');
    return savedPlayers ? JSON.parse(savedPlayers) : [];
  });

  const [lastPlayerTargetScores, setLastPlayerTargetScores] = useState<
    Record<string, number>
  >(() => {
    const savedTargetScores = localStorage.getItem(
      'runcount_lastPlayerTargetScores'
    );
    return savedTargetScores ? JSON.parse(savedTargetScores) : {};
  });

  const [lastBreakingPlayerId, setLastBreakingPlayerId] = useState<number>(
    () => {
      const savedBreakingPlayerId = localStorage.getItem(
        'runcount_lastBreakingPlayerId'
      );
      return savedBreakingPlayerId ? JSON.parse(savedBreakingPlayerId) : 0;
    }
  );

  // Check for saved game on initial load
  useEffect(() => {
    if (hasActiveGame) {
      const savedGame = getGameState();
      if (savedGame && !savedGame.completed) {
        // Only load games that are actually in progress
        // Set player names from the saved game
        const playerNames = savedGame.players.map((player) => player.name);
        setPlayers(playerNames);

        // Set target scores from the saved game
        const targetScores: Record<string, number> = {};
        savedGame.players.forEach((player) => {
          targetScores[player.name] = player.targetScore;
        });
        setPlayerTargetScores(targetScores);

        // Set the game ID
        setCurrentGameId(savedGame.id);

        // Redirect to scoring screen since game is in progress
        setGameState('scoring');
      } else {
        // If the saved game is completed or corrupted, clear it and stay on setup
        if (savedGame?.completed) {
          // Clear completed games from active storage
          clearGameState();
        }
        setGameState('setup');
      }
    }
  }, [hasActiveGame, getGameState, clearGameState]);

  // Close auth modal when user is authenticated
  useEffect(() => {
    if (user) {
      setShowAuthModal(false);

      // If user just logged in and there's an active game or game result being shown,
      // the game components will handle saving to Supabase via their own useEffect hooks
    }
  }, [user]);

  // Persist game settings to localStorage
  useEffect(() => {
    if (lastPlayers.length > 0) {
      localStorage.setItem('runcount_lastPlayers', JSON.stringify(lastPlayers));
    }
  }, [lastPlayers]);

  useEffect(() => {
    if (Object.keys(lastPlayerTargetScores).length > 0) {
      localStorage.setItem(
        'runcount_lastPlayerTargetScores',
        JSON.stringify(lastPlayerTargetScores)
      );
    }
  }, [lastPlayerTargetScores]);

  useEffect(() => {
    localStorage.setItem(
      'runcount_lastBreakingPlayerId',
      JSON.stringify(lastBreakingPlayerId)
    );
  }, [lastBreakingPlayerId]);

  // Listen for navigation to history from end game modal
  useEffect(() => {
    const handleSwitchToHistory = () => {
      setGameState('history');
    };

    window.addEventListener('switchToHistory', handleSwitchToHistory);
    return () => {
      window.removeEventListener('switchToHistory', handleSwitchToHistory);
    };
  }, []);

  // Handle user sign out
  const handleSignOut = async () => {
    await signOut();
    setShowProfileModal(false);
    // Only redirect to setup if not in the middle of a game
    if (gameState !== 'scoring' && gameState !== 'statistics') {
      setGameState('setup');
    }
  };

  // Switch between different components based on game state
  const renderComponent = () => {
    switch (gameState) {
      case 'setup':
        return (
          <GameSetup
            startGame={(players, playerTargetScores, breakingPlayerId) => {
              console.log(
                'App: Setting breaking player ID to:',
                breakingPlayerId
              );
              setPlayers(players);
              setPlayerTargetScores(playerTargetScores);
              setBreakingPlayerId(breakingPlayerId);
              // Save settings for future use
              setLastPlayers(players);
              setLastPlayerTargetScores(playerTargetScores);
              setLastBreakingPlayerId(breakingPlayerId);
              setGameState('scoring');
            }}
            lastPlayers={lastPlayers}
            lastPlayerTargetScores={lastPlayerTargetScores}
            lastBreakingPlayerId={lastBreakingPlayerId}
          />
        );
      case 'scoring':
        return (
          <GameScoring
            players={players}
            playerTargetScores={playerTargetScores}
            gameId={currentGameId}
            setGameId={setCurrentGameId}
            finishGame={() => {
              // Don't reset gameId here, as we need it for statistics
              setGameState('statistics');
            }}
            supabase={supabase}
            user={user}
            breakingPlayerId={breakingPlayerId}
          />
        );
      case 'statistics':
        return (
          <GameStatistics
            gameId={currentGameId}
            supabase={supabase}
            startNewGame={() => {
              setCurrentGameId(null);
              setGameState('setup');
            }}
            viewHistory={() => setGameState('history')}
            user={user}
          />
        );
      case 'history':
        return (
          <GameHistory
            supabase={supabase}
            startNewGame={() => setGameState('setup')}
            user={user}
          />
        );
      case 'profile':
        return (
          <UserProfile
            supabase={supabase}
            user={user!}
            onSignOut={handleSignOut}
          />
        );
      default:
        return <GameSetup startGame={() => setGameState('scoring')} />;
    }
  };

  // Render auth modal
  const renderAuthModal = () => {
    if (!showAuthModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-auto">
          <div className="p-4 flex justify-between border-b dark:border-gray-700">
            <h2 className="text-lg font-bold dark:text-white">
              Authentication
            </h2>
            <button
              onClick={() => setShowAuthModal(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100"
            >
              ✕
            </button>
          </div>
          <div className="p-4">
            {(gameState === 'scoring' || gameState === 'statistics') && (
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900 text-blue-800 dark:text-blue-100 rounded-md text-sm">
                <p>
                  <strong>Note:</strong> Logging in will save your current game
                  to your account, allowing you to access it from any device.
                </p>
              </div>
            )}
            <Auth
              supabase={supabase}
              onAuthSuccess={() => setShowAuthModal(false)}
            />
          </div>
        </div>
      </div>
    );
  };

  // Render profile modal
  const renderProfileModal = () => {
    if (!showProfileModal || !user) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-auto">
          <div className="p-4 flex justify-between border-b dark:border-gray-700">
            <h2 className="text-lg font-bold dark:text-white">Profile</h2>
            <button
              onClick={() => setShowProfileModal(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100"
            >
              ✕
            </button>
          </div>
          <div className="p-4">
            <UserProfile
              supabase={supabase}
              user={user}
              onSignOut={handleSignOut}
            />
          </div>
        </div>
      </div>
    );
  };

  // Theme toggle function
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('runcount_theme');
    return savedTheme ? savedTheme === 'dark' : true; // Default to dark if no theme is saved
  });

  // Update theme when darkMode changes
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('runcount_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('runcount_theme', 'light');
    }
  }, [darkMode]);

  // If still loading auth state, show loading indicator
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
        <header className="bg-blue-800 dark:bg-blue-900 text-white p-4 shadow-md">
          <h1 className="text-2xl font-bold">RunCount</h1>
          <p className="text-sm">Straight Pool (14.1) Scoring App</p>
        </header>
        <main className="flex-grow flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900 dark:text-gray-100">
      <header className="bg-blue-800 dark:bg-blue-900 text-white py-2 px-3 shadow-md">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">RunCount</h1>
          </div>
          <div className="flex items-center">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="mr-4 p-2 rounded-full hover:bg-blue-700 dark:hover:bg-blue-800"
              aria-label={
                darkMode ? 'Switch to light mode' : 'Switch to dark mode'
              }
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
            {user ? (
              <div className="flex items-center space-x-3">
                <span className="hidden md:inline text-sm">{user.email}</span>
                <div className="relative">
                  <button
                    className="bg-blue-700 hover:bg-blue-600 dark:bg-blue-800 dark:hover:bg-blue-700 p-2 rounded-full text-white"
                    onClick={() => {
                      if (
                        gameState === 'scoring' ||
                        gameState === 'statistics'
                      ) {
                        setShowProfileModal(true);
                      } else {
                        setGameState('profile');
                      }
                    }}
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
            ) : gameState === 'scoring' ? (
              <button
                onClick={() => setShowAuthModal(true)}
                className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-800 shadow-sm"
              >
                Log In
              </button>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-800 shadow-sm"
              >
                Log In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Only show navigation tabs when not in an active game */}
      {gameState !== 'scoring' && (
        <nav className="bg-white dark:bg-gray-800 shadow-sm">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex space-x-4 overflow-x-auto">
              <button
                onClick={() => setGameState('setup')}
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
                    onClick={() => setGameState('history')}
                    className={`py-3 px-3 text-sm font-medium transition-colors ${
                      gameState === 'history'
                        ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    History
                  </button>
                  <button
                    onClick={() => setGameState('profile')}
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
      )}

      <main className="flex-grow container mx-auto p-4">
        {renderComponent()}
      </main>

      <footer className="bg-gray-200 dark:bg-gray-800 p-2 text-center text-sm text-gray-600 dark:text-gray-400">
        Straight Pool 14.1 Scoring App
      </footer>

      {renderAuthModal()}
      {renderProfileModal()}
    </div>
  );
}

export default App;
