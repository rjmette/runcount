import { type GameAction, type Player } from '../../../types/game';
import { calculatePlayerStats as calculateSharedPlayerStats } from '../../shared/stats';

export interface InningAction {
  inningNumber: number;
  playerId: number;
  endAction: GameAction;
  pointsInInning: number;
  endTime: Date;
  currentScore: number;
}

export const calculateInningActions = (
  actions: GameAction[],
  players: Player[],
): InningAction[] => {
  const inningActions: InningAction[] = [];
  let currentInningNumber = 1;
  let startingPlayerId = actions[0]?.playerId ?? players[0]?.id;
  let previousTerminalPlayerId: number | null = null;
  let currentRun = 0;

  // Track cumulative scores for each player
  const playerScores: Record<number, number> = {};
  players.forEach((player) => {
    playerScores[player.id] = 0;
  });

  // Process actions to create inning-based history
  actions.forEach((action, idx) => {
    if (action.type === 'score') {
      // For score actions (regular balls or new rack), just add to inning points
      currentRun += action.value;
    } else if (['miss', 'safety', 'foul'].includes(action.type)) {
      // For turn-ending actions (miss, safety, foul), calculate points

      // Calculate balls pocketed in this final shot (if any)
      const prevAction = idx > 0 ? actions[idx - 1] : null;
      const prevBOT = prevAction?.ballsOnTable ?? 15;
      const ballsPocketedOnFinalShot = Math.max(0, prevBOT - (action.ballsOnTable || 0));

      // If it's a foul, subtract 1 point for the penalty
      const pointsInAction =
        action.type === 'foul'
          ? currentRun + ballsPocketedOnFinalShot - 1
          : currentRun + ballsPocketedOnFinalShot;

      if (startingPlayerId === undefined) {
        startingPlayerId = action.playerId;
      }

      if (
        inningActions.length > 0 &&
        action.playerId === startingPlayerId &&
        previousTerminalPlayerId !== null &&
        previousTerminalPlayerId !== startingPlayerId
      ) {
        currentInningNumber++;
      }

      // Update player's total score
      playerScores[action.playerId] += pointsInAction;

      // Add the inning to our array
      inningActions.push({
        inningNumber: currentInningNumber,
        playerId: action.playerId,
        endAction: action,
        pointsInInning: pointsInAction,
        endTime: new Date(action.timestamp),
        currentScore: playerScores[action.playerId],
      });
      previousTerminalPlayerId = action.playerId;

      // Reset points for next inning
      currentRun = 0;
    }
  });

  return inningActions;
};

export const calculatePlayerStats = (player: Player, actions: GameAction[]) => {
  const playerActions = actions.filter((action) => action.playerId === player.id);
  const stats = calculateSharedPlayerStats(player, actions);

  return {
    ...stats,
    totalActions: playerActions.length,
  };
};
