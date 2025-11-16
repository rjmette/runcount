import { useState, useEffect, useCallback } from 'react';
import type { FC } from 'react';

import { createClient } from '@supabase/supabase-js';

import { GameRouter } from './components/GameRouter';
import { Header } from './components/Header';
import { AuthModal } from './components/modals/AuthModal';
import { ProfileModal } from './components/modals/ProfileModal';
import { Navigation } from './components/Navigation';
import ErrorBanner from './components/shared/ErrorBanner';
import { ErrorBoundary, ErrorEventsBridge } from './components/shared/ErrorBoundary';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ErrorProvider, useError } from './context/ErrorContext';
import { GamePersistProvider } from './context/GamePersistContext';
import { useFullscreen } from './hooks/useFullscreen';
import { useGameSettings } from './hooks/useGameSettings';
import { useGameState } from './hooks/useGameState';
import { useTheme } from './hooks/useTheme';

import './App.css';

// Initialize Supabase client - Replace with your actual Supabase project details
const supabaseUrl = 'https://mipvwpynhcadvhknjpdq.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Main App Component - now just wraps the content with AuthProvider
const App: FC = () => {
  return (
    <ErrorProvider>
      <ErrorBoundary>
        <ErrorEventsBridge>
          <AuthProvider supabase={supabase}>
            <GamePersistProvider>
              <AppContent />
              <ErrorBanner />
            </GamePersistProvider>
          </AuthProvider>
        </ErrorEventsBridge>
      </ErrorBoundary>
    </ErrorProvider>
  );
};

// The actual app content, using the auth context
const AppContent: FC = () => {
  const { user, loading, signOut } = useAuth();
  const { addError } = useError();

  // Custom hooks for feature management
  const { isFullScreen, toggleFullscreen } = useFullscreen();
  const { darkMode, toggleDarkMode } = useTheme();
  const {
    lastPlayers,
    setLastPlayers,
    lastPlayerTargetScores,
    setLastPlayerTargetScores,
    lastBreakingPlayerId,
    setLastBreakingPlayerId,
  } = useGameSettings();
  const {
    gameState,
    setGameState,
    players,
    playerTargetScores,
    currentGameId,
    setCurrentGameId,
    breakingPlayerId,
    matchStartTime,
    setMatchStartTime,
    matchEndTime,
    setMatchEndTime,
    ballsOnTable,
    setBallsOnTable,
    handleStartGame: handleStartGameBase,
    handleFinishGame,
    handleStartNewGame,
    handleViewHistory,
    handleGoToSetup,
  } = useGameState();

  // Modal state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Close auth modal when user is authenticated
  useEffect(() => {
    if (user) {
      setShowAuthModal(false);
    }
  }, [user]);

  // Sign out handler
  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
    } catch (_error) {
      console.error('Failed to sign out user', _error);
      addError('Failed to sign out. Please try again.');
    } finally {
      setShowProfileModal(false);
      // Only redirect to setup if not in the middle of a game
      if (gameState !== 'scoring' && gameState !== 'statistics') {
        setGameState('setup');
      }
    }
  }, [signOut, gameState, addError, setGameState]);

  // Wrapper for handleStartGame to save settings
  const handleStartGame = useCallback(
    (
      players: string[],
      playerTargetScores: Record<string, number>,
      breakingPlayerId: number,
    ) => {
      handleStartGameBase(players, playerTargetScores, breakingPlayerId, (p, t, b) => {
        setLastPlayers(p);
        setLastPlayerTargetScores(t);
        setLastBreakingPlayerId(b);
      });
    },
    [
      handleStartGameBase,
      setLastPlayers,
      setLastPlayerTargetScores,
      setLastBreakingPlayerId,
    ],
  );

  // Profile click handler
  const handleProfileClick = useCallback(() => {
    if (gameState === 'scoring' || gameState === 'statistics') {
      setShowProfileModal(true);
    } else {
      setGameState('profile');
    }
  }, [gameState, setGameState]);

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
      <Header
        gameState={gameState}
        user={user}
        darkMode={darkMode}
        isFullScreen={isFullScreen}
        matchStartTime={matchStartTime}
        matchEndTime={matchEndTime}
        ballsOnTable={ballsOnTable}
        toggleDarkMode={toggleDarkMode}
        toggleFullscreen={toggleFullscreen}
        onAuthClick={() => setShowAuthModal(true)}
        onProfileClick={handleProfileClick}
      />

      <Navigation gameState={gameState} user={user} onNavigate={setGameState} />

      <main className="flex-grow container mx-auto p-4">
        <GameRouter
          gameState={gameState}
          supabase={supabase}
          user={user}
          lastPlayers={lastPlayers}
          lastPlayerTargetScores={lastPlayerTargetScores}
          lastBreakingPlayerId={lastBreakingPlayerId}
          onStartGame={handleStartGame}
          players={players}
          playerTargetScores={playerTargetScores}
          gameId={currentGameId}
          setGameId={setCurrentGameId}
          breakingPlayerId={breakingPlayerId}
          matchStartTime={matchStartTime}
          matchEndTime={matchEndTime}
          setMatchStartTime={setMatchStartTime}
          setMatchEndTime={setMatchEndTime}
          ballsOnTable={ballsOnTable}
          setBallsOnTable={setBallsOnTable}
          onFinishGame={handleFinishGame}
          onStartNewGame={handleStartNewGame}
          onViewHistory={handleViewHistory}
          onGoToSetup={handleGoToSetup}
          onSignOut={handleSignOut}
        />
      </main>

      <AuthModal
        isOpen={showAuthModal}
        gameState={gameState}
        supabase={supabase}
        onClose={() => setShowAuthModal(false)}
      />

      <ProfileModal
        isOpen={showProfileModal}
        user={user}
        supabase={supabase}
        onClose={() => setShowProfileModal(false)}
        onSignOut={handleSignOut}
      />
    </div>
  );
};

export default App;
