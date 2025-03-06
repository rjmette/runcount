import { SupabaseClient } from '@supabase/supabase-js';

export interface Player {
  id: number;
  name: string;
  score: number;
  innings: number;
  highRun: number;
  fouls: number;
  safeties: number;
  missedShots: number;
}

export interface GameAction {
  type: 'score' | 'foul' | 'safety' | 'miss';
  playerId: number;
  value: number;
  timestamp: Date;
}

export interface GameSettings {
  targetScore: number;
  players: string[];
}

export interface GameData {
  id: string;
  date: Date;
  players: Player[];
  winnerId: number | null;
  completed: boolean;
  targetScore: number;
  actions: GameAction[];
}

export interface GameSetupProps {
  startGame: (players: string[], targetScore: number) => void;
}

export interface GameScoringProps {
  players: string[];
  targetScore: number;
  gameId: string | null;
  setGameId: (id: string) => void;
  finishGame: () => void;
  supabase: SupabaseClient;
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
  onAddScore: (score: number) => void;
  onAddFoul: () => void;
  onAddSafety: () => void;
  onAddMiss: () => void;
}