import { useState, useEffect, useCallback, useMemo } from 'react';
import type { FC } from 'react';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { AwsAuthProvider, useAwsAuth } from './aws-auth/AwsAuthContext';
import { isAwsBackend } from './aws-auth/config';
import { createAwsBackend } from './backend/awsBackend';
import { createSupabaseBackend } from './backend/supabaseBackend';
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

import type { GameBackend } from './backend/types';
import type { AppUser } from './types/auth';

import './App.css';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY || '';
const supabase = isAwsBackend ? null : createClient(supabaseUrl, supabaseKey);

const getSupabaseClient = (): SupabaseClient => {
  if (!supabase) {
    throw new Error('Supabase client is only available when VITE_BACKEND is not aws.');
  }
  return supabase;
};

// Main App Component - now just wraps the content with AuthProvider
const App: FC = () => {
  return (
    <ErrorProvider>
      <ErrorBoundary>
        <ErrorEventsBridge>
          {isAwsBackend ? (
            <AwsAuthProvider>
              <GamePersistProvider>
                <AwsAppContent />
                <ErrorBanner />
              </GamePersistProvider>
            </AwsAuthProvider>
          ) : (
            <SupabaseAppProviders />
          )}
        </ErrorEventsBridge>
      </ErrorBoundary>
    </ErrorProvider>
  );
};

const SupabaseAppProviders: FC = () => {
  const supabaseClient = getSupabaseClient();

  return (
    <AuthProvider supabase={supabaseClient}>
      <GamePersistProvider>
        <SupabaseAppContent supabase={supabaseClient} />
        <ErrorBanner />
      </GamePersistProvider>
    </AuthProvider>
  );
};

interface SupabaseAppContentProps {
  supabase: SupabaseClient;
}

const SupabaseAppContent: FC<SupabaseAppContentProps> = ({ supabase }) => {
  const { user, loading, signOut } = useAuth();
  const backend = useMemo(() => createSupabaseBackend(supabase), []);

  return (
    <AppContent
      user={user}
      loading={loading}
      signOut={signOut}
      backend={backend}
      renderAuthModal={({ isOpen, gameState, onClose }) => (
        <AuthModal
          isOpen={isOpen}
          gameState={gameState}
          supabase={supabase}
          onClose={onClose}
        />
      )}
    />
  );
};

const AwsAppContent: FC = () => {
  const { user, loading, signOut, getIdToken, signIn } = useAwsAuth();
  const backend = useMemo(() => createAwsBackend(getIdToken), [getIdToken]);

  return (
    <AppContent
      user={user}
      loading={loading}
      signOut={signOut}
      backend={backend}
      renderAuthModal={({ isOpen, gameState, onClose }) => (
        <AwsAuthModal
          isOpen={isOpen}
          gameState={gameState}
          onClose={onClose}
          onSignIn={signIn}
        />
      )}
    />
  );
};

interface AppContentProps {
  user: AppUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
  backend: GameBackend;
  renderAuthModal: (props: {
    isOpen: boolean;
    gameState: ReturnType<typeof useGameState>['gameState'];
    onClose: () => void;
  }) => React.ReactNode;
}

// The actual app content, using the selected auth/backend implementation.
const AppContent: FC<AppContentProps> = ({
  user,
  loading,
  signOut,
  backend,
  renderAuthModal,
}) => {
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
    lastShotClockSeconds,
    setLastShotClockSeconds,
  } = useGameSettings();
  const [shotClockSeconds, setShotClockSeconds] = useState<number | null>(
    lastShotClockSeconds,
  );
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
    turnStartTime,
    setTurnStartTime,
    handleStartGame: handleStartGameBase,
    handleFinishGame,
    handleStartNewGame,
    handleViewHistory,
    handleViewTrends,
    handleGoToSetup,
  } = useGameState();

  useEffect(() => {
    setShotClockSeconds(lastShotClockSeconds);
  }, [lastShotClockSeconds]);

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
      nextShotClockSeconds: number | null,
    ) => {
      setShotClockSeconds(nextShotClockSeconds);
      handleStartGameBase(players, playerTargetScores, breakingPlayerId, (p, t, b) => {
        setLastPlayers(p);
        setLastPlayerTargetScores(t);
        setLastBreakingPlayerId(b);
        setLastShotClockSeconds(nextShotClockSeconds);
      });
    },
    [
      handleStartGameBase,
      setLastPlayers,
      setLastPlayerTargetScores,
      setLastBreakingPlayerId,
      setLastShotClockSeconds,
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
        user={user}
        darkMode={darkMode}
        isFullScreen={isFullScreen}
        toggleDarkMode={toggleDarkMode}
        toggleFullscreen={toggleFullscreen}
        onAuthClick={() => setShowAuthModal(true)}
        onProfileClick={handleProfileClick}
      />

      <Navigation gameState={gameState} user={user} onNavigate={setGameState} />

      <main className="flex-grow container mx-auto p-4 flex flex-col">
        <GameRouter
          gameState={gameState}
          backend={backend}
          user={user}
          lastPlayers={lastPlayers}
          lastPlayerTargetScores={lastPlayerTargetScores}
          lastBreakingPlayerId={lastBreakingPlayerId}
          lastShotClockSeconds={lastShotClockSeconds}
          onStartGame={handleStartGame}
          players={players}
          playerTargetScores={playerTargetScores}
          gameId={currentGameId}
          setGameId={setCurrentGameId}
          breakingPlayerId={breakingPlayerId}
          shotClockSeconds={shotClockSeconds}
          matchStartTime={matchStartTime}
          matchEndTime={matchEndTime}
          setMatchStartTime={setMatchStartTime}
          setMatchEndTime={setMatchEndTime}
          turnStartTime={turnStartTime}
          setTurnStartTime={setTurnStartTime}
          ballsOnTable={ballsOnTable}
          setBallsOnTable={setBallsOnTable}
          onFinishGame={handleFinishGame}
          onStartNewGame={handleStartNewGame}
          onViewHistory={handleViewHistory}
          onGoToSetup={handleGoToSetup}
          onViewTrends={handleViewTrends}
          onSignOut={handleSignOut}
        />
      </main>

      {renderAuthModal({
        isOpen: showAuthModal,
        gameState,
        onClose: () => setShowAuthModal(false),
      })}

      <ProfileModal
        isOpen={showProfileModal}
        user={user}
        backend={backend}
        onClose={() => setShowProfileModal(false)}
        onSignOut={handleSignOut}
      />
    </div>
  );
};

interface AwsAuthModalProps {
  isOpen: boolean;
  gameState: ReturnType<typeof useGameState>['gameState'];
  onClose: () => void;
  onSignIn: () => Promise<void>;
}

const AwsAuthModal: FC<AwsAuthModalProps> = ({
  isOpen,
  gameState,
  onClose,
  onSignIn,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-sm sm:max-w-lg w-full relative"
        role="dialog"
        aria-modal="true"
        aria-labelledby="aws-auth-modal-title"
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-7 h-7 flex items-center justify-center rounded-full bg-black/30 hover:bg-black/50 text-white transition-colors"
          aria-label="Close authentication"
        >
          ✕
        </button>
        <div className="p-5 text-center bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-700/60 dark:to-gray-700/30 rounded-t-2xl border-b border-gray-200 dark:border-gray-700">
          <h2 id="aws-auth-modal-title" className="text-xl font-bold dark:text-white">
            Sign in to RunCount
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Use your Google account to save games to AWS.
          </p>
        </div>
        <div className="p-4 space-y-4">
          {gameState === 'scoring' || gameState === 'statistics' ? (
            <div className="p-3 bg-blue-50 dark:bg-blue-900 text-blue-800 dark:text-blue-100 rounded-lg text-sm">
              Logging in will save your current game to your account.
            </div>
          ) : null}
          <button
            type="button"
            onClick={() => void onSignIn()}
            className="w-full inline-flex justify-center items-center py-2.5 px-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
          >
            Continue with Google
          </button>
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Signup, password recovery, and account updates are tracked for Phase 2.
          </p>
        </div>
      </div>
    </div>
  );
};

export default App;
