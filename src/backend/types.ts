import type { AppUser } from '../types/auth';
import type { GameData } from '../types/game';

export interface ProfileStats {
  totalGames: number;
  lastGameDate: string | null;
}

export interface GameBackend {
  listGames: (user: AppUser | null) => Promise<GameData[]>;
  getGame: (gameId: string) => Promise<GameData | null>;
  saveGame: (game: GameData, user: AppUser | null) => Promise<void>;
  deleteGame: (gameId: string) => Promise<void>;
  getProfileStats: (user: AppUser) => Promise<ProfileStats>;
  updateEmail?: (email: string) => Promise<void>;
  verifyEmailUpdate?: (code: string) => Promise<void>;
  updatePassword?: (password: string, currentPassword?: string) => Promise<void>;
  requiresCurrentPasswordForPasswordUpdate?: boolean;
}
