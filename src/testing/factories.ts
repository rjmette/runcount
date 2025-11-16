import { Player } from '../types/game';

export const createMockPlayer = (overrides: Partial<Player> = {}): Player => ({
  id: 1,
  name: 'Test Player',
  score: 0,
  innings: 0,
  highRun: 0,
  fouls: 0,
  consecutiveFouls: 0,
  safeties: 0,
  missedShots: 0,
  targetScore: 75,
  ...overrides,
});
