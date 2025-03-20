import { SupabaseClient, User } from '@supabase/supabase-js';

export interface Player {
  id: number;
  name: string;
  score: number;
  innings: number;
  highRun: number;
  fouls: number;
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
}

export interface GameSettings {
  players: string[];
  playerTargetScores: Record<string, number>;
}

export interface GameData {
  id: string;
  date: Date;
  players: Player[];
  winnerId: number | null;
  completed: boolean;
  actions: GameAction[];
  owner_id?: string; // UUID string from auth.users.id
  deleted?: boolean; // Flag for soft deletion
}

export interface GameSetupProps {
  startGame: (players: string[], playerTargetScores: Record<string, number>) => void;
  lastPlayers?: string[];
  lastPlayerTargetScores?: Record<string, number>;
}

export interface GameScoringProps {
  players: string[];
  playerTargetScores: Record<string, number>;
  gameId: string | null;
  setGameId: (id: string) => void;
  finishGame: () => void;
  supabase: SupabaseClient;
  user?: User | null;
}

export interface GameStatisticsProps {
  gameId: string | null;
  supabase: SupabaseClient;
  startNewGame: () => void;
  viewHistory: () => void;
}

export interface GameHistoryProps {
  supabase: SupabaseClient;
  startNewGame: () => void;
  user?: User | null;
}

export interface ScoreButtonProps {
  label: string;
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