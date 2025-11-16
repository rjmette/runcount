import { type Player, type GameAction } from '../../../types/game';

export const calculatePlayerStats = (player: Player, actions: GameAction[]) => {
  // Calculate safety efficiency
  let successfulSafeties = 0;
  const totalSafeties = player.safeties;

  // A safety is successful if the next action by opponent is a foul or miss
  for (let i = 0; i < actions.length - 1; i++) {
    const currentAction = actions[i];
    const nextAction = actions[i + 1];

    // If current action is a safety by this player
    if (currentAction.type === 'safety' && currentAction.playerId === player.id) {
      // Get next player ID
      const nextPlayerId = nextAction.playerId;

      // If next action is by a different player (opponent)
      if (nextPlayerId !== player.id) {
        // Check if next action is a foul or miss (successful safety)
        if (nextAction.type === 'foul' || nextAction.type === 'miss') {
          successfulSafeties++;
        }
      }
    }
  }

  // Calculate safety efficiency percentage
  const safetyEfficiency =
    totalSafeties > 0 ? Math.round((successfulSafeties / totalSafeties) * 100) : 0;

  // Calculate shooting percentage
  const shotsTaken = player.score + player.missedShots + player.safeties + player.fouls;
  const shootingPercentage =
    shotsTaken > 0 ? Math.round((player.score / shotsTaken) * 100) : 0;

  // Calculate BPI (Balls Per Inning)
  const bpi = player.innings > 0 ? (player.score / player.innings).toFixed(2) : '0.00';

  return {
    shootingPercentage,
    safetyEfficiency,
    successfulSafeties,
    bpi,
  };
};

export const calculateGameDuration = (actions: GameAction[]): string => {
  if (actions.length === 0) return 'N/A';

  const startTime = new Date(actions[0].timestamp);
  const endTime = new Date(actions[actions.length - 1].timestamp);
  const durationMs = endTime.getTime() - startTime.getTime();
  const minutes = Math.floor(durationMs / 60000);
  const seconds = Math.floor((durationMs % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
};

export const calculatePointsInInning = (
  actions: GameAction[],
  currentPlayerId: number,
  currentRun: number,
  ballsOnTable: number,
  action: GameAction,
): number => {
  const hasScoreActions = actions.some(
    (a) => a.type === 'score' && a.playerId === currentPlayerId,
  );

  const prevAction = actions.length > 0 ? actions[actions.length - 1] : null;
  const prevBOT = prevAction?.ballsOnTable ?? 15;
  const ballsPocketedOnFinalShot = Math.max(0, prevBOT - (action.ballsOnTable || 0));

  if (action.type === 'foul') {
    return hasScoreActions
      ? ballsPocketedOnFinalShot - 1
      : currentRun + ballsPocketedOnFinalShot - 1;
  }

  return hasScoreActions
    ? ballsPocketedOnFinalShot
    : currentRun + ballsPocketedOnFinalShot;
};
