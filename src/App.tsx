import React, { useState, useEffect } from 'react';
import './App.css';
import { createClient } from '@supabase/supabase-js';
import GameSetup from './components/GameSetup';
import GameScoring from './components/GameScoring';
import GameStatistics from './components/GameStatistics';
import GameHistory from './components/GameHistory';
import Auth from './components/auth/Auth';
import UserProfile from './components/auth/UserProfile';
import { AuthProvider, useAuth } from './context/AuthContext';

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
      <AppContent />
    </AuthProvider>
  );
}

// The actual app content, using the auth context
function AppContent() {
  const { user, loading, signOut } = useAuth();
  
  // Game state management
  const [gameState, setGameState] = useState<GameState>('setup');
  const [players, setPlayers] = useState<string[]>([]);
  const [playerTargetScores, setPlayerTargetScores] = useState<Record<string, number>>({});
  const [currentGameId, setCurrentGameId] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  // Store last used game settings for quick restart with persistence
  const [lastPlayers, setLastPlayers] = useState<string[]>(() => {
    const savedPlayers = localStorage.getItem('runcount_lastPlayers');
    return savedPlayers ? JSON.parse(savedPlayers) : [];
  });
  
  const [lastPlayerTargetScores, setLastPlayerTargetScores] = useState<Record<string, number>>(() => {
    const savedTargetScores = localStorage.getItem('runcount_lastPlayerTargetScores');
    return savedTargetScores ? JSON.parse(savedTargetScores) : {};
  });

  // Close auth modal when user is authenticated
  useEffect(() => {
    if (user) {
      setShowAuthModal(false);
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
      localStorage.setItem('runcount_lastPlayerTargetScores', JSON.stringify(lastPlayerTargetScores));
    }
  }, [lastPlayerTargetScores]);

  // Handle user sign out
  const handleSignOut = async () => {
    await signOut();
    setGameState('setup');
  };

  // Switch between different components based on game state
  const renderComponent = () => {
    switch (gameState) {
      case 'setup':
        return (
          <GameSetup 
            startGame={(players, playerTargetScores) => {
              setPlayers(players);
              setPlayerTargetScores(playerTargetScores);
              // Save settings for future use
              setLastPlayers(players);
              setLastPlayerTargetScores(playerTargetScores);
              setGameState('scoring');
            }}
            lastPlayers={lastPlayers}
            lastPlayerTargetScores={lastPlayerTargetScores}
          />
        );
      case 'scoring':
        return (
          <GameScoring 
            players={players}
            playerTargetScores={playerTargetScores}
            gameId={currentGameId}
            setGameId={setCurrentGameId}
            finishGame={() => setGameState('statistics')}
            supabase={supabase}
            user={user}
          />
        );
      case 'statistics':
        return (
          <GameStatistics 
            gameId={currentGameId}
            supabase={supabase}
            startNewGame={() => setGameState('setup')}
            viewHistory={() => setGameState('history')}
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
        <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-auto">
          <div className="p-4 flex justify-between border-b">
            <h2 className="text-lg font-bold">Authentication</h2>
            <button 
              onClick={() => setShowAuthModal(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          <div className="p-4">
            <Auth 
              supabase={supabase}
              onAuthSuccess={() => setShowAuthModal(false)} 
            />
          </div>
        </div>
      </div>
    );
  };

  // If still loading auth state, show loading indicator
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-100">
        <header className="bg-blue-800 text-white p-4 shadow-md">
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
    <div className="min-h-screen flex flex-col bg-gray-100">
      <header className="bg-blue-800 text-white p-4 shadow-md">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">RunCount</h1>
            <p className="text-sm">Straight Pool (14.1) Scoring App</p>
          </div>
          <div>
            {user ? (
              <div className="flex items-center space-x-3">
                <span className="hidden md:inline text-sm">{user.email}</span>
                <div className="relative">
                  {/* Disable profile button during active game */}
                  {gameState === 'scoring' ? (
                    <div 
                      className="bg-blue-400 p-2 rounded-full text-white cursor-not-allowed"
                      title="Profile unavailable during active game"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                  ) : (
                    <button 
                      className="bg-blue-700 hover:bg-blue-600 p-2 rounded-full text-white"
                      onClick={() => setGameState('profile')}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              gameState === 'scoring' ? (
                <div 
                  className="px-4 py-2 bg-blue-400 text-white rounded cursor-not-allowed"
                  title="Login unavailable during active game"
                >
                  Login / Sign Up
                </div>
              ) : (
                <button 
                  onClick={() => setShowAuthModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 shadow-sm"
                >
                  Login / Sign Up
                </button>
              )
            )}
          </div>
        </div>
      </header>
      
      {/* Only show navigation tabs when not in an active game */}
      {gameState !== 'scoring' && (
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex space-x-4 overflow-x-auto">
              <button 
                onClick={() => setGameState('setup')} 
                className={`py-3 px-3 text-sm font-medium transition-colors ${
                  gameState === 'setup' 
                    ? 'text-blue-600 border-b-2 border-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                New Game
              </button>
              <button 
                onClick={() => setGameState('history')} 
                className={`py-3 px-3 text-sm font-medium transition-colors ${
                  gameState === 'history' 
                    ? 'text-blue-600 border-b-2 border-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Game History
              </button>
              {user && (
                <button 
                  onClick={() => setGameState('profile')} 
                  className={`py-3 px-3 text-sm font-medium transition-colors ${
                    gameState === 'profile' 
                      ? 'text-blue-600 border-b-2 border-blue-600' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  My Profile
                </button>
              )}
            </div>
          </div>
        </nav>
      )}
      
      <main className="flex-grow container mx-auto p-4">
        {renderComponent()}
      </main>
      
      <footer className="bg-gray-200 p-2 text-center text-sm text-gray-600">
        RunCount &copy; {new Date().getFullYear()} - Straight Pool Scoring App
      </footer>
      
      {renderAuthModal()}
    </div>
  );
}

export default App;