import { SupabaseClient, User } from '@supabase/supabase-js';

export interface Player {
  id: number;
  name: string;
  score: number;
  innings: number;
  highRun: number;
  fouls: number;
  consecutiveFouls: number;
  safeties: number;
  missedShots: number;
  targetScore: number;
}

export interface GameAction {
  type: 'score' | 'foul' | 'safety' | 'miss';
  playerId: number;
  value: number;
  timestamp: Date;
  ballsOnTable?: number;
  reBreak?: boolean; // Flag for when a player must re-break after three consecutive fouls
  isBreakFoul?: boolean; // Flag for fouls that occur during the opening break
}

export interface GameSettings {
  players: string[];
  playerTargetScores: Record<string, number>;
  breakingPlayerId?: number; // ID of the player who is breaking
}

export interface GameData {
  id: string;
  date: Date | string;
  players: Player[];
  winner_id: number | null;
  completed: boolean;
  actions: GameAction[];
  owner_id?: string; // UUID string from auth.users.id
  deleted?: boolean; // Flag for soft deletion
  startTime?: Date | string; // When the match timer started
  endTime?: Date | string; // When the match ended
}

export interface GameSetupProps {
  startGame: (
    players: string[],
    playerTargetScores: Record<string, number>,
    breakingPlayerId: number
  ) => void;
  lastPlayers?: string[];
  lastPlayerTargetScores?: Record<string, number>;
  lastBreakingPlayerId?: number;
}

export interface GameScoringProps {
  players: string[];
  playerTargetScores: Record<string, number>;
  gameId: string | null;
  setGameId: (id: string) => void;
  finishGame: () => void;
  supabase: SupabaseClient;
  user?: User | null;
  breakingPlayerId?: number;
  matchStartTime: Date | null;
  matchEndTime: Date | null;
  setMatchStartTime: (time: Date | null) => void;
  setMatchEndTime: (time: Date | null) => void;
  ballsOnTable: number;
  setBallsOnTable: (count: number) => void;
}

export interface GameStatisticsProps {
  gameId: string | null;
  supabase: SupabaseClient;
  startNewGame: () => void;
  viewHistory: () => void;
  user?: User | null;
}

export interface GameHistoryProps {
  supabase: SupabaseClient;
  startNewGame: () => void;
  user?: User | null;
}

export interface ScoreButtonProps {
  label: string | React.ReactNode;
  value: number;
  onClick: (value: number) => void;
  className?: string;
}

export interface PlayerScoreProps {
  player: Player;
  isActive: boolean;
  onAddScore: (score: number, ballsOnTable?: number) => void;
  onAddFoul: (ballsOnTable?: number) => void;
  onAddSafety: (ballsOnTable?: number) => void;
  onAddMiss: (ballsOnTable?: number) => void;
}
