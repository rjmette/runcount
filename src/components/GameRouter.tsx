import type { FC } from 'react';

import UserProfile from './auth/UserProfile';
import GameHistory from './GameHistory/index';
import GameScoring from './GameScoring/index';
import GameSetup from './GameSetup';
import GameStatistics from './GameStatistics';

import type { GameState } from '../hooks/useGameState';
import type { User } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

interface GameRouterProps {
  gameState: GameState;
  supabase: SupabaseClient;
  user: User | null;
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
  // Profile props
  onSignOut: () => Promise<void>;
}

/**
 * Routes to the appropriate game component based on current game state
 */
export const GameRouter: FC<GameRouterProps> = ({
  gameState,
  supabase,
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
  onSignOut,
}) => {
  switch (gameState) {
    case 'setup':
      return (
        <GameSetup
          startGame={onStartGame}
          lastPlayers={lastPlayers}
          lastPlayerTargetScores={lastPlayerTargetScores}
          lastBreakingPlayerId={lastBreakingPlayerId}
          lastShotClockSeconds={lastShotClockSeconds}
        />
      );
    case 'scoring':
      return (
        <GameScoring
          players={players}
          playerTargetScores={playerTargetScores}
          gameId={gameId}
          setGameId={setGameId}
          finishGame={onFinishGame}
          supabase={supabase}
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
    case 'statistics':
      return (
        <GameStatistics
          gameId={gameId}
          supabase={supabase}
          startNewGame={onStartNewGame}
          viewHistory={onViewHistory}
          user={user}
        />
      );
    case 'history':
      return <GameHistory supabase={supabase} startNewGame={onGoToSetup} user={user} />;
    case 'profile':
      return <UserProfile supabase={supabase} user={user!} onSignOut={onSignOut} />;
    default:
      return <GameSetup startGame={onStartGame} />;
  }
};
