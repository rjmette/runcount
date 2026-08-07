import { lazy, Suspense } from 'react';
import type { FC, ReactNode } from 'react';

import type { GameBackend } from '../backend/types';
import type { GameState } from '../hooks/useGameState';
import type { AppUser } from '../types/auth';

const UserProfile = lazy(() => import('./auth/UserProfile'));
const GameHistory = lazy(() => import('./GameHistory/index'));
const GameScoring = lazy(() => import('./GameScoring/index'));
const GameSetup = lazy(() => import('./GameSetup'));
const GameStatistics = lazy(() => import('./GameStatistics'));
const TrendsPage = lazy(() => import('./Trends/index'));

interface GameRouterProps {
  gameState: GameState;
  backend: GameBackend;
  user: AppUser | null;
  // Game setup props
  lastPlayers: string[];
  lastPlayerTargetScores: Record<string, number>;
  lastBreakingPlayerId: number;
  lastShotClockSeconds: number | null;
  onStartGame: (
    players: string[],
    playerTargetScores: Record<string, number>,
    breakingPlayerId: number,
    shotClockSeconds: number | null,
  ) => void;
  // Game scoring props
  players: string[];
  playerTargetScores: Record<string, number>;
  gameId: string | null;
  setGameId: (id: string | null) => void;
  breakingPlayerId: number;
  shotClockSeconds: number | null;
  matchStartTime: Date | null;
  matchEndTime: Date | null;
  setMatchStartTime: (time: Date | null) => void;
  setMatchEndTime: (time: Date | null) => void;
  turnStartTime: Date | null;
  setTurnStartTime: (time: Date | null) => void;
  ballsOnTable: number;
  setBallsOnTable: (balls: number) => void;
  onFinishGame: () => void;
  // Game statistics props
  onStartNewGame: () => void;
  onViewHistory: () => void;
  // Game history props
  onGoToSetup: () => void;
  onViewTrends: () => void;
  // Profile props
  onSignOut: () => Promise<void>;
}

const RouteLoadingFallback: FC = () => (
  <div
    className="flex min-h-[18rem] flex-1 items-center justify-center rounded-lg border border-gray-200 bg-white p-6 text-gray-600 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
    role="status"
    aria-live="polite"
  >
    <div className="flex items-center gap-3">
      <span
        className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"
        aria-hidden="true"
      />
      <span className="text-sm font-medium">Loading game view...</span>
    </div>
  </div>
);

/**
 * Routes to the appropriate game component based on current game state
 */
export const GameRouter: FC<GameRouterProps> = ({
  gameState,
  backend,
  user,
  lastPlayers,
  lastPlayerTargetScores,
  lastBreakingPlayerId,
  lastShotClockSeconds,
  onStartGame,
  players,
  playerTargetScores,
  gameId,
  setGameId,
  breakingPlayerId,
  shotClockSeconds,
  matchStartTime,
  matchEndTime,
  setMatchStartTime,
  setMatchEndTime,
  turnStartTime,
  setTurnStartTime,
  ballsOnTable,
  setBallsOnTable,
  onFinishGame,
  onStartNewGame,
  onViewHistory,
  onGoToSetup,
  onViewTrends,
  onSignOut,
}) => {
  const renderSetup = () => (
    <GameSetup
      startGame={onStartGame}
      lastPlayers={lastPlayers}
      lastPlayerTargetScores={lastPlayerTargetScores}
      lastBreakingPlayerId={lastBreakingPlayerId}
      lastShotClockSeconds={lastShotClockSeconds}
    />
  );

  let route: ReactNode;

  switch (gameState) {
    case 'setup':
      route = renderSetup();
      break;
    case 'scoring':
      route = (
        <GameScoring
          players={players}
          playerTargetScores={playerTargetScores}
          gameId={gameId}
          setGameId={setGameId}
          finishGame={onFinishGame}
          backend={backend}
          user={user}
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
        />
      );
      break;
    case 'summary':
      route = (
        <GameStatistics
          gameId={gameId}
          backend={backend}
          startNewGame={onStartNewGame}
          viewHistory={onViewHistory}
          user={user}
        />
      );
      break;
    case 'history':
      route = (
        <GameHistory
          backend={backend}
          startNewGame={onGoToSetup}
          user={user}
          viewTrends={onViewTrends}
        />
      );
      break;
    case 'trends':
      route = <TrendsPage backend={backend} user={user} onStartNewGame={onGoToSetup} />;
      break;
    case 'profile':
      route = user ? (
        <UserProfile backend={backend} user={user} onSignOut={onSignOut} showPageTitle />
      ) : (
        renderSetup()
      );
      break;
    default:
      route = renderSetup();
  }

  return <Suspense fallback={<RouteLoadingFallback />}>{route}</Suspense>;
};
