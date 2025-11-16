import { type GameAction, type Player } from '../../../types/game';

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
  let currentPlayerId = players[0]?.id;
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

      // Update player's total score
      playerScores[currentPlayerId] += pointsInAction;

      // Add the inning to our array
      inningActions.push({
        inningNumber: currentInningNumber,
        playerId: currentPlayerId,
        endAction: action,
        pointsInInning: pointsInAction,
        endTime: new Date(action.timestamp),
        currentScore: playerScores[currentPlayerId],
      });

      // Update for next inning
      const nextPlayerId = players.find((p) => p.id !== currentPlayerId)?.id;
      if (nextPlayerId !== undefined) {
        currentPlayerId = nextPlayerId;
        if (currentPlayerId === players[0]?.id) {
          // If we're back to the first player, increment inning number
          currentInningNumber++;
        }
      }

      // Reset points for next inning
      currentRun = 0;
    }
  });

  return inningActions;
};

export const calculatePlayerStats = (player: Player, actions: GameAction[]) => {
  const playerActions = actions.filter((action) => action.playerId === player.id);

  // Calculate safety statistics
  let successfulSafeties = 0;
  let safetyInnings = 0;

  // A safety is successful if the next action by opponent is a foul or miss
  for (let i = 0; i < actions.length - 1; i++) {
    const currentAction = actions[i];
    const nextAction = actions[i + 1];

    // If current action is a safety by this player
    if (currentAction.type === 'safety' && currentAction.playerId === player.id) {
      safetyInnings++;

      // If next action is by a different player (opponent)
      if (nextAction.playerId !== player.id) {
        // Check if next action is a foul or miss (successful safety)
        if (nextAction.type === 'foul' || nextAction.type === 'miss') {
          successfulSafeties++;
        }
      }
    }
  }

  // Calculate safety efficiency percentage
  const safetyEfficiency =
    player.safeties > 0 ? Math.round((successfulSafeties / player.safeties) * 100) : 0;

  // Calculate offensive BPI (excluding safety innings)
  const offensiveInnings = Math.max(1, player.innings - safetyInnings);
  const offensiveBPI = (player.score / offensiveInnings).toFixed(2);

  return {
    bpi: player.innings > 0 ? (player.score / player.innings).toFixed(2) : '0.00',
    totalActions: playerActions.length,
    shootingPercentage:
      playerActions.length > 0
        ? Math.round((player.score / playerActions.length) * 100)
        : 0,
    offensiveBPI,
    safetyEfficiency,
    successfulSafeties,
  };
};
