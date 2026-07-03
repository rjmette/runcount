import { lazy, Suspense, useState, useEffect, useCallback, useMemo } from 'react';
import type { FC, ReactNode } from 'react';

import { AwsAuthProvider, useAwsAuth } from './aws-auth/AwsAuthContext';
import { createAwsBackend } from './backend/awsBackend';
import { GameRouter } from './components/GameRouter';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import ErrorBanner from './components/shared/ErrorBanner';
import { ErrorBoundary, ErrorEventsBridge } from './components/shared/ErrorBoundary';
import { ErrorProvider, useError } from './context/ErrorContext';
import { GamePersistProvider } from './context/GamePersistContext';
import { useFullscreen } from './hooks/useFullscreen';
import { useGameSettings } from './hooks/useGameSettings';
import { useGameState } from './hooks/useGameState';
import { useTheme } from './hooks/useTheme';

import type { GameBackend } from './backend/types';
import type { AppUser } from './types/auth';

import './App.css';

const AuthModal = lazy(() => import('./components/auth/AuthModal'));
const ProfileModal = lazy(() =>
  import('./components/modals/ProfileModal').then(({ ProfileModal }) => ({
    default: ProfileModal,
  })),
);

const AuthModalLoadingFallback: FC = () => (
  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
    <div
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-sm sm:max-w-lg w-full p-6 text-center"
      role="status"
      aria-live="polite"
    >
      <div
        className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"
        aria-hidden="true"
      />
      <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
        Loading sign-in...
      </p>
    </div>
  </div>
);

const ProfileModalLoadingFallback: FC = () => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div
      className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 text-center"
      role="status"
      aria-live="polite"
    >
      <div
        className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"
        aria-hidden="true"
      />
      <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
        Loading profile...
      </p>
    </div>
  </div>
);

const App: FC = () => {
  return (
    <ErrorProvider>
      <ErrorBoundary>
        <ErrorEventsBridge>
          <AwsAuthProvider>
            <GamePersistProvider>
              <AppWithAwsBackend />
              <ErrorBanner />
            </GamePersistProvider>
          </AwsAuthProvider>
        </ErrorEventsBridge>
      </ErrorBoundary>
    </ErrorProvider>
  );
};

const AppWithAwsBackend: FC = () => {
  const {
    user,
    loading,
    signOut,
    getIdToken,
    signIn,
    signInWithPassword,
    signUp,
    confirmSignUp,
    forgotPassword,
    confirmForgotPassword,
    updateEmail,
    verifyEmailUpdate,
    updatePassword,
  } = useAwsAuth();
  const isFederatedAwsUser =
    Boolean(user?.auth_provider) && user?.auth_provider !== 'password';
  const backend = useMemo(
    () =>
      createAwsBackend(
        getIdToken,
        isFederatedAwsUser
          ? undefined
          : {
              updateEmail,
              verifyEmailUpdate,
              updatePassword,
            },
      ),
    [getIdToken, isFederatedAwsUser, updateEmail, verifyEmailUpdate, updatePassword],
  );

  return (
    <AppContent
      user={user}
      loading={loading}
      signOut={signOut}
      backend={backend}
      renderAuthModal={({ isOpen, gameState, onClose }) =>
        isOpen ? (
          <Suspense fallback={<AuthModalLoadingFallback />}>
            <AuthModal
              isOpen={isOpen}
              gameState={gameState}
              onClose={onClose}
              awsAuth={{
                signInWithPassword,
                signInWithGoogle: signIn,
                signUp,
                confirmSignUp,
                forgotPassword,
                confirmForgotPassword,
              }}
            />
          </Suspense>
        ) : null
      }
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
  }) => ReactNode;
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

      {showProfileModal && (
        <Suspense fallback={<ProfileModalLoadingFallback />}>
          <ProfileModal
            isOpen={showProfileModal}
            user={user}
            backend={backend}
            onClose={() => setShowProfileModal(false)}
            onSignOut={handleSignOut}
          />
        </Suspense>
      )}
    </div>
  );
};

export default App;
