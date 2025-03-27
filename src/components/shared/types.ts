import { Player, GameAction } from '../../types/game';

export interface InningAction {
  inningNumber: number;
  playerId: number;
  endAction: GameAction;
  pointsInInning: number;
  endTime: Date;
  currentScore: number;
}

export interface PlayerStats {
  bpi: string;
  offensiveBPI: string;
  safetyEfficiency: number;
  shootingPercentage: number;
  successfulSafeties: number;
  failedSafeties?: number;
}

export interface StatCalculator {
  (player: Player, actions: GameAction[]): PlayerStats;
}
